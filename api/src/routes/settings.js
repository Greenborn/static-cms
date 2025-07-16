const express = require('express');
const router = express.Router();
const { getSetting, setSetting, getTemplateSettings } = require('../models/settings');

/**
 * @route GET /api/settings
 * @desc Devuelve configuraciones globales para el panel admin
 * @access Público
 */
router.get('/', async (req, res) => {
  const entorno = process.env.ENTORNO || 'DEV';
  const siteTitle = await getSetting('site_title');
  const lang = await getSetting('lang');
  res.json({
    entorno,
    siteTitle: siteTitle || 'Static CMS',
    lang: lang || 'es'
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

/**
 * @route PUT /api/settings/lang
 * @desc Actualiza el lenguaje del sitio (para la etiqueta html)
 * @access Privado (requiere autenticación)
 * @body { lang: string }
 */
router.put('/lang', async (req, res) => {
  const { lang } = req.body;
  if (!lang || typeof lang !== 'string' || lang.trim().length < 2) {
    return res.status(400).json({ error: 'El código de lenguaje es requerido (ej: es, en, fr)' });
  }
  await setSetting(
    'lang',
    lang.trim(),
    'Lenguaje principal del sitio (etiqueta <html lang="...">)',
    'General', // categoría
    true,      // is_template_item
    'lang'     // slug para mustache
  );
  res.json({ message: 'Lenguaje del sitio actualizado', lang: lang.trim() });
});

/**
 * @route GET /api/settings/template
 * @desc Devuelve todas las configuraciones mustacheables para el template
 * @access Privado (requiere autenticación)
 */
router.get('/template', async (req, res) => {
  const items = await getTemplateSettings();
  res.json({ templateSettings: items });
});

module.exports = router; 