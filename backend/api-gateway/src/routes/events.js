const express = require('express');
const Joi = require('joi');
const { authMiddleware, requireAdmin, requireFounderOrAdmin, requireInvestorOrAdmin } = require('../middleware/auth');
const { query } = require('../config/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schemas
const createEventSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().min(10).max(2000).required(),
  stage: Joi.string().valid('scouting', 'deal_sourcing', 'retreat').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  venue: Joi.string().min(3).max(255).required(),
  address: Joi.string().min(10).max(500).required(),
  maxCapacity: Joi.number().integer().min(1).max(10000).required(),
  isPublic: Joi.boolean().default(false),
  isInviteOnly: Joi.boolean().default(false),
  agenda: Joi.array().items(Joi.object({
    time: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    speaker: Joi.string().optional()
  })).optional(),
  speakers: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    title: Joi.string().required(),
    bio: Joi.string().optional(),
    image: Joi.string().uri().optional()
  })).optional()
});

const updateEventSchema = Joi.object({
  name: Joi.string().min(3).max(255).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  stage: Joi.string().valid('scouting', 'deal_sourcing', 'retreat').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  venue: Joi.string().min(3).max(255).optional(),
  address: Joi.string().min(10).max(500).optional(),
  maxCapacity: Joi.number().integer().min(1).max(10000).optional(),
  isPublic: Joi.boolean().optional(),
  isInviteOnly: Joi.boolean().optional(),
  status: Joi.string().valid('draft', 'published', 'ongoing', 'completed', 'cancelled').optional(),
  agenda: Joi.array().items(Joi.object({
    time: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().optional(),
    speaker: Joi.string().optional()
  })).optional(),
  speakers: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    title: Joi.string().required(),
    bio: Joi.string().optional(),
    image: Joi.string().uri().optional()
  })).optional()
});

const rsvpSchema = Joi.object({
  rsvpStatus: Joi.string().valid('confirmed', 'cancelled').required()
});

