const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const doctorQ = `
      SELECT d.id, d.name,
        COUNT(b.*) FILTER (WHERE b.status='CONFIRMED') AS confirmed_count,
        COUNT(b.*) FILTER (WHERE b.status='FAILED') AS failed_count
      FROM doctors d
      LEFT JOIN slots s ON s.doctor_id = d.id
      LEFT JOIN bookings b ON b.slot_id = s.id
      GROUP BY d.id, d.name
      ORDER BY confirmed_count DESC
    `;
    const { rows: doctorStats } = await pool.query(doctorQ);

    const dailyQ = `
      SELECT date_trunc('day', created_at)::date AS day,
             COUNT(*) FILTER (WHERE status='CONFIRMED') AS confirmed,
             COUNT(*) FILTER (WHERE status='PENDING') AS pending,
             COUNT(*) FILTER (WHERE status='FAILED') AS failed
      FROM bookings
      WHERE created_at > now() - interval '14 days'
      GROUP BY day
      ORDER BY day;
    `;
    const { rows: dailyStats } = await pool.query(dailyQ);

    res.json({ doctorStats, dailyStats });
  } catch (err) {
    console.error('analytics error', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
