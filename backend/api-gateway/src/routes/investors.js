const express = require('express');
const Joi = require('joi');
const { authMiddleware, requireInvestorOrAdmin, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation schemas
const createInvestorSchema = Joi.object({
  companyName: Joi.string().min(2).max(255).required(),
  investmentFocus: Joi.array().items(Joi.string().valid(
    'seed', 'series_a', 'series_b', 'series_c', 'growth', 'late_stage'
  )).min(1).required(),
  investmentRange: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(0).required()
  }).required(),
  industries: Joi.array().items(Joi.string()).min(1).required(),
  description: Joi.string().min(50).max(2000).required(),
  website: Joi.string().uri().optional(),
  linkedin: Joi.string().uri().optional(),
  location: Joi.string().min(2).max(255).required(),
  portfolioSize: Joi.number().integer().min(0).optional(),
  averageInvestment: Joi.number().min(0).optional(),
  totalInvested: Joi.number().min(0).optional(),
  notableInvestments: Joi.array().items(Joi.string()).optional(),
  investmentCriteria: Joi.object({
    minRevenue: Joi.number().min(0).optional(),
    maxRevenue: Joi.number().min(0).optional(),
    minTeamSize: Joi.number().integer().min(0).optional(),
    maxTeamSize: Joi.number().integer().min(0).optional(),
    requiredStage: Joi.array().items(Joi.string().valid(
      'idea', 'mvp', 'early_traction', 'growth', 'scale'
    )).optional(),
    geographicFocus: Joi.array().items(Joi.string()).optional()
  }).optional()
});

const updateInvestorSchema = Joi.object({
  companyName: Joi.string().min(2).max(255).optional(),
  investmentFocus: Joi.array().items(Joi.string().valid(
    'seed', 'series_a', 'series_b', 'series_c', 'growth', 'late_stage'
  )).min(1).optional(),
  investmentRange: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(0).required()
  }).optional(),
  industries: Joi.array().items(Joi.string()).min(1).optional(),
  description: Joi.string().min(50).max(2000).optional(),
  website: Joi.string().uri().optional(),
  linkedin: Joi.string().uri().optional(),
  location: Joi.string().min(2).max(255).optional(),
  portfolioSize: Joi.number().integer().min(0).optional(),
  averageInvestment: Joi.number().min(0).optional(),
  totalInvested: Joi.number().min(0).optional(),
  notableInvestments: Joi.array().items(Joi.string()).optional(),
  investmentCriteria: Joi.object({
    minRevenue: Joi.number().min(0).optional(),
    maxRevenue: Joi.number().min(0).optional(),
    minTeamSize: Joi.number().integer().min(0).optional(),
    maxTeamSize: Joi.number().integer().min(0).optional(),
    requiredStage: Joi.array().items(Joi.string().valid(
      'idea', 'mvp', 'early_traction', 'growth', 'scale'
    )).optional(),
    geographicFocus: Joi.array().items(Joi.string()).optional()
  }).optional(),
  isActive: Joi.boolean().optional()
});

