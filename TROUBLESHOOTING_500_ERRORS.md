# Troubleshooting 500 Errors

## Issue
The API endpoints are returning 500 (Internal Server Error) for:
- `/api/referrals`
- `/api/care-tasks`
- `/api/counseling-sessions`
- `/api/hts-sessions`

## Root Cause
The database tables may not exist or may be missing required columns.

## Solution

### Step 1: Verify Tables Exist
Run this SQL query in your MySQL database to check if the tables exist:

```sql
SHOW TABLES LIKE 'referrals';
SHOW TABLES LIKE 'care_tasks';
SHOW TABLES LIKE 'counseling_sessions';
SHOW TABLES LIKE 'hts_sessions';
```

### Step 2: Create Missing Tables
If the tables don't exist, run the migration file:

```bash
# Option 1: Run the migration file directly
mysql -u your_username -p your_database_name < backend/migrations/create_referrals_care_tables.sql

# Option 2: Import from myhub.sql (if you have it)
mysql -u your_username -p your_database_name < myhub.sql
```

### Step 3: Add Missing Column (if needed)
If `counseling_sessions` table exists but is missing `follow_up_reason` column:

```sql
ALTER TABLE counseling_sessions ADD COLUMN follow_up_reason TEXT;
```

### Step 4: Check Backend Logs
After making the changes, check your backend console for detailed error messages. The routes now include better error logging that will show:
- Error message
- Error stack trace
- Specific SQL errors

### Step 5: Verify Database Connection
Make sure your backend can connect to the database. Check `backend/db.js` configuration.

## Fixed Issues

1. ✅ **avgDuration error in Counseling.jsx** - Fixed by replacing with facilities count
2. ✅ **Better error logging** - All routes now log detailed error information
3. ✅ **Graceful handling of missing columns** - Counseling sessions route handles missing `follow_up_reason` column

## Next Steps

1. Run the migration SQL file to create the tables
2. Restart your backend server
3. Check the backend console for any remaining errors
4. Test the API endpoints again

