const express = require('express');
const db = require('../config/database');
const { asyncHandler } = require('../middleware/auth');
const { 
  createError, 
  validateAndSanitize 
} = require('../middleware/errorHandler');

const router = express.Router();

// Esquema de validación para formateadores
const formatterSchema = {
  name: {
    type: 'string',
    required: true,
    maxLength: 100
  },
  type: {
    type: 'string',
    required: true,
    pattern: /^(decimal|currency|datetime)$/
  },
  config: {
    type: 'string',
    required: true
  }
};

// Validación de configuración según tipo
const validateFormatterConfig = (type, configJson) => {
  try {
    const config = JSON.parse(configJson);
    
    switch (type) {
      case 'decimal':
        if (typeof config.decimals !== 'number' || config.decimals < 0 || config.decimals > 10) {
          throw new Error('Los decimales deben ser un número entre 0 y 10');
        }
        if (config.separator && typeof config.separator !== 'string') {
          throw new Error('El separador debe ser una cadena de texto');
        }
        break;
        
      case 'currency':
        if (!config.currency || typeof config.currency !== 'string') {
          throw new Error('La moneda es requerida y debe ser una cadena de texto');
        }
        if (typeof config.decimals !== 'number' || config.decimals < 0 || config.decimals > 4) {
          throw new Error('Los decimales deben ser un número entre 0 y 4');
        }
        if (config.symbol && typeof config.symbol !== 'string') {
          throw new Error('El símbolo debe ser una cadena de texto');
        }
        if (config.position && !['before', 'after'].includes(config.position)) {
          throw new Error('La posición debe ser "before" o "after"');
        }
        break;
        
      case 'datetime':
        if (!config.format || typeof config.format !== 'string') {
          throw new Error('El formato de fecha es requerido');
        }
        if (config.timezone && typeof config.timezone !== 'string') {
          throw new Error('La zona horaria debe ser una cadena de texto');
        }
        if (config.locale && typeof config.locale !== 'string') {
          throw new Error('El locale debe ser una cadena de texto');
        }
        break;
        
      default:
        throw new Error('Tipo de formateador no válido');
    }
    
    return true;
  } catch (error) {
    throw new Error(`Error en la configuración: ${error.message}`);
  }
};

// GET /api/formatters
// Obtener lista de formateadores
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    type,
    search,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const validSortFields = ['name', 'type', 'created_at'];
  const validSortOrders = ['ASC', 'DESC'];

  if (!validSortFields.includes(sortBy)) {
    throw createError(400, 'Campo de ordenamiento inválido');
  }

  if (!validSortOrders.includes(sortOrder.toUpperCase())) {
    throw createError(400, 'Orden de clasificación inválido');
  }

  // Construir consulta con filtros
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (type) {
    whereClause += ' AND type = ?';
    params.push(type);
  }

  if (search) {
    whereClause += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  // Obtener total de registros
  const countQuery = `SELECT COUNT(*) as total FROM formatters ${whereClause}`;
  const countResult = await db.get(countQuery, params);
  const total = countResult.total;

  // Obtener formateadores
  const query = `
    SELECT id, name, type, config, created_at
    FROM formatters 
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;
  
  const formatters = await db.all(query, [...params, parseInt(limit), offset]);

  // Parsear configuración JSON
  const parsedFormatters = formatters.map(f => ({
    ...f,
    config: JSON.parse(f.config)
  }));

  res.status(200).json({
    formatters: parsedFormatters,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// GET /api/formatters/:id
// Obtener un formateador específico
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const formatter = await db.get(
    'SELECT * FROM formatters WHERE id = ?',
    [id]
  );

  if (!formatter) {
    throw createError(404, 'Formateador no encontrado');
  }

  // Parsear configuración JSON
  formatter.config = JSON.parse(formatter.config);

  res.status(200).json({ formatter });
}));

// POST /api/formatters
// Crear un nuevo formateador
router.post('/', asyncHandler(async (req, res) => {
  const formatterData = validateAndSanitize(req.body, formatterSchema);

  // Validar configuración según tipo
  validateFormatterConfig(formatterData.type, formatterData.config);

  // Verificar si el nombre ya existe
  const existingFormatter = await db.get(
    'SELECT id FROM formatters WHERE name = ?',
    [formatterData.name]
  );

  if (existingFormatter) {
    throw createError(409, 'Ya existe un formateador con este nombre');
  }

  // Insertar nuevo formateador
  const result = await db.run(
    'INSERT INTO formatters (name, type, config) VALUES (?, ?, ?)',
    [
      formatterData.name,
      formatterData.type,
      formatterData.config
    ]
  );

  // Obtener el formateador creado
  const newFormatter = await db.get(
    'SELECT * FROM formatters WHERE id = ?',
    [result.id]
  );

  // Parsear configuración JSON
  newFormatter.config = JSON.parse(newFormatter.config);

  res.status(201).json({
    message: 'Formateador creado exitosamente',
    formatter: newFormatter
  });
}));

// PUT /api/formatters/:id
// Actualizar un formateador existente
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const formatterData = validateAndSanitize(req.body, formatterSchema);

  // Validar configuración si se proporciona
  if (formatterData.config) {
    validateFormatterConfig(formatterData.type, formatterData.config);
  }

  // Verificar si el formateador existe
  const existingFormatter = await db.get(
    'SELECT id FROM formatters WHERE id = ?',
    [id]
  );

  if (!existingFormatter) {
    throw createError(404, 'Formateador no encontrado');
  }

  // Verificar si el nombre ya existe en otro formateador
  if (formatterData.name) {
    const nameExists = await db.get(
      'SELECT id FROM formatters WHERE name = ? AND id != ?',
      [formatterData.name, id]
    );

    if (nameExists) {
      throw createError(409, 'Ya existe otro formateador con este nombre');
    }
  }

  // Actualizar formateador
  const updateFields = [];
  const updateValues = [];

  Object.keys(formatterData).forEach(key => {
    if (formatterData[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      updateValues.push(formatterData[key]);
    }
  });

  updateValues.push(id);

  await db.run(
    `UPDATE formatters SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );

  // Obtener el formateador actualizado
  const updatedFormatter = await db.get(
    'SELECT * FROM formatters WHERE id = ?',
    [id]
  );

  // Parsear configuración JSON
  updatedFormatter.config = JSON.parse(updatedFormatter.config);

  res.status(200).json({
    message: 'Formateador actualizado exitosamente',
    formatter: updatedFormatter
  });
}));

