const express = require('express');
const Joi = require('joi');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schemas
const createInvitationSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required()
});

const bulkInvitationSchema = Joi.object({
  eventId: Joi.string().uuid().required(),
  userIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required()
});

const respondInvitationSchema = Joi.object({
  status: Joi.string().valid('accepted', 'declined').required()
});

// Create event invitation (Admin only)
router.post('/', authMiddleware, requireAdmin, validateRequest(createInvitationSchema), async (req, res) => {
  try {
    const { eventId, userId } = req.body;

    // Check if event exists
    const eventResult = await query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user exists
    const userResult = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if invitation already exists
    const existingInvitation = await query(
      'SELECT * FROM event_invitations WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (existingInvitation.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invitation already exists'
      });
    }

    // Create invitation
    const result = await query(
      'INSERT INTO event_invitations (event_id, user_id, invited_by) VALUES ($1, $2, $3) RETURNING *',
      [eventId, userId, req.user.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        invitation: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create bulk invitations (Admin only)
router.post('/bulk', authMiddleware, requireAdmin, validateRequest(bulkInvitationSchema), async (req, res) => {
  try {
    const { eventId, userIds } = req.body;

    // Check if event exists
    const eventResult = await query(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check which users exist
    const userResult = await query(
      'SELECT id FROM users WHERE id = ANY($1)',
      [userIds]
    );

    const existingUserIds = userResult.rows.map(row => row.id);
    const nonExistentUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (nonExistentUserIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some users not found',
        data: {
          nonExistentUserIds
        }
      });
    }

    // Check existing invitations
    const existingInvitations = await query(
      'SELECT user_id FROM event_invitations WHERE event_id = $1 AND user_id = ANY($2)',
      [eventId, userIds]
    );

    const existingUserIds = existingInvitations.rows.map(row => row.user_id);
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All users already have invitations'
      });
    }

    // Create invitations
    const invitationValues = newUserIds.map(userId => `('${eventId}', '${userId}', '${req.user.userId}')`).join(', ');
    
    const result = await query(
      `INSERT INTO event_invitations (event_id, user_id, invited_by) 
       VALUES ${invitationValues} 
       RETURNING *`
    );

    res.status(201).json({
      success: true,
      message: `Invitations sent to ${result.rows.length} users`,
      data: {
        invitations: result.rows,
        skipped: existingUserIds.length
      }
    });
  } catch (error) {
    console.error('Bulk invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's invitations
router.get('/my-invitations', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ei.user_id = $1';
    const params = [req.user.userId];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND ei.status = $${++paramCount}`;
      params.push(status);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM event_invitations ei
       JOIN events e ON ei.event_id = e.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get invitations
    paramCount++;
    const invitationsResult = await query(
      `SELECT ei.*, e.name as event_name, e.description, e.start_date, e.end_date, 
              e.venue, e.stage, e.is_public, e.is_invite_only,
              u.first_name as inviter_first_name, u.last_name as inviter_last_name
       FROM event_invitations ei
       JOIN events e ON ei.event_id = e.id
       LEFT JOIN users u ON ei.invited_by = u.id
       ${whereClause}
       ORDER BY ei.sent_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        invitations: invitationsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Respond to invitation
router.patch('/:id/respond', authMiddleware, validateRequest(respondInvitationSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE event_invitations 
       SET status = $1, responded_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    // If accepted, automatically RSVP to the event
    if (status === 'accepted') {
      const invitation = result.rows[0];
      
      // Check if already RSVP'd
      const existingRsvp = await query(
        'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [invitation.event_id, req.user.userId]
      );

      if (existingRsvp.rows.length === 0) {
        await query(
          'INSERT INTO event_attendees (event_id, user_id, rsvp_status) VALUES ($1, $2, $3)',
          [invitation.event_id, req.user.userId, 'confirmed']
        );
      }
    }

    res.json({
      success: true,
      message: `Invitation ${status} successfully`,
      data: {
        invitation: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get event invitations (Admin only)
router.get('/event/:eventId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ei.event_id = $1';
    const params = [eventId];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND ei.status = $${++paramCount}`;
      params.push(status);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM event_invitations ei
       JOIN users u ON ei.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get invitations
    paramCount++;
    const invitationsResult = await query(
      `SELECT ei.*, u.first_name, u.last_name, u.email, u.role,
              inviter.first_name as inviter_first_name, inviter.last_name as inviter_last_name
       FROM event_invitations ei
       JOIN users u ON ei.user_id = u.id
       LEFT JOIN users inviter ON ei.invited_by = inviter.id
       ${whereClause}
       ORDER BY ei.sent_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        invitations: invitationsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get event invitations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete invitation (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM event_invitations WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    res.json({
      success: true,
      message: 'Invitation deleted successfully'
    });
  } catch (error) {
    console.error('Delete invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
