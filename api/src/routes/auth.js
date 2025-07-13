const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const db = require('../config/database');
const { 
  generateToken, 
  createTempSession, 
  checkTempSession,
  asyncHandler 
} = require('../middleware/auth');
const { 
  createError, 
  validateRequiredFields,
  validateAndSanitize 
} = require('../middleware/errorHandler');

const router = express.Router();

// Inicializar bot de Telegram
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });

// Esquema de validación para solicitud de acceso
const requestAccessSchema = {
  telegram_username: {
    type: 'string',
    required: true,
    maxLength: 32,
    pattern: /^[a-zA-Z0-9_]{5,32}$/
  }
};

// POST /api/auth/request-access
// Solicitar acceso temporal al panel de administración
router.post('/request-access', asyncHandler(async (req, res) => {
  const { telegram_username } = validateAndSanitize(req.body, requestAccessSchema);

  try {
    // Verificar si el usuario existe en Telegram
    const updates = await bot.getUpdates();
    const user = updates.find(update => 
      update.message?.from?.username === telegram_username
    );

    if (!user) {
      throw createError(404, 'Usuario de Telegram no encontrado');
    }

    const telegramId = user.message.from.id;
    const firstName = user.message.from.first_name;
    const lastName = user.message.from.last_name;

    // Verificar si el usuario está autorizado
    const allowedUsers = [
      parseInt(process.env.TELEGRAM_USER_ADMIN),
      parseInt(process.env.TELEGRAM_USER_CHECKER)
    ].filter(Boolean);

    if (!allowedUsers.includes(telegramId)) {
      throw createError(403, 'Usuario no autorizado para acceder al panel');
    }

    // Crear o actualizar usuario en la base de datos
    const existingUser = await db.get(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    if (existingUser) {
      await db.run(
        'UPDATE users SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?',
        [telegram_username, firstName, lastName, telegramId]
      );
    } else {
      await db.run(
        'INSERT INTO users (telegram_id, username, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
        [telegramId, telegram_username, firstName, lastName, 'admin']
      );
    }

    // Crear sesión temporal
    const tempToken = await createTempSession(telegramId);

    // Enviar mensaje al usuario con el enlace de acceso
    const accessUrl = `${process.env.BASE_URL}/api/auth/access/${tempToken}`;
    
    await bot.sendMessage(
      telegramId,
      `🔐 **Acceso al Panel de Administración**\n\n` +
      `Hola ${firstName}! Has solicitado acceso al panel de administración.\n\n` +
      `Para acceder, haz clic en el siguiente enlace:\n` +
      `${accessUrl}\n\n` +
      `⚠️ **Este enlace expira en ${process.env.TEMP_LINK_EXPIRY || 300} segundos**\n\n` +
      `Si no solicitaste este acceso, ignora este mensaje.`,
      { parse_mode: 'Markdown' }
    );

    res.status(200).json({
      message: 'Solicitud de acceso enviada',
      details: 'Revisa tu Telegram para el enlace de acceso'
    });

  } catch (error) {
    if (error.response?.statusCode === 403) {
      throw createError(403, 'Bot bloqueado por el usuario');
    }
    throw error;
  }
}));

// GET /api/auth/access/:token
// Verificar token de acceso temporal y generar token JWT
router.get('/access/:token', checkTempSession, asyncHandler(async (req, res) => {
  const { user, tempSession } = req;

  // Eliminar la sesión temporal ya que se usó
  await db.run(
    'DELETE FROM temp_sessions WHERE token = ?',
    [tempSession.token]
  );

  // Generar token JWT
  const token = generateToken(user);

  // Redirigir al panel de administración con el token
  const adminUrl = `${process.env.BASE_URL.replace('/api', '')}/admin?token=${token}`;
  
  res.redirect(adminUrl);
}));

// POST /api/auth/verify
// Verificar token JWT y devolver información del usuario
router.post('/verify', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw createError(400, 'Token requerido');
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const user = await db.get(
      'SELECT id, telegram_id, username, first_name, last_name, role, created_at FROM users WHERE telegram_id = ?',
      [decoded.telegram_id]
    );

    if (!user) {
      throw createError(401, 'Usuario no encontrado');
    }

    res.status(200).json({
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at
      },
      token: token
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw createError(401, 'Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
      throw createError(401, 'Token expirado');
    }
    throw error;
  }
}));

// POST /api/auth/logout
// Invalidar token (implementación básica - en producción usar blacklist)
router.post('/logout', asyncHandler(async (req, res) => {
  // En una implementación real, agregaríamos el token a una blacklist
  // Por ahora, solo devolvemos éxito
  res.status(200).json({
    message: 'Sesión cerrada exitosamente'
  });
}));

// GET /api/auth/me
// Obtener información del usuario actual
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw createError(401, 'Token requerido');
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const user = await db.get(
      'SELECT id, telegram_id, username, first_name, last_name, role, created_at FROM users WHERE telegram_id = ?',
      [decoded.telegram_id]
    );

    if (!user) {
      throw createError(401, 'Usuario no encontrado');
    }

    res.status(200).json({
      user: {
        id: user.id,
        telegram_id: user.telegram_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw createError(401, 'Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
      throw createError(401, 'Token expirado');
    }
    throw error;
  }
}));

// Webhook para recibir mensajes del bot (opcional)
router.post('/webhook', asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(200).json({ status: 'ok' });
  }

  const chatId = message.chat.id;
  const text = message.text;
  const from = message.from;

  // Solo procesar mensajes del chat configurado
  if (chatId.toString() !== process.env.TELEGRAM_CHAT_ID) {
    return res.status(200).json({ status: 'ok' });
  }

  // Comandos básicos del bot
  if (text === '/start') {
    await bot.sendMessage(chatId, 
      '🤖 **Static CMS Bot**\n\n' +
      'Bienvenido al bot de administración del Static CMS.\n\n' +
      'Comandos disponibles:\n' +
      '/status - Estado del sistema\n' +
      '/help - Ayuda\n\n' +
      'Para acceder al panel, solicita acceso desde la aplicación web.',
      { parse_mode: 'Markdown' }
    );
  } else if (text === '/status') {
    await bot.sendMessage(chatId,
      '📊 **Estado del Sistema**\n\n' +
      `✅ API: Activa\n` +
      `✅ Base de datos: Conectada\n` +
      `🌐 Entorno: ${process.env.NODE_ENV}\n` +
      `⏰ Hora: ${new Date().toLocaleString()}`,
      { parse_mode: 'Markdown' }
    );
  } else if (text === '/help') {
    await bot.sendMessage(chatId,
      '❓ **Ayuda**\n\n' +
      'Este bot maneja la autenticación del panel de administración del Static CMS.\n\n' +
      'Para acceder al panel:\n' +
      '1. Ve a la aplicación web\n' +
      '2. Solicita acceso con tu usuario de Telegram\n' +
      '3. Recibirás un enlace temporal\n' +
      '4. Haz clic en el enlace para acceder\n\n' +
      'Comandos:\n' +
      '/start - Iniciar bot\n' +
      '/status - Estado del sistema\n' +
      '/help - Esta ayuda',
      { parse_mode: 'Markdown' }
    );
  }

  res.status(200).json({ status: 'ok' });
}));

module.exports = router; 