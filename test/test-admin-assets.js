// Script de prueba para verificar la entrega de archivos del front admin
// Ejecutar: node test/test-admin-assets.js

/**
 * Este script verifica que:
 * - El panel admin responde en /admin
 * - Los assets JS/CSS del build están accesibles en /assets
 * - Usa la variable DOMINIO_ADMIN del .env
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');

// Cargar variables de entorno
const envPath = path.resolve(__dirname, '../api/.env');
const env = dotenv.parse(fs.readFileSync(envPath));

const DOMINIO_ADMIN = env.DOMINIO_ADMIN || 'http://localhost:3000';

// Leer archivos del build para probar
const assetsDir = path.resolve(__dirname, '../panel_admin/dist/assets');
const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js') || f.endsWith('.css'));

async function testAdminPanel() {
  try {
    // Probar acceso al panel admin
    const res = await axios.get(`${DOMINIO_ADMIN}/admin`);
    if (res.status === 200 && res.data.includes('<div id="app"></div>')) {
      console.log('✅ /admin responde correctamente');
    } else {
      console.error('❌ /admin no responde como se espera');
    }
  } catch (err) {
    console.error('❌ Error accediendo a /admin:', err.message);
  }
}

async function testAssets() {
  let ok = 0, fail = 0;
  for (const file of files) {
    const url = `${DOMINIO_ADMIN}/assets/${file}`;
    try {
      const res = await axios.get(url);
      if (res.status === 200) {
        console.log(`✅ Asset disponible: ${url}`);
        ok++;
      } else {
        console.error(`❌ Asset no disponible: ${url}`);
        fail++;
      }
    } catch (err) {
      console.error(`❌ Error accediendo a ${url}:`, err.response?.status || err.message);
      fail++;
    }
  }
  console.log(`\nResumen: ${ok} OK, ${fail} fallidos`);
}

(async () => {
  console.log('--- Prueba de entrega de archivos del front admin ---');
  await testAdminPanel();
  await testAssets();
})(); 