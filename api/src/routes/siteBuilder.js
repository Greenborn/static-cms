const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const Mustache = require('mustache');
const minify = require('html-minifier').minify;
const CleanCSS = require('clean-css');
const { minify: terserMinify } = require('terser');
const db = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

// Función para minificar HTML
const minifyHTML = (html) => {
  return minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
    removeAttributeQuotes: false,
    removeEmptyAttributes: false,
    removeOptionalTags: false,
    removeRedundantAttributes: false,
    removeScriptTypeAttributes: false,
    removeStyleLinkTypeAttributes: false,
    useShortDoctype: false
  });
};

// Función para minificar CSS
const minifyCSS = (css) => {
  const cleanCSS = new CleanCSS({
    level: 2,
    format: 'keep-breaks'
  });
  return cleanCSS.minify(css).styles;
};

// Función para minificar JavaScript
const minifyJS = async (js) => {
  try {
    const result = await terserMinify(js, {
      compress: true,
      mangle: true
    });
    return result.code;
  } catch (error) {
    console.error('Error minificando JS:', error);
    return js; // Devolver original si falla
  }
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
      site: {
        title: 'Static CMS Site',
        description: 'Sitio generado con Static CMS',
        url: process.env.BASE_URL || 'http://localhost:3000',
        generated_at: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error obteniendo datos para plantillas:', error);
    throw error;
  }
};

// Función para copiar archivos estáticos
const copyStaticFiles = async (sourceDir, targetDir) => {
  try {
    if (await fs.pathExists(sourceDir)) {
      await fs.copy(sourceDir, targetDir);
      console.log(`✅ Archivos copiados de ${sourceDir} a ${targetDir}`);
    }
  } catch (error) {
    console.error(`❌ Error copiando archivos de ${sourceDir}:`, error);
  }
};

// Función para generar el sitio completo
const generateSite = async () => {
  const publicDir = process.env.PUBLIC_DIR || '../public';
  const templateDir = process.env.TEMPLATE_DIR || '../template';
  
  try {
    console.log('🚀 Iniciando generación del sitio...');

    // Limpiar directorio público
    await fs.emptyDir(publicDir);
    console.log('✅ Directorio público limpiado');

    // Obtener datos para plantillas
    const templateData = await getTemplateData();
    console.log('✅ Datos obtenidos para plantillas');

    // Crear estructura de directorios
    await fs.ensureDir(path.join(publicDir, 'assets/css'));
    await fs.ensureDir(path.join(publicDir, 'assets/js'));
    await fs.ensureDir(path.join(publicDir, 'assets/images'));
    await fs.ensureDir(path.join(publicDir, 'pages'));
    console.log('✅ Estructura de directorios creada');

    // Copiar archivos estáticos
    await copyStaticFiles(path.join(templateDir, 'assets'), path.join(publicDir, 'assets'));
    await copyStaticFiles(path.join(templateDir, 'static'), publicDir);

    // Generar páginas
    for (const page of templateData.pages) {
      try {
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

        // Guardar página
        const pagePath = path.join(publicDir, 'pages', `${page.slug}.html`);
        await fs.writeFile(pagePath, minifiedHTML);

        console.log(`✅ Página generada: ${page.slug}.html`);
      } catch (error) {
        console.error(`❌ Error generando página ${page.slug}:`, error);
      }
    }

    // Generar página principal (index.html)
    let indexTemplatePath = path.join(templateDir, 'templates', 'index.html');
    // Si no existe en templates, usar template/base/index.html
    if (!(await fs.pathExists(indexTemplatePath))) {
      indexTemplatePath = path.join(templateDir, 'base', 'index.html');
    }
    if (await fs.pathExists(indexTemplatePath)) {
      const indexTemplate = await fs.readFile(indexTemplatePath, 'utf8');
      const indexHTML = Mustache.render(indexTemplate, templateData);
      const minifiedIndex = minifyHTML(indexHTML);
      await fs.writeFile(path.join(publicDir, 'index.html'), minifiedIndex);
      console.log('✅ Página principal generada');
    }

    // Generar sitemap
    const sitemap = generateSitemap(templateData.pages);
    await fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemap);
    console.log('✅ Sitemap generado');

    // Generar robots.txt
    const robotsTxt = generateRobotsTxt();
    await fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt);
    console.log('✅ Robots.txt generado');

    console.log('🎉 Sitio generado exitosamente!');
    return {
      success: true,
      pages_generated: templateData.pages.length,
      generated_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error generando sitio:', error);
    throw error;
  }
};

// Función para generar sitemap
const generateSitemap = (pages) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Página principal
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${baseUrl}/</loc>\n`;
  sitemap += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
  sitemap += `    <changefreq>daily</changefreq>\n`;
  sitemap += `    <priority>1.0</priority>\n`;
  sitemap += `  </url>\n`;
  
  // Páginas
  for (const page of pages) {
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/pages/${page.slug}.html</loc>\n`;
    sitemap += `    <lastmod>${page.updated_at || page.created_at}</lastmod>\n`;
    sitemap += `    <changefreq>weekly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;
  }
  
  sitemap += '</urlset>';
  return sitemap;
};

// Función para generar robots.txt
const generateRobotsTxt = () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Archivos estáticos
Allow: /assets/
Allow: /images/
Allow: /css/
Allow: /js/

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
`;
};

