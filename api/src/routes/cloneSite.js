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
  const parsed = new URL(url)
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

// Función recursiva para extraer URLs de fuentes y CSS importados de un CSS
async function extractFontAndCssImportsFromCss(cssUrl, baseUrl, visited = new Set()) {
  const fontUrls = []
  if (visited.has(cssUrl)) return fontUrls // Evitar ciclos
  visited.add(cssUrl)
  try {
    const response = await axios.get(cssUrl, { timeout: 10000 })
    const css = response.data
    // Buscar fuentes
    const urlRegex = /url\((['"]?)([^)'"\s]+\.(woff2?|ttf|otf|eot))\1\)/gi
    let match
    while ((match = urlRegex.exec(css)) !== null) {
      const fontUrl = match[2]
      const absoluteUrl = url.resolve(baseUrl, fontUrl)
      fontUrls.push({ url: absoluteUrl, type: 'font', original: fontUrl })
    }
    // Buscar @import url(...)
    const importRegex = /@import\s+url\((['"]?)([^)'"\s]+\.css)\1\)/gi
    let importMatch
    while ((importMatch = importRegex.exec(css)) !== null) {
      const importUrl = importMatch[2]
      const absoluteImportUrl = url.resolve(baseUrl, importUrl)
      // Recursivo: buscar fuentes en el CSS importado
      const importedFonts = await extractFontAndCssImportsFromCss(absoluteImportUrl, baseUrl, visited)
      fontUrls.push(...importedFonts)
    }
  } catch (e) {
    console.error('Error extrayendo fuentes/imports de CSS:', cssUrl, e.message)
  }
  return fontUrls
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
    const cloneDir = path.join(process.cwd(), 'template', 'clone')
    await fs.ensureDir(cloneDir)

    // Crear subdirectorio config y copiar archivos de configuración si no existen
    const baseConfigDir = path.join(process.cwd(), 'template', 'base', 'config')
    const cloneConfigDir = path.join(cloneDir, 'config')
    await fs.ensureDir(cloneConfigDir)
    // Copiar site.json
    const baseSiteJson = path.join(baseConfigDir, 'site.json')
    const cloneSiteJson = path.join(cloneConfigDir, 'site.json')
    if (!(await fs.pathExists(cloneSiteJson))) {
      await fs.copy(baseSiteJson, cloneSiteJson)
    }
    // Copiar theme.json
    const baseThemeJson = path.join(baseConfigDir, 'theme.json')
    const cloneThemeJson = path.join(cloneConfigDir, 'theme.json')
    if (!(await fs.pathExists(cloneThemeJson))) {
      await fs.copy(baseThemeJson, cloneThemeJson)
    }
    
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
    let resources = extractResources(html, siteUrl)

    // Buscar fuentes en los CSS descargados (recursivo)
    let fontResources = []
    for (const resource of resources) {
      if (resource.type === 'css') {
        const fonts = await extractFontAndCssImportsFromCss(resource.url, siteUrl)
        fontResources = fontResources.concat(fonts)
      }
    }

    // Buscar fuentes en los bloques <style> embebidos en el HTML
    const $ = cheerio.load(html) // Re-load HTML for cheerio to work on it
    $('style').each((i, elem) => {
      const css = $(elem).html()
      if (css) {
        const urlRegex = /url\((['"]?)([^)'"\s]+\.(woff2?|ttf|otf|eot))\1\)/gi
        let match
        while ((match = urlRegex.exec(css)) !== null) {
          const fontUrl = match[2]
          const absoluteUrl = url.resolve(siteUrl, fontUrl)
          fontResources.push({ url: absoluteUrl, type: 'font', original: fontUrl })
        }
      }
    })
    resources = resources.concat(fontResources)

    // Descargar automáticamente todas las fuentes detectadas
    const fontsDir = path.join(cloneDir, 'assets', 'fonts')
    await fs.ensureDir(fontsDir)
    for (const fontRes of fontResources) {
      try {
        const response = await axios.get(fontRes.url, { timeout: 10000, responseType: 'arraybuffer' })
        const fontFilename = generateSafeFilename(fontRes.url, 'font')
        const fontPath = path.join(fontsDir, fontFilename)
        await fs.writeFile(fontPath, response.data)
        // Copiar la fuente al directorio público
        const publicFontsDir = path.join(process.cwd(), 'public', 'f')
        await fs.ensureDir(publicFontsDir)
        const publicFontPath = path.join(publicFontsDir, fontFilename)
        await fs.copyFile(fontPath, publicFontPath)
        console.log(`✅ Fuente descargada y copiada a public/f: ${fontFilename}`)
      } catch (e) {
        console.error(`❌ Error descargando fuente ${fontRes.url}:`, e.message)
      }
    }

    // Eliminar referencias a CSS externos ya extraídos
    $('link[rel="stylesheet"]').remove()
    const cleanedHtml = $.html()

    // Generar nombre para el archivo HTML
    const htmlFilename = generateSafeFilename(siteUrl, 'html')
    const htmlPath = path.join(cloneDir, htmlFilename)

    // Guardar HTML limpio
    await fs.writeFile(htmlPath, cleanedHtml, 'utf8')
    
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
    const cloneDir = path.join(process.cwd(), 'template', 'clone')
    const assetsDir = path.join(cloneDir, 'assets')
    await fs.ensureDir(assetsDir)
    
    // Crear subdirectorio por tipo
    let typeDir
    if (resourceType === 'font') {
      typeDir = path.join(assetsDir, 'fonts')
    } else {
      typeDir = path.join(assetsDir, resourceType)
    }
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

    // === Si es imagen, registrar en galería, generar miniaturas y asociar a 'No catalogadas' ===
    if (resourceType === 'image') {
      const crypto = require('crypto')
      const MediaCategories = require('../models/mediaCategories')
      const MediaFiles = require('../models/mediaFiles')
      const { getBreakpointsOrdered } = require('../models/breakpoints')
      const sharp = require('sharp')
      // Calcular hash SHA256 de la imagen
      const hash = crypto.createHash('sha256').update(response.data).digest('hex')
      // Verificar si ya existe una imagen con ese hash
      const existing = await MediaFiles.getByHash(hash)
      if (existing) {
        console.log(`⚠️  Imagen duplicada detectada (hash: ${hash}), no se guarda ni procesa.`)
      } else {
        // 1. Verificar/crear categoría 'No catalogadas'
        let category = (await MediaCategories.getAll()).find(c => c.name === 'No catalogadas')
        if (!category) {
          category = await MediaCategories.create('No catalogadas')
        }
        // 2. Guardar en media_files
        const fileUrl = `/i/${filename}`
        const fileInfo = await MediaFiles.create({
          filename,
          original_name: filename,
          mimetype: response.headers['content-type'] || '',
          size: response.data.length,
          url: fileUrl,
          category_id: category.id,
          hash
        })
        // 3. Generar miniaturas
        const breakpoints = await getBreakpointsOrdered()
        const ext = path.extname(filename)
        const name = path.basename(filename, ext)
        const inputPath = path.join(process.cwd(), 'public', 'i', filename)
        // Copiar imagen al directorio público si no está
        const publicImgDir = path.join(process.cwd(), 'public', 'i')
        await fs.ensureDir(publicImgDir)
        await fs.copyFile(filePath, inputPath)
        for (const bp of breakpoints) {
          const width = parseInt(bp.valor_px)
          if (!width || isNaN(width)) continue
          const thumbName = `${name}_${bp.nombre}${ext}`
          const thumbPath = path.join(publicImgDir, thumbName)
          try {
            await sharp(inputPath).resize({ width }).toFile(thumbPath)
          } catch (e) {
            console.error(`Error generando miniatura ${thumbName}:`, e.message)
          }
        }
      }
    }
    
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