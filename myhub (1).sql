-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2025 at 03:24 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `myhub`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `provider_id` char(36) DEFAULT NULL,
  `facility_id` char(36) NOT NULL,
  `appointment_type` enum('follow_up','art_pickup','lab_test','counseling','general','initial') NOT NULL,
  `scheduled_start` datetime NOT NULL,
  `scheduled_end` datetime NOT NULL,
  `duration_minutes` int(11) DEFAULT 30,
  `status` enum('scheduled','confirmed','in_progress','completed','cancelled','no_show') DEFAULT 'scheduled',
  `reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `booked_by` char(36) DEFAULT NULL,
  `booked_at` datetime DEFAULT current_timestamp(),
  `cancelled_at` datetime DEFAULT NULL,
  `cancelled_by` char(36) DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_reminders`
--

CREATE TABLE `appointment_reminders` (
  `reminder_id` char(36) NOT NULL,
  `appointment_id` char(36) NOT NULL,
  `reminder_type` enum('sms','email','push','in_app') NOT NULL,
  `reminder_sent_at` datetime DEFAULT NULL,
  `reminder_scheduled_at` datetime NOT NULL,
  `status` enum('pending','sent','failed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `art_regimens`
--

CREATE TABLE `art_regimens` (
  `regimen_id` char(36) NOT NULL,
  `regimen_name` varchar(150) NOT NULL,
  `regimen_code` varchar(50) DEFAULT NULL,
  `line` enum('first_line','second_line','third_line','other') DEFAULT 'first_line',
  `components` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`components`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `audit_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `user_name` varchar(200) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','VIEW','EXPORT','PRINT','DOWNLOAD') NOT NULL,
  `module` varchar(100) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` char(36) DEFAULT NULL,
  `record_id` varchar(50) DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `change_summary` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `device_type` enum('Desktop','Mobile','Tablet') DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('success','failed','error') DEFAULT 'success',
  `error_message` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_sessions`
--

CREATE TABLE `auth_sessions` (
  `session_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `issued_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `revoked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_sessions`
--

INSERT INTO `auth_sessions` (`session_id`, `user_id`, `token_hash`, `issued_at`, `expires_at`, `ip_address`, `user_agent`, `is_active`, `revoked_at`) VALUES
('13fa97ce-7a7a-4dec-9076-b8eff2687c05', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$b7L4DVel8lvDrwcprq5dROMUdw2K2EdzJSVnGjwMYjDk/JIJkW81i', '2025-11-11 21:49:37', '2025-11-12 21:49:37', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('1b7acfe5-215c-4208-bf2c-2f82f3066884', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$TYn4DPcwrzbzZI1ePwmNl.xU5M6Ef/Y/9nIOX2qqsvZUJl6EHugDS', '2025-11-11 12:18:48', '2025-11-12 12:18:48', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('3b87d9e6-3f69-495a-a52b-13144c8f7fe7', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$WC4hKOCaczUPcsN4ffbjD.0STwo0Xoym7PKcNKNcP4azSq4/zt65a', '2025-11-11 13:50:46', '2025-11-12 13:50:46', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('70e5abb2-6161-42d8-ac53-cdf10b7e31d2', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$RytNuhUNOTDF0nNZ4fO8FOFU5mkaAVs/9B5FWB01n3lOzmYpXbnX.', '2025-11-11 21:52:30', '2025-11-12 21:52:30', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL),
('c55c2497-21ad-439c-aa6f-44df866571e3', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', '$2b$10$4eieeivKZT0WoRbtHAv.p.jNv9X3khFTtICj41pXJATLhhW1JBp6.', '2025-11-11 12:19:24', '2025-11-12 12:19:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `availability_slots`
--

CREATE TABLE `availability_slots` (
  `slot_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_status` enum('available','booked','blocked','unavailable') DEFAULT 'available',
  `appointment_id` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `care_tasks`
--

CREATE TABLE `care_tasks` (
  `task_id` char(36) NOT NULL,
  `referral_id` char(36) DEFAULT NULL,
  `patient_id` char(36) NOT NULL,
  `assignee_id` char(36) NOT NULL,
  `task_type` enum('follow_up','referral','counseling','appointment','other') NOT NULL,
  `task_description` text NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client_types`
--

CREATE TABLE `client_types` (
  `client_type_id` int(11) NOT NULL,
  `type_name` varchar(200) NOT NULL,
  `type_code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clinical_visits`
--

CREATE TABLE `clinical_visits` (
  `visit_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `visit_date` date NOT NULL,
  `visit_type` enum('initial','follow_up','emergency','routine','art_pickup') NOT NULL,
  `who_stage` enum('Stage 1','Stage 2','Stage 3','Stage 4','Not Applicable') DEFAULT NULL,
  `chief_complaint` text DEFAULT NULL,
  `clinical_notes` text DEFAULT NULL,
  `assessment` text DEFAULT NULL,
  `plan` text DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `follow_up_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `counseling_sessions`
--

CREATE TABLE `counseling_sessions` (
  `session_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `counselor_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `session_date` date DEFAULT curdate(),
  `session_type` enum('pre_test','post_test','adherence','mental_health','support','other') NOT NULL,
  `session_notes` text DEFAULT NULL,
  `follow_up_required` tinyint(1) DEFAULT 0,
  `follow_up_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dashboard_cache`
--

CREATE TABLE `dashboard_cache` (
  `cache_id` char(36) NOT NULL,
  `widget_id` varchar(100) NOT NULL,
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`parameters`)),
  `cached_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`cached_data`)),
  `cached_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `diagnoses`
--

CREATE TABLE `diagnoses` (
  `diagnosis_id` char(36) NOT NULL,
  `visit_id` char(36) NOT NULL,
  `icd10_code` varchar(10) DEFAULT NULL,
  `diagnosis_description` text NOT NULL,
  `diagnosis_type` enum('primary','secondary','differential','rule_out') DEFAULT 'primary',
  `is_chronic` tinyint(1) DEFAULT 0,
  `onset_date` date DEFAULT NULL,
  `resolved_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dispense_events`
--

CREATE TABLE `dispense_events` (
  `dispense_id` char(36) NOT NULL,
  `prescription_id` char(36) NOT NULL,
  `prescription_item_id` char(36) DEFAULT NULL,
  `nurse_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `dispensed_date` date DEFAULT curdate(),
  `quantity_dispensed` int(11) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `facilities`
--

CREATE TABLE `facilities` (
  `facility_id` char(36) NOT NULL,
  `facility_name` varchar(150) NOT NULL,
  `facility_type` enum('main','branch','satellite','external') NOT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`address`)),
  `region_id` int(11) DEFAULT NULL,
  `contact_person` varchar(200) DEFAULT NULL,
  `contact_number` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`facility_id`, `facility_name`, `facility_type`, `address`, `region_id`, `contact_person`, `contact_number`, `email`, `is_active`, `created_at`, `updated_at`) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'MyHubCares Main Clinic', 'main', '{\"street\": \"123 Health Avenue\", \"barangay\": \"Barangay Health\", \"city\": \"Manila\", \"province\": \"Metro Manila\", \"zip\": \"1000\"}', 1, 'Dr. Maria Santos', '+63-2-1234-5678', 'main@myhubcares.com', 1, '2025-11-11 12:07:58', '2025-11-11 12:07:58'),
('550e8400-e29b-41d4-a716-446655440002', 'MyHubCares Quezon City Branch', 'branch', '{\"street\": \"456 Wellness Street\", \"barangay\": \"Barangay Care\", \"city\": \"Quezon City\", \"province\": \"Metro Manila\", \"zip\": \"1100\"}', 1, 'Dr. Juan dela Cruz', '+63-2-2345-6789', 'qc@myhubcares.com', 1, '2025-11-11 12:07:58', '2025-11-11 12:07:58'),
('550e8400-e29b-41d4-a716-446655440003', 'MyHubCares Makati Satellite', 'satellite', '{\"street\": \"789 Medical Plaza\", \"barangay\": \"Barangay Medical\", \"city\": \"Makati\", \"province\": \"Metro Manila\", \"zip\": \"1200\"}', 1, 'Nurse Anna Garcia', '+63-2-3456-7890', 'makati@myhubcares.com', 1, '2025-11-11 12:07:58', '2025-11-11 12:07:58');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` char(36) NOT NULL,
  `patient_id` char(36) DEFAULT NULL,
  `staff_id` char(36) DEFAULT NULL,
  `category` enum('service','system','staff','facility','other') DEFAULT 'service',
  `message` text NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_posts`
--

CREATE TABLE `forum_posts` (
  `post_id` char(36) NOT NULL,
  `topic_id` char(36) NOT NULL,
  `author_id` char(36) NOT NULL,
  `content` text NOT NULL,
  `parent_post_id` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_reactions`
--

CREATE TABLE `forum_reactions` (
  `reaction_id` char(36) NOT NULL,
  `post_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `reaction_type` enum('like','love','insightful','thankful','sad','angry') DEFAULT 'like',
  `reacted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `forum_topics`
--

CREATE TABLE `forum_topics` (
  `topic_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('general','health','art','support','announcement') DEFAULT 'general',
  `created_by` char(36) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hts_sessions`
--

CREATE TABLE `hts_sessions` (
  `hts_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `tester_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `test_date` date DEFAULT curdate(),
  `test_result` enum('positive','negative','indeterminate') NOT NULL,
  `test_type` varchar(50) DEFAULT NULL,
  `pre_test_counseling` tinyint(1) DEFAULT 0,
  `post_test_counseling` tinyint(1) DEFAULT 0,
  `linked_to_care` tinyint(1) DEFAULT 0,
  `care_link_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `item_id` char(36) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `item_category` enum('medical','lab','office','pharmacy','other') DEFAULT 'other',
  `unit` varchar(50) DEFAULT NULL,
  `reorder_level` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lab_files`
--

CREATE TABLE `lab_files` (
  `file_id` char(36) NOT NULL,
  `result_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `uploaded_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lab_orders`
--

CREATE TABLE `lab_orders` (
  `order_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `ordering_provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `order_date` date DEFAULT curdate(),
  `test_panel` varchar(100) NOT NULL,
  `priority` enum('routine','urgent','stat') DEFAULT 'routine',
  `status` enum('ordered','collected','in_progress','completed','cancelled') DEFAULT 'ordered',
  `collection_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lab_results`
--

CREATE TABLE `lab_results` (
  `result_id` char(36) NOT NULL,
  `order_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `test_code` varchar(50) NOT NULL,
  `test_name` varchar(150) NOT NULL,
  `result_value` varchar(100) NOT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `reference_range_min` decimal(10,2) DEFAULT NULL,
  `reference_range_max` decimal(10,2) DEFAULT NULL,
  `reference_range_text` varchar(100) DEFAULT NULL,
  `is_critical` tinyint(1) DEFAULT 0,
  `critical_alert_sent` tinyint(1) DEFAULT 0,
  `collected_at` date DEFAULT NULL,
  `reported_at` date DEFAULT curdate(),
  `reviewed_at` datetime DEFAULT NULL,
  `reviewer_id` char(36) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medications`
--

CREATE TABLE `medications` (
  `medication_id` char(36) NOT NULL,
  `medication_name` varchar(150) NOT NULL,
  `generic_name` varchar(150) DEFAULT NULL,
  `form` enum('tablet','capsule','syrup','injection','cream','other') NOT NULL,
  `strength` varchar(50) DEFAULT NULL,
  `atc_code` varchar(10) DEFAULT NULL,
  `is_art` tinyint(1) DEFAULT 0,
  `is_controlled` tinyint(1) DEFAULT 0,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medication_adherence`
--

CREATE TABLE `medication_adherence` (
  `adherence_id` char(36) NOT NULL,
  `prescription_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `adherence_date` date DEFAULT curdate(),
  `taken` tinyint(1) DEFAULT 0,
  `missed_reason` text DEFAULT NULL,
  `adherence_percentage` decimal(5,2) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medication_inventory`
--

CREATE TABLE `medication_inventory` (
  `inventory_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `quantity_on_hand` int(11) DEFAULT 0,
  `unit` varchar(20) DEFAULT 'tablets',
  `expiry_date` date DEFAULT NULL,
  `reorder_level` int(11) DEFAULT 0,
  `last_restocked` date DEFAULT NULL,
  `supplier` varchar(200) DEFAULT NULL,
  `cost_per_unit` decimal(10,2) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medication_reminders`
--

CREATE TABLE `medication_reminders` (
  `reminder_id` char(36) NOT NULL,
  `prescription_id` char(36) DEFAULT NULL,
  `patient_id` char(36) NOT NULL,
  `medication_name` varchar(150) NOT NULL,
  `dosage` varchar(50) NOT NULL,
  `frequency` varchar(50) NOT NULL,
  `reminder_time` time NOT NULL,
  `sound_preference` enum('default','gentle','urgent') DEFAULT 'default',
  `browser_notifications` tinyint(1) DEFAULT 1,
  `special_instructions` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `missed_doses` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` char(36) NOT NULL,
  `thread_id` char(36) NOT NULL,
  `sender_id` char(36) NOT NULL,
  `recipient_id` char(36) DEFAULT NULL,
  `content` text NOT NULL,
  `sent_at` datetime DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_threads`
--

CREATE TABLE `message_threads` (
  `thread_id` char(36) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mfa_tokens`
--

CREATE TABLE `mfa_tokens` (
  `mfa_token_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `method` enum('totp','sms','email') NOT NULL,
  `secret` varchar(255) DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `code_hash` varchar(255) DEFAULT NULL,
  `issued_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `attempts` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` char(36) NOT NULL,
  `recipient_id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` enum('system','reminder','alert','appointment','lab','custom') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `patient_id` char(36) NOT NULL,
  `uic` varchar(30) NOT NULL,
  `philhealth_no` varchar(20) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `suffix` varchar(10) DEFAULT NULL,
  `birth_date` date NOT NULL,
  `sex` enum('M','F','O') NOT NULL,
  `civil_status` enum('Single','Married','Divorced','Widowed','Separated') DEFAULT NULL,
  `nationality` varchar(50) DEFAULT 'Filipino',
  `current_city` varchar(100) DEFAULT NULL,
  `current_province` varchar(100) DEFAULT NULL,
  `current_address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`current_address`)),
  `contact_phone` varchar(30) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mother_name` varchar(200) DEFAULT NULL,
  `father_name` varchar(200) DEFAULT NULL,
  `birth_order` int(11) DEFAULT NULL,
  `guardian_name` varchar(200) DEFAULT NULL,
  `guardian_relationship` varchar(50) DEFAULT NULL,
  `facility_id` char(36) NOT NULL,
  `arpa_risk_score` decimal(5,2) DEFAULT NULL,
  `arpa_last_calculated` date DEFAULT NULL,
  `status` enum('active','inactive','deceased','transferred') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`patient_id`, `uic`, `philhealth_no`, `first_name`, `middle_name`, `last_name`, `suffix`, `birth_date`, `sex`, `civil_status`, `nationality`, `current_city`, `current_province`, `current_address`, `contact_phone`, `email`, `mother_name`, `father_name`, `birth_order`, `guardian_name`, `guardian_relationship`, `facility_id`, `arpa_risk_score`, `arpa_last_calculated`, `status`, `created_at`, `updated_at`, `created_by`) VALUES
('7db2ecfb-e409-41f3-a632-b5db0d4f868b', 'HASA01062204', NULL, 'Hanna', 'N.', 'Sarabia', NULL, '2204-01-06', 'F', 'Single', 'Filipino', 'Calocan', 'METRO MANILA', '{\"city\":\"Calocan\",\"province\":\"METRO MANILA\"}', '0966-312-2562', 'sarabia.hanna.bsinfotech@gmail.com', NULL, NULL, NULL, NULL, NULL, '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, 'active', '2025-11-11 12:17:15', '2025-11-11 12:17:15', 'ffa85dab-263d-48e6-9cb1-fdef46b9b4a8');

-- --------------------------------------------------------

--
-- Table structure for table `patient_art_history`
--

CREATE TABLE `patient_art_history` (
  `history_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `regimen_id` char(36) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `reason_for_change` text DEFAULT NULL,
  `outcome` enum('ongoing','completed','discontinued','transferred_out','died') DEFAULT 'ongoing',
  `recorded_by` char(36) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_documents`
--

CREATE TABLE `patient_documents` (
  `document_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `document_type` enum('consent','id_copy','medical_record','lab_result','other') NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `uploaded_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_identifiers`
--

CREATE TABLE `patient_identifiers` (
  `identifier_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `id_type` enum('passport','driver_license','sss','tin','other') NOT NULL,
  `id_value` varchar(100) NOT NULL,
  `issued_at` date DEFAULT NULL,
  `expires_at` date DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patient_risk_scores`
--

CREATE TABLE `patient_risk_scores` (
  `risk_score_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `calculated_on` date DEFAULT curdate(),
  `risk_factors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`risk_factors`)),
  `recommendations` text DEFAULT NULL,
  `calculated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `permission_id` char(36) NOT NULL,
  `permission_code` varchar(100) NOT NULL,
  `permission_name` varchar(150) NOT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescriptions`
--

CREATE TABLE `prescriptions` (
  `prescription_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `prescriber_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `prescription_date` date DEFAULT curdate(),
  `prescription_number` varchar(50) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','completed','cancelled','expired') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prescription_items`
--

CREATE TABLE `prescription_items` (
  `prescription_item_id` char(36) NOT NULL,
  `prescription_id` char(36) NOT NULL,
  `medication_id` char(36) NOT NULL,
  `dosage` varchar(50) NOT NULL,
  `frequency` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `instructions` text DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `procedures`
--

CREATE TABLE `procedures` (
  `procedure_id` char(36) NOT NULL,
  `visit_id` char(36) NOT NULL,
  `cpt_code` varchar(8) DEFAULT NULL,
  `procedure_name` varchar(200) NOT NULL,
  `procedure_description` text DEFAULT NULL,
  `outcome` text DEFAULT NULL,
  `performed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `program_indicators`
--

CREATE TABLE `program_indicators` (
  `indicator_id` char(36) NOT NULL,
  `indicator_name` varchar(200) NOT NULL,
  `indicator_code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `target_value` decimal(10,2) DEFAULT NULL,
  `current_value` decimal(10,2) DEFAULT NULL,
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `facility_id` char(36) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referrals`
--

CREATE TABLE `referrals` (
  `referral_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `from_facility_id` char(36) NOT NULL,
  `to_facility_id` char(36) NOT NULL,
  `referral_reason` text NOT NULL,
  `urgency` enum('routine','urgent','emergency') DEFAULT 'routine',
  `status` enum('pending','accepted','in_transit','completed','rejected','cancelled') DEFAULT 'pending',
  `clinical_notes` text DEFAULT NULL,
  `referred_by` char(36) NOT NULL,
  `referred_at` datetime DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `accepted_by` char(36) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `regions`
--

CREATE TABLE `regions` (
  `region_id` int(11) NOT NULL,
  `region_name` varchar(150) NOT NULL,
  `region_code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `regions`
--

INSERT INTO `regions` (`region_id`, `region_name`, `region_code`, `is_active`, `created_at`) VALUES
(1, 'National Capital Region (NCR)', 'NCR', 1, '2025-11-11 09:51:22'),
(2, 'Cordillera Administrative Region', 'CAR', 1, '2025-11-11 09:51:22'),
(3, 'Ilocos Region', 'I', 1, '2025-11-11 09:51:22'),
(4, 'Cagayan Valley', 'II', 1, '2025-11-11 09:51:22'),
(5, 'Central Luzon', 'III', 1, '2025-11-11 09:51:22'),
(6, 'CALABARZON', 'IV-A', 1, '2025-11-11 09:51:22'),
(7, 'MIMAROPA', 'IV-B', 1, '2025-11-11 09:51:22'),
(8, 'Bicol Region', 'V', 1, '2025-11-11 09:51:22'),
(9, 'Western Visayas', 'VI', 1, '2025-11-11 09:51:22'),
(10, 'Central Visayas', 'VII', 1, '2025-11-11 09:51:22');

-- --------------------------------------------------------

--
-- Table structure for table `report_queries`
--

CREATE TABLE `report_queries` (
  `report_id` char(36) NOT NULL,
  `report_name` varchar(150) NOT NULL,
  `report_description` text DEFAULT NULL,
  `report_type` enum('patient','clinical','inventory','survey','custom') NOT NULL,
  `query_definition` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`query_definition`)),
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters`)),
  `schedule` varchar(50) DEFAULT NULL,
  `owner_id` char(36) NOT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_runs`
--

CREATE TABLE `report_runs` (
  `run_id` char(36) NOT NULL,
  `report_id` char(36) NOT NULL,
  `started_at` datetime DEFAULT current_timestamp(),
  `finished_at` datetime DEFAULT NULL,
  `status` enum('running','completed','failed','cancelled') DEFAULT 'running',
  `parameters_used` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters_used`)),
  `output_ref` varchar(500) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `run_by` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` char(36) NOT NULL,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system_role` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_permission_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `granted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_entries`
--

CREATE TABLE `stock_entries` (
  `stock_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `supplier_id` char(36) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_cost` decimal(10,2) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `received_at` datetime DEFAULT current_timestamp(),
  `received_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `movement_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `from_facility_id` char(36) DEFAULT NULL,
  `to_facility_id` char(36) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `movement_type` enum('transfer','adjustment','return','damage') NOT NULL,
  `notes` text DEFAULT NULL,
  `moved_by` char(36) DEFAULT NULL,
  `moved_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` char(36) NOT NULL,
  `supplier_name` varchar(150) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`address`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `surveys`
--

CREATE TABLE `surveys` (
  `survey_id` char(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `target_audience` enum('patients','staff','all') DEFAULT 'all',
  `is_active` tinyint(1) DEFAULT 1,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_answers`
--

CREATE TABLE `survey_answers` (
  `answer_id` char(36) NOT NULL,
  `response_id` char(36) NOT NULL,
  `question_id` char(36) NOT NULL,
  `answer_text` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_questions`
--

CREATE TABLE `survey_questions` (
  `question_id` char(36) NOT NULL,
  `survey_id` char(36) NOT NULL,
  `question_text` text NOT NULL,
  `question_type` enum('text','multiple_choice','rating','boolean') NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `position` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `survey_responses`
--

CREATE TABLE `survey_responses` (
  `response_id` char(36) NOT NULL,
  `survey_id` char(36) NOT NULL,
  `respondent_id` char(36) DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`setting_value`)),
  `description` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp(),
  `updated_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `username` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(200) NOT NULL,
  `role` enum('admin','physician','nurse','case_manager','lab_personnel','patient') NOT NULL,
  `status` enum('active','inactive','suspended','pending') DEFAULT 'active',
  `facility_id` char(36) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `failed_login_attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `mfa_enabled` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp(),
  `created_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `full_name`, `role`, `status`, `facility_id`, `phone`, `last_login`, `failed_login_attempts`, `locked_until`, `mfa_enabled`, `created_at`, `updated_at`, `created_by`) VALUES
('ffa85dab-263d-48e6-9cb1-fdef46b9b4a8', 'hanapot', 'sarabia.hanna.bsinfotech@gmail.com', '$2b$10$GeI4gQ1euEagHf6PVe6GjesT6VJcv5euO/YQOPMPjyJG5Rj5ncex.', 'Hanna N. Sarabia', 'admin', 'active', '550e8400-e29b-41d4-a716-446655440001', '0966-312-2562', '2025-11-11 21:52:30', 0, NULL, 0, '2025-11-11 12:17:15', '2025-11-11 12:17:15', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_facility_assignments`
--

CREATE TABLE `user_facility_assignments` (
  `assignment_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `is_primary` tinyint(1) DEFAULT 0,
  `assigned_at` datetime DEFAULT current_timestamp(),
  `assigned_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `user_role_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  `assigned_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vaccination_records`
--

CREATE TABLE `vaccination_records` (
  `vaccination_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `vaccine_id` char(36) NOT NULL,
  `provider_id` char(36) NOT NULL,
  `facility_id` char(36) NOT NULL,
  `dose_number` int(11) NOT NULL,
  `total_doses` int(11) NOT NULL,
  `date_given` date DEFAULT curdate(),
  `next_dose_due` date DEFAULT NULL,
  `lot_number` varchar(50) DEFAULT NULL,
  `administration_site` enum('left_arm','right_arm','left_thigh','right_thigh','other') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('complete','in_progress','due_soon','overdue') DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vaccine_catalog`
--

CREATE TABLE `vaccine_catalog` (
  `vaccine_id` char(36) NOT NULL,
  `vaccine_name` varchar(150) NOT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `series_length` int(11) NOT NULL,
  `dose_intervals` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`dose_intervals`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vital_signs`
--

CREATE TABLE `vital_signs` (
  `vital_id` char(36) NOT NULL,
  `visit_id` char(36) NOT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(5,2) DEFAULT NULL,
  `systolic_bp` int(11) DEFAULT NULL,
  `diastolic_bp` int(11) DEFAULT NULL,
  `pulse_rate` int(11) DEFAULT NULL,
  `temperature_c` decimal(4,1) DEFAULT NULL,
  `respiratory_rate` int(11) DEFAULT NULL,
  `oxygen_saturation` decimal(4,1) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `recorded_by` char(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `booked_by` (`booked_by`),
  ADD KEY `cancelled_by` (`cancelled_by`);

--
-- Indexes for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `art_regimens`
--
ALTER TABLE `art_regimens`
  ADD PRIMARY KEY (`regimen_id`),
  ADD UNIQUE KEY `regimen_code` (`regimen_code`);

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `availability_slots`
--
ALTER TABLE `availability_slots`
  ADD PRIMARY KEY (`slot_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `appointment_id` (`appointment_id`);

--
-- Indexes for table `care_tasks`
--
ALTER TABLE `care_tasks`
  ADD PRIMARY KEY (`task_id`),
  ADD KEY `referral_id` (`referral_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `assignee_id` (`assignee_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `client_types`
--
ALTER TABLE `client_types`
  ADD PRIMARY KEY (`client_type_id`),
  ADD UNIQUE KEY `type_code` (`type_code`);

--
-- Indexes for table `clinical_visits`
--
ALTER TABLE `clinical_visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `counseling_sessions`
--
ALTER TABLE `counseling_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `counselor_id` (`counselor_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `dashboard_cache`
--
ALTER TABLE `dashboard_cache`
  ADD PRIMARY KEY (`cache_id`);

--
-- Indexes for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD PRIMARY KEY (`diagnosis_id`),
  ADD KEY `visit_id` (`visit_id`);

--
-- Indexes for table `dispense_events`
--
ALTER TABLE `dispense_events`
  ADD PRIMARY KEY (`dispense_id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `prescription_item_id` (`prescription_item_id`),
  ADD KEY `nurse_id` (`nurse_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`facility_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `staff_id` (`staff_id`);

--
-- Indexes for table `forum_posts`
--
ALTER TABLE `forum_posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `topic_id` (`topic_id`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `parent_post_id` (`parent_post_id`);

--
-- Indexes for table `forum_reactions`
--
ALTER TABLE `forum_reactions`
  ADD PRIMARY KEY (`reaction_id`),
  ADD UNIQUE KEY `uq_reaction` (`post_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `forum_topics`
--
ALTER TABLE `forum_topics`
  ADD PRIMARY KEY (`topic_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `hts_sessions`
--
ALTER TABLE `hts_sessions`
  ADD PRIMARY KEY (`hts_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `tester_id` (`tester_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `lab_files`
--
ALTER TABLE `lab_files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `result_id` (`result_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `lab_orders`
--
ALTER TABLE `lab_orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `ordering_provider_id` (`ordering_provider_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `lab_results`
--
ALTER TABLE `lab_results`
  ADD PRIMARY KEY (`result_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `reviewer_id` (`reviewer_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `medications`
--
ALTER TABLE `medications`
  ADD PRIMARY KEY (`medication_id`);

--
-- Indexes for table `medication_adherence`
--
ALTER TABLE `medication_adherence`
  ADD PRIMARY KEY (`adherence_id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `medication_inventory`
--
ALTER TABLE `medication_inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD KEY `medication_id` (`medication_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `medication_reminders`
--
ALTER TABLE `medication_reminders`
  ADD PRIMARY KEY (`reminder_id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `thread_id` (`thread_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `message_threads`
--
ALTER TABLE `message_threads`
  ADD PRIMARY KEY (`thread_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `mfa_tokens`
--
ALTER TABLE `mfa_tokens`
  ADD PRIMARY KEY (`mfa_token_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `recipient_id` (`recipient_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`patient_id`),
  ADD UNIQUE KEY `uic` (`uic`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `patient_art_history`
--
ALTER TABLE `patient_art_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `regimen_id` (`regimen_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Indexes for table `patient_documents`
--
ALTER TABLE `patient_documents`
  ADD PRIMARY KEY (`document_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `patient_identifiers`
--
ALTER TABLE `patient_identifiers`
  ADD PRIMARY KEY (`identifier_id`),
  ADD KEY `patient_id` (`patient_id`);

--
-- Indexes for table `patient_risk_scores`
--
ALTER TABLE `patient_risk_scores`
  ADD PRIMARY KEY (`risk_score_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `calculated_by` (`calculated_by`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD UNIQUE KEY `permission_code` (`permission_code`);

--
-- Indexes for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD PRIMARY KEY (`prescription_id`),
  ADD UNIQUE KEY `prescription_number` (`prescription_number`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `prescriber_id` (`prescriber_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD PRIMARY KEY (`prescription_item_id`),
  ADD KEY `prescription_id` (`prescription_id`),
  ADD KEY `medication_id` (`medication_id`);

--
-- Indexes for table `procedures`
--
ALTER TABLE `procedures`
  ADD PRIMARY KEY (`procedure_id`),
  ADD KEY `visit_id` (`visit_id`);

--
-- Indexes for table `program_indicators`
--
ALTER TABLE `program_indicators`
  ADD PRIMARY KEY (`indicator_id`),
  ADD UNIQUE KEY `indicator_code` (`indicator_code`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `referrals`
--
ALTER TABLE `referrals`
  ADD PRIMARY KEY (`referral_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `from_facility_id` (`from_facility_id`),
  ADD KEY `to_facility_id` (`to_facility_id`),
  ADD KEY `referred_by` (`referred_by`),
  ADD KEY `accepted_by` (`accepted_by`);

--
-- Indexes for table `regions`
--
ALTER TABLE `regions`
  ADD PRIMARY KEY (`region_id`),
  ADD UNIQUE KEY `region_code` (`region_code`);

--
-- Indexes for table `report_queries`
--
ALTER TABLE `report_queries`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Indexes for table `report_runs`
--
ALTER TABLE `report_runs`
  ADD PRIMARY KEY (`run_id`),
  ADD KEY `report_id` (`report_id`),
  ADD KEY `run_by` (`run_by`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_code` (`role_code`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_permission_id`),
  ADD UNIQUE KEY `role_id` (`role_id`,`permission_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `stock_entries`
--
ALTER TABLE `stock_entries`
  ADD PRIMARY KEY (`stock_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`movement_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `from_facility_id` (`from_facility_id`),
  ADD KEY `to_facility_id` (`to_facility_id`),
  ADD KEY `moved_by` (`moved_by`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `surveys`
--
ALTER TABLE `surveys`
  ADD PRIMARY KEY (`survey_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD PRIMARY KEY (`answer_id`),
  ADD KEY `response_id` (`response_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indexes for table `survey_questions`
--
ALTER TABLE `survey_questions`
  ADD PRIMARY KEY (`question_id`),
  ADD KEY `survey_id` (`survey_id`);

--
-- Indexes for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD PRIMARY KEY (`response_id`),
  ADD KEY `survey_id` (`survey_id`),
  ADD KEY `respondent_id` (`respondent_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `user_facility_assignments`
--
ALTER TABLE `user_facility_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD UNIQUE KEY `uq_user_facility_primary` (`user_id`,`facility_id`,`is_primary`),
  ADD KEY `facility_id` (`facility_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_role_id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`),
  ADD KEY `assigned_by` (`assigned_by`);

--
-- Indexes for table `vaccination_records`
--
ALTER TABLE `vaccination_records`
  ADD PRIMARY KEY (`vaccination_id`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `vaccine_id` (`vaccine_id`),
  ADD KEY `provider_id` (`provider_id`),
  ADD KEY `facility_id` (`facility_id`);

--
-- Indexes for table `vaccine_catalog`
--
ALTER TABLE `vaccine_catalog`
  ADD PRIMARY KEY (`vaccine_id`);

--
-- Indexes for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD PRIMARY KEY (`vital_id`),
  ADD KEY `visit_id` (`visit_id`),
  ADD KEY `recorded_by` (`recorded_by`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `appointments_ibfk_4` FOREIGN KEY (`booked_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `appointments_ibfk_5` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD CONSTRAINT `appointment_reminders_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`);

--
-- Constraints for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `auth_sessions`
--
ALTER TABLE `auth_sessions`
  ADD CONSTRAINT `auth_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `availability_slots`
--
ALTER TABLE `availability_slots`
  ADD CONSTRAINT `availability_slots_ibfk_1` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `availability_slots_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `availability_slots_ibfk_3` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`);

--
-- Constraints for table `care_tasks`
--
ALTER TABLE `care_tasks`
  ADD CONSTRAINT `care_tasks_ibfk_1` FOREIGN KEY (`referral_id`) REFERENCES `referrals` (`referral_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `care_tasks_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `care_tasks_ibfk_3` FOREIGN KEY (`assignee_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `care_tasks_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `clinical_visits`
--
ALTER TABLE `clinical_visits`
  ADD CONSTRAINT `clinical_visits_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `clinical_visits_ibfk_2` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `clinical_visits_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `counseling_sessions`
--
ALTER TABLE `counseling_sessions`
  ADD CONSTRAINT `counseling_sessions_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `counseling_sessions_ibfk_2` FOREIGN KEY (`counselor_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `counseling_sessions_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD CONSTRAINT `diagnoses_ibfk_1` FOREIGN KEY (`visit_id`) REFERENCES `clinical_visits` (`visit_id`) ON DELETE CASCADE;

--
-- Constraints for table `dispense_events`
--
ALTER TABLE `dispense_events`
  ADD CONSTRAINT `dispense_events_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`),
  ADD CONSTRAINT `dispense_events_ibfk_2` FOREIGN KEY (`prescription_item_id`) REFERENCES `prescription_items` (`prescription_item_id`),
  ADD CONSTRAINT `dispense_events_ibfk_3` FOREIGN KEY (`nurse_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `dispense_events_ibfk_4` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `forum_posts`
--
ALTER TABLE `forum_posts`
  ADD CONSTRAINT `forum_posts_ibfk_1` FOREIGN KEY (`topic_id`) REFERENCES `forum_topics` (`topic_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_posts_ibfk_2` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `forum_posts_ibfk_3` FOREIGN KEY (`parent_post_id`) REFERENCES `forum_posts` (`post_id`) ON DELETE SET NULL;

--
-- Constraints for table `forum_reactions`
--
ALTER TABLE `forum_reactions`
  ADD CONSTRAINT `forum_reactions_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `forum_posts` (`post_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `forum_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `forum_topics`
--
ALTER TABLE `forum_topics`
  ADD CONSTRAINT `forum_topics_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `hts_sessions`
--
ALTER TABLE `hts_sessions`
  ADD CONSTRAINT `hts_sessions_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hts_sessions_ibfk_2` FOREIGN KEY (`tester_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `hts_sessions_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `lab_files`
--
ALTER TABLE `lab_files`
  ADD CONSTRAINT `lab_files_ibfk_1` FOREIGN KEY (`result_id`) REFERENCES `lab_results` (`result_id`),
  ADD CONSTRAINT `lab_files_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `lab_orders`
--
ALTER TABLE `lab_orders`
  ADD CONSTRAINT `lab_orders_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `lab_orders_ibfk_2` FOREIGN KEY (`ordering_provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `lab_orders_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `lab_results`
--
ALTER TABLE `lab_results`
  ADD CONSTRAINT `lab_results_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `lab_orders` (`order_id`),
  ADD CONSTRAINT `lab_results_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `lab_results_ibfk_3` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `lab_results_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `medication_adherence`
--
ALTER TABLE `medication_adherence`
  ADD CONSTRAINT `medication_adherence_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`),
  ADD CONSTRAINT `medication_adherence_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`);

--
-- Constraints for table `medication_inventory`
--
ALTER TABLE `medication_inventory`
  ADD CONSTRAINT `medication_inventory_ibfk_1` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`),
  ADD CONSTRAINT `medication_inventory_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `medication_reminders`
--
ALTER TABLE `medication_reminders`
  ADD CONSTRAINT `medication_reminders_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`),
  ADD CONSTRAINT `medication_reminders_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`thread_id`) REFERENCES `message_threads` (`thread_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `message_threads`
--
ALTER TABLE `message_threads`
  ADD CONSTRAINT `message_threads_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `mfa_tokens`
--
ALTER TABLE `mfa_tokens`
  ADD CONSTRAINT `mfa_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `patients_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `patient_art_history`
--
ALTER TABLE `patient_art_history`
  ADD CONSTRAINT `patient_art_history_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_art_history_ibfk_2` FOREIGN KEY (`regimen_id`) REFERENCES `art_regimens` (`regimen_id`),
  ADD CONSTRAINT `patient_art_history_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `patient_documents`
--
ALTER TABLE `patient_documents`
  ADD CONSTRAINT `patient_documents_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `patient_identifiers`
--
ALTER TABLE `patient_identifiers`
  ADD CONSTRAINT `patient_identifiers_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE;

--
-- Constraints for table `patient_risk_scores`
--
ALTER TABLE `patient_risk_scores`
  ADD CONSTRAINT `patient_risk_scores_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_risk_scores_ibfk_2` FOREIGN KEY (`calculated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `prescriptions`
--
ALTER TABLE `prescriptions`
  ADD CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  ADD CONSTRAINT `prescriptions_ibfk_2` FOREIGN KEY (`prescriber_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `prescriptions_ibfk_3` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `prescription_items`
--
ALTER TABLE `prescription_items`
  ADD CONSTRAINT `prescription_items_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`prescription_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `prescription_items_ibfk_2` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`medication_id`);

--
-- Constraints for table `procedures`
--
ALTER TABLE `procedures`
  ADD CONSTRAINT `procedures_ibfk_1` FOREIGN KEY (`visit_id`) REFERENCES `clinical_visits` (`visit_id`) ON DELETE CASCADE;

--
-- Constraints for table `program_indicators`
--
ALTER TABLE `program_indicators`
  ADD CONSTRAINT `program_indicators_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `referrals`
--
ALTER TABLE `referrals`
  ADD CONSTRAINT `referrals_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `referrals_ibfk_2` FOREIGN KEY (`from_facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `referrals_ibfk_3` FOREIGN KEY (`to_facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `referrals_ibfk_4` FOREIGN KEY (`referred_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `referrals_ibfk_5` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `report_queries`
--
ALTER TABLE `report_queries`
  ADD CONSTRAINT `report_queries_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `report_runs`
--
ALTER TABLE `report_runs`
  ADD CONSTRAINT `report_runs_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `report_queries` (`report_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `report_runs_ibfk_2` FOREIGN KEY (`run_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`permission_id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_entries`
--
ALTER TABLE `stock_entries`
  ADD CONSTRAINT `stock_entries_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`item_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_entries_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `stock_entries_ibfk_3` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`),
  ADD CONSTRAINT `stock_entries_ibfk_4` FOREIGN KEY (`received_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD CONSTRAINT `stock_movements_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`item_id`),
  ADD CONSTRAINT `stock_movements_ibfk_2` FOREIGN KEY (`from_facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `stock_movements_ibfk_3` FOREIGN KEY (`to_facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `stock_movements_ibfk_4` FOREIGN KEY (`moved_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `surveys`
--
ALTER TABLE `surveys`
  ADD CONSTRAINT `surveys_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `survey_answers`
--
ALTER TABLE `survey_answers`
  ADD CONSTRAINT `survey_answers_ibfk_1` FOREIGN KEY (`response_id`) REFERENCES `survey_responses` (`response_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `survey_questions` (`question_id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_questions`
--
ALTER TABLE `survey_questions`
  ADD CONSTRAINT `survey_questions_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE;

--
-- Constraints for table `survey_responses`
--
ALTER TABLE `survey_responses`
  ADD CONSTRAINT `survey_responses_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`survey_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `survey_responses_ibfk_2` FOREIGN KEY (`respondent_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD CONSTRAINT `system_settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `user_facility_assignments`
--
ALTER TABLE `user_facility_assignments`
  ADD CONSTRAINT `user_facility_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_facility_assignments_ibfk_2` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_facility_assignments_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_3` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `vaccination_records`
--
ALTER TABLE `vaccination_records`
  ADD CONSTRAINT `vaccination_records_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vaccination_records_ibfk_2` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccine_catalog` (`vaccine_id`),
  ADD CONSTRAINT `vaccination_records_ibfk_3` FOREIGN KEY (`provider_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `vaccination_records_ibfk_4` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`);

--
-- Constraints for table `vital_signs`
--
ALTER TABLE `vital_signs`
  ADD CONSTRAINT `vital_signs_ibfk_1` FOREIGN KEY (`visit_id`) REFERENCES `clinical_visits` (`visit_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vital_signs_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
