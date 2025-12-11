const pool = require('../db');
const { sendEvent } = require('../sse');

async function createBooking(req, res) {
  const { slot_id, user_name, user_contact } = req.body;
  if (!slot_id || !user_name) return res.status(400).json({ error: 'slot_id and user_name required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const slotRes = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [slot_id]);
    if (slotRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Slot not found' });
    }
    const slot = slotRes.rows[0];

    const reservedRes = await client.query(
      `SELECT
        SUM(CASE WHEN status='CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_count
       FROM bookings WHERE slot_id = $1`, [slot_id]
    );
    const confirmed = parseInt(reservedRes.rows[0].confirmed_count || 0, 10);
    const pending = parseInt(reservedRes.rows[0].pending_count || 0, 10);
    if (confirmed + pending >= slot.capacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Slot fully booked' });
    }

    const insertRes = await client.query(
      `INSERT INTO bookings (slot_id, user_name, user_contact, status) VALUES ($1,$2,$3,'PENDING') RETURNING *`,
      [slot_id, user_name, user_contact || null]
    );
    const booking = insertRes.rows[0];

    await client.query('COMMIT');

    const slotInfo = await pool.query(
      `SELECT s.*,
        COALESCE(bc.confirmed_count,0) AS confirmed_count,
        COALESCE(bc.pending_count,0) AS pending_count,
        (s.capacity - COALESCE(bc.confirmed_count,0) - COALESCE(bc.pending_count,0)) AS available
      FROM slots s
      LEFT JOIN (
        SELECT slot_id,
          SUM(CASE WHEN status='CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
          SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_count
        FROM bookings GROUP BY slot_id
      ) bc ON bc.slot_id = s.id WHERE s.id = $1`, [slot_id]
    );

    sendEvent({ type: 'slot_update', slot: slotInfo.rows[0] });

    res.status(201).json(booking);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch(e){}
    console.error('createBooking error', err);
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    client.release();
  }
}

async function confirmBooking(req, res) {
  const id = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bRes = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id]);
    if (bRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    const b = bRes.rows[0];
    if (b.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Booking not in PENDING state' });
    }

    const slotRes = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [b.slot_id]);
    const slot = slotRes.rows[0];

    const reservedRes = await client.query(
      `SELECT
        SUM(CASE WHEN status='CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_count
      FROM bookings WHERE slot_id = $1`, [b.slot_id]
    );
    const confirmed = parseInt(reservedRes.rows[0].confirmed_count || 0, 10);
    const pending = parseInt(reservedRes.rows[0].pending_count || 0, 10);

    if (confirmed >= slot.capacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Slot already fully booked' });
    }

    const updateRes = await client.query(
      `UPDATE bookings SET status='CONFIRMED', updated_at = now() WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    const slotInfo = await pool.query(
      `SELECT s.*,
        COALESCE(bc.confirmed_count,0) AS confirmed_count,
        COALESCE(bc.pending_count,0) AS pending_count,
        (s.capacity - COALESCE(bc.confirmed_count,0) - COALESCE(bc.pending_count,0)) AS available
      FROM slots s
      LEFT JOIN (
        SELECT slot_id,
          SUM(CASE WHEN status='CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_count,
          SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending_count
        FROM bookings GROUP BY slot_id
      ) bc ON bc.slot_id = s.id WHERE s.id = $1`, [b.slot_id]
    );

    sendEvent({ type: 'slot_update', slot: slotInfo.rows[0] });

    res.json(updateRes.rows[0]);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch(e){}
    console.error('confirmBooking err', err);
    res.status(500).json({ error: 'Failed to confirm booking' });
  } finally {
    client.release();
  }
}

async function getBooking(req, res) {
  const id = req.params.id;
  try {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getBooking error', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

async function listBookingsForSlot(req, res) {
  const slotId = req.params.slotId;
  try {
    const { rows } = await pool.query('SELECT * FROM bookings WHERE slot_id = $1 ORDER BY created_at DESC', [slotId]);
    res.json(rows);
  } catch (err) {
    console.error('listBookingsForSlot error', err);
    res.status(500).json({ error: 'Failed to list bookings' });
  }
}

module.exports = { createBooking, confirmBooking, getBooking, listBookingsForSlot };
