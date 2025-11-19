import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// ==================== FACILITIES/BRANCHES ====================

// Get all facilities with region info
router.get('/', async (req, res) => {
  try {
    const { search, facility_type, region_id, is_active } = req.query;

    let query = `
      SELECT 
        f.*,
        r.region_name,
        r.region_code
      FROM facilities f
      LEFT JOIN regions r ON f.region_id = r.region_id
      WHERE 1=1
    `;

    const params = [];

    if (is_active !== undefined) {
      query += ' AND f.is_active = ?';
      // Convert string "1" or "0" to number, or keep as is if already number
      const isActiveValue = is_active === '1' || is_active === 1 ? 1 : (is_active === '0' || is_active === 0 ? 0 : is_active);
      params.push(isActiveValue);
      console.log('Filtering facilities by is_active:', isActiveValue);
    }

    if (facility_type) {
      query += ' AND f.facility_type = ?';
      params.push(facility_type);
    }

    if (region_id) {
      query += ' AND f.region_id = ?';
      params.push(region_id);
    }

    if (search) {
      query +=
        ' AND (f.facility_name LIKE ? OR f.contact_person LIKE ? OR f.contact_number LIKE ? OR f.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY f.created_at DESC';

    const [facilities] = await db.query(query, params);
    
    console.log(`Found ${facilities.length} facilities matching criteria`);

    // Parse JSON address field for each facility
    const facilitiesWithParsedAddress = facilities.map((facility) => ({
      ...facility,
      address:
        typeof facility.address === 'string'
          ? JSON.parse(facility.address)
          : facility.address,
    }));

    console.log('Returning facilities:', facilitiesWithParsedAddress.length);
    res.json({ success: true, data: facilitiesWithParsedAddress });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch facilities' });
  }
});

// Get single facility
router.get('/:id', async (req, res) => {
  try {
    const [facilities] = await db.query(
      `SELECT 
        f.*,
        r.region_name,
        r.region_code
      FROM facilities f
      LEFT JOIN regions r ON f.region_id = r.region_id
      WHERE f.facility_id = ?`,
      [req.params.id]
    );

    if (facilities.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Facility not found' });
    }

    const facility = {
      ...facilities[0],
      address:
        typeof facilities[0].address === 'string'
          ? JSON.parse(facilities[0].address)
          : facilities[0].address,
    };

    res.json({ success: true, data: facility });
  } catch (error) {
    console.error('Error fetching facility:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch facility' });
  }
});

