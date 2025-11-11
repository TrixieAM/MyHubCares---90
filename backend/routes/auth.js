import express from "express";
import bcrypt from 'bcryptjs';
import { db } from "../db.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Generate UIC from patient data
const generateUIC = (firstName, lastName, birthDate) => {
  const date = new Date(birthDate);
  const motherLetters = (firstName.substring(0, 2) || 'XX').toUpperCase();
  const fatherLetters = (lastName.substring(0, 2) || 'XX').toUpperCase();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${motherLetters}${fatherLetters}${month}${day}${year}`;
};

// POST /api/register - Patient registration
router.post("/register", async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      firstName, middleName, lastName, suffix,
      birthDate, sex, civilStatus, nationality,
      contactPhone, email, currentCity, currentProvince,
      philhealthNo, branch, username, password
    } = req.body;

    // 1. Validate required fields
    if (!firstName || !lastName || !birthDate || !sex || !civilStatus || 
        !contactPhone || !email || !username || !password || !branch) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // 2. Check if username or email already exists
    const [existingUsers] = await connection.query(
      "SELECT user_id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        success: false, 
        message: "Username or email already exists" 
      });
    }

    // 3. Generate UIC
    const uic = generateUIC(firstName, lastName, birthDate);

    // 4. Check if patient with same UIC exists
    const [existingPatients] = await connection.query(
      "SELECT patient_id FROM patients WHERE uic = ?",
      [uic]
    );

    if (existingPatients.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        success: false, 
        message: "Patient with this name and birthdate already registered" 
      });
    }

    // 5. Validate facility_id exists
    const [facilities] = await connection.query(
      "SELECT facility_id FROM facilities WHERE facility_id = ? AND is_active = TRUE",
      [branch]
    );

    if (facilities.length === 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "Invalid facility/branch selected. Please select a valid branch." 
      });
    }

    const facility_id = facilities[0].facility_id;

    // 6. Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 7. Create user account
    const user_id = uuidv4();
    const full_name = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}${suffix ? ' ' + suffix : ''}`;

    await connection.query(
      `INSERT INTO users 
        (user_id, username, email, password_hash, full_name, role, status, facility_id, phone, created_at) 
       VALUES (?, ?, ?, ?, ?, 'patient', 'active', ?, ?, NOW())`,
      [user_id, username, email, password_hash, full_name, facility_id, contactPhone]
    );

    // 8. Create patient record
    const patient_id = uuidv4();
    const currentAddress = JSON.stringify({
      city: currentCity,
      province: currentProvince
    });

    await connection.query(
      `INSERT INTO patients 
        (patient_id, uic, philhealth_no, first_name, middle_name, last_name, suffix, 
         birth_date, sex, civil_status, nationality, current_city, current_province, 
         current_address, contact_phone, email, facility_id, status, created_at, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?)`,
      [
        patient_id, uic, philhealthNo || null, firstName, middleName || null, 
        lastName, suffix || null, birthDate, sex, civilStatus, nationality || 'Filipino',
        currentCity, currentProvince, currentAddress, contactPhone, email, 
        facility_id, user_id
      ]
    );

    await connection.commit();

    // 9. Generate token
    const token = jwt.sign(
      { user_id, role: 'patient', patient_id }, 
      JWT_SECRET, 
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        uic,
        username,
        token,
        user: {
          user_id,
          username,
          full_name,
          email,
          role: 'patient'
        }
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Registration error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Registration failed", 
      error: error.message 
    });
  } finally {
    connection.release();
  }
});

// POST /api/login (ENHANCED)
router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // 1. Find user
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? AND status = 'active'",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }

    const user = rows[0];

    // 2. Check if role matches (if role is provided in login)
    if (role && user.role !== role) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. This account is registered as ${user.role}` 
      });
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Increment failed login attempts
      await db.query(
        "UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE user_id = ?",
        [user.user_id]
      );
      
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    }

    // 4. Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ 
        success: false, 
        message: "Account is temporarily locked. Please try again later." 
      });
    }

    // 5. Generate session token
    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        role: user.role,
        facility_id: user.facility_id 
      }, 
      JWT_SECRET, 
      { expiresIn: "24h" }
    );

    // 6. Store session
    const session_id = uuidv4();
    const token_hash = await bcrypt.hash(token, 10);
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(
      `INSERT INTO auth_sessions 
        (session_id, user_id, token_hash, expires_at, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        session_id,
        user.user_id,
        token_hash,
        expires_at,
        req.ip,
        req.headers["user-agent"] || 'unknown',
      ]
    );

    // 7. Update last_login and reset failed attempts
    await db.query(
      "UPDATE users SET last_login = NOW(), failed_login_attempts = 0 WHERE user_id = ?", 
      [user.user_id]
    );

    // 8. Get patient data if role is patient
    let patientData = null;
    if (user.role === 'patient') {
      const [patients] = await db.query(
        "SELECT * FROM patients WHERE created_by = ?",
        [user.user_id]
      );
      patientData = patients[0] || null;
    }

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        facility_id: user.facility_id,
        patient: patientData
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/logout
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      // Revoke all active sessions for this user
      await db.query(
        "UPDATE auth_sessions SET is_active = FALSE, revoked_at = NOW() WHERE user_id = ?",
        [req.user.user_id]
      );
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/me - Get current user profile
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT user_id, username, email, full_name, role, facility_id, phone, last_login FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[0];

    // Get patient data if role is patient
    if (user.role === 'patient') {
      const [patients] = await db.query(
        "SELECT * FROM patients WHERE created_by = ?",
        [user.user_id]
      );
      user.patient = patients[0] || null;
    }

    // Get facility data
    if (user.facility_id) {
      const [facilities] = await db.query(
        "SELECT facility_id, facility_name, facility_type, contact_number FROM facilities WHERE facility_id = ?",
        [user.facility_id]
      );
      user.facility = facilities[0] || null;
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