// Get all events (with filtering)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      stage, 
      status, 
      search,
      isPublic,
      isInviteOnly,
      startDate,
      endDate
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Apply filters based on user role
    if (req.user.role === 'founder') {
      whereClause += ` AND (is_public = true OR id IN (SELECT event_id FROM event_invitations WHERE user_id = $${++paramCount}))`;
      params.push(req.user.userId);
    } else if (req.user.role === 'investor') {
      whereClause += ` AND (is_public = true OR id IN (SELECT event_id FROM event_invitations WHERE user_id = $${++paramCount}))`;
      params.push(req.user.userId);
    }

    if (stage) {
      whereClause += ` AND stage = $${++paramCount}`;
      params.push(stage);
    }

    if (status) {
      whereClause += ` AND status = $${++paramCount}`;
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${++paramCount} OR description ILIKE $${++paramCount})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    if (isPublic !== undefined) {
      whereClause += ` AND is_public = $${++paramCount}`;
      params.push(isPublic === 'true');
    }

    if (isInviteOnly !== undefined) {
      whereClause += ` AND is_invite_only = $${++paramCount}`;
      params.push(isInviteOnly === 'true');
    }

    if (startDate) {
      whereClause += ` AND start_date >= $${++paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND end_date <= $${++paramCount}`;
      params.push(endDate);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM events ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get events
    paramCount++;
    const eventsResult = await query(
      `SELECT e.*, 
              COUNT(ea.user_id) as attendee_count,
              CASE WHEN ea.user_id = $${++paramCount} THEN true ELSE false END as is_attending
       FROM events e
       LEFT JOIN event_attendees ea ON e.id = ea.event_id
       LEFT JOIN event_attendees ea2 ON e.id = ea2.event_id AND ea2.user_id = $${paramCount - 1}
       ${whereClause.replace('WHERE 1=1', 'WHERE e.id IN (SELECT id FROM events WHERE 1=1') + ')'}
       GROUP BY e.id, ea2.user_id
       ORDER BY e.start_date DESC 
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, req.user.userId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        events: eventsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get event by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT e.*, 
              COUNT(ea.user_id) as attendee_count,
              CASE WHEN ea2.user_id = $2 THEN true ELSE false END as is_attending,
              CASE WHEN ei.user_id = $2 THEN true ELSE false END as is_invited
       FROM events e
       LEFT JOIN event_attendees ea ON e.id = ea.event_id
       LEFT JOIN event_attendees ea2 ON e.id = ea2.event_id AND ea2.user_id = $2
       LEFT JOIN event_invitations ei ON e.id = ei.event_id AND ei.user_id = $2
       WHERE e.id = $1
       GROUP BY e.id, ea2.user_id, ei.user_id`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = result.rows[0];

    // Check access permissions
    if (!event.is_public && !event.is_invited && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create event (Admin only)
router.post('/', authMiddleware, requireAdmin, validateRequest(createEventSchema), async (req, res) => {
  try {
    const {
      name,
      description,
      stage,
      startDate,
      endDate,
      venue,
      address,
      maxCapacity,
      isPublic,
      isInviteOnly,
      agenda,
      speakers
    } = req.body;

    const result = await query(
      `INSERT INTO events (name, description, stage, start_date, end_date, venue, address, max_capacity, is_public, is_invite_only, agenda, speakers, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [name, description, stage, startDate, endDate, venue, address, maxCapacity, isPublic, isInviteOnly, JSON.stringify(agenda || []), JSON.stringify(speakers || []), req.user.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update event (Admin only)
router.put('/:id', authMiddleware, requireAdmin, validateRequest(updateEventSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        if (key === 'agenda' || key === 'speakers') {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    paramCount++;

    const result = await query(
      `UPDATE events SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete event (Admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// RSVP to event
router.post('/:id/rsvp', authMiddleware, validateRequest(rsvpSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { rsvpStatus } = req.body;

    // Check if event exists and user has access
    const eventResult = await query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Check if user has access to this event
    if (!event.is_public && req.user.role !== 'admin') {
      const invitationResult = await query(
        'SELECT * FROM event_invitations WHERE event_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );

      if (invitationResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You are not invited to this event'
        });
      }
    }

    // Check capacity
    if (rsvpStatus === 'confirmed') {
      const attendeeCount = await query(
        'SELECT COUNT(*) FROM event_attendees WHERE event_id = $1 AND rsvp_status = $2',
        [id, 'confirmed']
      );

      if (parseInt(attendeeCount.rows[0].count) >= event.max_capacity) {
        return res.status(400).json({
          success: false,
          message: 'Event is at full capacity'
        });
      }
    }

    // Upsert RSVP
    const result = await query(
      `INSERT INTO event_attendees (event_id, user_id, rsvp_status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id)
       DO UPDATE SET rsvp_status = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, req.user.userId, rsvpStatus]
    );

    res.json({
      success: true,
      message: `RSVP ${rsvpStatus} successfully`,
      data: {
        rsvp: result.rows[0]
      }
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Cancel RSVP
router.delete('/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'RSVP not found'
      });
    }

    res.json({
      success: true,
      message: 'RSVP cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get event attendees (Admin only)
router.get('/:id/attendees', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE ea.event_id = $1';
    const params = [id];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND ea.rsvp_status = $${++paramCount}`;
      params.push(status);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get attendees
    paramCount++;
    const attendeesResult = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.profile_image_url,
              ea.rsvp_status, ea.attended, ea.check_in_time, ea.check_out_time, ea.created_at
       FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       ${whereClause}
       ORDER BY ea.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        attendees: attendeesResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Check in/out for event (Admin only)
router.post('/:id/check-in/:userId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { action } = req.body; // 'check-in' or 'check-out'

    if (!['check-in', 'check-out'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be check-in or check-out'
      });
    }

    const updateField = action === 'check-in' ? 'check_in_time' : 'check_out_time';
    const attendedField = action === 'check-in' ? 'attended = true' : '';

    const result = await query(
      `UPDATE event_attendees 
       SET ${updateField} = CURRENT_TIMESTAMP${attendedField ? ', ' + attendedField : ''}
       WHERE event_id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendee not found'
      });
    }

    res.json({
      success: true,
      message: `Check ${action} successful`,
      data: {
        attendee: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Check in/out error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
