import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/survey-metrics/calculate - Calculate and store survey metrics (Module 11)
router.post('/calculate', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    // Only admin, physician, and case_manager can calculate metrics
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { facility_id, period_start, period_end } = req.body;

    if (!period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'period_start and period_end are required',
      });
    }

    await connection.beginTransaction();

    // Build query to aggregate survey responses
    let query = `
      SELECT 
        COUNT(*) as total_responses,
        AVG(CASE 
          WHEN overall_satisfaction = 'very_happy' THEN 5
          WHEN overall_satisfaction = 'happy' THEN 4
          WHEN overall_satisfaction = 'neutral' THEN 3
          WHEN overall_satisfaction = 'unhappy' THEN 2
          WHEN overall_satisfaction = 'very_unhappy' THEN 1
          ELSE NULL
        END) as avg_overall,
        AVG(staff_friendliness) as avg_staff,
        AVG(wait_time) as avg_wait,
        AVG(facility_cleanliness) as avg_cleanliness,
        SUM(CASE WHEN would_recommend = 'yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as recommendation_rate
      FROM survey_responses
      WHERE DATE(submitted_at) >= ? AND DATE(submitted_at) <= ?
    `;
    const params = [period_start, period_end];

    if (facility_id) {
      query += ' AND facility_id = ?';
      params.push(facility_id);
    } else {
      query += ' AND facility_id IS NULL';
    }

    const [results] = await connection.query(query, params);

    if (results.length === 0 || results[0].total_responses === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'No survey responses found for the specified period',
      });
    }

    const metrics = results[0];

    // Check if metrics already exist for this period
    let checkQuery = `
      SELECT metric_id FROM survey_metrics 
      WHERE period_start = ? AND period_end = ?
    `;
    const checkParams = [period_start, period_end];

    if (facility_id) {
      checkQuery += ' AND facility_id = ?';
      checkParams.push(facility_id);
    } else {
      checkQuery += ' AND facility_id IS NULL';
    }

    const [existing] = await connection.query(checkQuery, checkParams);

    const metric_id = uuidv4();

    if (existing.length > 0) {
      // Update existing metrics
      await connection.query(
        `UPDATE survey_metrics SET
          total_responses = ?,
          average_overall = ?,
          average_staff = ?,
          average_wait = ?,
          average_cleanliness = ?,
          recommendation_rate = ?,
          calculated_at = NOW()
        WHERE metric_id = ?`,
        [
          metrics.total_responses,
          metrics.avg_overall ? parseFloat(metrics.avg_overall.toFixed(2)) : null,
          metrics.avg_staff ? parseFloat(metrics.avg_staff.toFixed(2)) : null,
          metrics.avg_wait ? parseFloat(metrics.avg_wait.toFixed(2)) : null,
          metrics.avg_cleanliness ? parseFloat(metrics.avg_cleanliness.toFixed(2)) : null,
          metrics.recommendation_rate ? parseFloat(metrics.recommendation_rate.toFixed(2)) : null,
          existing[0].metric_id,
        ]
      );
    } else {
      // Insert new metrics
      await connection.query(
        `INSERT INTO survey_metrics (
          metric_id, facility_id, period_start, period_end,
          total_responses, average_overall, average_staff,
          average_wait, average_cleanliness, recommendation_rate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          metric_id,
          facility_id || null,
          period_start,
          period_end,
          metrics.total_responses,
          metrics.avg_overall ? parseFloat(metrics.avg_overall.toFixed(2)) : null,
          metrics.avg_staff ? parseFloat(metrics.avg_staff.toFixed(2)) : null,
          metrics.avg_wait ? parseFloat(metrics.avg_wait.toFixed(2)) : null,
          metrics.avg_cleanliness ? parseFloat(metrics.avg_cleanliness.toFixed(2)) : null,
          metrics.recommendation_rate ? parseFloat(metrics.recommendation_rate.toFixed(2)) : null,
        ]
      );
    }

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: existing.length > 0 ? 'UPDATE' : 'CREATE',
        module: 'SURVEYS',
        entity_type: 'survey_metrics',
        entity_id: existing.length > 0 ? existing[0].metric_id : metric_id,
        record_id: `Metrics-${period_start}-${period_end}`,
        new_value: {
          facility_id,
          period_start,
          period_end,
          total_responses: metrics.total_responses,
        },
        change_summary: `Calculated survey metrics for period ${period_start} to ${period_end}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    const [updatedMetrics] = await connection.query(
      'SELECT * FROM survey_metrics WHERE metric_id = ?',
      [existing.length > 0 ? existing[0].metric_id : metric_id]
    );

    res.json({
      success: true,
      message: 'Survey metrics calculated successfully',
      data: updatedMetrics[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error calculating survey metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate survey metrics',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// GET /api/survey-metrics - Get survey metrics (with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admin, physician, and case_manager can view metrics
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { facility_id, period_start, period_end, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        sm.*,
        f.facility_name
      FROM survey_metrics sm
      LEFT JOIN facilities f ON sm.facility_id = f.facility_id
      WHERE 1=1
    `;
    const params = [];

    if (facility_id) {
      query += ' AND sm.facility_id = ?';
      params.push(facility_id);
    }

    if (period_start) {
      query += ' AND sm.period_start >= ?';
      params.push(period_start);
    }

    if (period_end) {
      query += ' AND sm.period_end <= ?';
      params.push(period_end);
    }

    query += ' ORDER BY sm.period_start DESC, sm.calculated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [metrics] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM survey_metrics WHERE 1=1';
    const countParams = [];

    if (facility_id) {
      countQuery += ' AND facility_id = ?';
      countParams.push(facility_id);
    }

    if (period_start) {
      countQuery += ' AND period_start >= ?';
      countParams.push(period_start);
    }

    if (period_end) {
      countQuery += ' AND period_end <= ?';
      countParams.push(period_end);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: metrics,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching survey metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey metrics',
      error: error.message,
    });
  }
});

// GET /api/survey-metrics/summary - Get summary statistics
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    // Only admin, physician, and case_manager can view summary
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { facility_id } = req.query;

    // Get overall statistics
    let statsQuery = `
      SELECT 
        COUNT(*) as total_responses,
        AVG(CASE 
          WHEN overall_satisfaction = 'very_happy' THEN 5
          WHEN overall_satisfaction = 'happy' THEN 4
          WHEN overall_satisfaction = 'neutral' THEN 3
          WHEN overall_satisfaction = 'unhappy' THEN 2
          WHEN overall_satisfaction = 'very_unhappy' THEN 1
          ELSE NULL
        END) as avg_overall,
        AVG(staff_friendliness) as avg_staff,
        AVG(wait_time) as avg_wait,
        AVG(facility_cleanliness) as avg_cleanliness,
        SUM(CASE WHEN would_recommend = 'yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as recommendation_rate
      FROM survey_responses
      WHERE 1=1
    `;
    const statsParams = [];

    if (facility_id) {
      statsQuery += ' AND facility_id = ?';
      statsParams.push(facility_id);
    }

    const [stats] = await db.query(statsQuery, statsParams);

    // Get satisfaction distribution
    let distQuery = `
      SELECT 
        overall_satisfaction,
        COUNT(*) as count
      FROM survey_responses
      WHERE 1=1
    `;
    const distParams = [];

    if (facility_id) {
      distQuery += ' AND facility_id = ?';
      distParams.push(facility_id);
    }

    distQuery += ' GROUP BY overall_satisfaction ORDER BY overall_satisfaction';

    const [distribution] = await db.query(distQuery, distParams);

    res.json({
      success: true,
      data: {
        statistics: stats[0] || {
          total_responses: 0,
          avg_overall: null,
          avg_staff: null,
          avg_wait: null,
          avg_cleanliness: null,
          recommendation_rate: null,
        },
        distribution: distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching survey summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey summary',
      error: error.message,
    });
  }
});

export default router;

