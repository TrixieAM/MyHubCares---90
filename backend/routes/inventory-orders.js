import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { logAudit, getUserInfoForAudit, getClientIp } from '../utils/auditLogger.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { facility_id, supplier_id, status } = req.query;

    let query = `
      SELECT 
        io.*,
        f.facility_name,
        s.supplier_name,
        u1.full_name as ordered_by_name,
        u2.full_name as received_by_name
      FROM inventory_orders io
      JOIN facilities f ON io.facility_id = f.facility_id
      JOIN inventory_suppliers s ON io.supplier_id = s.supplier_id
      JOIN users u1 ON io.ordered_by = u1.user_id
      LEFT JOIN users u2 ON io.received_by = u2.user_id
      WHERE 1=1
    `;

    const params = [];

    if (facility_id) {
      query += ' AND io.facility_id = ?';
      params.push(facility_id);
    }

    if (supplier_id) {
      query += ' AND io.supplier_id = ?';
      params.push(supplier_id);
    }

    if (status) {
      query += ' AND io.status = ?';
      params.push(status);
    }

    query += ' ORDER BY io.order_date DESC, io.created_at DESC';

    const [results] = await db.query(query, params);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});

// Get order by ID with items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get order
    const orderQuery = `
      SELECT 
        io.*,
        f.facility_name,
        s.supplier_name,
        u1.full_name as ordered_by_name,
        u2.full_name as received_by_name
      FROM inventory_orders io
      JOIN facilities f ON io.facility_id = f.facility_id
      JOIN inventory_suppliers s ON io.supplier_id = s.supplier_id
      JOIN users u1 ON io.ordered_by = u1.user_id
      LEFT JOIN users u2 ON io.received_by = u2.user_id
      WHERE io.order_id = ?
    `;

    const [orderResults] = await db.query(orderQuery, [id]);

    if (orderResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Get order items
    const itemsQuery = `
      SELECT 
        ioi.*,
        m.medication_name,
        m.generic_name,
        m.form,
        m.strength
      FROM inventory_order_items ioi
      JOIN medications m ON ioi.medication_id = m.medication_id
      WHERE ioi.order_id = ?
      ORDER BY m.medication_name
    `;

    const [itemsResults] = await db.query(itemsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...orderResults[0],
        items: itemsResults,
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
});

// Create purchase order
router.post('/', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const {
      facility_id,
      supplier_id,
      order_date,
      expected_delivery_date,
      notes,
      items, // Array of { medication_id, quantity_ordered, unit_cost, batch_number, expiry_date }
    } = req.body;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    const ordered_by = req.user?.user_id;
    if (!ordered_by) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    if (!facility_id || !supplier_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'facility_id, supplier_id, and items are required',
      });
    }

    const order_id = uuidv4();
    let total_cost = 0;

    // Calculate total cost
    for (const item of items) {
      const itemCost = (item.quantity_ordered || 0) * (item.unit_cost || 0);
      total_cost += itemCost;
    }

    // Create order
    const insertOrderQuery = `
      INSERT INTO inventory_orders (
        order_id, facility_id, supplier_id, order_date,
        expected_delivery_date, total_cost, ordered_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertOrderQuery, [
      order_id,
      facility_id,
      supplier_id,
      order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date || null,
      total_cost,
      ordered_by,
      notes || null,
    ]);

    // Create order items
    for (const item of items) {
      const order_item_id = uuidv4();
      const insertItemQuery = `
        INSERT INTO inventory_order_items (
          order_item_id, order_id, medication_id, quantity_ordered,
          unit_cost, batch_number, expiry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await db.query(insertItemQuery, [
        order_item_id,
        order_id,
        item.medication_id,
        item.quantity_ordered,
        item.unit_cost || null,
        item.batch_number || null,
        item.expiry_date || null,
      ]);
    }

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_order',
        entity_id: order_id,
        record_id: order_id,
        new_value: {
          order_id,
          facility_id,
          supplier_id,
          total_cost,
          items_count: items.length,
        },
        change_summary: `Created purchase order with ${items.length} items`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { order_id, total_cost },
    });
  } catch (error) {
    console.error('Error creating order:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'CREATE',
        module: 'Inventory',
        entity_type: 'inventory_order',
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message,
    });
  }
});

