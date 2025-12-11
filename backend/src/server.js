const express = require('express');
const cors = require('cors');
require('dotenv').config();

const doctorsRouter = require('./routes/doctors');
const slotsRouter = require('./routes/slots');
const bookingsRouter = require('./routes/bookings');
const streamRouter = require('./routes/stream');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/stream', streamRouter);
app.use('/api/admin', adminRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

module.exports = app;