// Create facility
router.post('/', async (req, res) => {
  try {
    const {
      facility_name,
      facility_type,
      address,
      region_id,
      contact_person,
      contact_number,
      email,
      is_active = 1,
    } = req.body;

    // Validation
    if (!facility_name || !facility_type || !address) {
      return res.status(400).json({
        success: false,
        message: 'Facility name, type, and address are required',
      });
    }

    // Validate facility_type enum
    const validTypes = ['main', 'branch', 'satellite', 'external'];
    if (!validTypes.includes(facility_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility type',
      });
    }

    // Generate UUID for facility_id
    const facility_id = crypto.randomUUID();

    // Convert address object to JSON string
    const addressJson = JSON.stringify(address);

    const [result] = await db.query(
      `INSERT INTO facilities 
      (facility_id, facility_name, facility_type, address, region_id, 
       contact_person, contact_number, email, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        facility_id,
        facility_name,
        facility_type,
        addressJson,
        region_id,
        contact_person,
        contact_number,
        email,
        is_active,
      ]
    );

    const [newFacility] = await db.query(
      `SELECT 
        f.*,
        r.region_name,
        r.region_code
      FROM facilities f
      LEFT JOIN regions r ON f.region_id = r.region_id
      WHERE f.facility_id = ?`,
      [facility_id]
    );

    const facilityWithParsedAddress = {
      ...newFacility[0],
      address:
        typeof newFacility[0].address === 'string'
          ? JSON.parse(newFacility[0].address)
          : newFacility[0].address,
    };

    res.status(201).json({
      success: true,
      data: facilityWithParsedAddress,
      message: 'Facility created successfully',
    });
  } catch (error) {
    console.error('Error creating facility:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to create facility' });
  }
});

// Update facility
router.put('/:id', async (req, res) => {
  try {
    const {
      facility_name,
      facility_type,
      address,
      region_id,
      contact_person,
      contact_number,
      email,
      is_active,
    } = req.body;
    const { id } = req.params;

    // Validation
    if (!facility_name || !facility_type || !address) {
      return res.status(400).json({
        success: false,
        message: 'Facility name, type, and address are required',
      });
    }

    // Validate facility_type enum
    const validTypes = ['main', 'branch', 'satellite', 'external'];
    if (!validTypes.includes(facility_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid facility type',
      });
    }

    // Convert address object to JSON string
    const addressJson = JSON.stringify(address);

    const [result] = await db.query(
      `UPDATE facilities 
      SET facility_name = ?, 
          facility_type = ?, 
          address = ?, 
          region_id = ?, 
          contact_person = ?, 
          contact_number = ?, 
          email = ?, 
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE facility_id = ?`,
      [
        facility_name,
        facility_type,
        addressJson,
        region_id,
        contact_person,
        contact_number,
        email,
        is_active,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Facility not found' });
    }

    const [updatedFacility] = await db.query(
      `SELECT 
        f.*,
        r.region_name,
        r.region_code
      FROM facilities f
      LEFT JOIN regions r ON f.region_id = r.region_id
      WHERE f.facility_id = ?`,
      [id]
    );

    const facilityWithParsedAddress = {
      ...updatedFacility[0],
      address:
        typeof updatedFacility[0].address === 'string'
          ? JSON.parse(updatedFacility[0].address)
          : updatedFacility[0].address,
    };

    res.json({
      success: true,
      data: facilityWithParsedAddress,
      message: 'Facility updated successfully',
    });
  } catch (error) {
    console.error('Error updating facility:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to update facility' });
  }
});

// Delete facility (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE facilities SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE facility_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Facility not found' });
    }

    res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete facility' });
  }
});

// Delete facility (hard delete)
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM facilities WHERE facility_id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Facility not found' });
    }

    res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to delete facility' });
  }
});

// Get facilities by region
router.get('/by-region/:regionId', async (req, res) => {
  try {
    const [facilities] = await db.query(
      `SELECT 
        f.*,
        r.region_name,
        r.region_code
      FROM facilities f
      LEFT JOIN regions r ON f.region_id = r.region_id
      WHERE f.region_id = ? AND f.is_active = 1
      ORDER BY f.facility_name`,
      [req.params.regionId]
    );

    const facilitiesWithParsedAddress = facilities.map((facility) => ({
      ...facility,
      address:
        typeof facility.address === 'string'
          ? JSON.parse(facility.address)
          : facility.address,
    }));

    res.json({ success: true, data: facilitiesWithParsedAddress });
  } catch (error) {
    console.error('Error fetching facilities by region:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch facilities' });
  }
});

// Get facility statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalCount] = await db.query(
      'SELECT COUNT(*) as total FROM facilities WHERE is_active = 1'
    );

    const [byType] = await db.query(
      'SELECT facility_type, COUNT(*) as count FROM facilities WHERE is_active = 1 GROUP BY facility_type'
    );

    const [byRegion] = await db.query(
      `SELECT 
        r.region_name,
        r.region_code,
        COUNT(f.facility_id) as count
      FROM regions r
      LEFT JOIN facilities f ON r.region_id = f.region_id AND f.is_active = 1
      WHERE r.is_active = 1
      GROUP BY r.region_id
      ORDER BY count DESC`
    );

    res.json({
      success: true,
      data: {
        total: totalCount[0].total,
        byType: byType,
        byRegion: byRegion,
      },
    });
  } catch (error) {
    console.error('Error fetching facility statistics:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch statistics' });
  }
});

export default router;
