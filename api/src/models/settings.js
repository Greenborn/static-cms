// Modelo de configuraciones globales (settings)
// @module models/settings

const db = require('../config/database');

/**
 * Obtiene el valor de una configuración por clave
 * @param {string} key Clave de configuración
 * @returns {Promise<string|null>} Valor de la configuración o null si no existe
 */
async function getSetting(key) {
  const row = await db.get('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

/**
 * Establece o actualiza el valor de una configuración
 * @param {string} key Clave de configuración
 * @param {string} value Valor a guardar
 * @param {string} [description] Descripción opcional
 * @param {string} [category] Categoría o ubicación en el panel
 * @param {boolean} [isTemplateItem] Si es un ítem para el template
 * @param {string} [slug] Slug usado en el template (clave mustache)
 * @returns {Promise<void>}
 */
async function setSetting(key, value, description = null, category = 'General', isTemplateItem = false, slug = null) {
  await db.run(
    `INSERT INTO settings (key, value, description, category, is_template_item, slug)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       description = excluded.description,
       category = excluded.category,
       is_template_item = excluded.is_template_item,
       slug = excluded.slug`,
    [key, value, description, category, isTemplateItem ? 1 : 0, slug]
  );
}

module.exports = {
  getSetting,
  setSetting
}; 