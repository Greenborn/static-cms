const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');
const contentTypeRoutes = require('./routes/contentTypes');
const viewRoutes = require('./routes/views');
const mediaRoutes = require('./routes/media');
const formatterRoutes = require('./routes/formatters');
const siteBuilderRoutes = require('./routes/siteBuilder');

const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Función para verificar y construir el panel de administración
const ensureAdminPanelBuilt = async () => {
  const adminBuildPath = path.resolve(__dirname, '../../panel_admin/dist');
  const adminPackagePath = path.resolve(__dirname, '../../panel_admin/package.json');
  
  try {
    // Verificar si existe el directorio de build
    const buildExists = await fs.pathExists(adminBuildPath);
    const packageExists = await fs.pathExists(adminPackagePath);
    
    if (!packageExists) {
      console.log('⚠️  Panel de administración no encontrado en ../panel_admin/');
      return false;
    }
    
    if (!buildExists) {
      console.log('🔨 Panel de administración no compilado. Iniciando build automático...');
      
      // Verificar si node_modules existe
      const nodeModulesPath = path.resolve(__dirname, '../../panel_admin/node_modules');
      const nodeModulesExists = await fs.pathExists(nodeModulesPath);
      
      if (!nodeModulesExists) {
        console.log('📦 Instalando dependencias del panel de administración...');
        await runCommand('npm', ['install'], '../../panel_admin');
      }
      
      console.log('🏗️  Compilando panel de administración...');
      await runCommand('npm', ['run', 'build'], '../../panel_admin');
      
      console.log('✅ Panel de administración compilado exitosamente');
      return true;
    }
    
    console.log('✅ Panel de administración ya está compilado');
    return true;
    
  } catch (error) {
    console.error('❌ Error construyendo panel de administración:', error.message);
    return false;
  }
};

// Función para ejecutar comandos
const runCommand = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: path.resolve(__dirname, cwd),
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`[${command}] ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`[${command}] ERROR: ${data.toString().trim()}`);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
};

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configuración de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:8080', 'http://localhost:3000'],
  credentials: true
}));

// Compresión
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas
app.use('/api/pages', authMiddleware, pageRoutes);
app.use('/api/content-types', authMiddleware, contentTypeRoutes);
app.use('/api/views', authMiddleware, viewRoutes);
app.use('/api/media', authMiddleware, mediaRoutes);
app.use('/api/formatters', authMiddleware, formatterRoutes);
app.use('/api/site-builder', authMiddleware, siteBuilderRoutes);

// Servir el panel de administración (frontend)
const adminBuildPath = path.resolve(__dirname, '../../panel_admin/dist');
app.use('/admin', express.static(adminBuildPath));

// Redirigir cualquier ruta desconocida de /admin al index.html del frontend (SPA)
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(adminBuildPath, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Manejo de errores
app.use(errorHandler);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Inicialización del servidor
const startServer = async () => {
  try {
    // Verificar y construir panel de administración si es necesario
    await ensureAdminPanelBuilt();
    
    app.listen(PORT, () => {
      console.log(`🚀 Static CMS API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🎛️  Panel admin: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 