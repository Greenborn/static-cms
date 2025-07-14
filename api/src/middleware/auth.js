const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware de autenticación
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Token de autenticación requerido'
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verificar si el usuario existe en la base de datos
    const user = await db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [decoded.telegram_id]
    );

    const entorno = process.env.ENTORNO || 'DEV';

    if (!user) {
      // En entorno DEV, permitir acceso si el token es válido y el rol es admin
      if (entorno === 'DEV' && decoded.role === 'admin') {
        req.user = {
          telegram_id: decoded.telegram_id,
          username: decoded.username,
          role: decoded.role
        };
        return next();
      }
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar si el usuario tiene permisos de administrador
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    // Agregar información del usuario al request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado'
      });
    }

    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos específicos
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Permisos insuficientes'
      });
    }

    next();
  };
};

// Middleware para verificar sesión temporal
const checkTempSession = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        error: 'Token de sesión requerido'
      });
    }

    // Verificar si la sesión temporal existe y no ha expirado
    const session = await db.get(
      'SELECT * FROM temp_sessions WHERE token = ? AND expires_at > datetime("now")',
      [token]
    );

    if (!session) {
      return res.status(401).json({
        error: 'Sesión temporal inválida o expirada'
      });
    }

    // Obtener información del usuario
    const user = await db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [session.telegram_id]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    req.user = user;
    req.tempSession = session;
    next();

  } catch (error) {
    console.error('Error verificando sesión temporal:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Función para generar token JWT
const generateToken = (user) => {
  const payload = {
    telegram_id: user.telegram_id,
    username: user.username,
    role: user.role
  };

  const options = {
    expiresIn: process.env.TOKEN_EXPIRY || '1h'
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', options);
};

// Función para generar token de sesión temporal
const generateTempToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Función para crear sesión temporal
const createTempSession = async (telegramId) => {
  const token = generateTempToken();
  const expiresAt = new Date(Date.now() + (parseInt(process.env.TEMP_LINK_EXPIRY) || 300) * 1000);

  await db.run(
    'INSERT INTO temp_sessions (token, telegram_id, expires_at) VALUES (?, ?, ?)',
    [token, telegramId, expiresAt.toISOString()]
  );

  return token;
};

// Función para limpiar sesiones temporales expiradas
const cleanupExpiredSessions = async () => {
  try {
    await db.run(
      'DELETE FROM temp_sessions WHERE expires_at <= datetime("now")'
    );
  } catch (error) {
    console.error('Error limpiando sesiones expiradas:', error);
  }
};

// Ejecutar limpieza cada hora
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

module.exports = {
  authMiddleware,
  checkRole,
  checkTempSession,
  generateToken,
  generateTempToken,
  createTempSession,
  cleanupExpiredSessions
}; 