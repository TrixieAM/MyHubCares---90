import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/survey-responses - Submit a survey response (Module 11)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  let userInfo = null;

  try {
    const {
      patient_id,
      facility_id,
      overall_satisfaction,
      staff_friendliness,
      wait_time,
      facility_cleanliness,
      would_recommend,
      comments,
    } = req.body;

    // Validation
    if (!patient_id || !overall_satisfaction || !staff_friendliness || !wait_time || !facility_cleanliness || !would_recommend) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, overall_satisfaction, staff_friendliness, wait_time, facility_cleanliness, would_recommend',
      });
    }

    // Validate rating ranges
    if (staff_friendliness < 1 || staff_friendliness > 5) {
      return res.status(400).json({
        success: false,
        message: 'staff_friendliness must be between 1 and 5',
      });
    }

    if (wait_time < 1 || wait_time > 5) {
      return res.status(400).json({
        success: false,
        message: 'wait_time must be between 1 and 5',
      });
    }

    if (facility_cleanliness < 1 || facility_cleanliness > 5) {
      return res.status(400).json({
        success: false,
        message: 'facility_cleanliness must be between 1 and 5',
      });
    }

    // Check if patient exists
    const [patients] = await connection.query(
      'SELECT patient_id FROM patients WHERE patient_id = ?',
      [patient_id]
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    await connection.beginTransaction();

    // Calculate average score
    const average_score = ((staff_friendliness + wait_time + facility_cleanliness) / 3).toFixed(2);

    const survey_id = uuidv4();

    // Insert survey response
    await connection.query(
      `INSERT INTO survey_responses (
        survey_id, patient_id, facility_id, overall_satisfaction,
        staff_friendliness, wait_time, facility_cleanliness,
        would_recommend, comments, average_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        survey_id,
        patient_id,
        facility_id || null,
        overall_satisfaction,
        staff_friendliness,
        wait_time,
        facility_cleanliness,
        would_recommend,
        comments || null,
        average_score,
      ]
    );

    userInfo = await getUserInfoForAudit(req.user.user_id);

    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'SURVEYS',
        entity_type: 'survey_response',
        entity_id: survey_id,
        record_id: `Survey-${survey_id.substring(0, 8)}`,
        new_value: {
          patient_id,
          facility_id,
          overall_satisfaction,
          staff_friendliness,
          wait_time,
          facility_cleanliness,
          would_recommend,
          average_score,
        },
        change_summary: `Survey submitted for patient ${patient_id}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Survey submitted successfully',
      data: {
        survey_id,
        average_score: parseFloat(average_score),
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error submitting survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit survey',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// GET /api/survey-responses - Get all survey responses (with filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admin, physician, and case_manager can view all surveys
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { patient_id, facility_id, start_date, end_date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        sr.*,
        p.first_name,
        p.last_name,
        p.uic,
        f.facility_name
      FROM survey_responses sr
      LEFT JOIN patients p ON sr.patient_id = p.patient_id
      LEFT JOIN facilities f ON sr.facility_id = f.facility_id
      WHERE 1=1
    `;
    const params = [];

    if (patient_id) {
      query += ' AND sr.patient_id = ?';
      params.push(patient_id);
    }

    if (facility_id) {
      query += ' AND sr.facility_id = ?';
      params.push(facility_id);
    }

    if (start_date) {
      query += ' AND DATE(sr.submitted_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(sr.submitted_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY sr.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [surveys] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM survey_responses WHERE 1=1';
    const countParams = [];

    if (patient_id) {
      countQuery += ' AND patient_id = ?';
      countParams.push(patient_id);
    }

    if (facility_id) {
      countQuery += ' AND facility_id = ?';
      countParams.push(facility_id);
    }

    if (start_date) {
      countQuery += ' AND DATE(submitted_at) >= ?';
      countParams.push(start_date);
    }

    if (end_date) {
      countQuery += ' AND DATE(submitted_at) <= ?';
      countParams.push(end_date);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: surveys,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey responses',
      error: error.message,
    });
  }
});

// GET /api/survey-responses/:id - Get single survey response
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin, physician, and case_manager can view surveys
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const [surveys] = await db.query(
      `SELECT 
        sr.*,
        p.first_name,
        p.last_name,
        p.uic,
        f.facility_name
      FROM survey_responses sr
      LEFT JOIN patients p ON sr.patient_id = p.patient_id
      LEFT JOIN facilities f ON sr.facility_id = f.facility_id
      WHERE sr.survey_id = ?`,
      [id]
    );

    if (surveys.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Survey response not found',
      });
    }

    res.json({
      success: true,
      data: surveys[0],
    });
  } catch (error) {
    console.error('Error fetching survey response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch survey response',
      error: error.message,
    });
  }
});

// GET /api/survey-responses/patient/:patientId - Get surveys for a specific patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Patients can only view their own surveys
    if (req.user.role === 'patient') {
      // Verify patient access
      const [patientCheck] = await db.query(
        "SELECT patient_id FROM patients WHERE (created_by = ? OR email = (SELECT email FROM users WHERE user_id = ?)) AND patient_id = ?",
        [req.user.user_id, req.user.user_id, patientId]
      );

      if (patientCheck.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own surveys.',
        });
      }
    } else if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const [surveys] = await db.query(
      `SELECT 
        sr.*,
        f.facility_name
      FROM survey_responses sr
      LEFT JOIN facilities f ON sr.facility_id = f.facility_id
      WHERE sr.patient_id = ?
      ORDER BY sr.submitted_at DESC`,
      [patientId]
    );

    res.json({
      success: true,
      data: surveys,
    });
  } catch (error) {
    console.error('Error fetching patient surveys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient surveys',
      error: error.message,
    });
  }
});

export default router;

