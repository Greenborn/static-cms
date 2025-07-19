const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const db = require('./src/config/database');

async function generateThumbnails() {
  try {
    console.log('🖼️  Generando miniaturas para imágenes existentes...');
    
    // Esperar a que la base de datos se inicialice
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obtener breakpoints
    const breakpoints = await db.all('SELECT * FROM breakpoints ORDER BY valor_px ASC');
    console.log(`📏 Breakpoints encontrados: ${breakpoints.length}`);
    
    // Obtener archivos multimedia
    const files = await db.all('SELECT * FROM media_files WHERE mimetype LIKE "image/%"');
    console.log(`📁 Imágenes encontradas: ${files.length}`);
    
    if (files.length === 0) {
      console.log('⚠️  No hay imágenes para procesar');
      return;
    }
    
    for (const file of files) {
      console.log(`\n🔄 Procesando: ${file.original_name}`);
      
      const inputPath = path.join(__dirname, '../public/i', file.filename);
      
      // Verificar que el archivo existe
      if (!await fs.pathExists(inputPath)) {
        console.log(`❌ Archivo no encontrado: ${inputPath}`);
        continue;
      }
      
      const ext = path.extname(file.filename);
      const name = path.basename(file.filename, ext);
      
      // Generar miniaturas para cada breakpoint
      for (const bp of breakpoints) {
        const width = parseInt(bp.valor_px);
        if (!width || isNaN(width) || width === 0) continue;
        
        const thumbName = `${name}_${bp.nombre}${ext}`;
        const thumbPath = path.join(__dirname, '../public/i', thumbName);
        
        try {
          await sharp(inputPath)
            .resize({ width, withoutEnlargement: true })
            .toFile(thumbPath);
          
          console.log(`✅ Miniatura generada: ${thumbName} (${width}px)`);
        } catch (err) {
          console.error(`❌ Error generando ${thumbName}:`, err.message);
        }
      }
    }
    
    console.log('\n🎉 Proceso de generación de miniaturas completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generando miniaturas:', error);
    process.exit(1);
  }
}

generateThumbnails(); 