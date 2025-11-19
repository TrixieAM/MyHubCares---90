import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// GET /api/hts-sessions - Get all HTS sessions with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'nurse', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { patient_id, tester_id, facility_id, test_result, test_date_from, test_date_to } = req.query;

    let query = `
      SELECT 
        hts.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS tester_name,
        f.facility_name
      FROM hts_sessions hts
      LEFT JOIN patients p ON hts.patient_id = p.patient_id
      LEFT JOIN users u ON hts.tester_id = u.user_id
      LEFT JOIN facilities f ON hts.facility_id = f.facility_id
      WHERE 1=1
    `;

    const params = [];

    if (patient_id) {
      query += ' AND hts.patient_id = ?';
      params.push(patient_id);
    }

    if (tester_id) {
      query += ' AND hts.tester_id = ?';
      params.push(tester_id);
    }

    if (facility_id) {
      query += ' AND hts.facility_id = ?';
      params.push(facility_id);
    }

    if (test_result) {
      query += ' AND hts.test_result = ?';
      params.push(test_result);
    }

    if (test_date_from) {
      query += ' AND hts.test_date >= ?';
      params.push(test_date_from);
    }

    if (test_date_to) {
      query += ' AND hts.test_date <= ?';
      params.push(test_date_to);
    }

    // Filter by role - non-admin users see only their sessions
    if (req.user.role !== 'admin') {
      query += ' AND hts.tester_id = ?';
      params.push(req.user.user_id);
    }

    query += ' ORDER BY hts.test_date DESC, hts.created_at DESC';

    const [sessions] = await db.query(query, params);

    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Fetch HTS sessions error:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/hts-sessions/:id - Get HTS session by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      `SELECT 
        hts.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS tester_name,
        f.facility_name
      FROM hts_sessions hts
      LEFT JOIN patients p ON hts.patient_id = p.patient_id
      LEFT JOIN users u ON hts.tester_id = u.user_id
      LEFT JOIN facilities f ON hts.facility_id = f.facility_id
      WHERE hts.hts_id = ?`,
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'HTS session not found' });
    }

    // Check access - non-admin users can only see their own sessions
    if (req.user.role !== 'admin' && sessions[0].tester_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, session: sessions[0] });
  } catch (err) {
    console.error('Fetch HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/hts-sessions - Conduct HTS session (P7.3)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!['admin', 'physician', 'nurse'].includes(req.user.role)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      patient_id,
      facility_id,
      tester_id, // Allow selecting a specific tester/counselor
      test_date,
      test_result,
      test_type,
      pre_test_counseling = false,
      post_test_counseling = false,
      linked_to_care = false,
      care_link_date,
      notes,
    } = req.body;

    // Validate required fields
    if (!patient_id || !facility_id || !test_date || !test_result) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, facility_id, test_date, test_result',
      });
    }

    // Use provided tester_id or default to current user
    const finalTesterId = tester_id || req.user.user_id;

    // Generate UUID
    const hts_id = uuidv4();

    // Insert HTS session
    await connection.query(
      `INSERT INTO hts_sessions (
        hts_id, patient_id, tester_id, facility_id, test_date,
        test_result, test_type, pre_test_counseling, post_test_counseling,
        linked_to_care, care_link_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        hts_id,
        patient_id,
        finalTesterId, // Use selected tester or current user
        facility_id,
        test_date,
        test_result,
        test_type || null,
        pre_test_counseling ? 1 : 0,
        post_test_counseling ? 1 : 0,
        linked_to_care ? 1 : 0,
        linked_to_care && care_link_date ? care_link_date : (linked_to_care ? test_date : null),
        notes || null,
      ]
    );

    // If positive, automatically link to care if not already done
    if (test_result === 'positive' && !linked_to_care) {
      await connection.query(
        `UPDATE hts_sessions 
         SET linked_to_care = 1, care_link_date = ?
         WHERE hts_id = ?`,
        [test_date, hts_id]
      );
    }

    await connection.commit();

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'CREATE',
      module: 'HTS Sessions',
      entity_type: 'hts_session',
      entity_id: hts_id,
      record_id: hts_id,
      new_value: { hts_id, patient_id, test_result, linked_to_care },
      change_summary: `Conducted HTS session for patient ${patient_id}, result: ${test_result}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'HTS session recorded successfully',
      session: { hts_id, patient_id, test_result },
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    connection.release();
  }
});

// PUT /api/hts-sessions/:id - Update HTS session
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      'SELECT * FROM hts_sessions WHERE hts_id = ?',
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'HTS session not found' });
    }

    // Check access - non-admin users can only update their own sessions
    if (req.user.role !== 'admin' && sessions[0].tester_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      test_date,
      test_result,
      test_type,
      pre_test_counseling,
      post_test_counseling,
      linked_to_care,
      care_link_date,
      notes,
    } = req.body;

    await db.query(
      `UPDATE hts_sessions 
       SET test_date = COALESCE(?, test_date),
           test_result = COALESCE(?, test_result),
           test_type = COALESCE(?, test_type),
           pre_test_counseling = COALESCE(?, pre_test_counseling),
           post_test_counseling = COALESCE(?, post_test_counseling),
           linked_to_care = COALESCE(?, linked_to_care),
           care_link_date = COALESCE(?, care_link_date),
           notes = COALESCE(?, notes)
       WHERE hts_id = ?`,
      [
        test_date || sessions[0].test_date,
        test_result || sessions[0].test_result,
        test_type !== undefined ? test_type : sessions[0].test_type,
        pre_test_counseling !== undefined ? (pre_test_counseling ? 1 : 0) : sessions[0].pre_test_counseling,
        post_test_counseling !== undefined ? (post_test_counseling ? 1 : 0) : sessions[0].post_test_counseling,
        linked_to_care !== undefined ? (linked_to_care ? 1 : 0) : sessions[0].linked_to_care,
        care_link_date !== undefined ? care_link_date : sessions[0].care_link_date,
        notes !== undefined ? notes : sessions[0].notes,
        req.params.id,
      ]
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'HTS Sessions',
      entity_type: 'hts_session',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: sessions[0],
      new_value: req.body,
      change_summary: `Updated HTS session ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'HTS session updated successfully' });
  } catch (err) {
    console.error('Update HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/hts-sessions/:id - Delete HTS session
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      'SELECT * FROM hts_sessions WHERE hts_id = ?',
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'HTS session not found' });
    }

    // Check access - only admin or the tester who created it
    if (req.user.role !== 'admin' && sessions[0].tester_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db.query('DELETE FROM hts_sessions WHERE hts_id = ?', [req.params.id]);

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'DELETE',
      module: 'HTS Sessions',
      entity_type: 'hts_session',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: sessions[0],
      change_summary: `Deleted HTS session ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'HTS session deleted successfully' });
  } catch (err) {
    console.error('Delete HTS session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

