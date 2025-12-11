const express = require('express');
const router = express.Router();
const { createDoctor, listDoctors } = require('../controllers/doctorController');

router.post('/', createDoctor);
router.get('/', listDoctors);

module.exports = router;