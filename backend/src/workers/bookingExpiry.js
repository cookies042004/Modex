const pool = require('../db');
const { sendEvent } = require('../sse');

const CHECK_INTERVAL_MS = 15 * 1000;
const PENDING_TIMEOUT_MINUTES = 2;

async function expirePendingBookings() {
  try {
    const q = `
      UPDATE bookings
      SET status = 'FAILED', updated_at = now()
      WHERE status = 'PENDING' AND created_at < now() - interval '${PENDING_TIMEOUT_MINUTES} minutes'
      RETURNING id, slot_id
    `;
    const { rows } = await pool.query(q);
    if (rows.length) {
      for (const r of rows) {
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
          ) bc ON bc.slot_id = s.id WHERE s.id = $1`, [r.slot_id]
        );
        sendEvent({ type: 'slot_update', slot: slotInfo.rows[0] });
      }
      console.log('Expired bookings:', rows.map(r => r.id));
    }
  } catch (err) {
    console.error('Expiry worker error', err);
  }
}

function start() {
  console.log('Booking expiry worker started');
  setInterval(expirePendingBookings, CHECK_INTERVAL_MS);
}

module.exports = { start };
