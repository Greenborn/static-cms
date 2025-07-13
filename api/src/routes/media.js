const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { createError } = require('../middleware/errorHandler');

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,audio/mpeg,video/mp4').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, `Tipo de archivo no permitido: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB por defecto
  }
});

// Función para generar miniaturas de imágenes
const generateThumbnails = async (imagePath, originalId) => {
  try {
    const breakpoints = (process.env.BREAK_POINTS || '320,768,1024,1440').split(',').map(Number);
    const imageQuality = parseInt(process.env.IMAGE_QUALITY) || 85;
    
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    const thumbnails = [];
    
    for (const width of breakpoints) {
      if (metadata.width > width) {
        const thumbnailName = `${path.parse(imagePath).name}-${width}${path.extname(imagePath)}`;
        const thumbnailPath = path.join(path.dirname(imagePath), thumbnailName);
        
        await image
          .resize(width, null, { withoutEnlargement: true })
          .jpeg({ quality: imageQuality })
          .toFile(thumbnailPath);
        
        // Guardar miniatura en la base de datos
        const thumbnailResult = await db.run(
          'INSERT INTO images (name, alt, is_thumbnail, original_id, height, width, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            thumbnailName,
            `Thumbnail ${width}px`,
            true,
            originalId,
            Math.round((metadata.height * width) / metadata.width),
            width,
            thumbnailPath,
            (await fs.stat(thumbnailPath)).size,
            'image/jpeg'
          ]
        );
        
        thumbnails.push({
          id: thumbnailResult.id,
          name: thumbnailName,
          width: width,
          path: thumbnailPath
        });
      }
    }
    
    return thumbnails;
  } catch (error) {
    console.error('Error generando miniaturas:', error);
    throw error;
  }
};

// POST /api/media/upload
// Subir archivo multimedia
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw createError(400, 'No se proporcionó ningún archivo');
  }

  const { alt = '', description = '' } = req.body;
  const file = req.file;

  try {
    // Obtener información del archivo
    const stats = await fs.stat(file.path);
    const isImage = file.mimetype.startsWith('image/');

    // Guardar archivo original en la base de datos
    const result = await db.run(
      'INSERT INTO images (name, alt, is_thumbnail, original_id, height, width, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        file.filename,
        alt,
        false,
        null,
        null,
        null,
        file.path,
        stats.size,
        file.mimetype
      ]
    );

    let thumbnails = [];

    // Si es una imagen, generar miniaturas
    if (isImage) {
      try {
        const image = sharp(file.path);
        const metadata = await image.metadata();
        
        // Actualizar dimensiones de la imagen original
        await db.run(
          'UPDATE images SET height = ?, width = ? WHERE id = ?',
          [metadata.height, metadata.width, result.id]
        );

        // Generar miniaturas
        thumbnails = await generateThumbnails(file.path, result.id);
      } catch (error) {
        console.error('Error procesando imagen:', error);
        // Continuar sin miniaturas si hay error
      }
    }

    // Obtener el archivo guardado
    const savedFile = await db.get(
      'SELECT * FROM images WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      message: 'Archivo subido exitosamente',
      file: savedFile,
      thumbnails: thumbnails
    });

  } catch (error) {
    // Limpiar archivo si hay error
    await fs.remove(file.path);
    throw error;
  }
}));

