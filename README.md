# Static CMS

Sistema de gestión de contenido estático moderno y eficiente, diseñado para crear sitios web de alto rendimiento con una interfaz de administración intuitiva.

## 🚀 Características Principales

- **Generación de sitios estáticos** con rendimiento óptimo
- **Panel de administración moderno** con React y TypeScript
- **Autenticación por Telegram** con códigos de verificación
- **Gestión completa de contenido** (páginas, tipos, vistas)
- **Sistema de plantillas flexible** con herencia y componentes
- **Gestor multimedia** con optimización automática
- **Formateadores de contenido** configurables
- **Constructor de sitio** en tiempo real
- **API RESTful** completa con Node.js y Express
- **Base de datos SQLite** para simplicidad de despliegue

## 🏗️ Arquitectura

El proyecto está organizado en módulos independientes:

```
static-cms/
├── api/                   # Backend API (Node.js + Express)
├── panel_admin/           # Panel de administración (React + TypeScript)
├── public/                # Sitio estático generado
├── template/              # Sistema de plantillas
├── documentacion/         # Documentación completa
└── notas_construccion/    # Notas de desarrollo
```

### Módulos del Sistema

#### 🔧 API Backend (`/api`)
- **Tecnologías**: Node.js, Express, SQLite, JWT
- **Funcionalidades**: 
  - Autenticación con Telegram
  - CRUD completo de páginas, tipos de contenido, vistas
  - Gestión de multimedia con miniaturas
  - Formateadores de contenido
  - Constructor de sitio estático
  - API RESTful documentada

#### 🎨 Panel de Administración (`/panel_admin`)
- **Tecnologías**: React 18, TypeScript, Tailwind CSS, Vite
- **Funcionalidades**:
  - Interfaz moderna y responsiva
  - Dashboard con estadísticas en tiempo real
  - Gestión visual de contenido
  - Editor de plantillas con preview
  - Gestor de archivos multimedia
  - Constructor de sitio integrado

#### 🌐 Sitio Público (`/public`)
- **Contenido**: Archivos estáticos generados
- **Características**:
  - HTML optimizado y minificado
  - CSS y JS comprimidos
  - Imágenes optimizadas (WebP)
  - SEO automático (sitemap, meta tags)
  - Configuración de servidor web

#### 📝 Sistema de Plantillas (`/template`)
- **Motor**: Plantillas personalizadas con sintaxis simple
- **Características**:
  - Herencia de plantillas
  - Componentes reutilizables
  - Helpers para formateo
  - Configuración de tema
  - Plantillas por tipo de contenido

## 🛠️ Tecnologías Utilizadas

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: SQLite3
- **Autenticación**: JWT + Telegram Bot API
- **Validación**: Joi
- **Logging**: Winston
- **Seguridad**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: React 18
- **Lenguaje**: TypeScript
- **Build Tool**: Vite
- **Estilos**: Tailwind CSS
- **Estado**: React Query
- **Formularios**: React Hook Form
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast

### Herramientas
- **Versionado**: Git
- **Linting**: ESLint + Prettier
- **Testing**: Jest (preparado)
- **Documentación**: Markdown
- **Despliegue**: Manual en servidor

## 📦 Instalación y Configuración

### Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Git
- Telegram Bot Token (para autenticación)

### Instalación Rápida

1. **Clonar el repositorio**:
```bash
git clone https://github.com/tu-usuario/static-cms.git
cd static-cms
```

2. **Configurar API Backend**:
```bash
cd api
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm run dev
```

3. **Configurar Panel de Administración**:
```bash
cd ../panel_admin
npm install
cp .env.example .env
# Editar .env con la URL del API
npm run dev
```

4. **Acceder al sistema**:
- API: http://localhost:3000
- Panel Admin: http://localhost:3001
- Documentación: Ver `/documentacion/`

### Configuración de Telegram

