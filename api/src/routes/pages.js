const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../config/database');
const { 
  createError, 
  validateAndSanitize 
} = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs-extra');
const Mustache = require('mustache');
const minify = require('html-minifier').minify;

const router = express.Router();

// Función para minificar HTML
const minifyHTML = (html) => {
  return minify(html, {
    collapseWhitespace: false,
    removeComments: true,
    minifyCSS: false,
    minifyJS: false,
    removeAttributeQuotes: false,
    removeEmptyAttributes: false,
    removeOptionalTags: false,
    removeRedundantAttributes: false,
    removeScriptTypeAttributes: false,
    removeStyleLinkTypeAttributes: false,
    useShortDoctype: false,
    preserveLineBreaks: true
  });
};

// Función para obtener datos para las plantillas
const getTemplateData = async () => {
  try {
    // Obtener páginas publicadas
    const pages = await db.all(
      'SELECT * FROM pages WHERE status = "published" ORDER BY created_at DESC'
    );

    // Obtener tipos de contenido
    const contentTypes = await db.all('SELECT * FROM content_types');

    // Obtener contenido publicado
    const content = await db.all(
      'SELECT * FROM content WHERE status = "published" ORDER BY created_at DESC'
    );

    // Obtener imágenes
    const images = await db.all(
      'SELECT * FROM images WHERE is_thumbnail = FALSE ORDER BY created_at DESC'
    );

    // Obtener formateadores
    const formatters = await db.all('SELECT * FROM formatters');

    // Obtener configuraciones mustacheables
    const { getTemplateSettings } = require('../models/settings');
    const templateSettings = await getTemplateSettings();
    const siteConfig = {
      title: 'Static CMS Site',
      description: 'Sitio generado con Static CMS',
      url: process.env.BASE_URL || 'http://localhost:3000',
      generated_at: new Date().toISOString()
    };

    // Sobrescribir/añadir settings mustacheables
    templateSettings.forEach(item => {
      if (item.slug) {
        siteConfig[item.slug] = item.value;
      }
    });

    // Parsear campos JSON
    const parsedContentTypes = contentTypes.map(ct => ({
      ...ct,
      fields: JSON.parse(ct.fields)
    }));

    const parsedContent = content.map(c => ({
      ...c,
      data: JSON.parse(c.data)
    }));

    const parsedFormatters = formatters.map(f => ({
      ...f,
      config: JSON.parse(f.config)
    }));

    return {
      pages,
      contentTypes: parsedContentTypes,
      content: parsedContent,
      images,
      formatters: parsedFormatters,
      site: siteConfig
    };
  } catch (error) {
    console.error('Error obteniendo datos para plantillas:', error);
    throw error;
  }
};

// Función para generar archivo estático de una página
const generatePageFile = async (page) => {
  try {
    const publicDir = process.env.PUBLIC_DIR || '../public';
    const templateDir = process.env.TEMPLATE_DIR || '../template';

    // Solo generar archivos para páginas publicadas
    if (page.status !== 'published') {
      console.log(`⏭️  Página ${page.slug} no está publicada, saltando generación`);
      return;
    }

    // Obtener datos para plantillas
    const templateData = await getTemplateData();

    let htmlContent = '';

    if (page.template) {
      // Usar plantilla específica
      const templatePath = path.join(templateDir, 'templates', `${page.template}.html`);
      if (await fs.pathExists(templatePath)) {
        const template = await fs.readFile(templatePath, 'utf8');
        htmlContent = Mustache.render(template, {
          ...templateData,
          page: page
        });
      } else {
        // Usar contenido directo si no existe plantilla
        htmlContent = page.content || '';
      }
    } else {
      // Usar contenido directo
      htmlContent = page.content || '';
    }

    // Minificar HTML
    const minifiedHTML = minifyHTML(htmlContent);

    // Crear directorio pages si no existe
    const pagesDir = path.join(publicDir, 'pages');
    await fs.ensureDir(pagesDir);

    // Guardar página
    const pagePath = path.join(pagesDir, `${page.slug}.html`);
    await fs.writeFile(pagePath, minifiedHTML);

    console.log(`✅ Archivo estático generado: ${page.slug}.html`);
    return pagePath;
  } catch (error) {
    console.error(`❌ Error generando archivo estático para ${page.slug}:`, error);
    throw error;
  }
};

