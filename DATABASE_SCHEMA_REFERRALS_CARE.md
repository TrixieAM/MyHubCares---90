# Database Schema for Referrals & Care Coordination

This document contains the SQL schema for the referrals, counseling sessions, HTS sessions, and care tasks tables.

## Tables

### 1. referrals

```sql
CREATE TABLE referrals (
    referral_id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    from_facility_id CHAR(36) NOT NULL,
    to_facility_id CHAR(36) NOT NULL,
    referral_reason TEXT NOT NULL,
    urgency ENUM('routine','urgent','emergency') DEFAULT 'routine',
    status ENUM('pending','accepted','in_transit','completed','rejected','cancelled') DEFAULT 'pending',
    clinical_notes TEXT,
    referred_by CHAR(36) NOT NULL,
    referred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    accepted_at DATETIME,
    accepted_by CHAR(36),
    completed_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (from_facility_id) REFERENCES facilities(facility_id),
    FOREIGN KEY (to_facility_id) REFERENCES facilities(facility_id),
    FOREIGN KEY (referred_by) REFERENCES users(user_id),
    FOREIGN KEY (accepted_by) REFERENCES users(user_id),
    INDEX idx_referrals_patient_id (patient_id),
    INDEX idx_referrals_from_facility_id (from_facility_id),
    INDEX idx_referrals_to_facility_id (to_facility_id),
    INDEX idx_referrals_status (status),
    INDEX idx_referrals_referred_at (referred_at)
);
```

### 2. counseling_sessions

```sql
CREATE TABLE counseling_sessions (
    session_id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    counselor_id CHAR(36) NOT NULL,
    facility_id CHAR(36) NOT NULL,
    session_date DATE DEFAULT CURRENT_DATE,
    session_type ENUM('pre_test','post_test','adherence','mental_health','support','other') NOT NULL,
    session_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (counselor_id) REFERENCES users(user_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    INDEX idx_counseling_sessions_patient_id (patient_id),
    INDEX idx_counseling_sessions_counselor_id (counselor_id),
    INDEX idx_counseling_sessions_session_date (session_date)
);
```

### 3. hts_sessions

```sql
CREATE TABLE hts_sessions (
    hts_id CHAR(36) PRIMARY KEY,
    patient_id CHAR(36) NOT NULL,
    tester_id CHAR(36) NOT NULL,
    facility_id CHAR(36) NOT NULL,
    test_date DATE DEFAULT CURRENT_DATE,
    test_result ENUM('positive','negative','indeterminate') NOT NULL,
    test_type VARCHAR(50),
    pre_test_counseling BOOLEAN DEFAULT FALSE,
    post_test_counseling BOOLEAN DEFAULT FALSE,
    linked_to_care BOOLEAN DEFAULT FALSE,
    care_link_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (tester_id) REFERENCES users(user_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id),
    INDEX idx_hts_sessions_patient_id (patient_id),
    INDEX idx_hts_sessions_test_date (test_date),
    INDEX idx_hts_sessions_test_result (test_result)
);
```

### 4. care_tasks

```sql
CREATE TABLE care_tasks (
    task_id CHAR(36) PRIMARY KEY,
    referral_id CHAR(36),
    patient_id CHAR(36) NOT NULL,
    assignee_id CHAR(36) NOT NULL,
    task_type ENUM('follow_up','referral','counseling','appointment','other') NOT NULL,
    task_description TEXT NOT NULL,
    due_date DATE,
    status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    FOREIGN KEY (referral_id) REFERENCES referrals(referral_id) ON DELETE SET NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(user_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_care_tasks_patient_id (patient_id),
    INDEX idx_care_tasks_assignee_id (assignee_id),
    INDEX idx_care_tasks_due_date (due_date),
    INDEX idx_care_tasks_status (status)
);
```

## API Endpoints

### Referrals
- `GET /api/referrals` - Get all referrals (with filters)
- `GET /api/referrals/:id` - Get referral by ID
- `POST /api/referrals` - Create new referral
- `PUT /api/referrals/:id/accept` - Accept referral
- `PUT /api/referrals/:id/reject` - Reject referral
- `PUT /api/referrals/:id/complete` - Complete referral

### Counseling Sessions
- `GET /api/counseling-sessions` - Get all counseling sessions (with filters)
- `GET /api/counseling-sessions/:id` - Get session by ID
- `POST /api/counseling-sessions` - Record counseling session
- `PUT /api/counseling-sessions/:id` - Update counseling session
- `DELETE /api/counseling-sessions/:id` - Delete counseling session

### HTS Sessions
- `GET /api/hts-sessions` - Get all HTS sessions (with filters)
- `GET /api/hts-sessions/:id` - Get session by ID
- `POST /api/hts-sessions` - Conduct HTS session
- `PUT /api/hts-sessions/:id` - Update HTS session
- `DELETE /api/hts-sessions/:id` - Delete HTS session

### Care Tasks
- `GET /api/care-tasks` - Get all care tasks (with filters)
- `GET /api/care-tasks/:id` - Get task by ID
- `POST /api/care-tasks` - Create care task
- `PUT /api/care-tasks/:id` - Update care task
- `PUT /api/care-tasks/:id/status` - Update task status only
- `DELETE /api/care-tasks/:id` - Delete care task

