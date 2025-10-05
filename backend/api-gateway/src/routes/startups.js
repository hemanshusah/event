const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const { authMiddleware, requireFounderOrAdmin, requireInvestorOrAdmin, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed'), false);
    }
  }
});

// Validation schemas
const createStartupSchema = Joi.object({
  companyName: Joi.string().min(2).max(255).required(),
  tagline: Joi.string().min(10).max(500).optional(),
  description: Joi.string().min(50).max(2000).required(),
  website: Joi.string().uri().optional(),
  industry: Joi.string().min(2).max(100).required(),
  stage: Joi.string().valid('idea', 'mvp', 'early_traction', 'growth', 'scale').required(),
  foundedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  teamSize: Joi.number().integer().min(1).max(10000).required(),
  location: Joi.string().min(2).max(255).required(),
  fundingRaised: Joi.number().min(0).optional(),
  fundingGoal: Joi.number().min(0).optional(),
  financialInfo: Joi.object({
    revenue: Joi.number().min(0).optional(),
    burnRate: Joi.number().min(0).optional(),
    runway: Joi.number().min(0).optional(),
    monthlyRecurringRevenue: Joi.number().min(0).optional(),
    customerAcquisitionCost: Joi.number().min(0).optional(),
    lifetimeValue: Joi.number().min(0).optional()
  }).optional(),
  tractionMetrics: Joi.object({
    users: Joi.number().min(0).optional(),
    customers: Joi.number().min(0).optional(),
    revenue: Joi.number().min(0).optional(),
    growthRate: Joi.number().min(0).optional(),
    retentionRate: Joi.number().min(0).max(100).optional(),
    churnRate: Joi.number().min(0).max(100).optional()
  }).optional()
});

const updateStartupSchema = Joi.object({
  companyName: Joi.string().min(2).max(255).optional(),
  tagline: Joi.string().min(10).max(500).optional(),
  description: Joi.string().min(50).max(2000).optional(),
  website: Joi.string().uri().optional(),
  industry: Joi.string().min(2).max(100).optional(),
  stage: Joi.string().valid('idea', 'mvp', 'early_traction', 'growth', 'scale').optional(),
  foundedYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  teamSize: Joi.number().integer().min(1).max(10000).optional(),
  location: Joi.string().min(2).max(255).optional(),
  fundingRaised: Joi.number().min(0).optional(),
  fundingGoal: Joi.number().min(0).optional(),
  isPublic: Joi.boolean().optional(),
  financialInfo: Joi.object({
    revenue: Joi.number().min(0).optional(),
    burnRate: Joi.number().min(0).optional(),
    runway: Joi.number().min(0).optional(),
    monthlyRecurringRevenue: Joi.number().min(0).optional(),
    customerAcquisitionCost: Joi.number().min(0).optional(),
    lifetimeValue: Joi.number().min(0).optional()
  }).optional(),
  tractionMetrics: Joi.object({
    users: Joi.number().min(0).optional(),
    customers: Joi.number().min(0).optional(),
    revenue: Joi.number().min(0).optional(),
    growthRate: Joi.number().min(0).optional(),
    retentionRate: Joi.number().min(0).max(100).optional(),
    churnRate: Joi.number().min(0).max(100).optional()
  }).optional()
});

const teamMemberSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  title: Joi.string().min(2).max(100).required(),
  bio: Joi.string().min(10).max(1000).optional(),
  linkedin: Joi.string().uri().optional(),
  email: Joi.string().email().optional()
});