// GET /api/media
// Obtener lista de archivos multimedia
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    type, 
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const validSortFields = ['name', 'file_size', 'created_at'];
  const validSortOrders = ['ASC', 'DESC'];

  if (!validSortFields.includes(sortBy)) {
    throw createError(400, 'Campo de ordenamiento inválido');
  }

  if (!validSortOrders.includes(sortOrder.toUpperCase())) {
    throw createError(400, 'Orden de clasificación inválido');
  }

  // Construir consulta con filtros
  let whereClause = 'WHERE is_thumbnail = FALSE';
  const params = [];

  if (type) {
    if (type === 'image') {
      whereClause += ' AND mime_type LIKE "image/%"';
    } else if (type === 'video') {
      whereClause += ' AND mime_type LIKE "video/%"';
    } else if (type === 'audio') {
      whereClause += ' AND mime_type LIKE "audio/%"';
    }
  }

  if (search) {
    whereClause += ' AND (name LIKE ? OR alt LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Obtener total de registros
  const countQuery = `SELECT COUNT(*) as total FROM images ${whereClause}`;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // Obtener archivos
  const query = `
    SELECT id, name, alt, is_thumbnail, original_id, height, width, file_path, file_size, mime_type, created_at
    FROM images 
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  const files = await db.all(query, [...params, parseInt(limit), offset]);

  res.status(200).json({
    files,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/media/:id
// Obtener un archivo específico
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const file = await db.get(
    'SELECT * FROM images WHERE id = ?',
    [id]
  );

  if (!file) {
    throw createError(404, 'Archivo no encontrado');
  }

  // Obtener miniaturas si es una imagen
  let thumbnails = [];
  if (file.mime_type.startsWith('image/') && !file.is_thumbnail) {
    thumbnails = await db.all(
      'SELECT * FROM images WHERE original_id = ? AND is_thumbnail = TRUE',
      [id]
    );
  }

  res.status(200).json({
    file,
    thumbnails
  });
}));

// GET /api/media/:id/thumbnails
// Obtener miniaturas de una imagen
router.get('/:id/thumbnails', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const originalImage = await db.get(
    'SELECT * FROM images WHERE id = ? AND is_thumbnail = FALSE',
    [id]
  );

  if (!originalImage) {
    throw createError(404, 'Imagen original no encontrada');
  }

  const thumbnails = await db.all(
    'SELECT * FROM images WHERE original_id = ? AND is_thumbnail = TRUE',
    [id]
  );

  res.status(200).json({
    original: originalImage,
    thumbnails
  });
}));

// PUT /api/media/:id
// Actualizar metadatos de un archivo
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { alt, description } = req.body;

  const file = await db.get(
    'SELECT * FROM images WHERE id = ?',
    [id]
  );

  if (!file) {
    throw createError(404, 'Archivo no encontrado');
  }

  // Actualizar metadatos
  await db.run(
    'UPDATE images SET alt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [alt || file.alt, id]
  );

  // Obtener archivo actualizado
  const updatedFile = await db.get(
    'SELECT * FROM images WHERE id = ?',
    [id]
  );

  res.status(200).json({
    message: 'Archivo actualizado exitosamente',
    file: updatedFile
  });
}));

// DELETE /api/media/:id
// Eliminar un archivo
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const file = await db.get(
    'SELECT * FROM images WHERE id = ?',
    [id]
  );

  if (!file) {
    throw createError(404, 'Archivo no encontrado');
  }

  try {
    // Eliminar archivo físico
    await fs.remove(file.file_path);

    // Si es imagen original, eliminar miniaturas
    if (file.mime_type.startsWith('image/') && !file.is_thumbnail) {
      const thumbnails = await db.all(
        'SELECT file_path FROM images WHERE original_id = ? AND is_thumbnail = TRUE',
        [id]
      );

      for (const thumbnail of thumbnails) {
        await fs.remove(thumbnail.file_path);
      }

      // Eliminar registros de miniaturas
      await db.run('DELETE FROM images WHERE original_id = ?', [id]);
    }

    // Eliminar registro principal
    await db.run('DELETE FROM images WHERE id = ?', [id]);

    res.status(200).json({
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando archivo:', error);
    throw createError(500, 'Error al eliminar archivo');
  }
}));

// POST /api/media/:id/regenerate-thumbnails
// Regenerar miniaturas de una imagen
router.post('/:id/regenerate-thumbnails', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const originalImage = await db.get(
    'SELECT * FROM images WHERE id = ? AND is_thumbnail = FALSE AND mime_type LIKE "image/%"',
    [id]
  );

  if (!originalImage) {
    throw createError(404, 'Imagen original no encontrada');
  }

  try {
    // Eliminar miniaturas existentes
    const existingThumbnails = await db.all(
      'SELECT file_path FROM images WHERE original_id = ? AND is_thumbnail = TRUE',
      [id]
    );

    for (const thumbnail of existingThumbnails) {
      await fs.remove(thumbnail.file_path);
    }

    await db.run('DELETE FROM images WHERE original_id = ? AND is_thumbnail = TRUE', [id]);

    // Generar nuevas miniaturas
    const newThumbnails = await generateThumbnails(originalImage.file_path, id);

    res.status(200).json({
      message: 'Miniaturas regeneradas exitosamente',
      thumbnails: newThumbnails
    });

  } catch (error) {
    console.error('Error regenerando miniaturas:', error);
    throw createError(500, 'Error al regenerar miniaturas');
  }
}));

// GET /api/media/stats
// Obtener estadísticas de archivos multimedia
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_files,
      SUM(file_size) as total_size,
      SUM(CASE WHEN mime_type LIKE 'image/%' THEN 1 ELSE 0 END) as images,
      SUM(CASE WHEN mime_type LIKE 'video/%' THEN 1 ELSE 0 END) as videos,
      SUM(CASE WHEN mime_type LIKE 'audio/%' THEN 1 ELSE 0 END) as audios
    FROM images 
    WHERE is_thumbnail = FALSE
  `);

  res.status(200).json({ stats });
}));

// GET /api/media/types
// Obtener tipos de archivo soportados
router.get('/types', asyncHandler(async (req, res) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,image/webp,audio/mpeg,video/mp4').split(',');
  
  const fileTypes = {
    images: allowedTypes.filter(type => type.startsWith('image/')),
    videos: allowedTypes.filter(type => type.startsWith('video/')),
    audios: allowedTypes.filter(type => type.startsWith('audio/')),
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024
  };

  res.status(200).json({ fileTypes });
}));

module.exports = router; 