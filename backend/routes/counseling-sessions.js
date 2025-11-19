import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// GET /api/counseling-sessions - Get all counseling sessions with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager', 'nurse'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { patient_id, counselor_id, facility_id, session_type, session_date_from, session_date_to } = req.query;

    let query = `
      SELECT 
        cs.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS counselor_name,
        f.facility_name
      FROM counseling_sessions cs
      LEFT JOIN patients p ON cs.patient_id = p.patient_id
      LEFT JOIN users u ON cs.counselor_id = u.user_id
      LEFT JOIN facilities f ON cs.facility_id = f.facility_id
      WHERE 1=1
    `;

    const params = [];

    if (patient_id) {
      query += ' AND cs.patient_id = ?';
      params.push(patient_id);
    }

    if (counselor_id) {
      query += ' AND cs.counselor_id = ?';
      params.push(counselor_id);
    }

    if (facility_id) {
      query += ' AND cs.facility_id = ?';
      params.push(facility_id);
    }

    if (session_type) {
      query += ' AND cs.session_type = ?';
      params.push(session_type);
    }

    if (session_date_from) {
      query += ' AND cs.session_date >= ?';
      params.push(session_date_from);
    }

    if (session_date_to) {
      query += ' AND cs.session_date <= ?';
      params.push(session_date_to);
    }

    // Filter by role - non-admin users see only their sessions
    if (req.user.role !== 'admin') {
      query += ' AND cs.counselor_id = ?';
      params.push(req.user.user_id);
    }

    query += ' ORDER BY cs.session_date DESC, cs.created_at DESC';

    const [sessions] = await db.query(query, params);

    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Fetch counseling sessions error:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/counseling-sessions/:id - Get counseling session by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      `SELECT 
        cs.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u.full_name AS counselor_name,
        f.facility_name
      FROM counseling_sessions cs
      LEFT JOIN patients p ON cs.patient_id = p.patient_id
      LEFT JOIN users u ON cs.counselor_id = u.user_id
      LEFT JOIN facilities f ON cs.facility_id = f.facility_id
      WHERE cs.session_id = ?`,
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Counseling session not found' });
    }

    // Check access - non-admin users can only see their own sessions
    if (req.user.role !== 'admin' && sessions[0].counselor_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, session: sessions[0] });
  } catch (err) {
    console.error('Fetch counseling session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/counseling-sessions - Record counseling session (P7.4)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!['admin', 'physician', 'case_manager', 'nurse'].includes(req.user.role)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      patient_id,
      facility_id,
      session_date,
      session_type,
      session_notes,
      follow_up_required = false,
      follow_up_date,
      follow_up_reason,
      counselor_id, // Allow selecting a specific counselor
    } = req.body;

    // Validate required fields
    if (!patient_id || !facility_id || !session_date || !session_type) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, facility_id, session_date, session_type',
      });
    }

    // Use provided counselor_id or default to current user
    const finalCounselorId = counselor_id || req.user.user_id;

    // Generate UUID
    const session_id = uuidv4();

    // Insert counseling session
    // Note: follow_up_reason column may not exist in older database schemas
    try {
      await connection.query(
        `INSERT INTO counseling_sessions (
          session_id, patient_id, counselor_id, facility_id, session_date,
          session_type, session_notes, follow_up_required, follow_up_date, follow_up_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session_id,
          patient_id,
          finalCounselorId, // Use selected counselor or current user
          facility_id,
          session_date,
          session_type,
          session_notes || null,
          follow_up_required ? 1 : 0,
          follow_up_date || null,
          follow_up_reason || null,
        ]
      );
    } catch (insertErr) {
      // If follow_up_reason column doesn't exist, try without it
      if (insertErr.message && insertErr.message.includes('follow_up_reason')) {
        await connection.query(
          `INSERT INTO counseling_sessions (
            session_id, patient_id, counselor_id, facility_id, session_date,
            session_type, session_notes, follow_up_required, follow_up_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            session_id,
            patient_id,
            finalCounselorId, // Use selected counselor or current user
            facility_id,
            session_date,
            session_type,
            session_notes || null,
            follow_up_required ? 1 : 0,
            follow_up_date || null,
          ]
        );
      } else {
        throw insertErr;
      }
    }

    // Create care task if follow-up needed
    if (follow_up_required && follow_up_date) {
      const task_id = uuidv4();
      await connection.query(
        `INSERT INTO care_tasks (
          task_id, patient_id, assignee_id, task_type,
          task_description, due_date, status, created_by, created_at
        ) VALUES (?, ?, ?, 'counseling', ?, ?, 'pending', ?, NOW())`,
        [
          task_id,
          patient_id,
          req.user.user_id,
          `Follow-up counseling session for ${session_type}`,
          follow_up_date,
          req.user.user_id,
        ]
      );
    }

    await connection.commit();

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'CREATE',
      module: 'Counseling Sessions',
      entity_type: 'counseling_session',
      entity_id: session_id,
      record_id: session_id,
      new_value: { session_id, patient_id, session_type, follow_up_required },
      change_summary: `Recorded ${session_type} counseling session for patient ${patient_id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Counseling session recorded successfully',
      session: { session_id, patient_id, session_type },
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create counseling session error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    connection.release();
  }
});

// PUT /api/counseling-sessions/:id - Update counseling session
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      'SELECT * FROM counseling_sessions WHERE session_id = ?',
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Counseling session not found' });
    }

    // Check access - non-admin users can only update their own sessions
    if (req.user.role !== 'admin' && sessions[0].counselor_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      session_date,
      session_type,
      session_notes,
      follow_up_required,
      follow_up_date,
      follow_up_reason,
    } = req.body;

    await db.query(
      `UPDATE counseling_sessions 
       SET session_date = COALESCE(?, session_date),
           session_type = COALESCE(?, session_type),
           session_notes = COALESCE(?, session_notes),
           follow_up_required = COALESCE(?, follow_up_required),
           follow_up_date = COALESCE(?, follow_up_date),
           follow_up_reason = COALESCE(?, follow_up_reason)
       WHERE session_id = ?`,
      [
        session_date || sessions[0].session_date,
        session_type || sessions[0].session_type,
        session_notes !== undefined ? session_notes : sessions[0].session_notes,
        follow_up_required !== undefined ? (follow_up_required ? 1 : 0) : sessions[0].follow_up_required,
        follow_up_date !== undefined ? follow_up_date : sessions[0].follow_up_date,
        follow_up_reason !== undefined ? follow_up_reason : sessions[0].follow_up_reason,
        req.params.id,
      ]
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'Counseling Sessions',
      entity_type: 'counseling_session',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: sessions[0],
      new_value: req.body,
      change_summary: `Updated counseling session ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Counseling session updated successfully' });
  } catch (err) {
    console.error('Update counseling session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/counseling-sessions/:id - Delete counseling session
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [sessions] = await db.query(
      'SELECT * FROM counseling_sessions WHERE session_id = ?',
      [req.params.id]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ success: false, message: 'Counseling session not found' });
    }

    // Check access - only admin or the counselor who created it
    if (req.user.role !== 'admin' && sessions[0].counselor_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db.query('DELETE FROM counseling_sessions WHERE session_id = ?', [req.params.id]);

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'DELETE',
      module: 'Counseling Sessions',
      entity_type: 'counseling_session',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: sessions[0],
      change_summary: `Deleted counseling session ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Counseling session deleted successfully' });
  } catch (err) {
    console.error('Delete counseling session error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

