# Static CMS API

## Descripción

API backend para el Static CMS - Constructor de sitios estáticos. Proporciona endpoints REST para la gestión de contenido, autenticación con Telegram, y generación de sitios estáticos.

## Características

- 🔐 **Autenticación con Telegram** - Sistema de autenticación en dos factores
- 📄 **Gestión de Páginas** - CRUD completo para páginas del sitio
- 🏗️ **Tipos de Contenido** - Definición de estructuras de datos personalizadas
- 👁️ **Vistas y Plantillas** - Gestión de plantillas Mustache
- 🖼️ **Contenido Multimedia** - Subida y gestión de imágenes con miniaturas automáticas
- 🔧 **Formateadores** - Sistema de formateo de datos (decimales, moneda, fechas)
- 🚀 **Constructor de Sitio** - Generación automática de sitios estáticos
- 🛡️ **Seguridad** - Rate limiting, validación, sanitización
- 📊 **Base de Datos SQLite** - Almacenamiento ligero y eficiente

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Inicializar base de datos
npm run db:init

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## Configuración

### Variables de Entorno Requeridas

```env
# Entorno de ejecución
ENTORNO=DEV  # DEV para desarrollo, PRD para producción

# Telegram Bot Configuration
TELEGRAM_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_USER_ADMIN=admin_user_id_here

# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Database Configuration
DATABASE_PATH=./database/static-cms.sqlite

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Site Generation Configuration
PUBLIC_DIR=../public
TEMPLATE_DIR=../template
BREAK_POINTS=320,768,1024,1440
```

### Configuración

- `GET /api/settings` - Obtener configuración global (entorno)

## Endpoints

### Autenticación

- `POST /api/auth/request-access` - Solicitar acceso temporal
- `GET /api/auth/access/:token` - Verificar token y generar JWT
- `POST /api/auth/verify` - Verificar token JWT
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener información del usuario

### Páginas

- `GET /api/pages` - Listar páginas
- `GET /api/pages/:id` - Obtener página específica
- `POST /api/pages` - Crear página
- `PUT /api/pages/:id` - Actualizar página
- `DELETE /api/pages/:id` - Eliminar página
- `PATCH /api/pages/:id/status` - Cambiar estado de página

### Tipos de Contenido

- `GET /api/content-types` - Listar tipos de contenido
- `GET /api/content-types/:id` - Obtener tipo específico
- `POST /api/content-types` - Crear tipo de contenido
- `PUT /api/content-types/:id` - Actualizar tipo
- `DELETE /api/content-types/:id` - Eliminar tipo

### Vistas

- `GET /api/views` - Listar vistas
- `GET /api/views/:id` - Obtener vista específica
- `POST /api/views` - Crear vista
- `PUT /api/views/:id` - Actualizar vista
- `DELETE /api/views/:id` - Eliminar vista
- `POST /api/views/:id/preview` - Previsualizar vista

### Media

- `POST /api/media/upload` - Subir archivo
- `GET /api/media` - Listar archivos
- `GET /api/media/:id` - Obtener archivo específico
- `PUT /api/media/:id` - Actualizar metadatos
- `DELETE /api/media/:id` - Eliminar archivo

### Formateadores

- `GET /api/formatters` - Listar formateadores
- `GET /api/formatters/:id` - Obtener formateador específico
- `POST /api/formatters` - Crear formateador
- `PUT /api/formatters/:id` - Actualizar formateador
- `DELETE /api/formatters/:id` - Eliminar formateador
- `POST /api/formatters/:id/test` - Probar formateador

### Constructor de Sitio

- `POST /api/site-builder/generate` - Generar sitio completo
- `POST /api/site-builder/generate-page/:id` - Generar página específica
- `GET /api/site-builder/status` - Estado del constructor
- `POST /api/site-builder/clean` - Limpiar sitio generado
- `GET /api/site-builder/templates` - Plantillas disponibles

## Estructura del Proyecto

```
api/
├── src/
│   ├── app.js                 # Aplicación principal
│   ├── config/
│   │   └── database.js        # Configuración de base de datos
│   ├── middleware/
│   │   ├── auth.js           # Middleware de autenticación
│   │   └── errorHandler.js   # Manejo de errores
│   ├── routes/
│   │   ├── auth.js           # Rutas de autenticación
│   │   ├── pages.js          # Rutas de páginas
│   │   ├── contentTypes.js   # Rutas de tipos de contenido
│   │   ├── views.js          # Rutas de vistas
│   │   ├── media.js          # Rutas de media
│   │   ├── formatters.js     # Rutas de formateadores
│   │   └── siteBuilder.js    # Rutas del constructor
│   ├── controllers/          # Controladores (futuro)
│   ├── models/              # Modelos (futuro)
│   ├── services/            # Servicios (futuro)
│   └── utils/               # Utilidades (futuro)
├── database/                # Archivos de base de datos
├── logs/                    # Archivos de log
├── uploads/                 # Archivos subidos
├── package.json
├── env.example
└── README.md
```

