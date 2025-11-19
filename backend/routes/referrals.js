import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// Helper function to clean undefined values
function clean(obj) {
  const cleaned = {};
  for (const key in obj) {
    cleaned[key] = obj[key] === undefined ? null : obj[key];
  }
  return cleaned;
}

// GET /api/referrals - Get all referrals with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager', 'nurse'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { patient_id, from_facility_id, to_facility_id, status, urgency } = req.query;

    let query = `
      SELECT 
        r.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        f1.facility_name AS from_facility_name,
        f2.facility_name AS to_facility_name,
        u1.full_name AS referred_by_name,
        u2.full_name AS accepted_by_name
      FROM referrals r
      LEFT JOIN patients p ON r.patient_id = p.patient_id
      LEFT JOIN facilities f1 ON r.from_facility_id = f1.facility_id
      LEFT JOIN facilities f2 ON r.to_facility_id = f2.facility_id
      LEFT JOIN users u1 ON r.referred_by = u1.user_id
      LEFT JOIN users u2 ON r.accepted_by = u2.user_id
      WHERE 1=1
    `;

    const params = [];

    if (patient_id) {
      query += ' AND r.patient_id = ?';
      params.push(patient_id);
    }

    if (from_facility_id) {
      query += ' AND r.from_facility_id = ?';
      params.push(from_facility_id);
    }

    if (to_facility_id) {
      query += ' AND r.to_facility_id = ?';
      params.push(to_facility_id);
    }

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (urgency) {
      query += ' AND r.urgency = ?';
      params.push(urgency);
    }

    query += ' ORDER BY r.referred_at DESC';

    const [referrals] = await db.query(query, params);

    res.json({ success: true, referrals });
  } catch (err) {
    console.error('Fetch referrals error:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/referrals/:id - Get referral by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [referrals] = await db.query(
      `SELECT 
        r.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        f1.facility_name AS from_facility_name,
        f2.facility_name AS to_facility_name,
        u1.full_name AS referred_by_name,
        u2.full_name AS accepted_by_name
      FROM referrals r
      LEFT JOIN patients p ON r.patient_id = p.patient_id
      LEFT JOIN facilities f1 ON r.from_facility_id = f1.facility_id
      LEFT JOIN facilities f2 ON r.to_facility_id = f2.facility_id
      LEFT JOIN users u1 ON r.referred_by = u1.user_id
      LEFT JOIN users u2 ON r.accepted_by = u2.user_id
      WHERE r.referral_id = ?`,
      [req.params.id]
    );

    if (referrals.length === 0) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    res.json({ success: true, referral: referrals[0] });
  } catch (err) {
    console.error('Fetch referral error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/referrals - Create new referral (P7.1)
router.post('/', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      patient_id,
      from_facility_id,
      to_facility_id,
      referral_reason,
      urgency = 'routine',
      clinical_notes,
    } = req.body;

    // Validate required fields
    if (!patient_id || !from_facility_id || !to_facility_id || !referral_reason) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, from_facility_id, to_facility_id, referral_reason',
      });
    }

    // Generate UUID
    const referral_id = uuidv4();

    // Insert referral
    await connection.query(
      `INSERT INTO referrals (
        referral_id, patient_id, from_facility_id, to_facility_id,
        referral_reason, urgency, status, clinical_notes, referred_by, referred_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())`,
      [
        referral_id,
        patient_id,
        from_facility_id,
        to_facility_id,
        referral_reason,
        urgency,
        clinical_notes || null,
        req.user.user_id,
      ]
    );

    // Get facility names for task description
    const [fromFacility] = await connection.query(
      'SELECT facility_name FROM facilities WHERE facility_id = ?',
      [from_facility_id]
    );
    const [toFacility] = await connection.query(
      'SELECT facility_name FROM facilities WHERE facility_id = ?',
      [to_facility_id]
    );
    
    const fromFacilityName = fromFacility[0]?.facility_name || 'Unknown Facility';
    const toFacilityName = toFacility[0]?.facility_name || 'Unknown Facility';

    // Create care task for follow-up
    const task_id = uuidv4();
    await connection.query(
      `INSERT INTO care_tasks (
        task_id, referral_id, patient_id, assignee_id, task_type,
        task_description, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, 'referral', ?, 'pending', ?, NOW())`,
      [
        task_id,
        referral_id,
        patient_id,
        req.user.user_id,
        `Follow up on referral from ${fromFacilityName} to ${toFacilityName}`,
        req.user.user_id,
      ]
    );

    await connection.commit();

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'CREATE',
      module: 'Referrals',
      entity_type: 'referral',
      entity_id: referral_id,
      record_id: referral_id,
      new_value: { referral_id, patient_id, from_facility_id, to_facility_id, urgency },
      change_summary: `Created referral for patient ${patient_id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Referral created successfully',
      referral: { referral_id, patient_id, status: 'pending' },
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create referral error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  } finally {
    connection.release();
  }
});

// PUT /api/referrals/:id/accept - Accept referral
router.put('/:id/accept', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [referrals] = await db.query(
      'SELECT * FROM referrals WHERE referral_id = ?',
      [req.params.id]
    );

    if (referrals.length === 0) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    const referral = referrals[0];

    if (referral.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Referral is already ${referral.status}`,
      });
    }

    await db.query(
      `UPDATE referrals 
       SET status = 'accepted', accepted_at = NOW(), accepted_by = ?
       WHERE referral_id = ?`,
      [req.user.user_id, req.params.id]
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'Referrals',
      entity_type: 'referral',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: { status: 'pending' },
      new_value: { status: 'accepted' },
      change_summary: `Accepted referral ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Referral accepted successfully' });
  } catch (err) {
    console.error('Accept referral error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/referrals/:id/reject - Reject referral
router.put('/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { rejection_reason } = req.body;

    const [referrals] = await db.query(
      'SELECT * FROM referrals WHERE referral_id = ?',
      [req.params.id]
    );

    if (referrals.length === 0) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    await db.query(
      `UPDATE referrals 
       SET status = 'rejected', rejection_reason = ?
       WHERE referral_id = ?`,
      [rejection_reason || null, req.params.id]
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'Referrals',
      entity_type: 'referral',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: { status: referrals[0].status },
      new_value: { status: 'rejected', rejection_reason },
      change_summary: `Rejected referral ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Referral rejected successfully' });
  } catch (err) {
    console.error('Reject referral error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/referrals/:id/complete - Complete referral
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db.query(
      `UPDATE referrals 
       SET status = 'completed', completed_at = NOW()
       WHERE referral_id = ?`,
      [req.params.id]
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'Referrals',
      entity_type: 'referral',
      entity_id: req.params.id,
      record_id: req.params.id,
      new_value: { status: 'completed' },
      change_summary: `Completed referral ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Referral completed successfully' });
  } catch (err) {
    console.error('Complete referral error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

