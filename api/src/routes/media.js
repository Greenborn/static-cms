const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const { getBreakpointsOrdered } = require('../models/breakpoints');
const MediaCategories = require('../models/mediaCategories');
const MediaFiles = require('../models/mediaFiles');

const router = express.Router();

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Sube un archivo multimedia y genera miniaturas según breakpoints.
 *     tags:
 *       - Multimedia
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Archivo subido y miniaturas generadas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 url:
 *                   type: string
 *                 file:
 *                   type: object
 *                   properties:
 *                     originalName:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     mimetype:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     url:
 *                       type: string
 *                     resized:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nombre:
 *                             type: string
 *                           url:
 *                             type: string
 *                           width:
 *                             type: integer
 *       400:
 *         description: Error de validación o archivo no permitido.
 *       401:
 *         description: No autenticado.
 *
 * /api/media/upload-multiple:
 *   post:
 *     summary: Sube múltiples archivos multimedia.
 *     tags:
 *       - Multimedia
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Archivos subidos exitosamente.
 *       400:
 *         description: Error de validación.
 *       401:
 *         description: No autenticado.
 *
 * /api/media/files:
 *   get:
 *     summary: Lista los archivos multimedia disponibles en el directorio público.
 *     tags:
 *       - Multimedia
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de archivos.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       url:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       created:
 *                         type: string
 *                         format: date-time
 *                       modified:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autenticado.
 *
 * /api/media/files/{filename}:
 *   delete:
 *     summary: Elimina un archivo multimedia específico.
 *     tags:
 *       - Multimedia
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del archivo a eliminar
 *     responses:
 *       200:
 *         description: Archivo eliminado exitosamente.
 *       404:
 *         description: Archivo no encontrado.
 *       401:
 *         description: No autenticado.
 */
// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crear directorio de imágenes si no existe
    const uploadDir = path.join(__dirname, '../../../public/i');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  // Tipos de archivo permitidos
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'text/plain': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(createError(400, 'Tipo de archivo no permitido'), false);
  }
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

// =====================
// Endpoints de categorías
// =====================

/**
 * @route GET /api/media/categories
 * @desc Listar categorías de archivos multimedia
 * @access Privado
 */
router.get('/categories', authMiddleware, asyncHandler(async (req, res) => {
  const categories = await MediaCategories.getAll();
  res.status(200).json({ categories });
}));

/**
 * @route POST /api/media/categories
 * @desc Crear nueva categoría
 * @access Privado
 */
router.post('/categories', authMiddleware, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    throw createError(400, 'Nombre de categoría requerido');
  }
  const category = await MediaCategories.create(name);
  res.status(201).json({ category });
}));

/**
 * @route DELETE /api/media/categories/:id
 * @desc Eliminar categoría
 * @access Privado
 */
router.delete('/categories/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await MediaCategories.remove(id);
  res.status(200).json({ message: 'Categoría eliminada' });
}));

// =====================
// Endpoints de archivos multimedia con categoría
// =====================

/**
 * @route GET /api/media/files
 * @desc Listar archivos multimedia, opcionalmente filtrados por categoría
 * @access Privado
 */
router.get('/files', authMiddleware, asyncHandler(async (req, res) => {
  const { category_id } = req.query;
  const files = await MediaFiles.getAll({ categoryId: category_id });
  res.status(200).json({ files });
}));

/**
 * @route POST /api/media/upload
 * @desc Subir archivo multimedia con categoría asociada
 * @access Privado
 */
