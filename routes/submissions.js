const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../db/connection');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// POST /api/submissions
router.post('/', async (req, res) => {
  try {
const {
      first_name, last_name, email, phone, city, state, country,
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
      .input('country', sql.NVarChar(100), country || null)
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
        first_name, last_name, email, phone, city, state, country,
        donation_type, amount, recurrence, time_commitment,
        volunteer_skills, preferred_days, goods_items,
        goods_description, goods_dropoff, referral_source, notes
      ) VALUES (
        @first_name, @last_name, @email, @phone, @city, @state, @country,
        @donation_type, @amount, @recurrence, @time_commitment,
        @volunteer_skills, @preferred_days, @goods_items,
        @goods_description, @goods_dropoff, @referral_source, @notes
      )`);

// Send thank you email to donor
const donorEmail = {
  to: email,
  from: {
    email: process.env.FROM_EMAIL,
    name: 'Bridging The Gap Foundation'
  },
  subject: 'Thank You for Your Contribution — Bridging The Gap',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0A0F1A; color: #F0EDE6; padding: 40px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #C9A84C; font-size: 28px; margin-bottom: 8px;">Bridging The Gap</h1>
        <p style="color: #8B96A8; font-size: 14px;">Community Foundation</p>
      </div>
      <h2 style="color: #F0EDE6; font-size: 22px;">Thank You, ${first_name}!</h2>
      <p style="color: #8B96A8; line-height: 1.7;">Your contribution has been received and means everything to the communities we serve. Here's a summary of what you submitted:</p>
      <div style="background: #1A2235; border-left: 3px solid #C9A84C; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 8px;"><strong style="color: #C9A84C;">Donation Type:</strong> <span style="text-transform: capitalize;">${donation_type}</span></p>
        ${donation_type === 'money' ? `<p style="margin: 0 0 8px;"><strong style="color: #C9A84C;">Amount:</strong> $${amount} / ${recurrence}</p>` : ''}
        ${donation_type === 'time' ? `<p style="margin: 0 0 8px;"><strong style="color: #C9A84C;">Commitment:</strong> ${time_commitment}</p>` : ''}
        ${donation_type === 'goods' ? `<p style="margin: 0 0 8px;"><strong style="color: #C9A84C;">Items:</strong> ${goods_items}</p>` : ''}
      </div>
      <p style="color: #8B96A8; line-height: 1.7;">Our team will be in touch within 24 hours to coordinate next steps. You are officially part of the bridge.</p>
      <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #1A2235;">
        <p style="color: #8B96A8; font-size: 13px;">Bridging The Gap Foundation | Mableton, Georgia</p>
        <p style="color: #8B96A8; font-size: 13px;">501(c)(3) Nonprofit — Tax ID pending</p>
        <a href="https://bridgingthegapusa.org" style="color: #C9A84C; font-size: 13px;">bridgingthegapusa.org</a>
      </div>
    </div>
  `
};

// Send notification email to you
const notifyEmail = {
  to: process.env.NOTIFY_EMAIL,
  from: {
    email: process.env.FROM_EMAIL,
    name: 'Bridging The Gap Foundation'
  },
  subject: `New ${donation_type} Donation — ${first_name} ${last_name}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
      <h2 style="color: #0A0F1A;">New Donation Received</h2>
      <p><strong>Name:</strong> ${first_name} ${last_name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || '—'}</p>
      <p><strong>Location:</strong> ${city || '—'}, ${state || '—'}</p>
      <p><strong>Type:</strong> ${donation_type}</p>
      ${donation_type === 'money' ? `<p><strong>Amount:</strong> $${amount} / ${recurrence}</p>` : ''}
      ${donation_type === 'time' ? `<p><strong>Commitment:</strong> ${time_commitment}<br><strong>Skills:</strong> ${volunteer_skills || '—'}</p>` : ''}
      ${donation_type === 'goods' ? `<p><strong>Items:</strong> ${goods_items}<br><strong>Description:</strong> ${goods_description || '—'}</p>` : ''}
      <p><strong>Referral:</strong> ${referral_source || '—'}</p>
      <p><strong>Notes:</strong> ${notes || '—'}</p>
    </div>
  `
};

// Send both emails
try {
  await sgMail.send(donorEmail);
  await sgMail.send(notifyEmail);
  console.log('Emails sent successfully');
} catch (emailErr) {
  console.error('Email error:', emailErr.message);
}

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