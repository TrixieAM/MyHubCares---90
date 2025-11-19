import express from "express";
import { db } from "../db.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// GET /api/faqs - Get all published FAQs
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = "SELECT * FROM faqs WHERE is_published = TRUE";
    const params = [];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (question LIKE ? OR answer LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += " ORDER BY display_order ASC, created_at DESC";

    const [faqs] = await db.query(query, params);

    res.json({
      success: true,
      faqs: faqs || [],
    });
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET /api/faqs/:id - Get single FAQ
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [faqs] = await db.query(
      "SELECT * FROM faqs WHERE faq_id = ? AND is_published = TRUE",
      [id]
    );

    if (faqs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    // Increment view count
    await db.query("UPDATE faqs SET view_count = view_count + 1 WHERE faq_id = ?", [id]);

    res.json({
      success: true,
      faq: faqs[0],
    });
  } catch (err) {
    console.error("Error fetching FAQ:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;


