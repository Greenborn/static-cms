const express = require('express');
const db = require('../config/database');
const { asyncHandler } = require('../middleware/auth');
const { 
  createError, 
  validateAndSanitize 
} = require('../middleware/errorHandler');

const router = express.Router();

// Esquema de validación para vistas
const viewSchema = {
  name: {
    type: 'string',
    required: true,
    maxLength: 100
  },
  template: {
    type: 'string',
    required: true
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 500
  }
};

// Validación básica de template Mustache
const validateMustacheTemplate = (template) => {
  if (!template || typeof template !== 'string') {
    throw new Error('El template debe ser una cadena de texto');
  }

  // Verificar sintaxis básica de Mustache
  const mustachePatterns = [
    /\{\{[^}]+\}\}/g,  // Variables simples {{variable}}
    /\{\{#[^}]+\}\}/g, // Secciones {{#seccion}}
    /\{\{\/[^}]+\}\}/g, // Cierre de secciones {{/seccion}}
    /\{\{\^[^}]+\}\}/g, // Secciones inversas {{^seccion}}
    /\{\{>[^}]+\}\}/g,  // Partials {{>partial}}
  ];

  // Verificar que las llaves estén balanceadas
  const openBraces = (template.match(/\{\{/g) || []).length;
  const closeBraces = (template.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    throw new Error('Las llaves de Mustache no están balanceadas');
  }

  return true;
};

// GET /api/views
// Obtener lista de vistas con paginación y filtros
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const validSortFields = ['name', 'created_at', 'updated_at'];
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

  if (search) {
    whereClause += ' AND (name LIKE ? OR description LIKE ? OR template LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Obtener total de registros
  const countQuery = `SELECT COUNT(*) as total FROM views ${whereClause}`;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // Obtener vistas
  const query = `
    SELECT id, name, template, description, created_at, updated_at
    FROM views 
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  const views = await db.all(query, [...params, parseInt(limit), offset]);

  res.status(200).json({
    views,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/views/:id
// Obtener una vista específica
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const view = await db.get(
    'SELECT * FROM views WHERE id = ?',
    [id]
  );

  if (!view) {
    throw createError(404, 'Vista no encontrada');
  }

  res.status(200).json({ view });
}));

// GET /api/views/name/:name
// Obtener vista por nombre
router.get('/name/:name', asyncHandler(async (req, res) => {
  const { name } = req.params;

  const view = await db.get(
    'SELECT * FROM views WHERE name = ?',
    [name]
  );

  if (!view) {
    throw createError(404, 'Vista no encontrada');
  }

  res.status(200).json({ view });
}));

// POST /api/views
// Crear una nueva vista
router.post('/', asyncHandler(async (req, res) => {
  const viewData = validateAndSanitize(req.body, viewSchema);

  // Validar template Mustache
  validateMustacheTemplate(viewData.template);

  // Verificar si el nombre ya existe
  const existingView = await db.get(
    'SELECT id FROM views WHERE name = ?',
    [viewData.name]
  );

  if (existingView) {
    throw createError(409, 'Ya existe una vista con este nombre');
  }

  // Insertar nueva vista
  const result = await db.run(
    'INSERT INTO views (name, template, description) VALUES (?, ?, ?)',
    [
      viewData.name,
      viewData.template,
      viewData.description || null
    ]
  );

  // Obtener la vista creada
  const newView = await db.get(
    'SELECT * FROM views WHERE id = ?',
    [result.id]
  );

  res.status(201).json({
    message: 'Vista creada exitosamente',
    view: newView
  });
}));

// PUT /api/views/:id
// Actualizar una vista existente
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const viewData = validateAndSanitize(req.body, viewSchema);

  // Validar template Mustache si se proporciona
  if (viewData.template) {
    validateMustacheTemplate(viewData.template);
  }

  // Verificar si la vista existe
  const existingView = await db.get(
    'SELECT id FROM views WHERE id = ?',
    [id]
  );

  if (!existingView) {
    throw createError(404, 'Vista no encontrada');
  }

  // Verificar si el nombre ya existe en otra vista
  if (viewData.name) {
    const nameExists = await db.get(
      'SELECT id FROM views WHERE name = ? AND id != ?',
      [viewData.name, id]
    );

    if (nameExists) {
      throw createError(409, 'Ya existe otra vista con este nombre');
    }
  }

  // Actualizar vista
  const updateFields = [];
  const updateValues = [];

  Object.keys(viewData).forEach(key => {
    if (viewData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(viewData[key]);
    }
  });

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(id);

  await db.run(
    `UPDATE views SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  // Obtener la vista actualizada
  const updatedView = await db.get(
    'SELECT * FROM views WHERE id = ?',
    [id]
  );

  res.status(200).json({
    message: 'Vista actualizada exitosamente',
    view: updatedView
  });
}));