const dealFlowSchema = Joi.object({
  startupId: Joi.string().uuid().required(),
  status: Joi.string().valid('interested', 'in_review', 'due_diligence', 'negotiating', 'approved', 'rejected').required(),
  notes: Joi.string().max(1000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  expectedCloseDate: Joi.date().optional(),
  investmentAmount: Joi.number().min(0).optional()
});

// Get all investors (with filtering)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      industry, 
      investmentFocus,
      location,
      search,
      isActive,
      minInvestment,
      maxInvestment,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (industry) {
      whereClause += ` AND i.industries::text ILIKE $${++paramCount}`;
      params.push(`%${industry}%`);
    }

    if (investmentFocus) {
      whereClause += ` AND i.investment_focus::text ILIKE $${++paramCount}`;
      params.push(`%${investmentFocus}%`);
    }

    if (location) {
      whereClause += ` AND i.location ILIKE $${++paramCount}`;
      params.push(`%${location}%`);
    }

    if (search) {
      whereClause += ` AND (i.company_name ILIKE $${++paramCount} OR i.description ILIKE $${++paramCount})`;
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    if (isActive !== undefined) {
      whereClause += ` AND i.is_active = $${++paramCount}`;
      params.push(isActive === 'true');
    }

    if (minInvestment !== undefined) {
      whereClause += ` AND i.investment_range->>'min'::numeric >= $${++paramCount}`;
      params.push(parseFloat(minInvestment));
    }

    if (maxInvestment !== undefined) {
      whereClause += ` AND i.investment_range->>'max'::numeric <= $${++paramCount}`;
      params.push(parseFloat(maxInvestment));
    }

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'company_name', 'portfolio_size', 'total_invested'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM investors i ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get investors
    paramCount++;
    const investorsResult = await query(
      `SELECT i.*, u.first_name, u.last_name, u.email as contact_email,
              COUNT(df.id) as active_deals
       FROM investors i
       JOIN users u ON i.user_id = u.id
       LEFT JOIN deal_flow df ON i.id = df.investor_id AND df.status NOT IN ('approved', 'rejected')
       ${whereClause}
       GROUP BY i.id, u.first_name, u.last_name, u.email
       ORDER BY i.${sortField} ${sortDirection}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        investors: investorsResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get investor by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT i.*, u.first_name, u.last_name, u.email as contact_email
       FROM investors i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    const investor = result.rows[0];

    // Get deal flow for this investor
    const dealFlowResult = await query(
      `SELECT df.*, s.company_name, s.stage, s.industry, s.funding_raised,
              u.first_name as founder_first_name, u.last_name as founder_last_name
       FROM deal_flow df
       JOIN startups s ON df.startup_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE df.investor_id = $1
       ORDER BY df.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        investor: {
          ...investor,
          dealFlow: dealFlowResult.rows
        }
      }
    });
  } catch (error) {
    console.error('Get investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create investor profile (Investor only)
router.post('/', authMiddleware, requireInvestorOrAdmin, validateRequest(createInvestorSchema), async (req, res) => {
  try {
    const {
      companyName,
      investmentFocus,
      investmentRange,
      industries,
      description,
      website,
      linkedin,
      location,
      portfolioSize,
      averageInvestment,
      totalInvested,
      notableInvestments,
      investmentCriteria
    } = req.body;

    // Check if user already has an investor profile
    const existingInvestor = await query(
      'SELECT id FROM investors WHERE user_id = $1',
      [req.user.userId]
    );

    if (existingInvestor.rows.length > 0 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You already have an investor profile'
      });
    }

    const result = await query(
      `INSERT INTO investors (user_id, company_name, investment_focus, investment_range, 
                            industries, description, website, linkedin, location, 
                            portfolio_size, average_investment, total_invested, 
                            notable_investments, investment_criteria, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        req.user.userId, companyName, JSON.stringify(investmentFocus), JSON.stringify(investmentRange),
        JSON.stringify(industries), description, website, linkedin, location,
        portfolioSize || 0, averageInvestment || 0, totalInvested || 0,
        JSON.stringify(notableInvestments || []), JSON.stringify(investmentCriteria || {}), true
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Investor profile created successfully',
      data: {
        investor: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Create investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update investor profile
router.put('/:id', authMiddleware, validateRequest(updateInvestorSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user owns this investor profile or is admin
    const investorResult = await query(
      'SELECT user_id FROM investors WHERE id = $1',
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    if (investorResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
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
        if (['investmentFocus', 'investmentRange', 'industries', 'notableInvestments', 'investmentCriteria'].includes(key)) {
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
      `UPDATE investors SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Investor profile updated successfully',
      data: {
        investor: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get deal flow for investor
router.get('/:id/deal-flow', authMiddleware, requireInvestorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status, priority } = req.query;
    const offset = (page - 1) * limit;

    // Check if user owns this investor profile or is admin
    const investorResult = await query(
      'SELECT user_id FROM investors WHERE id = $1',
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    if (investorResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let whereClause = 'WHERE df.investor_id = $1';
    const params = [id];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND df.status = $${++paramCount}`;
      params.push(status);
    }

    if (priority) {
      whereClause += ` AND df.priority = $${++paramCount}`;
      params.push(priority);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM deal_flow df ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get deal flow
    paramCount++;
    const dealFlowResult = await query(
      `SELECT df.*, s.company_name, s.stage, s.industry, s.funding_raised, s.location,
              u.first_name as founder_first_name, u.last_name as founder_last_name,
              u.email as founder_email
       FROM deal_flow df
       JOIN startups s ON df.startup_id = s.id
       JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY df.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        dealFlow: dealFlowResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get deal flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add startup to deal flow
router.post('/:id/deal-flow', authMiddleware, requireInvestorOrAdmin, validateRequest(dealFlowSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { startupId, status, notes, priority, expectedCloseDate, investmentAmount } = req.body;

    // Check if user owns this investor profile or is admin
    const investorResult = await query(
      'SELECT user_id FROM investors WHERE id = $1',
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    if (investorResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if startup exists
    const startupResult = await query(
      'SELECT id FROM startups WHERE id = $1',
      [startupId]
    );

    if (startupResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found'
      });
    }

    // Check if already in deal flow
    const existingDeal = await query(
      'SELECT id FROM deal_flow WHERE investor_id = $1 AND startup_id = $2',
      [id, startupId]
    );

    if (existingDeal.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Startup already in deal flow'
      });
    }

    const result = await query(
      `INSERT INTO deal_flow (investor_id, startup_id, status, notes, priority, 
                            expected_close_date, investment_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, startupId, status, notes, priority || 'medium', expectedCloseDate, investmentAmount]
    );

    res.status(201).json({
      success: true,
      message: 'Startup added to deal flow successfully',
      data: {
        deal: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Add to deal flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update deal flow status
router.put('/:id/deal-flow/:dealId', authMiddleware, requireInvestorOrAdmin, async (req, res) => {
  try {
    const { id, dealId } = req.params;
    const { status, notes, priority, expectedCloseDate, investmentAmount } = req.body;

    // Check if user owns this investor profile or is admin
    const investorResult = await query(
      'SELECT user_id FROM investors WHERE id = $1',
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    if (investorResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await query(
      `UPDATE deal_flow 
       SET status = $1, notes = $2, priority = $3, expected_close_date = $4, 
           investment_amount = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND investor_id = $7
       RETURNING *`,
      [status, notes, priority, expectedCloseDate, investmentAmount, dealId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    res.json({
      success: true,
      message: 'Deal flow updated successfully',
      data: {
        deal: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update deal flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove from deal flow
router.delete('/:id/deal-flow/:dealId', authMiddleware, requireInvestorOrAdmin, async (req, res) => {
  try {
    const { id, dealId } = req.params;

    // Check if user owns this investor profile or is admin
    const investorResult = await query(
      'SELECT user_id FROM investors WHERE id = $1',
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    if (investorResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await query(
      'DELETE FROM deal_flow WHERE id = $1 AND investor_id = $2 RETURNING *',
      [dealId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found'
      });
    }

    res.json({
      success: true,
      message: 'Deal removed from flow successfully'
    });
  } catch (error) {
    console.error('Remove from deal flow error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get startup recommendations for investor
router.get('/:id/recommendations', authMiddleware, requireInvestorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    // Get investor criteria
    const investorResult = await query(
      'SELECT investment_criteria, industries, investment_focus FROM investors WHERE id = $1',
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    const investor = investorResult.rows[0];
    const criteria = investor.investment_criteria || {};
    const industries = investor.industries || [];
    const investmentFocus = investor.investment_focus || [];

    // Build recommendation query based on investor criteria
    let whereClause = 'WHERE s.is_public = true';
    const params = [];
    let paramCount = 0;

    if (criteria.requiredStage && criteria.requiredStage.length > 0) {
      whereClause += ` AND s.stage = ANY($${++paramCount})`;
      params.push(criteria.requiredStage);
    }

    if (criteria.geographicFocus && criteria.geographicFocus.length > 0) {
      whereClause += ` AND s.location ILIKE ANY($${++paramCount})`;
      params.push(criteria.geographicFocus.map(loc => `%${loc}%`));
    }

    if (industries.length > 0) {
      whereClause += ` AND s.industry = ANY($${++paramCount})`;
      params.push(industries);
    }

    if (criteria.minRevenue !== undefined) {
      whereClause += ` AND (s.financial_info->>'revenue')::numeric >= $${++paramCount}`;
      params.push(criteria.minRevenue);
    }

    if (criteria.maxRevenue !== undefined) {
      whereClause += ` AND (s.financial_info->>'revenue')::numeric <= $${++paramCount}`;
      params.push(criteria.maxRevenue);
    }

    // Exclude startups already in deal flow
    whereClause += ` AND s.id NOT IN (SELECT startup_id FROM deal_flow WHERE investor_id = $${++paramCount})`;
    params.push(id);

    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email as founder_email,
              CASE WHEN sar.investor_id = $${++paramCount} THEN true ELSE false END as has_access
       FROM startups s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN startup_access_requests sar ON s.id = sar.startup_id AND sar.investor_id = $${paramCount - 1} AND sar.status = 'approved'
       ${whereClause}
       ORDER BY s.investability_score DESC, s.created_at DESC
       LIMIT $${paramCount + 1}`,
      [...params, id, limit]
    );

    res.json({
      success: true,
      data: {
        recommendations: result.rows
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get investor analytics
router.get('/:id/analytics', authMiddleware, requireInvestorOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user owns this investor profile or is admin
    const investorResult = await query(
      'SELECT user_id FROM investors WHERE id = $1',
      [id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    if (investorResult.rows[0].user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get deal flow statistics
    const dealStatsResult = await query(
      `SELECT 
        status,
        COUNT(*) as count,
        AVG(investment_amount) as avg_investment
       FROM deal_flow 
       WHERE investor_id = $1 
       GROUP BY status`,
      [id]
    );

    // Get industry distribution
    const industryStatsResult = await query(
      `SELECT 
        s.industry,
        COUNT(*) as count
       FROM deal_flow df
       JOIN startups s ON df.startup_id = s.id
       WHERE df.investor_id = $1
       GROUP BY s.industry
       ORDER BY count DESC`,
      [id]
    );

    // Get stage distribution
    const stageStatsResult = await query(
      `SELECT 
        s.stage,
        COUNT(*) as count
       FROM deal_flow df
       JOIN startups s ON df.startup_id = s.id
       WHERE df.investor_id = $1
       GROUP BY s.stage
       ORDER BY count DESC`,
      [id]
    );

    // Get monthly deal flow
    const monthlyStatsResult = await query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as deals_added
       FROM deal_flow 
       WHERE investor_id = $1 
       AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month`,
      [id]
    );

    res.json({
      success: true,
      data: {
        dealStats: dealStatsResult.rows,
        industryDistribution: industryStatsResult.rows,
        stageDistribution: stageStatsResult.rows,
        monthlyTrends: monthlyStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
