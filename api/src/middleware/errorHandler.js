// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message
    });
  }

  // Error de base de datos
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Error de restricción de base de datos',
      details: 'El registro ya existe o viola una restricción'
    });
  }

  // Error de archivo no encontrado
  if (err.code === 'ENOENT') {
    return res.status(404).json({
      error: 'Archivo no encontrado',
      details: err.message
    });
  }

  // Error de permisos de archivo
  if (err.code === 'EACCES') {
    return res.status(500).json({
      error: 'Error de permisos',
      details: 'No se tienen permisos para acceder al archivo'
    });
  }

  // Error de límite de tamaño de archivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      details: 'El archivo excede el tamaño máximo permitido'
    });
  }

  // Error de tipo de archivo no permitido
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Tipo de archivo no permitido',
      details: 'El tipo de archivo no está en la lista de tipos permitidos'
    });
  }

  // Error de Telegram
  if (err.code === 'TELEGRAM_ERROR') {
    return res.status(500).json({
      error: 'Error de Telegram',
      details: 'No se pudo comunicar con la API de Telegram'
    });
  }

  // Error de template Mustache
  if (err.name === 'MustacheError') {
    return res.status(500).json({
      error: 'Error en plantilla',
      details: 'Error al procesar la plantilla Mustache'
    });
  }

  // Error de procesamiento de imagen
  if (err.name === 'SharpError') {
    return res.status(500).json({
      error: 'Error de procesamiento de imagen',
      details: 'No se pudo procesar la imagen'
    });
  }

  // Error de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes',
      details: 'Has excedido el límite de solicitudes. Intenta de nuevo más tarde.'
    });
  }

  // Error por defecto
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

// Middleware para capturar errores asíncronos
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para crear errores personalizados
const createError = (statusCode, message, code = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (code) error.code = code;
  return error;
};

// Función para validar campos requeridos
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw createError(400, `Campos requeridos faltantes: ${missingFields.join(', ')}`);
  }
};

// Función para validar tipos de datos
const validateFieldTypes = (data, fieldTypes) => {
  for (const [field, expectedType] of Object.entries(fieldTypes)) {
    if (data[field] !== undefined) {
      const actualType = typeof data[field];
      if (actualType !== expectedType) {
        throw createError(400, `Campo '${field}' debe ser de tipo ${expectedType}, recibido ${actualType}`);
      }
    }
  }
};

// Función para sanitizar entrada
const sanitizeInput = (input, fieldName = null) => {
  if (typeof input === 'string') {
    // No sanitizar campos que contienen HTML
    if (fieldName === 'content' || fieldName === 'data') {
      return input.trim();
    }
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

// Función para validar y sanitizar objeto completo
const validateAndSanitize = (data, schema) => {
  const sanitized = {};
  
  for (const [field, config] of Object.entries(schema)) {
    if (config.required && !data[field]) {
      throw createError(400, `Campo requerido faltante: ${field}`);
    }
    
    if (data[field] !== undefined && data[field] !== null) {
      // Validar tipo
      if (config.type && typeof data[field] !== config.type) {
        throw createError(400, `Campo '${field}' debe ser de tipo ${config.type}`);
      }
      
      // Sanitizar
      sanitized[field] = sanitizeInput(data[field], field);
      
      // Validar longitud si se especifica
      if (config.maxLength && sanitized[field].length > config.maxLength) {
        throw createError(400, `Campo '${field}' excede la longitud máxima de ${config.maxLength}`);
      }
      
      // Validar formato si se especifica
      if (config.pattern && !config.pattern.test(sanitized[field])) {
        throw createError(400, `Campo '${field}' no cumple con el formato requerido`);
      }
    } else if (data[field] === null && config.allowNull) {
      // Permitir valores null si está configurado
      sanitized[field] = null;
    } else if (data[field] === null && !config.allowNull) {
      // Si no se permite null, asignar valor por defecto o string vacío
      sanitized[field] = config.default !== undefined ? config.default : '';
    }
  }
  
  return sanitized;
};

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  validateRequiredFields,
  validateFieldTypes,
  sanitizeInput,
  validateAndSanitize
}; 