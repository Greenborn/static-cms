#!/usr/bin/env node

/**
 * Script para sincronizar la configuración DOMINIO_ADMIN del backend con el frontend
 * Este script debe ejecutarse antes del build del panel de administración
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Lee un archivo .env y retorna un objeto con las variables
 * @param {string} envPath - Ruta al archivo .env
 * @returns {Object} - Objeto con las variables de entorno
 */
function parseEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) {
      return {};
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    logError(`Error al leer el archivo .env: ${error.message}`);
    return {};
  }
}

/**
 * Escribe un archivo .env con las variables proporcionadas
 * @param {string} envPath - Ruta al archivo .env
 * @param {Object} env - Objeto con las variables de entorno
 */
function writeEnvFile(envPath, env) {
  try {
    let content = '';
    
    Object.entries(env).forEach(([key, value]) => {
      content += `${key}=${value}\n`;
    });

    fs.writeFileSync(envPath, content, 'utf8');
    logSuccess(`Archivo .env actualizado: ${envPath}`);
  } catch (error) {
    logError(`Error al escribir el archivo .env: ${error.message}`);
    throw error;
  }
}

/**
 * Función principal que sincroniza la configuración
 */
function syncEnvConfig() {
  log('🔄 Iniciando sincronización de configuración del backend al frontend...', 'cyan');

  // Rutas de los archivos
  const backendEnvPath = path.join(__dirname, '../../api/.env');
  const frontendEnvPath = path.join(__dirname, '../.env');
  const frontendEnvExamplePath = path.join(__dirname, '../env.example');

  // Leer configuración del backend
  logInfo('Leyendo configuración del backend...');
  const backendEnv = parseEnvFile(backendEnvPath);
  
  // Variables que se sincronizan del backend al frontend
  const syncVariables = {
    DOMINIO_ADMIN: 'http://localhost:3000',
    ENTORNO: 'DEV',
    PORT: '3000'
  };

  // Verificar y establecer valores por defecto si no existen
  Object.keys(syncVariables).forEach(key => {
    if (!backendEnv[key]) {
      logWarning(`${key} no encontrado en el backend, usando valor por defecto: ${syncVariables[key]}`);
      backendEnv[key] = syncVariables[key];
    }
  });

  logInfo(`Variables del backend:`);
  Object.keys(syncVariables).forEach(key => {
    logInfo(`  ${key}: ${backendEnv[key]}`);
  });

  // Leer configuración actual del frontend
  logInfo('Leyendo configuración actual del frontend...');
  const frontendEnv = parseEnvFile(frontendEnvPath);

  // Verificar si hay cambios
  let hasChanges = false;
  Object.keys(syncVariables).forEach(key => {
    if (frontendEnv[key] !== backendEnv[key]) {
      hasChanges = true;
      logInfo(`Actualizando ${key}: ${frontendEnv[key] || 'no definido'} → ${backendEnv[key]}`);
    }
  });

  if (!hasChanges) {
    logSuccess('Todas las configuraciones ya están sincronizadas');
    return;
  }

  // Actualizar configuración del frontend
  logInfo('Actualizando configuración del frontend...');
  Object.keys(syncVariables).forEach(key => {
    frontendEnv[key] = backendEnv[key];
  });

  // Escribir archivo .env del frontend
  writeEnvFile(frontendEnvPath, frontendEnv);

  logSuccess('Sincronización completada exitosamente');
  logInfo('Variables sincronizadas: ' + Object.keys(syncVariables).join(', '));
}

// Ejecutar el script
if (require.main === module) {
  try {
    syncEnvConfig();
  } catch (error) {
    logError(`Error durante la sincronización: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { syncEnvConfig }; 