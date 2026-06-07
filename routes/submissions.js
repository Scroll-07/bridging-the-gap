const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/connection');

// POST /api/submissions
router.post('/', async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, city, state,
      donation_type, amount, recurrence, time_commitment,
      volunteer_skills, preferred_days, goods_items,
      goods_description, goods_dropoff, referral_source, notes
    } = req.body;

    if (!first_name || !last_name || !email || !donation_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pool = await getPool();
    await pool.request()
      .input('first_name', sql.NVarChar(100), first_name)
      .input('last_name', sql.NVarChar(100), last_name)
      .input('email', sql.NVarChar(255), email)
      .input('phone', sql.NVarChar(30), phone || null)
      .input('city', sql.NVarChar(100), city || null)
      .input('state', sql.NVarChar(50), state || null)
      .input('donation_type', sql.NVarChar(20), donation_type)
      .input('amount', sql.Decimal(10, 2), amount || null)
      .input('recurrence', sql.NVarChar(20), recurrence || null)
      .input('time_commitment', sql.NVarChar(100), time_commitment || null)
      .input('volunteer_skills', sql.NVarChar(500), volunteer_skills || null)
      .input('preferred_days', sql.NVarChar(50), preferred_days || null)
      .input('goods_items', sql.NVarChar(500), goods_items || null)
      .input('goods_description', sql.NVarChar(1000), goods_description || null)
      .input('goods_dropoff', sql.NVarChar(100), goods_dropoff || null)
      .input('referral_source', sql.NVarChar(100), referral_source || null)
      .input('notes', sql.NVarChar(1000), notes || null)
      .query(`INSERT INTO donors (
        first_name, last_name, email, phone, city, state,
        donation_type, amount, recurrence, time_commitment,
        volunteer_skills, preferred_days, goods_items,
        goods_description, goods_dropoff, referral_source, notes
      ) VALUES (
        @first_name, @last_name, @email, @phone, @city, @state,
        @donation_type, @amount, @recurrence, @time_commitment,
        @volunteer_skills, @preferred_days, @goods_items,
        @goods_description, @goods_dropoff, @referral_source, @notes
      )`);

    res.json({ success: true, message: 'Submission saved successfully' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// GET /api/submissions
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT TOP 500 * FROM donors ORDER BY submitted_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;