// Receive order (update received quantities and create inventory transactions)
router.put('/:id/receive', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { order_item_id, quantity_received, batch_number, expiry_date }

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    const received_by = req.user?.user_id;
    if (!received_by) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Get order
    const [order] = await db.query(
      'SELECT * FROM inventory_orders WHERE order_id = ?',
      [id]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order[0].status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Order is already received',
      });
    }

    // Get order items
    const [orderItems] = await db.query(
      'SELECT * FROM inventory_order_items WHERE order_id = ?',
      [id]
    );

    // Update order items and create inventory transactions
    for (const receivedItem of items) {
      const orderItem = orderItems.find(item => item.order_item_id === receivedItem.order_item_id);
      if (!orderItem) continue;

      const quantity_received = parseInt(receivedItem.quantity_received || 0);
      const previous_received = orderItem.quantity_received || 0;
      const new_received = previous_received + quantity_received;

      // Update order item
      let status = 'partial';
      if (new_received >= orderItem.quantity_ordered) {
        status = 'received';
      } else if (new_received > 0) {
        status = 'partial';
      }

      await db.query(
        `UPDATE inventory_order_items SET
          quantity_received = ?,
          batch_number = COALESCE(?, batch_number),
          expiry_date = COALESCE(?, expiry_date),
          status = ?
        WHERE order_item_id = ?`,
        [
          new_received,
          receivedItem.batch_number || null,
          receivedItem.expiry_date || null,
          status,
          receivedItem.order_item_id,
        ]
      );

      // Find or create inventory item
      const [inventory] = await db.query(
        `SELECT inventory_id, quantity_on_hand FROM medication_inventory 
         WHERE medication_id = ? AND facility_id = ?`,
        [orderItem.medication_id, order[0].facility_id]
      );

      let inventory_id;
      if (inventory.length > 0) {
        inventory_id = inventory[0].inventory_id;
        // Update existing inventory
        await db.query(
          `UPDATE medication_inventory SET
            quantity_on_hand = quantity_on_hand + ?,
            last_restocked = CURDATE(),
            batch_number = COALESCE(?, batch_number),
            expiry_date = COALESCE(?, expiry_date)
          WHERE inventory_id = ?`,
          [
            quantity_received,
            receivedItem.batch_number || null,
            receivedItem.expiry_date || null,
            inventory_id,
          ]
        );
      } else {
        // Create new inventory item
        inventory_id = uuidv4();
        await db.query(
          `INSERT INTO medication_inventory (
            inventory_id, medication_id, facility_id, quantity_on_hand,
            batch_number, expiry_date, last_restocked
          ) VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
          [
            inventory_id,
            orderItem.medication_id,
            order[0].facility_id,
            quantity_received,
            receivedItem.batch_number || null,
            receivedItem.expiry_date || null,
          ]
        );
      }

      // Create transaction record
      const transaction_id = uuidv4();
      const [currentInventory] = await db.query(
        'SELECT quantity_on_hand FROM medication_inventory WHERE inventory_id = ?',
        [inventory_id]
      );

      await db.query(
        `INSERT INTO inventory_transactions (
          transaction_id, inventory_id, transaction_type, quantity_change,
          quantity_before, quantity_after, batch_number, performed_by,
          facility_id, transaction_date, reference_id, reference_type
        ) VALUES (?, ?, 'restock', ?, ?, ?, ?, ?, ?, CURDATE(), ?, 'order')`,
        [
          transaction_id,
          inventory_id,
          quantity_received,
          currentInventory[0].quantity_on_hand - quantity_received,
          currentInventory[0].quantity_on_hand,
          receivedItem.batch_number || null,
          received_by,
          order[0].facility_id,
          id,
        ]
      );
    }

    // Update order status
    const [allItems] = await db.query(
      'SELECT status FROM inventory_order_items WHERE order_id = ?',
      [id]
    );

    let orderStatus = 'received';
    if (allItems.some(item => item.status === 'partial')) {
      orderStatus = 'partial';
    } else if (allItems.some(item => item.status === 'pending')) {
      orderStatus = 'ordered';
    }

    await db.query(
      `UPDATE inventory_orders SET
        status = ?,
        received_by = ?,
        received_at = NOW()
      WHERE order_id = ?`,
      [orderStatus, received_by, id]
    );

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Inventory',
        entity_type: 'inventory_order',
        entity_id: id,
        record_id: id,
        change_summary: `Received order: ${items.length} items`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.json({
      success: true,
      message: 'Order received successfully',
    });
  } catch (error) {
    console.error('Error receiving order:', error);

    // Log failed audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Inventory',
        entity_type: 'inventory_order',
        entity_id: id,
        status: 'failed',
        error_message: error.message,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to receive order',
      error: error.message,
    });
  }
});

// Cancel order
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  let userInfo = null;

  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get user info for audit logging
    if (req.user?.user_id) {
      userInfo = await getUserInfoForAudit(req.user.user_id);
    }

    // Check if order exists
    const [order] = await db.query(
      'SELECT * FROM inventory_orders WHERE order_id = ?',
      [id]
    );

    if (order.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    if (order[0].status === 'received') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a received order',
      });
    }

    // Update order status
    await db.query(
      `UPDATE inventory_orders SET
        status = 'cancelled',
        notes = CONCAT(COALESCE(notes, ''), '\nCancelled: ', ?)
      WHERE order_id = ?`,
      [reason || 'No reason provided', id]
    );

    // Update order items status
    await db.query(
      "UPDATE inventory_order_items SET status = 'cancelled' WHERE order_id = ?",
      [id]
    );

    // Log audit entry
    if (userInfo) {
      await logAudit({
        user_id: userInfo.user_id,
        user_name: userInfo.user_name,
        user_role: userInfo.user_role,
        action: 'UPDATE',
        module: 'Inventory',
        entity_type: 'inventory_order',
        entity_id: id,
        record_id: id,
        change_summary: `Cancelled order: ${reason || 'No reason provided'}`,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent'],
        status: 'success',
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
});

export default router;

