const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');
const { 
  createError, 
  validateAndSanitize 
} = require('../middleware/errorHandler');

const router = express.Router();

// Esquema de validación para tipos de contenido
const contentTypeSchema = {
  name: {
    type: 'string',
    required: true,
    maxLength: 100
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 500
  },
  fields: {
    type: 'string',
    required: true
  }
};

// Validación de estructura de campos
const validateFieldsStructure = (fieldsJson) => {
  try {
    const fields = JSON.parse(fieldsJson);
    
    if (!Array.isArray(fields)) {
      throw new Error('Los campos deben ser un array');
    }

    for (const field of fields) {
      if (!field.name || !field.type) {
        throw new Error('Cada campo debe tener nombre y tipo');
      }

      const validTypes = ['text', 'textarea', 'number', 'date', 'boolean', 'select', 'file', 'relation', 'url', 'imagen'];
      if (!validTypes.includes(field.type)) {
        throw new Error(`Tipo de campo inválido: ${field.type}`);
      }

      if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
        throw new Error('Los campos de tipo select deben tener opciones');
      }

      if (field.required && typeof field.required !== 'boolean') {
        throw new Error('El campo required debe ser booleano');
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Error en la estructura de campos: ${error.message}`);
  }
};

// GET /api/content-types
// Obtener lista de tipos de contenido
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
    whereClause += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Obtener total de registros
  const countQuery = `SELECT COUNT(*) as total FROM content_types ${whereClause}`;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // Obtener tipos de contenido
  const query = `
    SELECT id, name, description, fields, created_at, updated_at
    FROM content_types 
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  const contentTypes = await db.all(query, [...params, parseInt(limit), offset]);

  // Parsear campos JSON
  const parsedContentTypes = contentTypes.map(ct => ({
    ...ct,
    fields: JSON.parse(ct.fields)
  }));

  res.status(200).json({
    contentTypes: parsedContentTypes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/content-types/:id
// Obtener un tipo de contenido específico
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contentType = await db.get(
    'SELECT * FROM content_types WHERE id = ?',
    [id]
  );

  if (!contentType) {
    throw createError(404, 'Tipo de contenido no encontrado');
  }

  // Parsear campos JSON
  contentType.fields = JSON.parse(contentType.fields);

  res.status(200).json({ contentType });
}));

// POST /api/content-types
// Crear un nuevo tipo de contenido
router.post('/', asyncHandler(async (req, res) => {
  const contentTypeData = validateAndSanitize(req.body, contentTypeSchema);

  // Validar estructura de campos
  validateFieldsStructure(contentTypeData.fields);

  // Verificar si el nombre ya existe
  const existingContentType = await db.get(
    'SELECT id FROM content_types WHERE name = ?',
    [contentTypeData.name]
  );

  if (existingContentType) {
    throw createError(409, 'Ya existe un tipo de contenido con este nombre');
  }

  // Insertar nuevo tipo de contenido
  const result = await db.run(
    'INSERT INTO content_types (name, description, fields) VALUES (?, ?, ?)',
    [
      contentTypeData.name,
      contentTypeData.description || null,
      contentTypeData.fields
    ]
  );

  // Obtener el tipo de contenido creado
  const newContentType = await db.get(
    'SELECT * FROM content_types WHERE id = ?',
    [result.id]
  );

  // Parsear campos JSON
  newContentType.fields = JSON.parse(newContentType.fields);

  res.status(201).json({
    message: 'Tipo de contenido creado exitosamente',
    contentType: newContentType
  });
}));

// PUT /api/content-types/:id
// Actualizar un tipo de contenido existente
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const contentTypeData = validateAndSanitize(req.body, contentTypeSchema);

  // Validar estructura de campos si se proporciona
  if (contentTypeData.fields) {
    validateFieldsStructure(contentTypeData.fields);
  }

  // Verificar si el tipo de contenido existe
  const existingContentType = await db.get(
    'SELECT id FROM content_types WHERE id = ?',
    [id]
  );

  if (!existingContentType) {
    throw createError(404, 'Tipo de contenido no encontrado');
  }

  // Verificar si el nombre ya existe en otro tipo de contenido
  if (contentTypeData.name) {
    const nameExists = await db.get(
      'SELECT id FROM content_types WHERE name = ? AND id != ?',
      [contentTypeData.name, id]
    );

    if (nameExists) {
      throw createError(409, 'Ya existe otro tipo de contenido con este nombre');
    }
  }

  // Actualizar tipo de contenido
  const updateFields = [];
  const updateValues = [];

  Object.keys(contentTypeData).forEach(key => {
    if (contentTypeData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(contentTypeData[key]);
    }
  });

  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(id);

  await db.run(
    `UPDATE content_types SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  // Obtener el tipo de contenido actualizado
  const updatedContentType = await db.get(
    'SELECT * FROM content_types WHERE id = ?',
    [id]
  );

  // Parsear campos JSON
  updatedContentType.fields = JSON.parse(updatedContentType.fields);

  res.status(200).json({
    message: 'Tipo de contenido actualizado exitosamente',
    contentType: updatedContentType
  });
}));

// DELETE /api/content-types/:id
// Eliminar un tipo de contenido
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si el tipo de contenido existe
  const existingContentType = await db.get(
    'SELECT id FROM content_types WHERE id = ?',
    [id]
  );

  if (!existingContentType) {
    throw createError(404, 'Tipo de contenido no encontrado');
  }

  // Verificar si hay contenido asociado
  const contentCount = await db.get(
    'SELECT COUNT(*) as count FROM content WHERE content_type_id = ?',
    [id]
  );

  if (contentCount.count > 0) {
    throw createError(409, 'No se puede eliminar el tipo de contenido porque tiene contenido asociado');
  }

  // Eliminar tipo de contenido
  await db.run('DELETE FROM content_types WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Tipo de contenido eliminado exitosamente'
  });
}));

// GET /api/content-types/:id/fields
// Obtener solo los campos de un tipo de contenido
router.get('/:id/fields', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contentType = await db.get(
    'SELECT fields FROM content_types WHERE id = ?',
    [id]
  );

  if (!contentType) {
    throw createError(404, 'Tipo de contenido no encontrado');
  }

  const fields = JSON.parse(contentType.fields);

  res.status(200).json({ fields });
}));

// GET /api/content-types/field-types
// Obtener tipos de campo disponibles
router.get('/field-types', asyncHandler(async (req, res) => {
  const fieldTypes = [
    {
      type: 'text',
      name: 'Texto corto',
      description: 'Campo de texto de una línea',
      configurable: true
    },
    {
      type: 'textarea',
      name: 'Texto largo',
      description: 'Campo de texto de múltiples líneas',
      configurable: true
    },
    {
      type: 'number',
      name: 'Número',
      description: 'Campo numérico',
      configurable: true
    },
    {
      type: 'date',
      name: 'Fecha',
      description: 'Campo de fecha',
      configurable: true
    },
    {
      type: 'boolean',
      name: 'Booleano',
      description: 'Campo de verdadero/falso',
      configurable: false
    },
    {
      type: 'select',
      name: 'Selector',
      description: 'Campo de selección con opciones',
      configurable: true
    },
    {
      type: 'file',
      name: 'Archivo',
      description: 'Campo para subir archivos',
      configurable: true
    },
    {
      type: 'relation',
      name: 'Relación',
      description: 'Campo para relacionar con otro contenido',
      configurable: true
    }
  ];

  res.status(200).json({ fieldTypes });
}));

// GET /api/content-types/:id/stats
// Obtener estadísticas de un tipo de contenido
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si el tipo de contenido existe
  const contentType = await db.get(
    'SELECT id FROM content_types WHERE id = ?',
    [id]
  );

  if (!contentType) {
    throw createError(404, 'Tipo de contenido no encontrado');
  }

  // Obtener estadísticas
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_content,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived
    FROM content 
    WHERE content_type_id = ?
  `, [id]);

  res.status(200).json({ stats });
}));

// GET /api/content-types/stats
// Obtener estadísticas generales de tipos de contenido
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_types,
      COUNT(DISTINCT ct.id) as types_with_content
    FROM content_types ct
    LEFT JOIN content c ON ct.id = c.content_type_id
  `);

  res.status(200).json({ stats });
}));

module.exports = router; 