import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all inventory transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { inventory_id, facility_id, transaction_type, start_date, end_date } = req.query;

    let query = `
      SELECT 
        it.*,
        mi.medication_id,
        m.medication_name,
        f.facility_name,
        u.full_name as performed_by_name
      FROM inventory_transactions it
      JOIN medication_inventory mi ON it.inventory_id = mi.inventory_id
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON it.facility_id = f.facility_id
      JOIN users u ON it.performed_by = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (inventory_id) {
      query += ' AND it.inventory_id = ?';
      params.push(inventory_id);
    }

    if (facility_id) {
      query += ' AND it.facility_id = ?';
      params.push(facility_id);
    }

    if (transaction_type) {
      query += ' AND it.transaction_type = ?';
      params.push(transaction_type);
    }

    if (start_date) {
      query += ' AND it.transaction_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND it.transaction_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY it.created_at DESC LIMIT 1000';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory transactions',
      error: error.message,
    });
  }
});

// Get transaction by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        it.*,
        mi.medication_id,
        m.medication_name,
        f.facility_name,
        u.full_name as performed_by_name
      FROM inventory_transactions it
      JOIN medication_inventory mi ON it.inventory_id = mi.inventory_id
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON it.facility_id = f.facility_id
      JOIN users u ON it.performed_by = u.user_id
      WHERE it.transaction_id = ?
    `;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error.message,
    });
  }
});

// Get transactions for a specific inventory item
router.get('/inventory/:inventoryId', authenticateToken, async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { limit = 100 } = req.query;

    const query = `
      SELECT 
        it.*,
        u.full_name as performed_by_name
      FROM inventory_transactions it
      JOIN users u ON it.performed_by = u.user_id
      WHERE it.inventory_id = ?
      ORDER BY it.created_at DESC
      LIMIT ?
    `;

    const [results] = await db.query(query, [inventoryId, parseInt(limit)]);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory transactions',
      error: error.message,
    });
  }
});

// Create inventory transaction
router.post('/', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const {
      inventory_id,
      transaction_type,
      quantity_change,
      batch_number,
      transaction_reason,
      reference_id,
      reference_type,
      notes,
      transaction_date,
    } = req.body;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    const performed_by = req.user?.user_id;
    if (!performed_by) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get facility_id from inventory item
    const [inventoryCheck] = await db.query(
      'SELECT facility_id, quantity_on_hand FROM medication_inventory WHERE inventory_id = ?',
      [inventory_id]
    );

    if (inventoryCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    const facility_id = inventoryCheck[0].facility_id;
    const quantity_before = inventoryCheck[0].quantity_on_hand;
    const quantity_after = quantity_before + parseInt(quantity_change);

    // Validate quantity_after is not negative
    if (quantity_after < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock. Cannot perform transaction that would result in negative quantity.',
      });
    }

    const transaction_id = uuidv4();

    // Create transaction record
    const insertQuery = `
      INSERT INTO inventory_transactions (
        transaction_id, inventory_id, transaction_type, quantity_change,
        quantity_before, quantity_after, batch_number, transaction_reason,
        performed_by, facility_id, transaction_date, reference_id,
        reference_type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertQuery, [
      transaction_id,
      inventory_id,
      transaction_type,
      quantity_change,
      quantity_before,
      quantity_after,
      batch_number || null,
      transaction_reason || null,
      performed_by,
      facility_id,
      transaction_date || new Date().toISOString().split('T')[0],
      reference_id || null,
      reference_type || null,
      notes || null,
    ]);

    // Update inventory quantity
    await db.query(
      'UPDATE medication_inventory SET quantity_on_hand = ? WHERE inventory_id = ?',
      [quantity_after, inventory_id]
    );

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_transaction',
        entity_id: transaction_id,
        record_id: transaction_id,
        new_value: {
          transaction_id,
          inventory_id,
          transaction_type,
          quantity_change,
          quantity_before,
          quantity_after,
        },
        change_summary: `Created ${transaction_type} transaction: ${quantity_change > 0 ? '+' : ''}${quantity_change} units`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction_id, quantity_before, quantity_after },
    });
  } catch (error) {
    console.error('Error creating transaction:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_transaction',
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message,
    });
  }
});

export default router;

