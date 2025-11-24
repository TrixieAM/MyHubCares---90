import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all inventory alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { facility_id, alert_type, alert_level, acknowledged } = req.query;

    let query = `
      SELECT 
        ia.*,
        mi.medication_id,
        m.medication_name,
        f.facility_name,
        u.full_name as acknowledged_by_name
      FROM inventory_alerts ia
      JOIN medication_inventory mi ON ia.inventory_id = mi.inventory_id
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      LEFT JOIN users u ON ia.acknowledged_by = u.user_id
      WHERE 1=1
    `;

    const params = [];

    if (facility_id) {
      query += ' AND mi.facility_id = ?';
      params.push(facility_id);
    }

    if (alert_type) {
      query += ' AND ia.alert_type = ?';
      params.push(alert_type);
    }

    if (alert_level) {
      query += ' AND ia.alert_level = ?';
      params.push(alert_level);
    }

    if (acknowledged !== undefined) {
      query += ' AND ia.acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    query += ' ORDER BY ia.alert_level DESC, ia.created_at DESC';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory alerts',
      error: error.message,
    });
  }
});

// Get unacknowledged alerts
router.get('/unacknowledged', authenticateToken, async (req, res) => {
  try {
    const { facility_id } = req.query;

    let query = `
      SELECT 
        ia.*,
        mi.medication_id,
        m.medication_name,
        f.facility_name
      FROM inventory_alerts ia
      JOIN medication_inventory mi ON ia.inventory_id = mi.inventory_id
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      WHERE ia.acknowledged = 0
    `;

    const params = [];

    if (facility_id) {
      query += ' AND mi.facility_id = ?';
      params.push(facility_id);
    }

    query += ' ORDER BY ia.alert_level DESC, ia.created_at DESC';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching unacknowledged alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unacknowledged alerts',
      error: error.message,
    });
  }
});

// Get alert by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ia.*,
        mi.medication_id,
        m.medication_name,
        f.facility_name,
        u.full_name as acknowledged_by_name
      FROM inventory_alerts ia
      JOIN medication_inventory mi ON ia.inventory_id = mi.inventory_id
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      LEFT JOIN users u ON ia.acknowledged_by = u.user_id
      WHERE ia.alert_id = ?
    `;

    const [results] = await db.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert',
      error: error.message,
    });
  }
});

// Create inventory alert
router.post('/', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const {
      inventory_id,
      alert_type,
      alert_level,
      current_value,
      threshold_value,
      message,
    } = req.body;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    // Check if alert already exists for this inventory and type
    const [existingAlert] = await db.query(
      `SELECT alert_id FROM inventory_alerts 
       WHERE inventory_id = ? AND alert_type = ? AND acknowledged = 0`,
      [inventory_id, alert_type]
    );

    if (existingAlert.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An unacknowledged alert of this type already exists for this inventory item',
        data: { alert_id: existingAlert[0].alert_id },
      });
    }

    const alert_id = uuidv4();

    const insertQuery = `
      INSERT INTO inventory_alerts (
        alert_id, inventory_id, alert_type, alert_level,
        current_value, threshold_value, message
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertQuery, [
      alert_id,
      inventory_id,
      alert_type,
      alert_level || 'warning',
      current_value,
      threshold_value,
      message,
    ]);

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_alert',
        entity_id: alert_id,
        record_id: alert_id,
        new_value: {
          alert_id,
          inventory_id,
          alert_type,
          alert_level,
        },
        change_summary: `Created ${alert_type} alert (${alert_level})`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Alert created successfully',
      data: { alert_id },
    });
  } catch (error) {
    console.error('Error creating alert:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_alert',
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message,
    });
  }
});

// Acknowledge alert
router.put('/:id/acknowledge', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const { id } = req.params;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    const acknowledged_by = req.user?.user_id;
    if (!acknowledged_by) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Check if alert exists
    const [alertCheck] = await db.query(
      'SELECT alert_id, acknowledged FROM inventory_alerts WHERE alert_id = ?',
      [id]
    );

    if (alertCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    if (alertCheck[0].acknowledged === 1) {
      return res.status(400).json({
        success: false,
        message: 'Alert is already acknowledged',
      });
    }

    // Update alert
    await db.query(
      `UPDATE inventory_alerts 
       SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = NOW() 
       WHERE alert_id = ?`,
      [acknowledged_by, id]
    );

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Inventory',
        entity_type: 'inventory_alert',
        entity_id: id,
        record_id: id,
        change_summary: 'Acknowledged alert',
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Inventory',
        entity_type: 'inventory_alert',
        entity_id: id,
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert',
      error: error.message,
    });
  }
});