// DELETE /api/formatters/:id
// Eliminar un formateador
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar si el formateador existe
  const existingFormatter = await db.get(
    'SELECT id FROM formatters WHERE id = ?',
    [id]
  );

  if (!existingFormatter) {
    throw createError(404, 'Formateador no encontrado');
  }

  // Eliminar formateador
  await db.run('DELETE FROM formatters WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Formateador eliminado exitosamente'
  });
}));

// POST /api/formatters/:id/test
// Probar un formateador con datos de ejemplo
router.post('/:id/test', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { value } = req.body;

  if (value === undefined) {
    throw createError(400, 'Valor requerido para la prueba');
  }

  const formatter = await db.get(
    'SELECT * FROM formatters WHERE id = ?',
    [id]
  );

  if (!formatter) {
    throw createError(404, 'Formateador no encontrado');
  }

  const config = JSON.parse(formatter.config);
  let formattedValue;

  try {
    switch (formatter.type) {
      case 'decimal':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          throw new Error('El valor debe ser un número');
        }
        formattedValue = numValue.toFixed(config.decimals || 2);
        if (config.separator) {
          formattedValue = formattedValue.replace('.', config.separator);
        }
        break;

      case 'currency':
        const currencyValue = parseFloat(value);
        if (isNaN(currencyValue)) {
          throw new Error('El valor debe ser un número');
        }
        const symbol = config.symbol || config.currency;
        const position = config.position || 'before';
        const formattedNumber = currencyValue.toFixed(config.decimals || 2);
        
        if (position === 'before') {
          formattedValue = `${symbol}${formattedNumber}`;
        } else {
          formattedValue = `${formattedNumber}${symbol}`;
        }
        break;

      case 'datetime':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          throw new Error('El valor debe ser una fecha válida');
        }
        
        // Implementación básica de formato de fecha
        const format = config.format || 'YYYY-MM-DD HH:mm:ss';
        formattedValue = format
          .replace('YYYY', dateValue.getFullYear())
          .replace('MM', String(dateValue.getMonth() + 1).padStart(2, '0'))
          .replace('DD', String(dateValue.getDate()).padStart(2, '0'))
          .replace('HH', String(dateValue.getHours()).padStart(2, '0'))
          .replace('mm', String(dateValue.getMinutes()).padStart(2, '0'))
          .replace('ss', String(dateValue.getSeconds()).padStart(2, '0'));
        break;

      default:
        throw new Error('Tipo de formateador no soportado');
    }

    res.status(200).json({
      original: value,
      formatted: formattedValue,
      formatter: {
        id: formatter.id,
        name: formatter.name,
        type: formatter.type,
        config: config
      }
    });

  } catch (error) {
    throw createError(400, `Error al formatear: ${error.message}`);
  }
}));

// GET /api/formatters/types
// Obtener tipos de formateadores disponibles
router.get('/types', asyncHandler(async (req, res) => {
  const formatterTypes = [
    {
      type: 'decimal',
      name: 'Numérico Decimal',
      description: 'Formatea números con decimales y separadores personalizados',
      configSchema: {
        decimals: { type: 'number', required: true, min: 0, max: 10 },
        separator: { type: 'string', required: false }
      },
      example: {
        value: 1234.5678,
        config: { decimals: 2, separator: ',' },
        result: '1.234,57'
      }
    },
    {
      type: 'currency',
      name: 'Moneda',
      description: 'Formatea valores monetarios con símbolo y posición personalizable',
      configSchema: {
        currency: { type: 'string', required: true },
        symbol: { type: 'string', required: false },
        decimals: { type: 'number', required: false, min: 0, max: 4 },
        position: { type: 'string', required: false, enum: ['before', 'after'] }
      },
      example: {
        value: 1234.56,
        config: { currency: 'USD', symbol: '$', decimals: 2, position: 'before' },
        result: '$1234.56'
      }
    },
    {
      type: 'datetime',
      name: 'Fecha y Hora',
      description: 'Formatea fechas y horas con formato personalizable',
      configSchema: {
        format: { type: 'string', required: true },
        timezone: { type: 'string', required: false },
        locale: { type: 'string', required: false }
      },
      example: {
        value: '2023-12-25T10:30:00',
        config: { format: 'DD/MM/YYYY HH:mm' },
        result: '25/12/2023 10:30'
      }
    }
  ];

  res.status(200).json({ formatterTypes });
}));

// GET /api/formatters/stats
// Obtener estadísticas de formateadores
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await db.get(`
    SELECT 
      COUNT(*) as total_formatters,
      SUM(CASE WHEN type = 'decimal' THEN 1 ELSE 0 END) as decimal_formatters,
      SUM(CASE WHEN type = 'currency' THEN 1 ELSE 0 END) as currency_formatters,
      SUM(CASE WHEN type = 'datetime' THEN 1 ELSE 0 END) as datetime_formatters
    FROM formatters
  `);

  res.status(200).json({ stats });
}));

module.exports = router; 