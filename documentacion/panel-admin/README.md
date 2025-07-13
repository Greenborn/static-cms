# Panel de Administración - Static CMS

## Descripción General

El panel de administración es la interfaz web que permite a los administradores gestionar el contenido del sitio estático de manera intuitiva y eficiente.

## Tecnologías Utilizadas

- **VueJS** - Framework frontend (TypeScript prohibido)
- **Axios** - Cliente HTTP para comunicación con la API
- **Bootstrap** - Framework CSS para el diseño responsive

## Arquitectura del Panel

### Estructura de Componentes

```
panel-admin/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.vue
│   │   │   └── TelegramAuth.vue
│   │   ├── pages/
│   │   │   ├── PageList.vue
│   │   │   ├── PageEditor.vue
│   │   │   └── PageForm.vue
│   │   ├── content/
│   │   │   ├── ContentTypeList.vue
│   │   │   ├── ContentTypeEditor.vue
│   │   │   └── ContentForm.vue
│   │   ├── views/
│   │   │   ├── ViewList.vue
│   │   │   ├── ViewEditor.vue
│   │   │   └── ViewForm.vue
│   │   ├── media/
│   │   │   ├── MediaUploader.vue
│   │   │   ├── ImageManager.vue
│   │   │   └── MediaLibrary.vue
│   │   └── common/
│   │       ├── Navigation.vue
│   │       ├── Sidebar.vue
│   │       └── Footer.vue
│   ├── views/
│   │   ├── Dashboard.vue
│   │   ├── Pages.vue
│   │   ├── ContentTypes.vue
│   │   ├── Views.vue
│   │   ├── Media.vue
│   │   └── Settings.vue
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.js
│   │   └── media.js
│   └── utils/
│       ├── formatters.js
│       └── validators.js
```

## Funcionalidades Principales

### 1. Autenticación

#### Sistema de Login con Telegram

El panel implementa autenticación en dos factores mediante Telegram:

1. **Solicitud de Acceso**: El usuario solicita un enlace de acceso temporal
2. **Verificación por Bot**: El bot de Telegram verifica la identidad del usuario
3. **Generación de Token**: Se genera un token de sesión temporal
4. **Acceso al Panel**: El usuario accede al panel con el token generado

#### Componentes de Autenticación

- `LoginForm.vue` - Formulario de inicio de sesión
- `TelegramAuth.vue` - Integración con el bot de Telegram

### 2. Gestión de Páginas

#### Listado de Páginas

- Vista de todas las páginas del sitio
- Filtros por estado, fecha de creación, etc.
- Búsqueda por título o contenido
- Paginación de resultados

#### Editor de Páginas

- Editor WYSIWYG para contenido HTML
- Previsualización en tiempo real
- Gestión de metadatos (título, descripción, keywords)
- Configuración de plantillas mustache

#### Formulario de Páginas

- Campos para título, slug, contenido
- Selector de plantilla
- Configuración de SEO
- Opciones de publicación

### 3. Gestión de Tipos de Contenido

#### Listado de Tipos de Contenido

- Vista de todos los tipos de contenido definidos
- Información sobre campos y formateadores
- Estadísticas de uso

#### Editor de Tipos de Contenido

- Constructor visual de campos
- Configuración de tipos de datos
- Asignación de formateadores
- Validaciones personalizadas

#### Gestión de Campos

- **Tipos de Campo Soportados**:
  - Texto (corto y largo)
  - Número
  - Fecha
  - Booleano
  - Selector
  - Archivo
  - Relación

### 4. Gestión de Vistas

#### Listado de Vistas

- Vista de todas las plantillas de vista
- Información sobre uso y dependencias
- Estado de validación

#### Editor de Vistas

- Editor de código HTML con syntax highlighting
- Previsualización de la vista con datos de ejemplo
- Gestión de variables mustache
- Validación de sintaxis

### 5. Gestión de Contenido Multimedia

