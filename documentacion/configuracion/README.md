# Configuración del Sistema - Static CMS

## Descripción General

Este documento describe todas las configuraciones necesarias para el funcionamiento correcto del Static CMS, incluyendo variables de entorno, configuración de base de datos y ajustes del servidor.

## Variables de Entorno

### Configuración del Bot de Telegram

```env
# Token del bot de Telegram (obligatorio)
TELEGRAM_TOKEN=your_bot_token_here

# ID del chat de Telegram (obligatorio)
TELEGRAM_CHAT_ID=your_chat_id_here

# ID del usuario administrador (obligatorio)
TELEGRAM_USER_ADMIN=admin_user_id_here

# ID del usuario verificador (opcional)
TELEGRAM_USER_CHECKER=checker_user_id_here
```

#### Cómo Obtener las Credenciales de Telegram

1. **Crear un Bot**:
   - Habla con [@BotFather](https://t.me/botfather) en Telegram
   - Usa el comando `/newbot`
   - Sigue las instrucciones para crear tu bot
   - Guarda el token proporcionado

2. **Obtener Chat ID**:
   - Agrega tu bot al chat/grupo donde quieres recibir notificaciones
   - Envía un mensaje al bot
   - Visita: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Busca el `chat.id` en la respuesta

3. **Obtener User ID**:
   - Envía un mensaje al bot desde tu cuenta
   - Visita: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Busca el `from.id` en la respuesta

### Configuración del Servidor

```env
# Puerto del servidor (por defecto: 3000)
PORT=3000

# Entorno de ejecución (development/production)
NODE_ENV=development

# URL base de la aplicación
BASE_URL=http://localhost:3000

# Tiempo de expiración de tokens (en segundos)
TOKEN_EXPIRY=3600

# Tiempo de expiración de enlaces temporales (en segundos)
TEMP_LINK_EXPIRY=300
```

### Configuración de Base de Datos

```env
# Ruta del archivo de base de datos SQLite
DATABASE_PATH=./database.sqlite

# Modo de logging de SQLite (normal/wal)
SQLITE_MODE=normal

# Tiempo de timeout de la base de datos (en milisegundos)
DATABASE_TIMEOUT=5000
```

### Configuración de Breakpoints

```env
# Breakpoints para imágenes responsivas (separados por comas)
BREAK_POINTS=320,768,1024,1440

# Calidad de compresión de imágenes (1-100)
IMAGE_QUALITY=85

# Formatos de imagen soportados
SUPPORTED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp
```

### Configuración de Rate Limiting

```env
# Límite de requests por ventana de tiempo
RATE_LIMIT_WINDOW_MS=900000

# Número máximo de requests por ventana
RATE_LIMIT_MAX_REQUESTS=100

# Mensaje de error para rate limit excedido
RATE_LIMIT_MESSAGE=Too many requests, please try again later
```

### Configuración de Archivos

```env
# Directorio de archivos subidos
UPLOAD_DIR=./uploads

# Tamaño máximo de archivo (en bytes)
MAX_FILE_SIZE=10485760

# Tipos de archivo permitidos
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,audio/mpeg,video/mp4

# Directorio de salida del sitio estático
PUBLIC_DIR=./public

# Directorio de plantillas
TEMPLATE_DIR=./templates
```

### Configuración de Cache

```env
# Habilitar cache (true/false)
ENABLE_CACHE=true

# Tiempo de vida del cache (en segundos)
CACHE_TTL=3600

# Directorio de cache
CACHE_DIR=./cache
```

### Configuración de Logging

```env
# Nivel de logging (error, warn, info, debug)
LOG_LEVEL=info

# Archivo de log
LOG_FILE=./logs/app.log

# Formato de timestamp en logs
LOG_TIMESTAMP_FORMAT=YYYY-MM-DD HH:mm:ss
```

## Configuración de Desarrollo

### Archivo `.env.development`

```env
# Configuración específica para desarrollo
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
ENABLE_CACHE=false
DATABASE_PATH=./database-dev.sqlite
```

### Archivo `.env.production`

```env
# Configuración específica para producción
NODE_ENV=production
PORT=80
LOG_LEVEL=warn
ENABLE_CACHE=true
DATABASE_PATH=/var/lib/static-cms/database.sqlite
```

## Configuración del Panel de Administración

### Variables de Entorno del Frontend

```env
# URL de la API backend
VUE_APP_API_URL=http://localhost:3000/api

# Nombre del bot de Telegram
VUE_APP_TELEGRAM_BOT_USERNAME=your_bot_username

# Nombre de la aplicación
VUE_APP_APP_NAME=Static CMS Admin

# Versión de la aplicación
VUE_APP_VERSION=1.0.0

# Modo de desarrollo
VUE_APP_DEBUG=true
```

## Configuración de Base de Datos

### Estructura de Tablas

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de páginas
CREATE TABLE pages (
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
);

-- Tabla de tipos de contenido
CREATE TABLE content_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    fields TEXT, -- JSON con la definición de campos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vistas
CREATE TABLE views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de imágenes
CREATE TABLE images (
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
);

-- Tabla de formateadores
CREATE TABLE formatters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT, -- JSON con la configuración
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Inicialización de la Base de Datos

```bash
# Crear la base de datos inicial
npm run db:init

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

## Configuración del Servidor Web

### Nginx (Recomendado)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirección a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # Configuración SSL
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Configuración de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Panel de Administración
    location /admin {
        alias /path/to/panel-admin/dist;
        try_files $uri $uri/ /admin/index.html;
    }
    
    # Sitio Estático
    location / {
        root /path/to/public;
        try_files $uri $uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /path/to/public
    
    # Redirección a HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /path/to/public
    
    # Configuración SSL
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    # Proxy para API
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
    
    # Configuración de cache
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </FilesMatch>
</VirtualHost>
```

## Configuración de Monitoreo

### Logs

```bash
# Estructura de directorios de logs
logs/
├── app.log          # Logs de la aplicación
├── access.log       # Logs de acceso
├── error.log        # Logs de errores
└── telegram.log     # Logs del bot de Telegram
```

### Métricas

```env
# Habilitar métricas
ENABLE_METRICS=true

# Puerto para métricas
METRICS_PORT=9090

# Endpoint de health check
HEALTH_CHECK_ENDPOINT=/health
```

## Configuración de Backup

### Backup Automático

```bash
#!/bin/bash
# Script de backup automático

# Configuración
BACKUP_DIR="/backups/static-cms"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/path/to/database.sqlite"
UPLOADS_DIR="/path/to/uploads"

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"

# Backup de base de datos
sqlite3 "$DB_FILE" ".backup '$BACKUP_DIR/database_$DATE.sqlite'"

# Backup de archivos subidos
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$UPLOADS_DIR" .

# Limpiar backups antiguos (mantener últimos 7 días)
find "$BACKUP_DIR" -name "*.sqlite" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
```

## Validación de Configuración

### Script de Validación

```bash
#!/bin/bash
# Script para validar la configuración

echo "Validando configuración del Static CMS..."

# Verificar variables de entorno requeridas
required_vars=("TELEGRAM_TOKEN" "TELEGRAM_CHAT_ID" "TELEGRAM_USER_ADMIN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: Variable $var no está definida"
        exit 1
    fi
done

# Verificar conectividad con Telegram
curl -s "https://api.telegram.org/bot$TELEGRAM_TOKEN/getMe" > /dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: No se puede conectar con la API de Telegram"
    exit 1
fi

# Verificar base de datos
if [ ! -f "$DATABASE_PATH" ]; then
    echo "INFO: Base de datos no existe, se creará automáticamente"
fi

echo "Configuración válida ✓"
```

## Troubleshooting

### Problemas Comunes

1. **Error de autenticación de Telegram**:
   - Verificar que el token del bot sea correcto
   - Verificar que el bot esté activo
   - Verificar que el chat ID sea correcto

2. **Error de base de datos**:
   - Verificar permisos de escritura en el directorio
   - Verificar que SQLite esté instalado
   - Verificar la ruta de la base de datos

3. **Error de rate limiting**:
   - Ajustar los límites en la configuración
   - Verificar logs para identificar patrones de abuso

4. **Error de generación de imágenes**:
   - Verificar que las librerías de imagen estén instaladas
   - Verificar permisos de escritura en el directorio de uploads
   - Verificar el formato de los breakpoints 