const express = require('express')
const router = express.Router()

// Middleware para verificar rol admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso solo para administradores' })
  }
  next()
}

/**
 * @route POST /api/clone-site
 * @desc Clona un sitio desde una URL (dummy)
 * @access Solo admin
 */
router.post('/', requireAdmin, async (req, res) => {
  const { url } = req.body
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL requerida' })
  }
  // Aquí iría la lógica real de clonado
  res.json({ success: true, message: `Sitio clonado desde ${url} (simulado)` })
})

module.exports = router 