router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
  const { category_id } = req.body;
  if (!req.file) {
    throw createError(400, 'No se proporcionó ningún archivo');
  }
  // Guardar imagen original (ya guardada por multer)
  const fileUrl = `/i/${req.file.filename}`;
  // Limpiar el nombre original del archivo para evitar problemas de encoding
  const cleanOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  
  // Guardar metadata en la base de datos
  const fileInfo = await MediaFiles.create({
    filename: req.file.filename,
    original_name: cleanOriginalName,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: fileUrl,
    category_id: category_id || null
  });

  // === Generar miniaturas para cada breakpoint ===
  let resized = [];
  if (req.file.mimetype && req.file.mimetype.startsWith('image/')) {
    const breakpoints = await getBreakpointsOrdered();
    const ext = path.extname(req.file.filename);
    const name = path.basename(req.file.filename, ext);
    const inputPath = path.join(__dirname, '../../../public/i', req.file.filename);
    for (const bp of breakpoints) {
      const width = parseInt(bp.valor_px);
      if (!width || isNaN(width)) continue;
      const thumbName = `${name}_${bp.nombre}${ext}`;
      const thumbPath = path.join(__dirname, '../../../public/i', thumbName);
      try {
        await sharp(inputPath)
          .resize({ width, withoutEnlargement: true })
          .toFile(thumbPath);
        resized.push({ nombre: bp.nombre, url: `/i/${thumbName}`, width });
      } catch (err) {
        console.error(`Error generando miniatura ${thumbName}:`, err);
      }
    }
  }

  res.status(200).json({
    message: 'Archivo subido exitosamente',
    file: fileInfo,
    resized
  });
}));

/**
 * @route POST /api/media/regenerate-thumbnails/:id
 * @desc Regenera las miniaturas de una imagen existente
 * @access Privado (requiere autenticación)
 */
router.post('/regenerate-thumbnails/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const file = await MediaFiles.getById(id);
  if (!file) {
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return res.status(400).json({ message: 'El archivo no es una imagen' });
  }
  const breakpoints = await getBreakpointsOrdered();
  const ext = path.extname(file.filename);
  const name = path.basename(file.filename, ext);
  const inputPath = path.join(__dirname, '../../../public/i', file.filename);
  let resized = [];
  for (const bp of breakpoints) {
    const width = parseInt(bp.valor_px);
    if (!width || isNaN(width)) continue;
    const thumbName = `${name}_${bp.nombre}${ext}`;
    const thumbPath = path.join(__dirname, '../../../public/i', thumbName);
    try {
      await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .toFile(thumbPath);
      resized.push({ nombre: bp.nombre, url: `/i/${thumbName}`, width });
    } catch (err) {
      console.error(`Error generando miniatura ${thumbName}:`, err);
    }
  }
  res.status(200).json({ message: 'Miniaturas regeneradas', resized });
}));

/**
 * @route PATCH /api/media/files/:id
 * @desc Cambiar la categoría de un archivo multimedia
 * @access Privado
 */
router.patch('/files/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category_id } = req.body;
  if (!category_id) {
    throw createError(400, 'ID de categoría requerido');
  }
  await MediaFiles.updateCategory(id, category_id);
  res.status(200).json({ message: 'Categoría actualizada' });
}));

/**
 * @route DELETE /api/media/files/:id
 * @desc Eliminar archivo multimedia
 * @access Privado
 */
router.delete('/files/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  await MediaFiles.remove(id);
  res.status(200).json({ message: 'Archivo eliminado' });
}));

/**
 * @route GET /api/media/preview/:id
 * @desc Sirve la imagen original (o miniatura si se especifica) para vista previa en el panel admin
 * @access Privado (requiere autenticación)
 * @query ?size=breakpoint (opcional)
 */
router.get('/preview/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { size } = req.query;
  const file = await MediaFiles.getById(id);
  if (!file) {
    return res.status(404).json({ message: 'Archivo no encontrado' });
  }
  let filePath = path.join(__dirname, '../../../public/i', file.filename);
  // Si se solicita una miniatura por breakpoint
  if (size) {
    const ext = path.extname(file.filename);
    const name = path.basename(file.filename, ext);
    const thumbName = `${name}_${size}${ext}`;
    const thumbPath = path.join(__dirname, '../../../public/i', thumbName);
    if (fs.existsSync(thumbPath)) {
      filePath = thumbPath;
    }
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Archivo no encontrado en disco' });
  }
  res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
  res.sendFile(filePath);
}));

module.exports = router; 