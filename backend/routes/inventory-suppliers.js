import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all suppliers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { is_active, search } = req.query;

    let query = 'SELECT * FROM inventory_suppliers WHERE 1=1';
    const params = [];

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (supplier_name LIKE ? OR contact_person LIKE ? OR contact_email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY supplier_name';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message,
    });
  }
});

// Get supplier by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'SELECT * FROM inventory_suppliers WHERE supplier_id = ?';
    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supplier',
      error: error.message,
    });
  }
});

// Create supplier
router.post('/', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const {
      supplier_name,
      contact_person,
      contact_phone,
      contact_email,
      address,
      payment_terms,
      is_active = true,
    } = req.body;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    if (!supplier_name) {
      return res.status(400).json({
        success: false,
        message: 'Supplier name is required',
      });
    }

    const supplier_id = uuidv4();

    const insertQuery = `
      INSERT INTO inventory_suppliers (
        supplier_id, supplier_name, contact_person, contact_phone,
        contact_email, address, payment_terms, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertQuery, [
      supplier_id,
      supplier_name,
      contact_person || null,
      contact_phone || null,
      contact_email || null,
      address ? JSON.stringify(address) : null,
      payment_terms || null,
      is_active ? 1 : 0,
    ]);

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_supplier',
        entity_id: supplier_id,
        record_id: supplier_name,
        new_value: {
          supplier_id,
          supplier_name,
          contact_person,
          contact_email,
        },
        change_summary: `Created supplier: ${supplier_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: { supplier_id },
    });
  } catch (error) {
    console.error('Error creating supplier:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_supplier',
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create supplier',
      error: error.message,
    });
  }
});

// Update supplier
router.put('/:id', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const { id } = req.params;
    const {
      supplier_name,
      contact_person,
      contact_phone,
      contact_email,
      address,
      payment_terms,
      is_active,
    } = req.body;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    // Check if supplier exists
    const [oldSupplier] = await db.query(
      'SELECT * FROM inventory_suppliers WHERE supplier_id = ?',
      [id]
    );

    if (oldSupplier.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    const updateQuery = `
      UPDATE inventory_suppliers SET
        supplier_name = ?,
        contact_person = ?,
        contact_phone = ?,
        contact_email = ?,
        address = ?,
        payment_terms = ?,
        is_active = ?,
        updated_at = NOW()
      WHERE supplier_id = ?
    `;

    await db.query(updateQuery, [
      supplier_name || oldSupplier[0].supplier_name,
      contact_person !== undefined ? contact_person : oldSupplier[0].contact_person,
      contact_phone !== undefined ? contact_phone : oldSupplier[0].contact_phone,
      contact_email !== undefined ? contact_email : oldSupplier[0].contact_email,
      address ? JSON.stringify(address) : oldSupplier[0].address,
      payment_terms !== undefined ? payment_terms : oldSupplier[0].payment_terms,
      is_active !== undefined ? (is_active ? 1 : 0) : oldSupplier[0].is_active,
      id,
    ]);

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Inventory',
        entity_type: 'inventory_supplier',
        entity_id: id,
        record_id: supplier_name || oldSupplier[0].supplier_name,
        old_value: {
          supplier_name: oldSupplier[0].supplier_name,
          is_active: oldSupplier[0].is_active,
        },
        new_value: {
          supplier_name: supplier_name || oldSupplier[0].supplier_name,
          is_active: is_active !== undefined ? is_active : oldSupplier[0].is_active,
        },
        change_summary: `Updated supplier: ${supplier_name || oldSupplier[0].supplier_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.json({
      success: true,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    console.error('Error updating supplier:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Inventory',
        entity_type: 'inventory_supplier',
        entity_id: id,
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update supplier',
      error: error.message,
    });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const { id } = req.params;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    // Check if supplier exists
    const [supplier] = await db.query(
      'SELECT supplier_id, supplier_name FROM inventory_suppliers WHERE supplier_id = ?',
      [id]
    );

    if (supplier.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    // Check if supplier is used in any orders
    const [orders] = await db.query(
      'SELECT COUNT(*) as count FROM inventory_orders WHERE supplier_id = ?',
      [id]
    );

    if (orders[0].count > 0) {
      // Soft delete
      await db.query(
        'UPDATE inventory_suppliers SET is_active = 0, updated_at = NOW() WHERE supplier_id = ?',
        [id]
      );
    } else {
      // Hard delete if not used
      await db.query('DELETE FROM inventory_suppliers WHERE supplier_id = ?', [id]);
    }

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'DELETE',
        module: 'Inventory',
        entity_type: 'inventory_supplier',
        entity_id: id,
        record_id: supplier[0].supplier_name,
        change_summary: `Deleted supplier: ${supplier[0].supplier_name}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'DELETE',
        module: 'Inventory',
        entity_type: 'inventory_supplier',
        entity_id: id,
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete supplier',
      error: error.message,
    });
  }
});

export default router;

