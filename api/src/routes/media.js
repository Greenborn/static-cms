const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const { getBreakpointsOrdered } = require('../models/breakpoints');

const router = express.Router();

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

// POST /api/media/upload
// Subir archivo
router.post('/upload', authMiddleware, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError(400, 'No se proporcionó ningún archivo');
  }

  // Guardar imagen original (ya guardada por multer)
  const fileUrl = `/i/${req.file.filename}`;
  const originalPath = req.file.path;
  const ext = path.extname(req.file.filename);
  const baseName = path.basename(req.file.filename, ext);

  // Procesar breakpoints
  let breakpoints = [];
  try {
    breakpoints = await getBreakpointsOrdered();
  } catch (e) {
    // Si falla, continuar solo con la original
    breakpoints = [];
  }

  const resizedFiles = [];
  for (const bp of breakpoints) {
    if (bp.valor_px > 0) {
      const bpDir = path.join(__dirname, '../../../public/i', bp.nombre);
      if (!fs.existsSync(bpDir)) {
        fs.mkdirSync(bpDir, { recursive: true });
      }
      const resizedPath = path.join(bpDir, req.file.filename);
      try {
        await sharp(originalPath)
          .resize({ width: bp.valor_px })
          .toFile(resizedPath);
        resizedFiles.push({
          nombre: bp.nombre,
          url: `/i/${bp.nombre}/${req.file.filename}`,
          path: resizedPath,
          width: bp.valor_px
        });
      } catch (err) {
        // Si falla un breakpoint, continuar con los demás
        console.error(`Error generando imagen para breakpoint ${bp.nombre}:`, err);
      }
    }
  }

  // Información del archivo
  const fileInfo = {
    originalName: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    url: fileUrl,
    path: req.file.path,
    resized: resizedFiles
  };

  res.status(200).json({
    message: 'Archivo subido y optimizado exitosamente',
    url: fileUrl,
    file: fileInfo
  });
}));

// POST /api/media/upload-multiple
// Subir múltiples archivos
router.post('/upload-multiple', authMiddleware, upload.array('files', 10), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw createError(400, 'No se proporcionaron archivos');
  }

  const files = req.files.map(file => ({
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    url: `/i/${file.filename}`,
    path: file.path
  }));

  res.status(200).json({
    message: 'Archivos subidos exitosamente',
    files: files
  });
}));

// GET /api/media/files
// Listar archivos en el directorio de imágenes
router.get('/files', authMiddleware, asyncHandler(async (req, res) => {
  const uploadDir = path.join(__dirname, '../../../public/i');
  
  // Crear directorio si no existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  try {
    const files = fs.readdirSync(uploadDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename: filename,
        url: `/i/${filename}`,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });

    res.status(200).json({
      files: fileList
    });
  } catch (error) {
    throw createError(500, 'Error al leer archivos');
  }
}));

// DELETE /api/media/files/:filename
// Eliminar archivo
router.delete('/files/:filename', authMiddleware, asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../../../public/i', filename);

  if (!fs.existsSync(filePath)) {
    throw createError(404, 'Archivo no encontrado');
  }

  try {
    fs.unlinkSync(filePath);
    res.status(200).json({
      message: 'Archivo eliminado exitosamente'
    });
  } catch (error) {
    throw createError(500, 'Error al eliminar archivo');
  }
}));

module.exports = router; 