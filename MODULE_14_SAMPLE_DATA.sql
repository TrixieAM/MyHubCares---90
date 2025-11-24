-- =====================================================
-- MODULE 14: INVENTORY MANAGEMENT - SAMPLE DATA
-- =====================================================
-- This script adds sample data for inventory transactions,
-- alerts, suppliers, and orders connected to existing inventory
-- =====================================================

-- Step 1: Add sample suppliers to inventory_suppliers
-- (Migrate from existing suppliers table if data exists, or add new ones)
INSERT INTO `inventory_suppliers` (
  `supplier_id`, `supplier_name`, `contact_person`, `contact_phone`,
  `contact_email`, `address`, `payment_terms`, `is_active`, `created_at`
) VALUES
-- Sample Supplier 1
(UUID(), 'MyHubCares Pharmacy', 'John Dela Cruz', '+63-912-345-6789',
 'pharmacy@myhubcares.com', 
 JSON_OBJECT('street', '123 Medical Center', 'city', 'Manila', 'province', 'Metro Manila', 'zip_code', '1000'),
 'Net 30', 1, NOW()),
-- Sample Supplier 2
(UUID(), 'MedSupply Philippines', 'Maria Santos', '+63-917-654-3210',
 'sales@medsupply.ph',
 JSON_OBJECT('street', '456 Health Avenue', 'city', 'Makati', 'province', 'Metro Manila', 'zip_code', '1200'),
 'COD', 1, NOW()),
-- Sample Supplier 3
(UUID(), 'Pharma Distributors Inc.', 'Robert Tan', '+63-918-111-2222',
 'info@pharmadist.com',
 JSON_OBJECT('street', '789 Pharma Street', 'city', 'Quezon City', 'province', 'Metro Manila', 'zip_code', '1100'),
 'Net 15', 1, NOW())
ON DUPLICATE KEY UPDATE `supplier_id` = `supplier_id`;

-- Step 2: Get existing inventory items to link transactions and alerts
-- We'll use the inventory items that already exist in the database

-- Step 3: Add sample inventory transactions
-- Note: Replace inventory_id values with actual IDs from your medication_inventory table
INSERT INTO `inventory_transactions` (
  `transaction_id`, `inventory_id`, `transaction_type`, `quantity_change`,
  `quantity_before`, `quantity_after`, `batch_number`, `transaction_reason`,
  `performed_by`, `facility_id`, `transaction_date`, `reference_type`, `notes`
)
SELECT 
  UUID() as transaction_id,
  mi.inventory_id,
  'restock' as transaction_type,
  100 as quantity_change,
  mi.quantity_on_hand as quantity_before,
  mi.quantity_on_hand + 100 as quantity_after,
  CONCAT('BATCH-', DATE_FORMAT(NOW(), '%Y%m%d'), '-001') as batch_number,
  'Initial stock replenishment' as transaction_reason,
  (SELECT user_id FROM users WHERE role = 'admin' LIMIT 1) as performed_by,
  mi.facility_id,
  DATE_SUB(CURDATE(), INTERVAL 7 DAY) as transaction_date,
  'manual' as reference_type,
  'Sample transaction data' as notes
FROM medication_inventory mi
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_transactions it 
  WHERE it.inventory_id = mi.inventory_id 
  LIMIT 1
)
LIMIT 2;

-- Add a dispense transaction
INSERT INTO `inventory_transactions` (
  `transaction_id`, `inventory_id`, `transaction_type`, `quantity_change`,
  `quantity_before`, `quantity_after`, `batch_number`, `transaction_reason`,
  `performed_by`, `facility_id`, `transaction_date`, `reference_type`, `notes`
)
SELECT 
  UUID() as transaction_id,
  mi.inventory_id,
  'dispense' as transaction_type,
  -30 as quantity_change,
  mi.quantity_on_hand as quantity_before,
  GREATEST(0, mi.quantity_on_hand - 30) as quantity_after,
  mi.batch_number,
  'Medication dispensed to patient' as transaction_reason,
  (SELECT user_id FROM users WHERE role = 'nurse' LIMIT 1) as performed_by,
  mi.facility_id,
  DATE_SUB(CURDATE(), INTERVAL 3 DAY) as transaction_date,
  'prescription' as reference_type,
  'Sample dispense transaction' as notes
FROM medication_inventory mi
WHERE mi.quantity_on_hand >= 30
LIMIT 1;

-- Step 4: Add sample inventory alerts
-- Low stock alerts
INSERT INTO `inventory_alerts` (
  `alert_id`, `inventory_id`, `alert_type`, `alert_level`,
  `current_value`, `threshold_value`, `message`, `acknowledged`
)
SELECT 
  UUID() as alert_id,
  mi.inventory_id,
  'low_stock' as alert_type,
  CASE 
    WHEN mi.quantity_on_hand = 0 THEN 'critical'
    WHEN mi.quantity_on_hand <= (mi.reorder_level * 0.5) THEN 'critical'
    ELSE 'warning'
  END as alert_level,
  mi.quantity_on_hand as current_value,
  mi.reorder_level as threshold_value,
  CONCAT(m.medication_name, ' is at or below reorder level. Current: ', mi.quantity_on_hand, ', Reorder level: ', mi.reorder_level) as message,
  0 as acknowledged
FROM medication_inventory mi
JOIN medications m ON mi.medication_id = m.medication_id
WHERE mi.quantity_on_hand <= mi.reorder_level
  AND NOT EXISTS (
    SELECT 1 FROM inventory_alerts ia 
    WHERE ia.inventory_id = mi.inventory_id 
    AND ia.alert_type = 'low_stock' 
    AND ia.acknowledged = 0
  )