// Get all startups (with filtering)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      industry, 
      stage, 
      search,
      isPublic,
      minFunding,
      maxFunding,
      location,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Apply filters based on user role
    if (req.user.role === 'founder') {
      whereClause += ` AND s.user_id = $${++paramCount}`;
      params.push(req.user.userId);
    } else if (req.user.role === 'investor') {
      // Investors can only see public startups or those they have access to
      whereClause += ` AND (s.is_public = true OR s.id IN (SELECT startup_id FROM startup_access_requests WHERE investor_id = $${++paramCount} AND status = 'approved'))`;
      params.push(req.user.userId);
    }

    if (industry) {
      whereClause += ` AND s.industry ILIKE $${++paramCount}`;
      params.push(`%${industry}%`);
    }

    if (stage) {
      whereClause += ` AND s.stage = $${++paramCount}`;
      params.push(stage);
    }

    if (search) {
      whereClause += ` AND (s.company_name ILIKE $${++paramCount} OR s.description ILIKE $${++paramCount} OR s.tagline ILIKE $${++paramCount})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    if (isPublic !== undefined) {
      whereClause += ` AND s.is_public = $${++paramCount}`;
      params.push(isPublic === 'true');
    }

    if (minFunding !== undefined) {
      whereClause += ` AND s.funding_raised >= $${++paramCount}`;
      params.push(parseFloat(minFunding));
    }

    if (maxFunding !== undefined) {
      whereClause += ` AND s.funding_raised <= $${++paramCount}`;
      params.push(parseFloat(maxFunding));
    }

    if (location) {
      whereClause += ` AND s.location ILIKE $${++paramCount}`;
      params.push(`%${location}%`);
    }

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'company_name', 'funding_raised', 'investability_score'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM startups s ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get startups
    paramCount++;
    const startupsResult = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email as founder_email,
              CASE WHEN sar.investor_id = $${++paramCount} THEN true ELSE false END as has_access
       FROM startups s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN startup_access_requests sar ON s.id = sar.startup_id AND sar.investor_id = $${paramCount - 1} AND sar.status = 'approved'
       ${whereClause}
       ORDER BY s.${sortField} ${sortDirection}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, req.user.userId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        startups: startupsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get startups error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get startup by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email as founder_email,
              CASE WHEN sar.investor_id = $2 THEN true ELSE false END as has_access,
              sar.status as access_status
       FROM startups s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN startup_access_requests sar ON s.id = sar.startup_id AND sar.investor_id = $2
       WHERE s.id = $1`,
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    const startup = result.rows[0];

    // Check access permissions
    if (!startup.is_public && !startup.has_access && req.user.role !== 'admin' && startup.user_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get team members
    const teamResult = await query(
      'SELECT * FROM startup_team_members WHERE startup_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      success: true,
      data: {
        startup: {
          ...startup,
          teamMembers: teamResult.rows
        }
      }
    });
  } catch (error) {
    console.error('Get startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create startup (Founder only)
router.post('/', authMiddleware, requireFounderOrAdmin, validateRequest(createStartupSchema), async (req, res) => {
  try {
    const {
      companyName,
      tagline,
      description,
      website,
      industry,
      stage,
      foundedYear,
      teamSize,
      location,
      fundingRaised,
      fundingGoal,
      financialInfo,
      tractionMetrics
    } = req.body;

    // Check if user already has a startup
    const existingStartup = await query(
      'SELECT id FROM startups WHERE user_id = $1',
      [req.user.userId]
    );

    if (existingStartup.rows.length > 0 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You already have a startup profile'
      });
    }

    const result = await query(
      `INSERT INTO startups (user_id, company_name, tagline, description, website, industry, stage, 
                            founded_year, team_size, location, funding_raised, funding_goal, 
                            financial_info, traction_metrics, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        req.user.userId, companyName, tagline, description, website, industry, stage,
        foundedYear, teamSize, location, fundingRaised || 0, fundingGoal || 0,
        JSON.stringify(financialInfo || {}), JSON.stringify(tractionMetrics || {}), false
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Startup profile created successfully',
      data: {
        startup: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update startup
router.put('/:id', authMiddleware, validateRequest(updateStartupSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user owns this startup or is admin
    const startupResult = await query(
      'SELECT user_id FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        if (key === 'financialInfo' || key === 'tractionMetrics') {
          updateFields.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramCount}`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${dbField} = $${paramCount}`);
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
      `UPDATE startups SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Startup updated successfully',
      data: {
        startup: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete startup
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns this startup or is admin
    const startupResult = await query(
      'SELECT user_id FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await query(
      'DELETE FROM startups WHERE id = $1 RETURNING *',
      [id]
    );

    res.json({
      success: true,
      message: 'Startup deleted successfully'
    });
  } catch (error) {
    console.error('Delete startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload startup logo
router.post('/:id/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if user owns this startup or is admin
    const startupResult = await query(
      'SELECT user_id FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Here you would typically upload to S3 or your file storage service
    // For now, we'll just return a success message
    const logoUrl = `https://your-storage-bucket.com/startups/${id}/logo-${Date.now()}.${req.file.originalname.split('.').pop()}`;

    const result = await query(
      'UPDATE startups SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [logoUrl, id]
    );

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoUrl
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload pitch deck
router.post('/:id/pitch-deck', authMiddleware, upload.single('pitchDeck'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if user owns this startup or is admin
    const startupResult = await query(
      'SELECT user_id FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Here you would typically upload to S3 or your file storage service
    const pitchDeckUrl = `https://your-storage-bucket.com/startups/${id}/pitch-deck-${Date.now()}.${req.file.originalname.split('.').pop()}`;

    const result = await query(
      'UPDATE startups SET pitch_deck_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [pitchDeckUrl, id]
    );

    res.json({
      success: true,
      message: 'Pitch deck uploaded successfully',
      data: {
        pitchDeckUrl
      }
    });
  } catch (error) {
    console.error('Upload pitch deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add team member
router.post('/:id/team-members', authMiddleware, validateRequest(teamMemberSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, bio, linkedin, email } = req.body;

    // Check if user owns this startup or is admin
    const startupResult = await query(
      'SELECT user_id FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await query(
      `INSERT INTO startup_team_members (startup_id, name, title, bio, linkedin, email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, title, bio, linkedin, email]
    );

    res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      data: {
        teamMember: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update team member
router.put('/:id/team-members/:memberId', authMiddleware, validateRequest(teamMemberSchema), async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const { name, title, bio, linkedin, email } = req.body;

    // Check if user owns this startup or is admin
    const startupResult = await query(
      'SELECT user_id FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await query(
      `UPDATE startup_team_members 
       SET name = $1, title = $2, bio = $3, linkedin = $4, email = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND startup_id = $7
       RETURNING *`,
      [name, title, bio, linkedin, email, memberId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.json({
      success: true,
      message: 'Team member updated successfully',
      data: {
        teamMember: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete team member
router.delete('/:id/team-members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { id, memberId } = req.params;

    // Check if user owns this startup or is admin
    const startupResult = await query(
      'SELECT user_id FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await query(
      'DELETE FROM startup_team_members WHERE id = $1 AND startup_id = $2 RETURNING *',
      [memberId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    res.json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Request access to startup (Investor only)
router.post('/:id/request-access', authMiddleware, requireInvestorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if startup exists
    const startupResult = await query(
      'SELECT id, is_public FROM startups WHERE id = $1',
      [id]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    if (startupResult.rows[0].is_public) {
      return res.status(400).json({
        success: false,
        message: 'This startup is public, no access request needed'
      });
    }

    // Check if request already exists
    const existingRequest = await query(
      'SELECT id FROM startup_access_requests WHERE startup_id = $1 AND investor_id = $2',
      [id, req.user.userId]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Access request already exists'
      });
    }

    const result = await query(
      'INSERT INTO startup_access_requests (startup_id, investor_id) VALUES ($1, $2) RETURNING *',
      [id, req.user.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Access request sent successfully',
      data: {
        request: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get access requests for startup (Admin only)
router.get('/:id/access-requests', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE sar.startup_id = $1';
    const params = [id];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND sar.status = $${++paramCount}`;
      params.push(status);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM startup_access_requests sar
       JOIN investors i ON sar.investor_id = i.id
       JOIN users u ON i.user_id = u.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get access requests
    paramCount++;
    const requestsResult = await query(
      `SELECT sar.*, u.first_name, u.last_name, u.email, i.company_name as investor_company,
              admin.first_name as reviewed_by_first_name, admin.last_name as reviewed_by_last_name
       FROM startup_access_requests sar
       JOIN investors i ON sar.investor_id = i.id
       JOIN users u ON i.user_id = u.id
       LEFT JOIN users admin ON sar.reviewed_by = admin.id
       ${whereClause}
       ORDER BY sar.requested_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        requests: requestsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get access requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve/Deny access request (Admin only)
router.patch('/:id/access-requests/:requestId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id, requestId } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved or denied'
      });
    }

    const result = await query(
      `UPDATE startup_access_requests 
       SET status = $1, notes = $2, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $3
       WHERE id = $4 AND startup_id = $5
       RETURNING *`,
      [status, notes, req.user.userId, requestId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    res.json({
      success: true,
      message: `Access request ${status} successfully`,
      data: {
        request: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update access request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
