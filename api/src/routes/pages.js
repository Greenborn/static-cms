const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');
const { 
  createError, 
  validateAndSanitize 
} = require('../middleware/errorHandler');

const router = express.Router();

// Esquema de validación para páginas
const pageSchema = {
  title: {
    type: 'string',
    required: true,
    maxLength: 255
  },
  slug: {
    type: 'string',
    required: true,
    maxLength: 255,
    pattern: /^[a-z0-9-]+$/
  },
  content: {
    type: 'string',
    required: false
  },
  template: {
    type: 'string',
    required: false,
    maxLength: 255
  },
  meta_description: {
    type: 'string',
    required: false,
    maxLength: 500
  },
  meta_keywords: {
    type: 'string',
    required: false,
    maxLength: 500
  },
  status: {
    type: 'string',
    required: false,
    pattern: /^(draft|published|archived)$/
  }
};

// GET /api/pages
// Obtener lista de páginas con paginación y filtros
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const validSortFields = ['title', 'slug', 'status', 'created_at', 'updated_at'];
  const validSortOrders = ['ASC', 'DESC'];

  if (!validSortFields.includes(sortBy)) {
    throw createError(400, 'Campo de ordenamiento inválido');
  }

  if (!validSortOrders.includes(sortOrder.toUpperCase())) {
    throw createError(400, 'Orden de clasificación inválido');
  }

  // Construir consulta con filtros
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (title LIKE ? OR slug LIKE ? OR content LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Obtener total de registros
  const countQuery = `SELECT COUNT(*) as total FROM pages ${whereClause}`;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // Obtener páginas
  const query = `
    SELECT id, title, slug, content, template, meta_description, meta_keywords, 
           status, created_at, updated_at
    FROM pages 
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  const pages = await db.all(query, [...params, parseInt(limit), offset]);

  res.status(200).json({
    pages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/pages/:id
// Obtener una página específica
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const page = await db.get(
    'SELECT * FROM pages WHERE id = ?',
    [id]
  );

  if (!page) {
    throw createError(404, 'Página no encontrada');
  }

  res.status(200).json({ page });
}));

// GET /api/pages/slug/:slug
// Obtener página por slug
router.get('/slug/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const page = await db.get(
    'SELECT * FROM pages WHERE slug = ?',
    [slug]
  );

  if (!page) {
    throw createError(404, 'Página no encontrada');
  }

  res.status(200).json({ page });
}));

// POST /api/pages
// Crear una nueva página
router.post('/', asyncHandler(async (req, res) => {
  const pageData = validateAndSanitize(req.body, pageSchema);

  // Verificar si el slug ya existe
  const existingPage = await db.get(
    'SELECT id FROM pages WHERE slug = ?',
    [pageData.slug]
  );

  if (existingPage) {
    throw createError(409, 'Ya existe una página con este slug');
  }

  // Insertar nueva página
  const result = await db.run(
    `INSERT INTO pages (title, slug, content, template, meta_description, meta_keywords, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      pageData.title,
      pageData.slug,
      pageData.content || null,
      pageData.template || null,
      pageData.meta_description || null,
      pageData.meta_keywords || null,
      pageData.status || 'draft'
    ]
  );

  // Obtener la página creada
  const newPage = await db.get(
    'SELECT * FROM pages WHERE id = ?',
    [result.id]
  );

  res.status(201).json({
    message: 'Página creada exitosamente',
    page: newPage
  });
}));

// PUT /api/pages/:id
// Actualizar una página existente
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pageData = validateAndSanitize(req.body, pageSchema);

  // Verificar si la página existe
  const existingPage = await db.get(
    'SELECT id FROM pages WHERE id = ?',
    [id]
  );

  if (!existingPage) {
    throw createError(404, 'Página no encontrada');
  }

  // Verificar si el slug ya existe en otra página
  if (pageData.slug) {
    const slugExists = await db.get(
      'SELECT id FROM pages WHERE slug = ? AND id != ?',
      [pageData.slug, id]
    );

    if (slugExists) {
      throw createError(409, 'Ya existe otra página con este slug');
    }
  }

  // Actualizar página
  const updateFields = [];
  const updateValues = [];

  Object.keys(pageData).forEach(key => {
    if (pageData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(pageData[key]);
    }
  });

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(id);

  await db.run(
    `UPDATE pages SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  // Obtener la página actualizada
  const updatedPage = await db.get(
    'SELECT * FROM pages WHERE id = ?',
    [id]
  );

  res.status(200).json({
    message: 'Página actualizada exitosamente',
    page: updatedPage
  });
}));

// DELETE /api/pages/:id
// Eliminar una página
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si la página existe
  const existingPage = await db.get(
    'SELECT id FROM pages WHERE id = ?',
    [id]
  );

  if (!existingPage) {
    throw createError(404, 'Página no encontrada');
  }

  // Eliminar página
  await db.run('DELETE FROM pages WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Página eliminada exitosamente'
  });
}));

// PATCH /api/pages/:id/status
// Cambiar el estado de una página
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['draft', 'published', 'archived'].includes(status)) {
    throw createError(400, 'Estado inválido. Debe ser: draft, published, o archived');
  }

  // Verificar si la página existe
  const existingPage = await db.get(
    'SELECT id FROM pages WHERE id = ?',
    [id]
  );

  if (!existingPage) {
    throw createError(404, 'Página no encontrada');
  }

  // Actualizar estado
  await db.run(
    'UPDATE pages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id]
  );

  res.status(200).json({
    message: 'Estado de página actualizado exitosamente',
    status
  });
}));

// GET /api/pages/templates/list
// Obtener lista de plantillas disponibles
router.get('/templates/list', asyncHandler(async (req, res) => {
  const templates = await db.all(
    'SELECT DISTINCT template FROM pages WHERE template IS NOT NULL AND template != ""'
  );

  res.status(200).json({
    templates: templates.map(t => t.template)
  });
}));

// GET /api/pages/stats
// Obtener estadísticas de páginas
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
    FROM pages
  `);

  res.status(200).json({ stats });
}));

module.exports = router; 