import express from "express";
import { db } from "../db.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// GET /api/patients - Get all patients (for staff only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'physician', 'nurse', 'case_manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [patients] = await db.query(`
      SELECT p.*, f.facility_name, u.username 
      FROM patients p
      LEFT JOIN facilities f ON p.facility_id = f.facility_id
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, patients });
  } catch (err) {
    console.error("Fetch patients error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/patients/:id - Get patient by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const [patients] = await db.query(
      "SELECT * FROM patients WHERE patient_id = ?",
      [req.params.id]
    );

    if (patients.length === 0) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Check if user has permission to view this patient
    const patient = patients[0];
    if (req.user.role === 'patient' && patient.created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, patient });
  } catch (err) {
    console.error("Fetch patient error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/patients/:id - Update patient
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { 
      contact_phone, email, current_city, current_province, 
      civil_status, guardian_name, guardian_relationship 
    } = req.body;

    const [patients] = await db.query(
      "SELECT * FROM patients WHERE patient_id = ?",
      [req.params.id]
    );

    if (patients.length === 0) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Check permissions
    const patient = patients[0];
    if (req.user.role === 'patient' && patient.created_by !== req.user.user_id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const currentAddress = JSON.stringify({
      city: current_city,
      province: current_province
    });

    await db.query(
      `UPDATE patients SET 
        contact_phone = ?, email = ?, current_city = ?, current_province = ?,
        current_address = ?, civil_status = ?, guardian_name = ?, 
        guardian_relationship = ?, updated_at = NOW()
      WHERE patient_id = ?`,
      [
        contact_phone, email, current_city, current_province,
        currentAddress, civil_status, guardian_name, 
        guardian_relationship, req.params.id
      ]
    );

    res.json({ success: true, message: "Patient updated successfully" });
  } catch (err) {
    console.error("Update patient error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