#### Subida de Archivos

- Drag & drop para subida de archivos
- Soporte para múltiples formatos
- Progreso de subida en tiempo real
- Validación de archivos

#### Gestión de Imágenes

- Biblioteca de imágenes
- Generación automática de miniaturas
- Edición de metadatos (alt, título)
- Optimización automática

#### Biblioteca de Media

- Organización por categorías
- Búsqueda y filtros
- Información de uso
- Gestión de permisos

### 6. Formateadores

#### Configuración de Formateadores

- **Numérico Decimal**: Configuración de decimales y separadores
- **Tipo Moneda**: Moneda, formato y símbolo
- **Fecha Hora**: Formato de fecha y zona horaria

#### Aplicación de Formateadores

- Asignación a campos de tipos de contenido
- Previsualización del formato
- Configuración por idioma

## Interfaz de Usuario

### Diseño Responsive

El panel utiliza Bootstrap para garantizar una experiencia óptima en todos los dispositivos:

- **Desktop**: Vista completa con sidebar
- **Tablet**: Layout adaptativo
- **Mobile**: Navegación colapsable

### Navegación

- **Sidebar**: Navegación principal con iconos
- **Breadcrumbs**: Ruta de navegación actual
- **Búsqueda Global**: Búsqueda rápida en todo el contenido

### Componentes Reutilizables

- **Modales**: Para confirmaciones y formularios
- **Tooltips**: Información contextual
- **Notificaciones**: Alertas y mensajes de estado
- **Loading States**: Indicadores de carga

## Integración con la API

### Servicios de API

```javascript
// Ejemplo de servicio para páginas
export const pageService = {
  async getPages(params) {
    return await api.get('/api/pages', { params });
  },
  
  async createPage(data) {
    return await api.post('/api/pages', data);
  },
  
  async updatePage(id, data) {
    return await api.put(`/api/pages/${id}`, data);
  },
  
  async deletePage(id) {
    return await api.delete(`/api/pages/${id}`);
  }
};
```

### Manejo de Errores

- Interceptores de Axios para manejo global de errores
- Notificaciones de error contextuales
- Reintentos automáticos para errores de red
- Logging de errores para debugging

### Autenticación

- Interceptor para incluir tokens en requests
- Manejo de tokens expirados
- Redirección automática al login
- Refresh de tokens

## Configuración

### Variables de Entorno

```env
VUE_APP_API_URL=http://localhost:3000/api
VUE_APP_TELEGRAM_BOT_USERNAME=your_bot_username
VUE_APP_APP_NAME=Static CMS Admin
```

### Configuración de Desarrollo

```bash
# Instalación de dependencias
npm install

# Ejecución en modo desarrollo
npm run serve

# Construcción para producción
npm run build

# Linting
npm run lint
```

## Seguridad

### Validación de Entrada

- Validación de formularios en el frontend
- Sanitización de datos antes del envío
- Prevención de XSS en contenido HTML

### Autenticación y Autorización

- Tokens JWT para sesiones
- Verificación de permisos por ruta
- Logout automático por inactividad

### Protección de Datos

- Encriptación de datos sensibles
- Headers de seguridad apropiados
- Validación de tipos de archivo

## Testing

### Pruebas Unitarias

- Tests para componentes Vue
- Tests para servicios de API
- Tests para utilidades

### Pruebas de Integración

- Tests de flujos completos
- Tests de autenticación
- Tests de gestión de contenido

### Pruebas E2E

- Tests de navegación completa
- Tests de formularios
- Tests de responsividad

## Despliegue

### Construcción para Producción

```bash
npm run build
```

### Configuración de Servidor

- Servir archivos estáticos
- Configurar headers de cache
- Habilitar compresión Gzip
- Configurar HTTPS

### Monitoreo

- Logs de errores del frontend
- Métricas de rendimiento
- Alertas de disponibilidad 