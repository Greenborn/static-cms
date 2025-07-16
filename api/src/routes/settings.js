const express = require('express');
const router = express.Router();
const { getSetting, setSetting } = require('../models/settings');

/**
 * @route GET /api/settings
 * @desc Devuelve configuraciones globales para el panel admin
 * @access Público
 */
router.get('/', async (req, res) => {
  const entorno = process.env.ENTORNO || 'DEV';
  const siteTitle = await getSetting('site_title');
  res.json({
    entorno,
    siteTitle: siteTitle || 'Static CMS'
  });
});

/**
 * @route PUT /api/settings/site-title
 * @desc Actualiza el título del sitio
 * @access Privado (requiere autenticación)
 * @body { siteTitle: string }
 */
router.put('/site-title', async (req, res) => {
  const { siteTitle } = req.body;
  if (!siteTitle || typeof siteTitle !== 'string' || siteTitle.trim().length === 0) {
    return res.status(400).json({ error: 'El título del sitio es requerido' });
  }
  await setSetting(
    'site_title',
    siteTitle.trim(),
    'Título principal del sitio',
    'General', // categoría
    true,      // is_template_item
    'title'    // slug para mustache
  );
  res.json({ message: 'Título del sitio actualizado', siteTitle: siteTitle.trim() });
});

module.exports = router; 