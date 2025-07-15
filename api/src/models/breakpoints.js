// Modelo de breakpoints para acceso a la base de datos
// @module models/breakpoints

const db = require('../config/database');

/**
 * Obtiene todos los breakpoints
 * @returns {Promise<Array>} Lista de breakpoints
 */
async function getAllBreakpoints() {
  return db.all('SELECT * FROM breakpoints ORDER BY valor_px ASC');
}

/**
 * Actualiza el valor de un breakpoint por nombre
 * @param {string} nombre Nombre del breakpoint
 * @param {number} valor_px Nuevo valor en px
 * @returns {Promise<object>} Resultado de la actualización
 */
async function updateBreakpoint(nombre, valor_px) {
  return db.run('UPDATE breakpoints SET valor_px = ? WHERE nombre = ?', [valor_px, nombre]);
}

/**
 * Obtiene los breakpoints ordenados por valor_px ascendente
 * @returns {Promise<Array>} Lista de breakpoints
 */
async function getBreakpointsOrdered() {
  return db.all('SELECT * FROM breakpoints ORDER BY valor_px ASC');
}

module.exports = {
  getAllBreakpoints,
  updateBreakpoint,
  getBreakpointsOrdered
}; 