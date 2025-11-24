-- =====================================================
-- MODULE 11: PATIENT FEEDBACK & SURVEYS - SQL ALTERS
-- =====================================================
-- Safe migration script for existing database
-- =====================================================

-- Step 1: Drop old survey-related tables (if they exist and you want to remove them)
-- WARNING: This will delete all data in these tables!
-- Uncomment only if you want to completely remove the old structure

-- DROP TABLE IF EXISTS `survey_answers`;
-- DROP TABLE IF EXISTS `survey_questions`;
-- DROP TABLE IF EXISTS `surveys`;

-- Step 2: Drop old survey_responses table if it exists with old structure
-- WARNING: This will delete all existing survey data!
-- Only run if you don't need to migrate existing data

DROP TABLE IF EXISTS `survey_responses`;

-- Step 3: Create new survey_responses table (Module 11.1)
CREATE TABLE `survey_responses` (
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

-- Step 4: Create survey_metrics table (Module 11.2)
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