// DELETE /api/views/:id
// Eliminar una vista
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si la vista existe
  const existingView = await db.get(
    'SELECT id FROM views WHERE id = ?',
    [id]
  );

  if (!existingView) {
    throw createError(404, 'Vista no encontrada');
  }

  // Eliminar vista
  await db.run('DELETE FROM views WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Vista eliminada exitosamente'
  });
}));

// POST /api/views/:id/preview
// Previsualizar una vista con datos de ejemplo
router.post('/:id/preview', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data = {} } = req.body;

  // Obtener la vista
  const view = await db.get(
    'SELECT * FROM views WHERE id = ?',
    [id]
  );

  if (!view) {
    throw createError(404, 'Vista no encontrada');
  }

  try {
    // Renderizar template con datos de ejemplo
    const Mustache = require('mustache');
    const rendered = Mustache.render(view.template, data);

    res.status(200).json({
      preview: rendered,
      template: view.template,
      data: data
    });

  } catch (error) {
    throw createError(500, `Error al renderizar template: ${error.message}`);
  }
}));

// POST /api/views/validate
// Validar sintaxis de un template Mustache
router.post('/validate', asyncHandler(async (req, res) => {
  const { template } = req.body;

  if (!template) {
    throw createError(400, 'Template requerido');
  }

  try {
    validateMustacheTemplate(template);

    // Intentar renderizar con datos vacíos para verificar sintaxis
    const Mustache = require('mustache');
    Mustache.render(template, {});

    res.status(200).json({
      valid: true,
      message: 'Template válido'
    });

  } catch (error) {
    res.status(400).json({
      valid: false,
      message: error.message
    });
  }
}));

// GET /api/views/:id/variables
// Extraer variables utilizadas en el template
router.get('/:id/variables', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const view = await db.get(
    'SELECT template FROM views WHERE id = ?',
    [id]
  );

  if (!view) {
    throw createError(404, 'Vista no encontrada');
  }

  // Extraer variables del template
  const variablePattern = /\{\{([^#\/^>][^}]*)\}\}/g;
  const variables = [];
  let match;

  while ((match = variablePattern.exec(view.template)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }

  res.status(200).json({
    variables: variables.sort()
  });
}));

// GET /api/views/stats
// Obtener estadísticas de vistas
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_views,
      COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as with_description
    FROM views
  `);

  res.status(200).json({ stats });
}));

// POST /api/views/import
// Importar vista desde referencia de sitio existente
router.post('/import', asyncHandler(async (req, res) => {
  const { name, html_content, css_files = [], js_files = [] } = req.body;

  if (!name || !html_content) {
    throw createError(400, 'Nombre y contenido HTML son requeridos');
  }

  // Verificar si el nombre ya existe
  const existingView = await db.get(
    'SELECT id FROM views WHERE name = ?',
    [name]
  );

  if (existingView) {
    throw createError(409, 'Ya existe una vista con este nombre');
  }

  // Crear la vista con el HTML importado
  const result = await db.run(
    'INSERT INTO views (name, template, description) VALUES (?, ?, ?)',
    [
      name,
      html_content,
      `Vista importada desde sitio existente. CSS: ${css_files.join(', ')}. JS: ${js_files.join(', ')}`
    ]
  );

  // Obtener la vista creada
  const newView = await db.get(
    'SELECT * FROM views WHERE id = ?',
    [result.id]
  );

  res.status(201).json({
    message: 'Vista importada exitosamente',
    view: newView,
    imported_files: {
      css: css_files,
      js: js_files
    }
  });
}));

module.exports = router; 