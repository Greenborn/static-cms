const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs-extra')
const path = require('path')
const url = require('url')
const db = require('../config/database')

// Middleware para verificar rol admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso solo para administradores' })
  }
  next()
}

/**
 * Extrae recursos (CSS, JS, imágenes) del HTML
 */
function extractResources(html, baseUrl) {
  const $ = cheerio.load(html)
  const resources = []
  
  // CSS
  $('link[rel="stylesheet"]').each((i, elem) => {
    const href = $(elem).attr('href')
    if (href) {
      const absoluteUrl = url.resolve(baseUrl, href)
      resources.push({
        url: absoluteUrl,
        type: 'css',
        original: href
      })
    }
  })
  
  // JavaScript
  $('script[src]').each((i, elem) => {
    const src = $(elem).attr('src')
    if (src) {
      const absoluteUrl = url.resolve(baseUrl, src)
      resources.push({
        url: absoluteUrl,
        type: 'js',
        original: src
      })
    }
  })
  
  // Imágenes
  $('img[src]').each((i, elem) => {
    const src = $(elem).attr('src')
    if (src) {
      const absoluteUrl = url.resolve(baseUrl, src)
      resources.push({
        url: absoluteUrl,
        type: 'image',
        original: src
      })
    }
  })
  
  return resources
}

/**
 * Genera nombre de archivo seguro
 */
function generateSafeFilename(url, type) {
  const parsed = url.parse(url)
  const pathname = parsed.pathname || '/'
  const ext = path.extname(pathname) || getDefaultExtension(type)
  const basename = path.basename(pathname, ext) || 'index'
  const safeName = basename.replace(/[^a-zA-Z0-9]/g, '_')
  return `${safeName}${ext}`
}

/**
 * Obtiene extensión por defecto según tipo
 */
function getDefaultExtension(type) {
  switch (type) {
    case 'css': return '.css'
    case 'js': return '.js'
    case 'image': return '.jpg'
    default: return '.html'
  }
}

/**
 * @route POST /api/clone-site
 * @desc Inicia proceso de clonado - analiza sitio y devuelve lista de recursos
 * @access Solo admin
 */
router.post('/', requireAdmin, async (req, res) => {
  const { url: siteUrl } = req.body
  
  if (!siteUrl) {
    return res.status(400).json({ success: false, message: 'URL requerida' })
  }

  try {
    // Crear directorio de clonado si no existe
    const cloneDir = path.resolve(__dirname, '../../../template/clone')
    await fs.ensureDir(cloneDir)
    
    // Crear registro de proceso
    const processResult = await db.run(
      'INSERT INTO clone_processes (url, status) VALUES (?, ?)',
      [siteUrl, 'analyzing']
    )
    const processId = processResult.id
    
    // Hacer petición GET al sitio
    const response = await axios.get(siteUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StaticCMS-Cloner/1.0)'
      }
    })
    
    const html = response.data
    const resources = extractResources(html, siteUrl)
    
    // Generar nombre para el archivo HTML
    const htmlFilename = generateSafeFilename(siteUrl, 'html')
    const htmlPath = path.join(cloneDir, htmlFilename)
    
    // Guardar HTML
    await fs.writeFile(htmlPath, html, 'utf8')
    
    // Actualizar proceso
    await db.run(
      'UPDATE clone_processes SET status = ?, total_resources = ?, html_file = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['ready', resources.length, htmlFilename, processId]
    )
    
    // Registrar log de análisis exitoso
    await db.run(
      'INSERT INTO clone_logs (process_id, resource_url, resource_type, status, file_path) VALUES (?, ?, ?, ?, ?)',
      [processId, siteUrl, 'html', 'success', htmlFilename]
    )
    
    res.json({
      success: true,
      message: `Sitio analizado exitosamente`,
      data: {
        processId,
        totalResources: resources.length,
        resources: resources.map((r, index) => ({
          id: index + 1,
          url: r.url,
          type: r.type,
          original: r.original,
          status: 'pending'
        }))
      }
    })
    
  } catch (error) {
    console.error('Error iniciando clonado:', error)
    
    // Registrar error en logs si hay processId
    if (typeof processId !== 'undefined') {
      await db.run(
        'INSERT INTO clone_logs (process_id, resource_url, resource_type, status, error_message) VALUES (?, ?, ?, ?, ?)',
        [processId, siteUrl, 'html', 'error', error.message]
      )
      
      await db.run(
        'UPDATE clone_processes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['error', processId]
      )
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error analizando sitio',
      error: error.message 
    })
  }
})

/**
 * @route POST /api/clone-site/process-resource
 * @desc Procesa un recurso específico de la lista
 * @access Solo admin
 */
router.post('/process-resource', requireAdmin, async (req, res) => {
  const { processId, resourceIndex, resourceUrl, resourceType, originalPath } = req.body
  
  if (!processId || resourceIndex === undefined || !resourceUrl) {
    return res.status(400).json({ success: false, message: 'Parámetros requeridos' })
  }

  try {
    const cloneDir = path.resolve(__dirname, '../../../template/clone')
    const assetsDir = path.join(cloneDir, 'assets')
    await fs.ensureDir(assetsDir)
    
    // Crear subdirectorio por tipo
    const typeDir = path.join(assetsDir, resourceType)
    await fs.ensureDir(typeDir)
    
    // Descargar recurso
    const response = await axios.get(resourceUrl, {
      timeout: 10000,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StaticCMS-Cloner/1.0)'
      }
    })
    
    // Generar nombre de archivo
    const filename = generateSafeFilename(resourceUrl, resourceType)
    const filePath = path.join(typeDir, filename)
    
    // Guardar archivo
    await fs.writeFile(filePath, response.data)
    
    // Actualizar contador de recursos procesados
    await db.run(
      'UPDATE clone_processes SET processed_resources = processed_resources + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [processId]
    )
    
    // Registrar log exitoso
    await db.run(
      'INSERT INTO clone_logs (process_id, resource_url, resource_type, status, file_path) VALUES (?, ?, ?, ?, ?)',
      [processId, resourceUrl, resourceType, 'success', path.relative(cloneDir, filePath)]
    )
    
    res.json({
      success: true,
      message: `Recurso procesado: ${filename}`,
      data: {
        filename,
        filePath: path.relative(cloneDir, filePath),
        size: response.data.length
      }
    })
    
  } catch (error) {
    console.error('Error procesando recurso:', error)
    
    // Registrar error en logs
    await db.run(
      'INSERT INTO clone_logs (process_id, resource_url, resource_type, status, error_message) VALUES (?, ?, ?, ?, ?)',
      [processId, resourceUrl, resourceType, 'error', error.message]
    )
    
    res.status(500).json({ 
      success: false, 
      message: 'Error procesando recurso',
      error: error.message 
    })
  }
})

/**
 * @route GET /api/clone-site/status/:processId
 * @desc Obtiene estado de un proceso de clonado
 * @access Solo admin
 */
router.get('/status/:processId', requireAdmin, async (req, res) => {
  const { processId } = req.params
  
  try {
    const process = await db.get(
      'SELECT * FROM clone_processes WHERE id = ?',
      [processId]
    )
    
    if (!process) {
      return res.status(404).json({ success: false, message: 'Proceso no encontrado' })
    }
    
    const logs = await db.all(
      'SELECT * FROM clone_logs WHERE process_id = ? ORDER BY created_at DESC LIMIT 50',
      [processId]
    )
    
    res.json({
      success: true,
      data: {
        process,
        logs
      }
    })
    
  } catch (error) {
    console.error('Error obteniendo estado:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo estado',
      error: error.message 
    })
  }
})

module.exports = router 