// Generate alerts for low stock and expiring items
router.post('/generate', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    const { facility_id, months = 3 } = req.query;

    let lowStockQuery = `
      SELECT 
        mi.inventory_id,
        mi.quantity_on_hand,
        mi.reorder_level,
        m.medication_name,
        f.facility_name
      FROM medication_inventory mi
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      WHERE mi.quantity_on_hand <= mi.reorder_level
    `;

    const params = [];

    if (facility_id) {
      lowStockQuery += ' AND mi.facility_id = ?';
      params.push(facility_id);
    }

    const [lowStockItems] = await db.query(lowStockQuery, params);

    let expiringQuery = `
      SELECT 
        mi.inventory_id,
        mi.expiry_date,
        DATEDIFF(mi.expiry_date, CURDATE()) as days_until_expiry,
        m.medication_name,
        f.facility_name
      FROM medication_inventory mi
      JOIN medications m ON mi.medication_id = m.medication_id
      JOIN facilities f ON mi.facility_id = f.facility_id
      WHERE mi.expiry_date IS NOT NULL
        AND mi.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? MONTH)
        AND mi.expiry_date >= CURDATE()
    `;

    const expiringParams = [months];
    if (facility_id) {
      expiringQuery += ' AND mi.facility_id = ?';
      expiringParams.push(facility_id);
    }

    const [expiringItems] = await db.query(expiringQuery, expiringParams);

    const alertsCreated = [];

    // Create low stock alerts
    for (const item of lowStockItems) {
      // Check if alert already exists
      const [existing] = await db.query(
        `SELECT alert_id FROM inventory_alerts 
         WHERE inventory_id = ? AND alert_type = 'low_stock' AND acknowledged = 0`,
        [item.inventory_id]
      );

      if (existing.length === 0) {
        const alert_id = uuidv4();
        const alert_level = item.quantity_on_hand === 0 ? 'critical' : 'warning';
        const message = `${item.medication_name} is at or below reorder level. Current: ${item.quantity_on_hand}, Reorder level: ${item.reorder_level}`;

        await db.query(
          `INSERT INTO inventory_alerts (
            alert_id, inventory_id, alert_type, alert_level,
            current_value, threshold_value, message
          ) VALUES (?, ?, 'low_stock', ?, ?, ?, ?)`,
          [alert_id, item.inventory_id, alert_level, item.quantity_on_hand, item.reorder_level, message]
        );

        alertsCreated.push({ alert_id, type: 'low_stock', inventory_id: item.inventory_id });
      }
    }

    // Create expiring alerts
    for (const item of expiringItems) {
      // Check if alert already exists
      const [existing] = await db.query(
        `SELECT alert_id FROM inventory_alerts 
         WHERE inventory_id = ? AND alert_type = 'expiring_soon' AND acknowledged = 0`,
        [item.inventory_id]
      );

      if (existing.length === 0) {
        const alert_id = uuidv4();
        const alert_level = item.days_until_expiry <= 30 ? 'critical' : 'warning';
        const message = `${item.medication_name} is expiring soon. Expiry date: ${item.expiry_date} (${item.days_until_expiry} days)`;

        await db.query(
          `INSERT INTO inventory_alerts (
            alert_id, inventory_id, alert_type, alert_level,
            current_value, threshold_value, message
          ) VALUES (?, ?, 'expiring_soon', ?, ?, ?, ?)`,
          [alert_id, item.inventory_id, alert_level, item.days_until_expiry, 90, message]
        );

        alertsCreated.push({ alert_id, type: 'expiring_soon', inventory_id: item.inventory_id });
      }
    }

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_alert',
        change_summary: `Generated ${alertsCreated.length} alerts (${lowStockItems.length} low stock, ${expiringItems.length} expiring)`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.json({
      success: true,
      message: `Generated ${alertsCreated.length} alerts`,
      data: {
        alerts_created: alertsCreated.length,
        low_stock_items: lowStockItems.length,
        expiring_items: expiringItems.length,
        alerts: alertsCreated,
      },
    });
  } catch (error) {
    console.error('Error generating alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate alerts',
      error: error.message,
    });
  }
});

export default router;

