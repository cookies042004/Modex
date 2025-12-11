const express = require('express');
const router = express.Router();
const { addClient } = require('../sse');

router.get('/', (req, res) => {
  addClient(res);
});

module.exports = router;