LIMIT 3;

-- Expiring soon alerts
INSERT INTO `inventory_alerts` (
  `alert_id`, `inventory_id`, `alert_type`, `alert_level`,
  `current_value`, `threshold_value`, `message`, `acknowledged`
)
SELECT 
  UUID() as alert_id,
  mi.inventory_id,
  'expiring_soon' as alert_type,
  CASE 
    WHEN DATEDIFF(mi.expiry_date, CURDATE()) <= 30 THEN 'critical'
    WHEN DATEDIFF(mi.expiry_date, CURDATE()) <= 60 THEN 'warning'
    ELSE 'info'
  END as alert_level,
  DATEDIFF(mi.expiry_date, CURDATE()) as current_value,
  90 as threshold_value,
  CONCAT(m.medication_name, ' is expiring soon. Expiry date: ', mi.expiry_date, ' (', DATEDIFF(mi.expiry_date, CURDATE()), ' days remaining)') as message,
  0 as acknowledged
FROM medication_inventory mi
JOIN medications m ON mi.medication_id = m.medication_id
WHERE mi.expiry_date IS NOT NULL
  AND mi.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
  AND mi.expiry_date >= CURDATE()
  AND NOT EXISTS (
    SELECT 1 FROM inventory_alerts ia 
    WHERE ia.inventory_id = mi.inventory_id 
    AND ia.alert_type = 'expiring_soon' 
    AND ia.acknowledged = 0
  )
LIMIT 2;

-- Step 5: Add sample purchase orders
-- Create a sample order
SET @order_id = UUID();
SET @supplier_id = (SELECT supplier_id FROM inventory_suppliers WHERE is_active = 1 LIMIT 1);
SET @facility_id = (SELECT facility_id FROM facilities WHERE is_active = 1 LIMIT 1);
SET @ordered_by = (SELECT user_id FROM users WHERE role IN ('admin', 'nurse') LIMIT 1);

INSERT INTO `inventory_orders` (
  `order_id`, `facility_id`, `supplier_id`, `order_date`,
  `expected_delivery_date`, `status`, `total_cost`, `ordered_by`, `notes`
) VALUES (
  @order_id,
  @facility_id,
  @supplier_id,
  DATE_SUB(CURDATE(), INTERVAL 10 DAY),
  DATE_ADD(CURDATE(), INTERVAL 5 DAY),
  'in_transit',
  15000.00,
  @ordered_by,
  'Sample purchase order for inventory replenishment'
);

-- Add order items
INSERT INTO `inventory_order_items` (
  `order_item_id`, `order_id`, `medication_id`, `quantity_ordered`,
  `quantity_received`, `unit_cost`, `batch_number`, `expiry_date`, `status`
)
SELECT 
  UUID() as order_item_id,
  @order_id as order_id,
  mi.medication_id,
  200 as quantity_ordered,
  0 as quantity_received,
  COALESCE(mi.cost_per_unit, 50.00) as unit_cost,
  CONCAT('BATCH-', DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 YEAR), '%Y%m%d'), '-001') as batch_number,
  DATE_ADD(CURDATE(), INTERVAL 1 YEAR) as expiry_date,
  'pending' as status
FROM medication_inventory mi
LIMIT 2;

-- Create another order that's been received
SET @order_id2 = UUID();
SET @received_by = (SELECT user_id FROM users WHERE role IN ('admin', 'nurse') LIMIT 1);

INSERT INTO `inventory_orders` (
  `order_id`, `facility_id`, `supplier_id`, `order_date`,
  `expected_delivery_date`, `status`, `total_cost`, `ordered_by`, 
  `received_by`, `received_at`, `notes`
) VALUES (
  @order_id2,
  @facility_id,
  @supplier_id,
  DATE_SUB(CURDATE(), INTERVAL 20 DAY),
  DATE_SUB(CURDATE(), INTERVAL 15 DAY),
  'received',
  8000.00,
  @ordered_by,
  @received_by,
  DATE_SUB(CURDATE(), INTERVAL 15 DAY),
  'Sample completed order'
);

-- Add received order items
INSERT INTO `inventory_order_items` (
  `order_item_id`, `order_id`, `medication_id`, `quantity_ordered`,
  `quantity_received`, `unit_cost`, `batch_number`, `expiry_date`, `status`
)
SELECT 
  UUID() as order_item_id,
  @order_id2 as order_id,
  mi.medication_id,
  150 as quantity_ordered,
  150 as quantity_received,
  COALESCE(mi.cost_per_unit, 45.00) as unit_cost,
  CONCAT('BATCH-', DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 YEAR), '%Y%m%d'), '-002') as batch_number,
  DATE_ADD(CURDATE(), INTERVAL 1 YEAR) as expiry_date,
  'received' as status
FROM medication_inventory mi
LIMIT 1;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check suppliers
-- SELECT COUNT(*) as supplier_count FROM inventory_suppliers;

-- Check transactions
-- SELECT COUNT(*) as transaction_count FROM inventory_transactions;

-- Check alerts
-- SELECT alert_type, alert_level, COUNT(*) as count 
-- FROM inventory_alerts 
-- GROUP BY alert_type, alert_level;

-- Check orders
-- SELECT status, COUNT(*) as count 
-- FROM inventory_orders 
-- GROUP BY status;

-- Check order items
-- SELECT status, COUNT(*) as count 
-- FROM inventory_order_items 
-- GROUP BY status;

