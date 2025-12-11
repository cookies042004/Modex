const pool = require('../db');

function timesOverlap(startA, endA, startB, endB) {
  return (startA < endB) && (endA > startB);
}

async function createSlot(req, res) {
  const { doctor_id, start_time, end_time, capacity = 1 } = req.body;
  if (!doctor_id || !start_time || !end_time) {
    return res.status(400).json({ error: 'doctor_id, start_time, end_time required' });
  }

  try {
    const overlapQ = `
      SELECT 1 FROM slots
      WHERE doctor_id = $1
        AND NOT (end_time <= $2 OR start_time >= $3)
      LIMIT 1
    `;
    const overlapRes = await pool.query(overlapQ, [doctor_id, start_time, end_time]);
    if (overlapRes.rowCount > 0) {
      return res.status(409).json({ error: 'Overlapping slot exists for this doctor' });
    }

    const q = `
      INSERT INTO slots (doctor_id, start_time, end_time, capacity)
      VALUES ($1,$2,$3,$4) RETURNING *
    `;
    const { rows } = await pool.query(q, [doctor_id, start_time, end_time, capacity]);
    res.json(rows[0]);
  } catch (error) {
    console.error('createSlot error', error);
    res.status(500).json({ error: 'Failed to create slot' });
  }
}

async function listSlots(req, res) {
  try {
    // Return slots with computed confirmed, pending and available counts
    const q = `
      SELECT
        s.*,
        d.name AS doctor_name,
        COALESCE(b_counts.confirmed_count, 0) AS confirmed_count,
        COALESCE(b_counts.pending_count, 0) AS pending_count,
        (s.capacity - COALESCE(b_counts.confirmed_count, 0) - COALESCE(b_counts.pending_count, 0)) AS available
      FROM slots s
      JOIN doctors d ON s.doctor_id = d.id
      LEFT JOIN (
        SELECT slot_id,
               SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
               SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count
        FROM bookings
        GROUP BY slot_id
      ) b_counts ON b_counts.slot_id = s.id
      ORDER BY s.start_time;
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    console.error('listSlots error', err);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
}

module.exports = { createSlot, listSlots };
