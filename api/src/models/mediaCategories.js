const db = require('../config/database');

/**
 * Modelo para categorías de archivos multimedia
 */
const MediaCategories = {
  // Obtener todas las categorías
  async getAll() {
    return await db.all('SELECT * FROM media_categories ORDER BY name ASC');
  },

  // Obtener una categoría por ID
  async getById(id) {
    return await db.get('SELECT * FROM media_categories WHERE id = ?', [id]);
  },

  // Crear una nueva categoría
  async create(name) {
    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO media_categories (name, created_at, updated_at) VALUES (?, ?, ?)',
      [name, now, now]
    );
    return { id: result.lastID, name, created_at: now, updated_at: now };
  },

  // Eliminar una categoría
  async remove(id) {
    return await db.run('DELETE FROM media_categories WHERE id = ?', [id]);
  },

  // Actualizar nombre de categoría
  async update(id, name) {
    const now = new Date().toISOString();
    return await db.run(
      'UPDATE media_categories SET name = ?, updated_at = ? WHERE id = ?',
      [name, now, id]
    );
  }
};

module.exports = MediaCategories; 