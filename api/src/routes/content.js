const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');
const { 
  createError, 
  validateAndSanitize 
} = require('../middleware/errorHandler');

const router = express.Router();

// Esquema de validación para contenido
const contentSchema = {
  title: {
    type: 'string',
    required: true,
    maxLength: 200
  },
  content_type_id: {
    type: 'number',
    required: true
  },
  data: {
    type: 'string',
    required: true
  },
  status: {
    type: 'string',
    required: false,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  slug: {
    type: 'string',
    required: false,
    maxLength: 200,
    allowNull: true
  }
};

// Validación de datos de contenido según el tipo
const validateContentData = async (contentTypeId, dataJson) => {
  try {
    // Obtener el tipo de contenido
    const contentType = await db.get(
      'SELECT fields FROM content_types WHERE id = ?',
      [contentTypeId]
    );

    if (!contentType) {
      throw new Error('Tipo de contenido no encontrado');
    }

    const fields = JSON.parse(contentType.fields);
    const data = JSON.parse(dataJson);

    // Validar que todos los campos requeridos estén presentes
    for (const field of fields) {
      if (field.required && (data[field.name] === undefined || data[field.name] === null || data[field.name] === '')) {
        throw new Error(`El campo "${field.name}" es requerido`);
      }
    }

    // Validar tipos de datos
    for (const field of fields) {
      if (data[field.name] !== undefined && data[field.name] !== null && data[field.name] !== '') {
        switch (field.type) {
          case 'number':
            if (isNaN(Number(data[field.name]))) {
              throw new Error(`El campo "${field.name}" debe ser un número`);
            }
            break;
          case 'boolean':
            if (typeof data[field.name] !== 'boolean' && !['true', 'false', '1', '0'].includes(String(data[field.name]).toLowerCase())) {
              throw new Error(`El campo "${field.name}" debe ser un booleano`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(data[field.name]))) {
              throw new Error(`El campo "${field.name}" debe ser una fecha válida`);
            }
            break;
          case 'url':
            try {
              new URL(data[field.name]);
            } catch {
              throw new Error(`El campo "${field.name}" debe ser una URL válida`);
            }
            break;
          case 'select':
            if (field.options && !field.options.includes(data[field.name])) {
              throw new Error(`El campo "${field.name}" debe ser una de las opciones válidas`);
            }
            break;
        }
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Error en la validación de datos: ${error.message}`);
  }
};

// Función para generar slugs únicos
const generateUniqueSlug = async (title, excludeId = null) => {
  // Generar slug base
  let baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
  
  // Si el slug está vacío, usar 'contenido'
  if (!baseSlug) {
    baseSlug = 'contenido';
  }
  
  let slug = baseSlug;
  let counter = 1;
  
  // Verificar si el slug ya existe
  while (true) {
    let query = 'SELECT id FROM content WHERE slug = ?';
    let params = [slug];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const existingContent = await db.get(query, params);
    
    if (!existingContent) {
      break; // Slug único encontrado
    }
    
    // Generar nuevo slug con contador
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};

// GET /api/content
// Obtener lista de contenido
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search,
    content_type_id,
    status,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const validSortFields = ['title', 'content_type_id', 'status', 'created_at', 'updated_at'];
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
    whereClause += ' AND (c.title LIKE ? OR c.slug LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (content_type_id) {
    whereClause += ' AND c.content_type_id = ?';
    params.push(parseInt(content_type_id));
  }

  if (status) {
    whereClause += ' AND c.status = ?';
    params.push(status);
  }

  // Obtener total de registros
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM content c 
    LEFT JOIN content_types ct ON c.content_type_id = ct.id 
    ${whereClause}
  `;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // Obtener contenido con información del tipo
  const query = `
    SELECT 
      c.id, 
      c.title, 
      c.slug, 
      c.status, 
      c.created_at, 
      c.updated_at,
      c.content_type_id,
      ct.name as content_type_name
    FROM content c
    LEFT JOIN content_types ct ON c.content_type_id = ct.id
    ${whereClause}
    ORDER BY c.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  const content = await db.all(query, [...params, parseInt(limit), offset]);

  res.status(200).json({
    content,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/content/:id
// Obtener un contenido específico
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const content = await db.get(
    `SELECT 
      c.*,
      ct.name as content_type_name,
      ct.fields as content_type_fields
    FROM content c
    LEFT JOIN content_types ct ON c.content_type_id = ct.id
    WHERE c.id = ?`,
    [id]
  );

  if (!content) {
    throw createError(404, 'Contenido no encontrado');
  }

  // Parsear datos JSON
  content.data = JSON.parse(content.data);
  content.content_type_fields = JSON.parse(content.content_type_fields);

  res.status(200).json({ content });
}));

// Función para decodificar datos URL encoded
const decodeContentData = (data) => {
  if (data.data && typeof data.data === 'string') {
    try {
      data.data = decodeURIComponent(data.data);
    } catch (error) {
      console.warn('Error decodificando datos URL encoded:', error.message);
    }
  }
  return data;
};

// POST /api/content
// Crear nuevo contenido
router.post('/', asyncHandler(async (req, res) => {
  // Decodificar datos antes de validar
  const decodedData = decodeContentData(req.body);
  const contentData = validateAndSanitize(decodedData, contentSchema);

  // Validar datos según el tipo de contenido
  await validateContentData(contentData.content_type_id, contentData.data);

  // Generar slug único si no se proporciona
  if (!contentData.slug) {
    contentData.slug = await generateUniqueSlug(contentData.title);
  } else {
    // Verificar si el slug proporcionado ya existe
    const existingContent = await db.get(
      'SELECT id FROM content WHERE slug = ?',
      [contentData.slug]
    );

    if (existingContent) {
      throw createError(409, 'Ya existe contenido con este slug');
    }
  }

  // Insertar nuevo contenido
  const result = await db.run(
    'INSERT INTO content (title, slug, content_type_id, data, status) VALUES (?, ?, ?, ?, ?)',
    [
      contentData.title,
      contentData.slug,
      contentData.content_type_id,
      contentData.data,
      contentData.status || 'draft'
    ]
  );

  // Obtener el contenido creado
  const newContent = await db.get(
    `SELECT 
      c.*,
      ct.name as content_type_name
    FROM content c
    LEFT JOIN content_types ct ON c.content_type_id = ct.id
    WHERE c.id = ?`,
    [result.id]
  );

  // Parsear datos JSON
  newContent.data = JSON.parse(newContent.data);

  res.status(201).json({
    message: 'Contenido creado exitosamente',
    content: newContent
  });
}));

// PUT /api/content/:id
// Actualizar contenido existente
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Decodificar datos antes de validar
  const decodedData = decodeContentData(req.body);
  const contentData = validateAndSanitize(decodedData, contentSchema);

  // Verificar si el contenido existe
  const existingContent = await db.get(
    'SELECT id FROM content WHERE id = ?',
    [id]
  );

  if (!existingContent) {
    throw createError(404, 'Contenido no encontrado');
  }

  // Validar datos según el tipo de contenido
  await validateContentData(contentData.content_type_id, contentData.data);

  // Generar slug único si no se proporciona
  if (!contentData.slug) {
    contentData.slug = await generateUniqueSlug(contentData.title, id);
  } else {
    // Verificar si el slug proporcionado ya existe en otro contenido
    const slugExists = await db.get(
      'SELECT id FROM content WHERE slug = ? AND id != ?',
      [contentData.slug, id]
    );

    if (slugExists) {
      throw createError(409, 'Ya existe otro contenido con este slug');
    }
  }

  // Actualizar contenido
  await db.run(
    'UPDATE content SET title = ?, slug = ?, content_type_id = ?, data = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [
      contentData.title,
      contentData.slug,
      contentData.content_type_id,
      contentData.data,
      contentData.status || 'draft',
      id
    ]
  );

  // Obtener el contenido actualizado
  const updatedContent = await db.get(
    `SELECT 
      c.*,
      ct.name as content_type_name
    FROM content c
    LEFT JOIN content_types ct ON c.content_type_id = ct.id
    WHERE c.id = ?`,
    [id]
  );

  // Parsear datos JSON
  updatedContent.data = JSON.parse(updatedContent.data);

  res.status(200).json({
    message: 'Contenido actualizado exitosamente',
    content: updatedContent
  });
}));

// DELETE /api/content/:id
// Eliminar contenido
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si el contenido existe
  const existingContent = await db.get(
    'SELECT id FROM content WHERE id = ?',
    [id]
  );

  if (!existingContent) {
    throw createError(404, 'Contenido no encontrado');
  }

  // Eliminar contenido
  await db.run('DELETE FROM content WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Contenido eliminado exitosamente'
  });
}));

// GET /api/content/types/:id/fields
// Obtener campos de un tipo de contenido específico
router.get('/types/:id/fields', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const contentType = await db.get(
    'SELECT id, name, fields FROM content_types WHERE id = ?',
    [id]
  );

  if (!contentType) {
    throw createError(404, 'Tipo de contenido no encontrado');
  }

  // Parsear campos JSON
  contentType.fields = JSON.parse(contentType.fields);

  res.status(200).json({ contentType });
}));

module.exports = router; 