/**
 * @route POST /api/site-builder/build
 * @desc Genera el sitio estático completo (alias de /generate)
 * @access Privado (requiere autenticación)
 * @returns { message, success, pages_generated, generated_at }
 */
router.post('/build', asyncHandler(async (req, res) => {
  const result = await generateSite();
  res.status(200).json({
    message: 'Sitio generado exitosamente',
    ...result
  });
}));

// POST /api/site-builder/generate-page/:id
// Generar una página específica
router.post('/generate-page/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const publicDir = process.env.PUBLIC_DIR || '../public';
  const templateDir = process.env.TEMPLATE_DIR || '../template';

  // Obtener la página
  const page = await db.get(
    'SELECT * FROM pages WHERE id = ?',
    [id]
  );

  if (!page) {
    throw createError(404, 'Página no encontrada');
  }

  try {
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
        htmlContent = page.content || '';
      }
    } else {
      htmlContent = page.content || '';
    }

    // Minificar HTML
    const minifiedHTML = minifyHTML(htmlContent);

    // Guardar página
    const pagePath = path.join(publicDir, 'pages', `${page.slug}.html`);
    await fs.ensureDir(path.dirname(pagePath));
    await fs.writeFile(pagePath, minifiedHTML);

    res.status(200).json({
      message: 'Página generada exitosamente',
      page: page.slug,
      path: pagePath
    });

  } catch (error) {
    console.error('Error generando página:', error);
    throw createError(500, 'Error al generar la página');
  }
}));

// GET /api/site-builder/status
// Obtener estado del constructor de sitio
router.get('/status', asyncHandler(async (req, res) => {
  const publicDir = process.env.PUBLIC_DIR || '../public';
  
  try {
    const stats = await fs.stat(publicDir);
    const files = await fs.readdir(publicDir);
    
    res.status(200).json({
      status: 'ready',
      public_dir: publicDir,
      last_modified: stats.mtime,
      files_count: files.length,
      files: files
    });
  } catch (error) {
    res.status(200).json({
      status: 'not_generated',
      public_dir: publicDir,
      error: 'Directorio público no existe'
    });
  }
}));

// POST /api/site-builder/clean
// Limpiar el sitio generado
router.post('/clean', asyncHandler(async (req, res) => {
  const publicDir = process.env.PUBLIC_DIR || '../public';
  
  try {
    await fs.emptyDir(publicDir);
    
    res.status(200).json({
      message: 'Sitio limpiado exitosamente',
      public_dir: publicDir
    });
  } catch (error) {
    throw createError(500, 'Error al limpiar el sitio');
  }
}));

// GET /api/site-builder/templates
// Obtener plantillas disponibles
router.get('/templates', asyncHandler(async (req, res) => {
  const templateDir = process.env.TEMPLATE_DIR || '../template';
  const templatesPath = path.join(templateDir, 'templates');
  
  try {
    if (await fs.pathExists(templatesPath)) {
      const files = await fs.readdir(templatesPath);
      const templates = files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
      
      res.status(200).json({
        templates,
        template_dir: templatesPath
      });
    } else {
      res.status(200).json({
        templates: [],
        template_dir: templatesPath,
        message: 'Directorio de plantillas no existe'
      });
    }
  } catch (error) {
    throw createError(500, 'Error al obtener plantillas');
  }
}));

// POST /api/site-builder/preview
// Previsualizar una plantilla con datos
router.post('/preview', asyncHandler(async (req, res) => {
  const { template, data = {} } = req.body;
  const templateDir = process.env.TEMPLATE_DIR || '../template';
  
  if (!template) {
    throw createError(400, 'Nombre de plantilla requerido');
  }

  try {
    const templatePath = path.join(templateDir, 'templates', `${template}.html`);
    
    if (!(await fs.pathExists(templatePath))) {
      throw createError(404, 'Plantilla no encontrada');
    }

    const templateContent = await fs.readFile(templatePath, 'utf8');
    const templateData = await getTemplateData();
    
    const rendered = Mustache.render(templateContent, {
      ...templateData,
      ...data
    });

    res.status(200).json({
      preview: rendered,
      template: template,
      data: data
    });

  } catch (error) {
    throw createError(500, `Error al previsualizar: ${error.message}`);
  }
}));

// GET /api/site-builder/stats
// Obtener estadísticas del sitio
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    // Estadísticas de páginas
    const pageStats = await db.get(`
      SELECT 
        COUNT(*) as total_pages,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_pages,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_pages
      FROM pages
    `);

    // Estadísticas de contenido
    const contentStats = await db.get(`
      SELECT 
        COUNT(*) as total_content,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_content
      FROM content
    `);

    // Estadísticas de media
    const mediaStats = await db.get(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size
      FROM images 
      WHERE is_thumbnail = FALSE
    `);

    res.status(200).json({
      pages: pageStats,
      content: contentStats,
      media: mediaStats,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    throw createError(500, 'Error al obtener estadísticas');
  }
}));

// Clonar sitio (dummy)
router.post('/clone', async (req, res) => {
  const { url } = req.body
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL requerida' })
  }
  // Aquí iría la lógica real de clonado
  res.json({ success: true, message: `Sitio clonado desde ${url} (simulado)` })
})

module.exports = router; 