import express from "express";
import { db } from "../db.js";

const router = express.Router();

// GET /api/facilities - Get all active facilities
router.get("/", async (req, res) => {
  try {
    const [facilities] = await db.query(
      "SELECT * FROM facilities WHERE is_active = TRUE ORDER BY facility_name"
    );

    res.json({ success: true, facilities });
  } catch (err) {
    console.error("Fetch facilities error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/facilities/:id - Get facility by ID
router.get("/:id", async (req, res) => {
  try {
    const [facilities] = await db.query(
      "SELECT * FROM facilities WHERE facility_id = ?",
      [req.params.id]
    );

    if (facilities.length === 0) {
      return res.status(404).json({ success: false, message: "Facility not found" });
    }

    res.json({ success: true, facility: facilities[0] });
  } catch (err) {
    console.error("Fetch facility error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;