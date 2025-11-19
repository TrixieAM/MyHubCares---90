-- Migration: Create FAQs table
-- Description: Creates the faqs table for storing frequently asked questions
-- Date: 2025-01-XX

CREATE TABLE IF NOT EXISTS `faqs` (
  `faq_id` char(36) NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `display_order` int(11) DEFAULT 0,
  `view_count` int(11) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`faq_id`),
  KEY `idx_faqs_category` (`category`),
  KEY `idx_faqs_is_published` (`is_published`),
  KEY `idx_faqs_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert sample FAQs
INSERT INTO `faqs` (`faq_id`, `question`, `answer`, `category`, `display_order`, `is_published`) VALUES
(UUID(), 'What is MyHubCares?', 'MyHubCares is a comprehensive healthcare management system designed to provide quality healthcare services. Our mission is "It\'s my hub, and it\'s yours" - we are your partner in sexual health and wellness.', 'general', 1, 1),
(UUID(), 'How do I register as a patient?', 'You can register as a patient by clicking on the "Register" option on the login page. You will need to provide your personal information, contact details, and create a username and password.', 'general', 2, 1),
(UUID(), 'How do I book an appointment?', 'To book an appointment, navigate to the "Appointments" section (or "My Appointments" if you are a patient), select your preferred date and time, and confirm your booking. You will receive a confirmation notification.', 'general', 3, 1),
(UUID(), 'How do I view my lab results?', 'Lab results can be viewed in the "Lab Test" section. Once your lab results are available, they will appear in your dashboard. You can also access them from your patient profile.', 'treatment', 1, 1),
(UUID(), 'How do I manage my medications?', 'You can view your prescriptions in the "Prescriptions" section. Medication reminders can be set up in the "Medication Reminder" section to help you stay on track with your treatment.', 'treatment', 2, 1),
(UUID(), 'What should I do if I miss a medication dose?', 'If you miss a medication dose, you should record it in the Medication Adherence section. It is important to inform your healthcare provider about missed doses during your next visit.', 'treatment', 3, 1),
(UUID(), 'How do I change my password?', 'You can change your password by going to Settings > Change Password. You will need to enter your current password and create a new password that meets the security requirements.', 'general', 4, 1),
(UUID(), 'How do I update my profile information?', 'You can update your profile information by navigating to the Profile section. Click on "Edit Profile" to modify your personal details, contact information, and other relevant information.', 'general', 5, 1),
(UUID(), 'What is UIC?', 'UIC stands for Unique Identifier Code. It is a unique code generated for each patient based on specific criteria to ensure proper patient identification and record management.', 'general', 6, 1),
(UUID(), 'How do I contact support?', 'You can contact support through your facility\'s contact information, or visit our website at www.myhubcares.com. For urgent matters, please contact your healthcare provider directly.', 'general', 7, 1);


