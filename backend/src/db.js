const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres123@localhost:5432/doctor_booking';
const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
