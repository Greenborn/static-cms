const express = require('express');
const router = express.Router();
const { getBreakpoints, putBreakpoint } = require('../controllers/breakpointsController');
const asyncHandler = require('../middleware/errorHandler').asyncHandler;
const { authMiddleware } = require('../middleware/auth');

// Obtener todos los breakpoints
router.get('/', authMiddleware, asyncHandler(getBreakpoints));

// Actualizar un breakpoint por nombre
router.put('/:nombre', authMiddleware, asyncHandler(putBreakpoint));

module.exports = router; 