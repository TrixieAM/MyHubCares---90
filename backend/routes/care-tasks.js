import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticateToken } from './auth.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';

const router = express.Router();

// GET /api/care-tasks - Get all care tasks with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager', 'nurse'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { patient_id, assignee_id, task_type, status, due_date_from, due_date_to, referral_id } = req.query;

    let query = `
      SELECT 
        ct.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u1.full_name AS assignee_name,
        u2.full_name AS created_by_name,
        r.referral_id AS referral_exists
      FROM care_tasks ct
      LEFT JOIN patients p ON ct.patient_id = p.patient_id
      LEFT JOIN users u1 ON ct.assignee_id = u1.user_id
      LEFT JOIN users u2 ON ct.created_by = u2.user_id
      LEFT JOIN referrals r ON ct.referral_id = r.referral_id
      WHERE 1=1
    `;

    const params = [];

    if (patient_id) {
      query += ' AND ct.patient_id = ?';
      params.push(patient_id);
    }

    if (assignee_id) {
      query += ' AND ct.assignee_id = ?';
      params.push(assignee_id);
    }

    if (task_type) {
      query += ' AND ct.task_type = ?';
      params.push(task_type);
    }

    if (status) {
      query += ' AND ct.status = ?';
      params.push(status);
    }

    if (referral_id) {
      query += ' AND ct.referral_id = ?';
      params.push(referral_id);
    }

    if (due_date_from) {
      query += ' AND ct.due_date >= ?';
      params.push(due_date_from);
    }

    if (due_date_to) {
      query += ' AND ct.due_date <= ?';
      params.push(due_date_to);
    }

    // Filter by role - non-admin users see only their assigned tasks or tasks they created
    if (req.user.role !== 'admin') {
      query += ' AND (ct.assignee_id = ? OR ct.created_by = ?)';
      params.push(req.user.user_id, req.user.user_id);
    }

    query += ' ORDER BY ct.due_date ASC, ct.created_at DESC';

    const [tasks] = await db.query(query, params);

    res.json({ success: true, tasks });
  } catch (err) {
    console.error('Fetch care tasks error:', err);
    console.error('Error details:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/care-tasks/:id - Get care task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.query(
      `SELECT 
        ct.*,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        u1.full_name AS assignee_name,
        u2.full_name AS created_by_name
      FROM care_tasks ct
      LEFT JOIN patients p ON ct.patient_id = p.patient_id
      LEFT JOIN users u1 ON ct.assignee_id = u1.user_id
      LEFT JOIN users u2 ON ct.created_by = u2.user_id
      WHERE ct.task_id = ?`,
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Care task not found' });
    }

    // Check access - non-admin users can only see their assigned tasks or tasks they created
    if (req.user.role !== 'admin' && 
        tasks[0].assignee_id !== req.user.user_id && 
        tasks[0].created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, task: tasks[0] });
  } catch (err) {
    console.error('Fetch care task error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/care-tasks - Create care task
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'case_manager', 'nurse'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      referral_id,
      patient_id,
      assignee_id,
      task_type,
      task_description,
      due_date,
    } = req.body;

    // Validate required fields
    if (!patient_id || !assignee_id || !task_type || !task_description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patient_id, assignee_id, task_type, task_description',
      });
    }

    // Generate UUID
    const task_id = uuidv4();

    // Insert care task
    await db.query(
      `INSERT INTO care_tasks (
        task_id, referral_id, patient_id, assignee_id, task_type,
        task_description, due_date, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [
        task_id,
        referral_id || null,
        patient_id,
        assignee_id,
        task_type,
        task_description,
        due_date || null,
        req.user.user_id,
      ]
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'CREATE',
      module: 'Care Tasks',
      entity_type: 'care_task',
      entity_id: task_id,
      record_id: task_id,
      new_value: { task_id, patient_id, assignee_id, task_type },
      change_summary: `Created ${task_type} care task for patient ${patient_id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({
      success: true,
      message: 'Care task created successfully',
      task: { task_id, patient_id, task_type, status: 'pending' },
    });
  } catch (err) {
    console.error('Create care task error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// PUT /api/care-tasks/:id - Update care task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.query(
      'SELECT * FROM care_tasks WHERE task_id = ?',
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Care task not found' });
    }

    // Check access - non-admin users can only update their assigned tasks or tasks they created
    if (req.user.role !== 'admin' && 
        tasks[0].assignee_id !== req.user.user_id && 
        tasks[0].created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const {
      assignee_id,
      task_type,
      task_description,
      due_date,
      status,
    } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (assignee_id !== undefined) {
      updateFields.push('assignee_id = ?');
      updateValues.push(assignee_id);
    }

    if (task_type !== undefined) {
      updateFields.push('task_type = ?');
      updateValues.push(task_type);
    }

    if (task_description !== undefined) {
      updateFields.push('task_description = ?');
      updateValues.push(task_description);
    }

    if (due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(due_date);
    }

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // Set completed_at if status is completed
      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      } else if (status !== 'completed' && tasks[0].status === 'completed') {
        updateFields.push('completed_at = NULL');
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updateValues.push(req.params.id);

    await db.query(
      `UPDATE care_tasks SET ${updateFields.join(', ')} WHERE task_id = ?`,
      updateValues
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'Care Tasks',
      entity_type: 'care_task',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: tasks[0],
      new_value: req.body,
      change_summary: `Updated care task ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Care task updated successfully' });
  } catch (err) {
    console.error('Update care task error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/care-tasks/:id/status - Update task status only
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.query(
      'SELECT * FROM care_tasks WHERE task_id = ?',
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Care task not found' });
    }

    // Check access - non-admin users can only update their assigned tasks or tasks they created
    if (req.user.role !== 'admin' && 
        tasks[0].assignee_id !== req.user.user_id && 
        tasks[0].created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status } = req.body;

    if (!status || !['pending', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, in_progress, completed, or cancelled',
      });
    }

    const updateFields = ['status = ?'];
    const updateValues = [status];

    // Set completed_at if status is completed
    if (status === 'completed') {
      updateFields.push('completed_at = NOW()');
    } else if (status !== 'completed' && tasks[0].status === 'completed') {
      updateFields.push('completed_at = NULL');
    }

    updateValues.push(req.params.id);

    await db.query(
      `UPDATE care_tasks SET ${updateFields.join(', ')} WHERE task_id = ?`,
      updateValues
    );

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'UPDATE',
      module: 'Care Tasks',
      entity_type: 'care_task',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: { status: tasks[0].status },
      new_value: { status },
      change_summary: `Updated care task status to ${status}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Task status updated successfully' });
  } catch (err) {
    console.error('Update task status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/care-tasks/:id - Delete care task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [tasks] = await db.query(
      'SELECT * FROM care_tasks WHERE task_id = ?',
      [req.params.id]
    );

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Care task not found' });
    }

    // Check access - only admin or the user who created it
    if (req.user.role !== 'admin' && tasks[0].created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db.query('DELETE FROM care_tasks WHERE task_id = ?', [req.params.id]);

    // Log audit
    const auditInfo = await getUserInfoForAudit(req.user.user_id);
    await logAudit({
      ...auditInfo,
      action: 'DELETE',
      module: 'Care Tasks',
      entity_type: 'care_task',
      entity_id: req.params.id,
      record_id: req.params.id,
      old_value: tasks[0],
      change_summary: `Deleted care task ${req.params.id}`,
      ip_address: getClientIp(req),
      user_agent: req.get('user-agent'),
    });

    res.json({ success: true, message: 'Care task deleted successfully' });
  } catch (err) {
    console.error('Delete care task error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

