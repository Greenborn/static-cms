const express = require('express');
const router = express.Router();

/**
 * @route GET /api/settings
 * @desc Devuelve configuraciones globales para el panel admin
 * @access Público
 */
router.get('/', (req, res) => {
  res.json({
    entorno: process.env.ENTORNO || 'DEV'
  });
});

module.exports = router; 