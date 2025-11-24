-- =====================================================
-- MODULE 14: INVENTORY MANAGEMENT - SQL ALTERS
-- =====================================================
-- This script creates the missing tables for Module 14
-- Run this on your existing database
-- =====================================================

-- Step 1: Rename suppliers table to inventory_suppliers and add missing fields
-- Note: This will preserve existing data

-- First, check if suppliers table exists and rename it
CREATE TABLE IF NOT EXISTS `inventory_suppliers` (
  `supplier_id` char(36) NOT NULL,
  `supplier_name` varchar(200) NOT NULL,
  `contact_person` varchar(200) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`address`)),
  `payment_terms` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`supplier_id`),
  KEY `idx_inventory_suppliers_name` (`supplier_name`),
  KEY `idx_inventory_suppliers_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrate data from suppliers to inventory_suppliers if suppliers exists
INSERT INTO `inventory_suppliers` (
  `supplier_id`, `supplier_name`, `contact_person`, `contact_phone`, 
  `contact_email`, `address`, `is_active`, `created_at`
)
SELECT 
  `supplier_id`, `supplier_name`, `contact_person`, `phone`, 
  `email`, `address`, `is_active`, `created_at`
FROM `suppliers`
WHERE NOT EXISTS (
  SELECT 1 FROM `inventory_suppliers` WHERE `inventory_suppliers`.`supplier_id` = `suppliers`.`supplier_id`
)
ON DUPLICATE KEY UPDATE `supplier_id` = `supplier_id`;

-- Step 2: Create inventory_transactions table (Module 14.2)
CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `transaction_id` char(36) NOT NULL,
  `inventory_id` char(36) NOT NULL,
  `transaction_type` enum('restock','dispense','adjustment','transfer','expired','damaged','return') NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `quantity_before` int(11) NOT NULL,
  `quantity_after` int(11) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `transaction_reason` text DEFAULT NULL,
  `performed_by` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `transaction_date` date DEFAULT (curdate()),
  `reference_id` char(36) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`transaction_id`),
  KEY `idx_inventory_transactions_inventory_id` (`inventory_id`),
  KEY `idx_inventory_transactions_transaction_type` (`transaction_type`),
  KEY `idx_inventory_transactions_transaction_date` (`transaction_date`),
  KEY `idx_inventory_transactions_facility_id` (`facility_id`),
  KEY `idx_inventory_transactions_performed_by` (`performed_by`),
  CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `medication_inventory` (`inventory_id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_transactions_ibfk_2` FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `inventory_transactions_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 3: Create inventory_alerts table (Module 14.3)
CREATE TABLE IF NOT EXISTS `inventory_alerts` (
  `alert_id` char(36) NOT NULL,
  `inventory_id` char(36) NOT NULL,
  `alert_type` enum('low_stock','expiring_soon','expired','overstock') NOT NULL,
  `alert_level` enum('info','warning','critical') DEFAULT 'warning',
  `current_value` decimal(10,2) NOT NULL,
  `threshold_value` decimal(10,2) NOT NULL,
  `message` text NOT NULL,
  `acknowledged` tinyint(1) DEFAULT 0,
  `acknowledged_by` char(36) DEFAULT NULL,
  `acknowledged_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`alert_id`),
  KEY `idx_inventory_alerts_inventory_id` (`inventory_id`),
  KEY `idx_inventory_alerts_alert_type` (`alert_type`),
  KEY `idx_inventory_alerts_acknowledged` (`acknowledged`),
  KEY `idx_inventory_alerts_created_at` (`created_at`),
  KEY `idx_inventory_alerts_alert_level` (`alert_level`),
  CONSTRAINT `inventory_alerts_ibfk_1` FOREIGN KEY (`inventory_id`) REFERENCES `medication_inventory` (`inventory_id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_alerts_ibfk_2` FOREIGN KEY (`acknowledged_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 4: Create inventory_orders table (Module 14.5)
CREATE TABLE IF NOT EXISTS `inventory_orders` (
  `order_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `supplier_id` char(36) NOT NULL,
  `order_date` date DEFAULT (curdate()),
  `expected_delivery_date` date DEFAULT NULL,
  `status` enum('pending','ordered','in_transit','received','cancelled','partial') DEFAULT 'pending',
  `total_cost` decimal(10,2) DEFAULT NULL,
  `ordered_by` char(36) NOT NULL,
  `received_by` char(36) DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`order_id`),
  KEY `idx_inventory_orders_facility_id` (`facility_id`),
  KEY `idx_inventory_orders_supplier_id` (`supplier_id`),
  KEY `idx_inventory_orders_status` (`status`),
  KEY `idx_inventory_orders_order_date` (`order_date`),
  KEY `idx_inventory_orders_ordered_by` (`ordered_by`),
  CONSTRAINT `inventory_orders_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  CONSTRAINT `inventory_orders_ibfk_2` FOREIGN KEY (`supplier_id`) REFERENCES `inventory_suppliers` (`supplier_id`),
  CONSTRAINT `inventory_orders_ibfk_3` FOREIGN KEY (`ordered_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `inventory_orders_ibfk_4` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 5: Create inventory_order_items table (Module 14.6)
CREATE TABLE IF NOT EXISTS `inventory_order_items` (
  `order_item_id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `quantity_ordered` int(11) NOT NULL,
  `quantity_received` int(11) DEFAULT 0,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` enum('pending','received','partial','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`order_item_id`),
  KEY `idx_inventory_order_items_order_id` (`order_id`),
  KEY `idx_inventory_order_items_medication_id` (`medication_id`),
  KEY `idx_inventory_order_items_status` (`status`),
  CONSTRAINT `inventory_order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `inventory_orders` (`order_id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_order_items_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 6: Add indexes to medication_inventory if they don't exist
-- Note: These indexes may already exist, but adding them won't cause errors
ALTER TABLE `medication_inventory`
  ADD INDEX IF NOT EXISTS `idx_inventory_medication_id` (`medication_id`),
  ADD INDEX IF NOT EXISTS `idx_inventory_facility_id` (`facility_id`),
  ADD INDEX IF NOT EXISTS `idx_inventory_expiry_date` (`expiry_date`),
  ADD INDEX IF NOT EXISTS `idx_inventory_batch_number` (`batch_number`);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
-- SHOW TABLES LIKE 'inventory%';

-- Verify inventory_transactions table structure
-- DESCRIBE `inventory_transactions`;

-- Verify inventory_alerts table structure
-- DESCRIBE `inventory_alerts`;

-- Verify inventory_suppliers table structure
-- DESCRIBE `inventory_suppliers`;

-- Verify inventory_orders table structure
-- DESCRIBE `inventory_orders`;

-- Verify inventory_order_items table structure
-- DESCRIBE `inventory_order_items`;

-- Check indexes
-- SHOW INDEXES FROM `inventory_transactions`;
-- SHOW INDEXES FROM `inventory_alerts`;
-- SHOW INDEXES FROM `inventory_orders`;

-- Check foreign keys
-- SELECT 
--   CONSTRAINT_NAME,
--   TABLE_NAME,
--   COLUMN_NAME,
--   REFERENCED_TABLE_NAME,
--   REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME IN ('inventory_transactions', 'inventory_alerts', 'inventory_orders', 'inventory_order_items', 'inventory_suppliers')
--   AND REFERENCED_TABLE_NAME IS NOT NULL;