## Base de Datos

### Tablas Principales

- **users** - Usuarios del sistema
- **pages** - Páginas del sitio
- **content_types** - Tipos de contenido
- **content** - Contenido dinámico
- **views** - Plantillas de vistas
- **images** - Archivos multimedia
- **formatters** - Configuración de formateadores
- **temp_sessions** - Sesiones temporales

## Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Ejecutar en modo desarrollo
npm start           # Ejecutar en producción
npm test            # Ejecutar tests
npm run db:init     # Inicializar base de datos
npm run db:migrate  # Ejecutar migraciones
npm run db:seed     # Poblar con datos de ejemplo
```

### Logs

Los logs se guardan en el directorio `logs/` con los siguientes niveles:
- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `debug` - Información de debugging

## Seguridad

### Autenticación

- Autenticación en dos factores mediante Telegram
- Tokens JWT para sesiones
- Sesiones temporales para acceso inicial
- Verificación de permisos por endpoint

### Validación

- Validación de entrada en todos los endpoints
- Sanitización de datos
- Validación de tipos de archivo
- Rate limiting para prevenir abuso

### Rate Limiting

- 100 requests por 15 minutos por IP
- Configurable mediante variables de entorno
- Headers de rate limit incluidos en respuestas

## Despliegue

### Requisitos

- Node.js 16+
- SQLite3
- Espacio en disco para archivos subidos

### Variables de Producción

```env
NODE_ENV=production
PORT=80
BASE_URL=https://your-domain.com
DATABASE_PATH=/var/lib/static-cms/database.sqlite
UPLOAD_DIR=/var/lib/static-cms/uploads
PUBLIC_DIR=/var/www/html
```

### Proceso de Despliegue

1. Clonar repositorio
2. Instalar dependencias: `npm install --production`
3. Configurar variables de entorno
4. Inicializar base de datos: `npm run db:init`
5. Configurar proceso manager (PM2, systemd, etc.)
6. Configurar proxy reverso (Nginx, Apache)

## Monitoreo

### Health Check

```bash
curl http://localhost:3000/health
```

### Métricas

- Estado de la base de datos
- Uso de memoria y CPU
- Tiempo de respuesta de endpoints
- Errores y excepciones

## Troubleshooting

### Problemas Comunes

1. **Error de Telegram**: Verificar token y configuración del bot
2. **Error de base de datos**: Verificar permisos y ruta de archivo
3. **Error de subida de archivos**: Verificar directorio y permisos
4. **Error de generación**: Verificar plantillas y datos

### Logs de Debug

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Buscar errores específicos
grep "ERROR" logs/app.log
```

## Contribución

1. Fork el proyecto
2. Crear rama para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

MIT License - ver archivo LICENSE para más detalles. 

## Panel de Administración y Assets Estáticos

El backend sirve el panel de administración (frontend) generado por Vite desde:

- `/admin` → Sirve la aplicación principal (SPA) desde `panel_admin/dist/index.html`.
- `/admin/assets` → Sirve los assets estáticos (JS, CSS, imágenes) generados por Vite.
- `/assets` → Sirve directamente los archivos estáticos generados por Vite para el panel admin, permitiendo que las rutas `/assets/archivo.js` funcionen correctamente.

**Ejemplo de acceso:**
- `http://localhost:3000/admin` → Acceso al panel de administración
- `http://localhost:3000/assets/index-xxxxxxx.js` → Acceso a los archivos JS/CSS generados

> Si tienes problemas de carga de assets, asegúrate de que el build de Vite esté actualizado y que los archivos existan en `panel_admin/dist/assets/`. 

## Pruebas automáticas de entrega de archivos del panel admin

En el directorio `test/` hay un script para verificar que el panel de administración y sus assets se sirvan correctamente según la variable de entorno `DOMINIO_ADMIN`:

```bash
node test/test-admin-assets.js
```

Este script:
- Lee la variable `DOMINIO_ADMIN` de `api/.env` (ejemplo: `DOMINIO_ADMIN=http://localhost:3000`)
- Verifica que `/admin` responda correctamente
- Verifica que los archivos JS y CSS generados por Vite estén accesibles en `/assets`

Si todo está correcto, verás un resumen de assets disponibles y el estado del panel. 

## Navegación interna del panel de administración

El panel de administración (Vue) utiliza navegación basada en hash (`#`) para todas las rutas internas. Esto asegura compatibilidad con el backend y evita problemas de rutas en SPAs.

> Esta es una regla obligatoria definida en `.cursorrules` para todas las apps Vue o Angular del proyecto. 