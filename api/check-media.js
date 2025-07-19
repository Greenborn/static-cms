const db = require('./src/config/database');

async function checkMedia() {
  try {
    console.log('🔍 Verificando archivos multimedia...');
    
    // Esperar a que la base de datos se inicialice
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const files = await db.all('SELECT * FROM media_files');
    console.log(`📁 Archivos multimedia encontrados: ${files.length}`);
    
    if (files.length > 0) {
      console.log('📋 Lista de archivos:');
      files.forEach(file => {
        console.log(`  - ID: ${file.id}, Nombre: ${file.original_name}, Archivo: ${file.filename}`);
      });
      
      // Regenerar miniaturas para cada imagen
      for (const file of files) {
        if (file.mimetype && file.mimetype.startsWith('image/')) {
          console.log(`🔄 Regenerando miniaturas para: ${file.original_name}`);
          
          // Llamar al endpoint de regeneración de miniaturas
          const { spawn } = require('child_process');
          const curl = spawn('curl', [
            '-X', 'POST',
            '-H', 'Content-Type: application/json',
            'http://localhost:3000/api/media/regenerate-thumbnails/' + file.id
          ]);
          
          curl.stdout.on('data', (data) => {
            console.log(`✅ Miniatura regenerada: ${data.toString()}`);
          });
          
          curl.stderr.on('data', (data) => {
            console.error(`❌ Error: ${data.toString()}`);
          });
        }
      }
    } else {
      console.log('⚠️  No hay archivos multimedia en la base de datos');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verificando archivos multimedia:', error);
    process.exit(1);
  }
}

checkMedia(); 