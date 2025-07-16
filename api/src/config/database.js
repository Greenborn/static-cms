const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
  constructor() {
    this.dbPath = process.env.DATABASE_PATH || './database/static-cms.sqlite';
    this.db = null;
    this.init();
  }

  async init() {
    try {
      // Crear directorio de base de datos si no existe
      const dbDir = path.dirname(this.dbPath);
      await fs.ensureDir(dbDir);

      // Crear conexión a la base de datos
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err.message);
        } else {
          console.log('✅ Connected to SQLite database');
          this.createTables();
        }
      });

    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  createTables() {
    const tables = [
      // Tabla de usuarios
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de páginas
      `CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        content TEXT,
        template TEXT,
        meta_description TEXT,
        meta_keywords TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de tipos de contenido
      `CREATE TABLE IF NOT EXISTS content_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        fields TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de vistas
      `CREATE TABLE IF NOT EXISTS views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        template TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de imágenes
      `CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        alt TEXT,
        is_thumbnail BOOLEAN DEFAULT FALSE,
        original_id INTEGER,
        height INTEGER,
        width INTEGER,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (original_id) REFERENCES images(id)
      )`,

      // Tabla de formateadores
      `CREATE TABLE IF NOT EXISTS formatters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        config TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de contenido
      `CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        data TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_type_id) REFERENCES content_types(id)
      )`,

      // Tabla de sesiones temporales
      `CREATE TABLE IF NOT EXISTS temp_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE NOT NULL,
        telegram_id INTEGER NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de procesos de clonado
      `CREATE TABLE IF NOT EXISTS clone_processes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        total_resources INTEGER DEFAULT 0,
        processed_resources INTEGER DEFAULT 0,
        html_file TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de logs de clonado
      `CREATE TABLE IF NOT EXISTS clone_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id INTEGER NOT NULL,
        resource_url TEXT,
        resource_type TEXT,
        status TEXT,
        error_message TEXT,
        file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (process_id) REFERENCES clone_processes(id)
      )`,

      // Tabla de breakpoints para imágenes responsivas
      `CREATE TABLE IF NOT EXISTS breakpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL,
        valor_px INTEGER NOT NULL
      )`,

      // Tabla de configuraciones globales
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        description TEXT,
        category TEXT DEFAULT 'General',
        is_template_item BOOLEAN DEFAULT 0,
        slug TEXT
      )`
    ];

    tables.forEach((table) => {
      this.db.run(table, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
      });
    });

    // Insertar breakpoints por defecto si la tabla está vacía
    this.db.get('SELECT COUNT(*) as count FROM breakpoints', (err, row) => {
      if (err) {
        console.error('Error verificando breakpoints:', err.message);
        return;
      }
      if (row.count === 0) {
        const defaultBreakpoints = [
          { nombre: 'xs', valor_px: 0 },
          { nombre: 'sm', valor_px: 576 },
          { nombre: 'md', valor_px: 768 },
          { nombre: 'lg', valor_px: 992 },
          { nombre: 'xl', valor_px: 1200 },
          { nombre: 'xxl', valor_px: 1400 }
        ];
        const stmt = this.db.prepare('INSERT INTO breakpoints (nombre, valor_px) VALUES (?, ?)');
        defaultBreakpoints.forEach(bp => {
          stmt.run(bp.nombre, bp.valor_px);
        });
        stmt.finalize();
        console.log('Breakpoints por defecto insertados en la base de datos.');
      }
    });

    // Migración automática de la tabla settings para agregar nuevas columnas si no existen
    this.db.serialize(() => {
      this.db.all("PRAGMA table_info(settings)", (err, columns) => {
        if (err) {
          console.error('Error verificando columnas de settings:', err.message);
          return;
        }
        const colNames = columns.map(col => col.name);
        if (!colNames.includes('category')) {
          this.db.run("ALTER TABLE settings ADD COLUMN category TEXT DEFAULT 'General'", (err) => {
            if (!err) console.log('Columna category agregada a settings');
          });
        }
        if (!colNames.includes('is_template_item')) {
          this.db.run("ALTER TABLE settings ADD COLUMN is_template_item BOOLEAN DEFAULT 0", (err) => {
            if (!err) console.log('Columna is_template_item agregada a settings');
          });
        }
        if (!colNames.includes('slug')) {
          this.db.run("ALTER TABLE settings ADD COLUMN slug TEXT", (err) => {
            if (!err) console.log('Columna slug agregada a settings');
          });
        }
      });
    });

    // Crear índices para mejorar rendimiento
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)',
      'CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status)',
      'CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug)',
      'CREATE INDEX IF NOT EXISTS idx_content_status ON content(status)',
      'CREATE INDEX IF NOT EXISTS idx_images_original ON images(original_id)',
      'CREATE INDEX IF NOT EXISTS idx_temp_sessions_token ON temp_sessions(token)',
      'CREATE INDEX IF NOT EXISTS idx_temp_sessions_expires ON temp_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_clone_processes_status ON clone_processes(status)',
      'CREATE INDEX IF NOT EXISTS idx_clone_processes_url ON clone_processes(url)',
      'CREATE INDEX IF NOT EXISTS idx_clone_logs_process ON clone_logs(process_id)',
      'CREATE INDEX IF NOT EXISTS idx_clone_logs_status ON clone_logs(status)'
    ];

    indexes.forEach((index) => {
      this.db.run(index, (err) => {
        if (err) {
          console.error('Error creating index:', err.message);
        }
      });
    });
  }

  // Método para ejecutar consultas
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Método para obtener una fila
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Método para obtener múltiples filas
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Método para cerrar la conexión
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

// Exportar instancia singleton
module.exports = new Database(); 