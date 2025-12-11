const express = require('express');
const router = express.Router();
const { createSlot, listSlots } = require('../controllers/slotController');

router.post('/', createSlot);
router.get('/', listSlots);

module.exports = router;