1. Crear bot en [@BotFather](https://t.me/botfather)
2. Obtener token del bot
3. Configurar en `api/.env`:
```env
TELEGRAM_BOT_TOKEN=tu_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui
```

## 🚀 Uso Rápido

### 1. Primera Configuración

1. **Acceder al panel de administración**
2. **Solicitar acceso con tu ID de Telegram**
3. **Verificar código enviado por Telegram**
4. **Configurar información del sitio**

### 2. Crear Contenido

1. **Crear tipos de contenido** (Artículo, Producto, etc.)
2. **Diseñar vistas** con plantillas HTML
3. **Crear páginas** asignando tipos y vistas
4. **Subir multimedia** (imágenes, documentos)

### 3. Generar Sitio

1. **Revisar contenido** en el dashboard
2. **Generar sitio completo** desde el constructor
3. **Verificar archivos** en `/public/`
4. **Desplegar** en servidor web

## 📚 Documentación

La documentación completa está disponible en el directorio `/documentacion/`:

- **[README Principal](documentacion/README.md)** - Visión general del proyecto
- **[API Backend](documentacion/api.md)** - Documentación completa de la API
- **[Proceso de Generación](documentacion/proceso-generacion.md)** - Cómo funciona el constructor
- **[Panel de Administración](documentacion/panel-admin.md)** - Guía del panel
- **[Configuración del Sistema](documentacion/configuracion.md)** - Variables y configuraciones

### Estructura de Documentación

```
documentacion/
├── README.md              # Índice principal
├── api.md                 # API Backend
├── proceso-generacion.md  # Constructor de sitio
├── panel-admin.md         # Panel de administración
├── configuracion.md       # Configuración del sistema
└── troubleshooting.md     # Solución de problemas
```

## 🔧 Desarrollo

### Estructura de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: cambios de estilo
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

### Scripts Disponibles

#### API Backend
```bash
cd api
npm run dev          # Desarrollo
npm run start        # Producción
npm run test         # Tests
npm run lint         # Linting
```

#### Panel de Administración
```bash
cd panel_admin
npm run dev          # Desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run lint         # Linting
```

### Variables de Entorno

#### API (.env)
```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DATABASE_PATH=./data/cms.db

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRES_IN=24h

# Telegram
TELEGRAM_BOT_TOKEN=tu_bot_token
TELEGRAM_CHAT_ID=tu_chat_id

# Archivos
UPLOAD_PATH=./public/media
MAX_FILE_SIZE=10485760

# Seguridad
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

#### Panel Admin (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=Static CMS Admin
```

## 🌐 Despliegue

### Opción 1: Despliegue Manual

1. **Configurar servidor** (Ubuntu/Debian recomendado)
2. **Instalar Node.js** y dependencias
3. **Configurar base de datos** SQLite
4. **Configurar servidor web** (Nginx/Apache)
5. **Configurar SSL** con Let's Encrypt
6. **Configurar Telegram Bot**



### Configuración de Servidor Web

#### Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Panel de administración
    location /admin {
        proxy_pass http://localhost:3001;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3000;
    }
    
    # Sitio estático
    location / {
        root /var/www/html/public;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔒 Seguridad

### Características de Seguridad

- **Autenticación JWT** con expiración
- **Rate limiting** para prevenir abuso
- **Validación de entrada** con sanitización
- **Headers de seguridad** (Helmet)
- **CORS configurado** apropiadamente
- **Validación de archivos** multimedia
- **Logs de auditoría** para acciones críticas

### Mejores Prácticas

- Cambiar JWT_SECRET en producción
- Configurar HTTPS obligatorio
- Mantener dependencias actualizadas
- Hacer backups regulares de la base de datos
- Monitorear logs de acceso

## 📊 Rendimiento

### Métricas Objetivo

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Optimizaciones Implementadas

- **Generación estática** para máximo rendimiento
- **Compresión de archivos** (gzip/brotli)
- **Optimización de imágenes** automática
- **Cache de navegador** configurado
- **Lazy loading** para recursos pesados
- **Minificación** de CSS/JS/HTML

## 🤝 Contribución

1. **Fork** del repositorio
2. **Crear rama** feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** cambios: `git commit -m 'feat: nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

### Guías de Contribución

- Seguir convenciones de código establecidas
- Agregar tests para nuevas funcionalidades
- Actualizar documentación según sea necesario
- Verificar que no hay regresiones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

### Canales de Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/static-cms/issues)
- **Documentación**: `/documentacion/`
- **Email**: soporte@static-cms.com

### Troubleshooting Común

Ver [documentacion/troubleshooting.md](documentacion/troubleshooting.md) para soluciones a problemas comunes.

## 🗺️ Roadmap

### Versión 1.1
- [ ] Soporte para múltiples idiomas
- [ ] Sistema de comentarios
- [ ] Newsletter integrado
- [ ] Analytics avanzado

### Versión 1.2
- [ ] Editor visual de plantillas
- [ ] Sistema de plugins
- [ ] API GraphQL
- [ ] Soporte para bases de datos PostgreSQL

### Versión 2.0
- [ ] Multi-tenant
- [ ] CDN integrado
- [ ] PWA por defecto
- [ ] Machine Learning para SEO

---

**Static CMS** - Construyendo el futuro del contenido web estático 🚀 