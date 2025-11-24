-- =====================================================
-- MODULE 11: PATIENT FEEDBACK & SURVEYS - SQL ALTERS
-- =====================================================
-- This script updates the database to align with Module 11 specification
-- Run this on your existing database
-- =====================================================

-- Step 1: Drop old survey-related tables (if they exist)
-- Note: Only run these if you want to completely replace the old structure
-- If you have data you want to keep, you may need to migrate it first

DROP TABLE IF EXISTS `survey_answers`;
DROP TABLE IF EXISTS `survey_questions`;
DROP TABLE IF EXISTS `surveys`;
DROP TABLE IF EXISTS `survey_responses`; -- Drop old structure

-- Step 2: Create new survey_responses table (Module 11.1)
CREATE TABLE IF NOT EXISTS `survey_responses` (
  `survey_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `facility_id` char(36) DEFAULT NULL,
  `overall_satisfaction` enum('very_happy','happy','neutral','unhappy','very_unhappy') NOT NULL,
  `staff_friendliness` int(11) NOT NULL CHECK (`staff_friendliness` >= 1 AND `staff_friendliness` <= 5),
  `wait_time` int(11) NOT NULL CHECK (`wait_time` >= 1 AND `wait_time` <= 5),
  `facility_cleanliness` int(11) NOT NULL CHECK (`facility_cleanliness` >= 1 AND `facility_cleanliness` <= 5),
  `would_recommend` enum('yes','maybe','no') NOT NULL,
  `comments` text DEFAULT NULL,
  `average_score` decimal(3,2) DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`survey_id`),
  KEY `idx_survey_responses_patient_id` (`patient_id`),
  KEY `idx_survey_responses_facility_id` (`facility_id`),
  KEY `idx_survey_responses_submitted_at` (`submitted_at`),
  CONSTRAINT `survey_responses_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  CONSTRAINT `survey_responses_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 3: Create survey_metrics table (Module 11.2)
CREATE TABLE IF NOT EXISTS `survey_metrics` (
  `metric_id` char(36) NOT NULL,
  `facility_id` char(36) DEFAULT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `total_responses` int(11) DEFAULT 0,
  `average_overall` decimal(3,2) DEFAULT NULL,
  `average_staff` decimal(3,2) DEFAULT NULL,
  `average_wait` decimal(3,2) DEFAULT NULL,
  `average_cleanliness` decimal(3,2) DEFAULT NULL,
  `recommendation_rate` decimal(5,2) DEFAULT NULL,
  `calculated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`metric_id`),
  KEY `idx_survey_metrics_facility_id` (`facility_id`),
  KEY `idx_survey_metrics_period` (`period_start`,`period_end`),
  CONSTRAINT `survey_metrics_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- ALTERNATIVE: If survey_responses table already exists with old structure
-- Use these ALTER statements instead:
-- =====================================================

-- ALTER TABLE `survey_responses` 
--   DROP FOREIGN KEY IF EXISTS `survey_responses_ibfk_1`,
--   DROP FOREIGN KEY IF EXISTS `survey_responses_ibfk_2`,
--   DROP INDEX IF EXISTS `survey_id`,
--   DROP INDEX IF EXISTS `respondent_id`;

-- ALTER TABLE `survey_responses`
--   DROP COLUMN IF EXISTS `response_id`,
--   DROP COLUMN IF EXISTS `survey_id` (old),
--   DROP COLUMN IF EXISTS `respondent_id`,
--   ADD COLUMN `survey_id` char(36) NOT NULL FIRST,
--   ADD COLUMN `patient_id` char(36) NOT NULL AFTER `survey_id`,
--   ADD COLUMN `facility_id` char(36) DEFAULT NULL AFTER `patient_id`,
--   ADD COLUMN `overall_satisfaction` enum('very_happy','happy','neutral','unhappy','very_unhappy') NOT NULL AFTER `facility_id`,
--   ADD COLUMN `staff_friendliness` int(11) NOT NULL CHECK (`staff_friendliness` >= 1 AND `staff_friendliness` <= 5) AFTER `overall_satisfaction`,
--   ADD COLUMN `wait_time` int(11) NOT NULL CHECK (`wait_time` >= 1 AND `wait_time` <= 5) AFTER `staff_friendliness`,
--   ADD COLUMN `facility_cleanliness` int(11) NOT NULL CHECK (`facility_cleanliness` >= 1 AND `facility_cleanliness` <= 5) AFTER `wait_time`,
--   ADD COLUMN `would_recommend` enum('yes','maybe','no') NOT NULL AFTER `facility_cleanliness`,
--   ADD COLUMN `comments` text DEFAULT NULL AFTER `would_recommend`,
--   ADD COLUMN `average_score` decimal(3,2) DEFAULT NULL AFTER `comments`,
--   MODIFY COLUMN `submitted_at` datetime DEFAULT current_timestamp();

-- ALTER TABLE `survey_responses`
--   ADD PRIMARY KEY (`survey_id`),
--   ADD KEY `idx_survey_responses_patient_id` (`patient_id`),
--   ADD KEY `idx_survey_responses_facility_id` (`facility_id`),
--   ADD KEY `idx_survey_responses_submitted_at` (`submitted_at`),
--   ADD CONSTRAINT `survey_responses_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
--   ADD CONSTRAINT `survey_responses_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify survey_responses table structure
-- DESCRIBE `survey_responses`;

-- Verify survey_metrics table structure
-- DESCRIBE `survey_metrics`;

-- Check indexes
-- SHOW INDEXES FROM `survey_responses`;
-- SHOW INDEXES FROM `survey_metrics`;

-- Check foreign keys
-- SELECT 
--   CONSTRAINT_NAME,
--   TABLE_NAME,
--   COLUMN_NAME,
--   REFERENCED_TABLE_NAME,
--   REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME IN ('survey_responses', 'survey_metrics')
--   AND REFERENCED_TABLE_NAME IS NOT NULL;

