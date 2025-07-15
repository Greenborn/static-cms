// Controlador para breakpoints
// @module controllers/breakpointsController

const { getAllBreakpoints, updateBreakpoint } = require('../models/breakpoints');

/**
 * Obtener todos los breakpoints
 * @param {*} req 
 * @param {*} res 
 */
async function getBreakpoints(req, res) {
  try {
    const breakpoints = await getAllBreakpoints();
    res.json({ success: true, breakpoints });
  } catch (error) {
    console.error('Error obteniendo breakpoints:', error);
    res.status(500).json({ success: false, message: 'Error obteniendo breakpoints', error: error.message });
  }
}

/**
 * Actualizar un breakpoint
 * @param {*} req 
 * @param {*} res 
 */
async function putBreakpoint(req, res) {
  try {
    const { nombre } = req.params;
    const { valor_px } = req.body;
    if (typeof valor_px !== 'number' || valor_px < 0) {
      return res.status(400).json({ success: false, message: 'El valor debe ser un número positivo' });
    }
    const result = await updateBreakpoint(nombre, valor_px);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Breakpoint no encontrado' });
    }
    res.json({ success: true, message: 'Breakpoint actualizado' });
  } catch (error) {
    console.error('Error actualizando breakpoint:', error);
    res.status(500).json({ success: false, message: 'Error actualizando breakpoint', error: error.message });
  }
}

module.exports = {
  getBreakpoints,
  putBreakpoint
}; 