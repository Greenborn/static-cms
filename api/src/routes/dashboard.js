const express = require('express')
const router = express.Router()
const db = require('../config/database')

/**
 * @route GET /api/dashboard/stats
 * @desc Devuelve estadísticas generales del sistema
 * @access Privado (requiere autenticación)
 */
router.get('/stats', async (req, res) => {
  try {
    // Consultas de conteo directo a las tablas
    const rowPages = await db.get('SELECT COUNT(*) as count FROM pages')
    const rowContentTypes = await db.get('SELECT COUNT(*) as count FROM content_types')
    const rowViews = await db.get('SELECT COUNT(*) as count FROM views')
    const rowMedia = await db.get('SELECT COUNT(*) as count FROM images')

    res.json({
      success: true,
      data: {
        totalPages: rowPages.count,
        totalContentTypes: rowContentTypes.count,
        totalViews: rowViews.count,
        totalMedia: rowMedia.count
      }
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error)
    res.status(500).json({ success: false, message: 'Error obteniendo estadísticas', error: error.message })
  }
})

module.exports = router 