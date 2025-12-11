const pool = require('../db');

async function createDoctor(req, res) {
  const { name, speciality } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const q = 'INSERT INTO doctors(name, speciality) VALUES($1,$2) RETURNING *';
    const { rows } = await pool.query(q, [name, speciality || null]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
}

async function listDoctors(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM doctors ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list doctors' });
  }
}

module.exports = { createDoctor, listDoctors };
