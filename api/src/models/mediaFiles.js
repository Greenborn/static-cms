const db = require('../config/database');

/**
 * Modelo para archivos multimedia
 */
const MediaFiles = {
  // Listar archivos, opcionalmente filtrados por categoría
  async getAll({ categoryId } = {}) {
    let query = 'SELECT * FROM media_files';
    const params = [];
    if (categoryId) {
      query += ' WHERE category_id = ?';
      params.push(categoryId);
    }
    query += ' ORDER BY created_at DESC';
    return await db.all(query, params);
  },

  // Obtener archivo por ID
  async getById(id) {
    return await db.get('SELECT * FROM media_files WHERE id = ?', [id]);
  },

  // Crear nuevo archivo multimedia
  async create({ filename, original_name, mimetype, size, url, category_id }) {
    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO media_files (filename, original_name, mimetype, size, url, category_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [filename, original_name, mimetype, size, url, category_id, now, now]
    );
    return { id: result.lastID, filename, original_name, mimetype, size, url, category_id, created_at: now, updated_at: now };
  },

  // Actualizar categoría de un archivo
  async updateCategory(id, category_id) {
    const now = new Date().toISOString();
    return await db.run(
      'UPDATE media_files SET category_id = ?, updated_at = ? WHERE id = ?',
      [category_id, now, id]
    );
  },

  // Eliminar archivo
  async remove(id) {
    return await db.run('DELETE FROM media_files WHERE id = ?', [id]);
  }
};

module.exports = MediaFiles; 