// Función para eliminar archivo estático de una página
const deletePageFile = async (page) => {
  try {
    const publicDir = process.env.PUBLIC_DIR || '../public';
    const pagePath = path.join(publicDir, 'pages', `${page.slug}.html`);

    if (await fs.pathExists(pagePath)) {
      await fs.remove(pagePath);
      console.log(`🗑️  Archivo estático eliminado: ${page.slug}.html`);
    }
  } catch (error) {
    console.error(`❌ Error eliminando archivo estático para ${page.slug}:`, error);
    // No lanzar error para no interrumpir el flujo principal
  }
};

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

// Función para decodificar contenido URL encoded
const decodeContent = (data) => {
  if (data.content && typeof data.content === 'string') {
    try {
      data.content = decodeURIComponent(data.content);
    } catch (error) {
      console.warn('Error decodificando contenido URL encoded:', error.message);
    }
  }
  return data;
};

// POST /api/pages
// Crear una nueva página
router.post('/', asyncHandler(async (req, res) => {
  // Decodificar contenido antes de validar
  const decodedData = decodeContent(req.body);
  const pageData = validateAndSanitize(decodedData, pageSchema);

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

  // Generar archivo estático si la página está publicada
  try {
    await generatePageFile(newPage);
  } catch (error) {
    console.error('Error generando archivo estático:', error);
    // No fallar la operación principal por errores de generación
  }

  res.status(201).json({
    message: 'Página creada exitosamente',
    page: newPage
  });
}));

// PUT /api/pages/:id
// Actualizar una página existente
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  // Decodificar contenido antes de validar
  const decodedData = decodeContent(req.body);
  const pageData = validateAndSanitize(decodedData, pageSchema);

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

  // Generar archivo estático si la página está publicada
  try {
    await generatePageFile(updatedPage);
  } catch (error) {
    console.error('Error generando archivo estático:', error);
    // No fallar la operación principal por errores de generación
  }

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
    'SELECT * FROM pages WHERE id = ?',
    [id]
  );

  if (!existingPage) {
    throw createError(404, 'Página no encontrada');
  }

  // Eliminar página
  await db.run('DELETE FROM pages WHERE id = ?', [id]);

  // Eliminar archivo estático si existe
  try {
    await deletePageFile(existingPage);
  } catch (error) {
    console.error('Error eliminando archivo estático:', error);
    // No fallar la operación principal por errores de eliminación
  }

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

  // Obtener la página actualizada para generar/eliminar archivo estático
  const updatedPage = await db.get(
    'SELECT * FROM pages WHERE id = ?',
    [id]
  );

  // Generar o eliminar archivo estático según el nuevo estado
  try {
    if (status === 'published') {
      await generatePageFile(updatedPage);
    } else {
      await deletePageFile(updatedPage);
    }
  } catch (error) {
    console.error('Error manejando archivo estático:', error);
    // No fallar la operación principal por errores de archivo
  }

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

// POST /api/pages/:id/regenerate
// Regenerar manualmente el archivo estático de una página
router.post('/:id/regenerate', asyncHandler(async (req, res) => {
  const { id } = req.params;
 
  // Verificar si la página existe
  const page = await db.get(
    'SELECT * FROM pages WHERE id = ?',
    [id]
  );
 
  if (!page) {
    throw createError(404, 'Página no encontrada');
  }
 
  try {
    // Regenerar archivo estático
    const filePath = await generatePageFile(page);
 
    res.status(200).json({
      message: 'Archivo estático regenerado exitosamente',
      page: page.slug,
      filePath: filePath,
      status: page.status
    });
  } catch (error) {
    console.error('Error regenerando archivo estático:', error);
    throw createError(500, 'Error al regenerar el archivo estático');
  }
}));

module.exports = router; 