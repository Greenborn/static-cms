# Panel de Administración - Static CMS

Panel de administración web para gestionar el contenido del Static CMS. Desarrollado con Vue 3, JavaScript y Bootstrap 5.

## 🚀 Características

- **Interfaz moderna y responsiva** con Bootstrap 5
- **Autenticación por Telegram** con códigos de verificación
- **Gestión completa de páginas** (CRUD, estados, estadísticas)
- **Administración de tipos de contenido** con campos personalizables
- **Sistema de vistas** con previsualización de plantillas
- **Gestor de multimedia** con subida de archivos y miniaturas
- **Formateadores de contenido** configurables
- **Constructor de sitio** con generación en tiempo real
- **Dashboard con estadísticas** en tiempo real
- **Navegación intuitiva** con sidebar responsive

## 🛠️ Tecnologías

- **Frontend**: Vue 3, JavaScript, Vite
- **Estilos**: Bootstrap 5, Bootstrap Icons
- **Estado**: Vue 3 Composition API
- **Navegación**: Vue Router 4
- **HTTP Client**: Axios

## 📦 Instalación

1. **Instalar dependencias**:
```bash
npm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Editar `.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=Static CMS Admin
```

3. **Ejecutar en desarrollo**:
```bash
npm run dev
```

El panel estará disponible en `http://localhost:6000`

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   └── Layout.vue      # Layout principal con sidebar
├── pages/              # Páginas de la aplicación
│   ├── Login.vue       # Página de autenticación
│   ├── Dashboard.vue   # Dashboard principal
│   ├── Pages.vue       # Gestión de páginas
│   ├── ContentTypes.vue # Tipos de contenido
│   ├── Views.vue       # Vistas y plantillas
│   ├── Media.vue       # Gestor multimedia
│   ├── Formatters.vue  # Formateadores
│   ├── SiteBuilder.vue # Constructor de sitio
│   └── Settings.vue    # Configuraciones
├── services/           # Servicios y API
│   └── api.js          # Cliente API
├── stores/             # Stores de estado
│   └── auth.js         # Store de autenticación
├── utils/              # Utilidades
├── App.vue             # Componente principal
├── main.js             # Punto de entrada
├── router.js           # Configuración de rutas
└── main.css            # Estilos globales
```

## 🔐 Autenticación

El panel utiliza autenticación por Telegram:

1. **Solicitud de acceso**: El usuario ingresa su ID de Telegram
2. **Envío de código**: El sistema envía un código de 6 dígitos por Telegram
3. **Verificación**: El usuario ingresa el código para acceder
4. **Sesión persistente**: El token se almacena en localStorage

### Obtener ID de Telegram

1. Abrir Telegram y buscar `@userinfobot`
2. Enviar cualquier mensaje al bot
3. El bot responderá con el ID de usuario

## 📱 Páginas Principales

### Dashboard
- Estadísticas en tiempo real
- Resumen de páginas, contenido y multimedia
- Información del último build
- Acciones rápidas

### Gestión de Páginas
- Lista paginada de páginas
- Filtros por estado (draft, published, archived)
- Editor de contenido con preview
- Gestión de metadatos
- Asignación de tipos de contenido y vistas

### Tipos de Contenido
- Crear y editar tipos de contenido
- Configurar campos personalizables
- Validación de campos
- Ordenamiento de campos

### Vistas
- Gestión de plantillas HTML
- Previsualización en tiempo real
- Asociación con tipos de contenido
- Validación de sintaxis

### Multimedia
- Subida de archivos con drag & drop
- Generación automática de miniaturas
- Gestión de metadatos (alt, caption)
- Estadísticas de uso

### Formateadores
- Configuración de formateadores
- Prueba de formateo en tiempo real
- Tipos: Markdown, HTML, Custom

### Constructor de Sitio
- Generación completa del sitio
- Generación de páginas individuales
- Estado del build en tiempo real
- Limpieza de archivos generados

## 🎨 Componentes UI

### Botones
```html
<button class="btn btn-primary">Botón Primario</button>
<button class="btn btn-secondary">Botón Secundario</button>
<button class="btn btn-outline-primary">Botón Outline</button>
```

### Inputs
```html
<input class="form-control" placeholder="Texto..." />
```

### Cards
```html
<div class="card">
  <div class="card-header">
    <h5 class="card-title">Título</h5>
  </div>
  <div class="card-body">
    Contenido
  </div>
</div>
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL del API backend | `http://localhost:3000/api` |
| `VITE_APP_TITLE` | Título de la aplicación | `Static CMS Admin` |

### Proxy de Desarrollo

El panel está configurado para hacer proxy de las llamadas API al backend durante desarrollo:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

## 📊 Estado de la Aplicación

### Vue 3 Composition API
- Estado reactivo con `ref()` y `reactive()`
- Stores modulares para gestión de estado
- Computed properties para derivaciones
- Watchers para efectos secundarios

### Store de Autenticación
```javascript
import { useAuthStore } from './stores/auth.js'

const authStore = useAuthStore()
const { user, isAuthenticated, login, logout } = authStore
```

## 🚀 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Linting del código
- `npm run lint:fix` - Linting y corrección automática

## 🔒 Seguridad

- **Autenticación JWT** con expiración
- **Interceptores de Axios** para manejo de tokens
- **Guardias de ruta** para protección de páginas
- **Validación de entrada** en formularios
- **Sanitización de datos** antes de envío

## 📱 Responsive Design

El panel está completamente optimizado para dispositivos móviles:

- **Sidebar colapsable** en pantallas pequeñas
- **Navegación adaptativa** con menú hamburguesa
- **Cards responsive** que se ajustan al contenido
- **Formularios optimizados** para touch

## 🎯 Próximas Funcionalidades

- [ ] Editor de contenido WYSIWYG
- [ ] Sistema de notificaciones en tiempo real
- [ ] Exportación de datos
- [ ] Temas personalizables
- [ ] Modo oscuro
- [ ] Accesibilidad mejorada
- [ ] Tests automatizados
- [ ] PWA (Progressive Web App)

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 

## 🔄 Sincronización automática y build

Cuando se inicia el backend (API), se ejecuta automáticamente el build del panel de administración. Antes del build, se sincronizan variables clave como `DOMINIO_ADMIN` desde el backend al archivo `.env` del frontend.

- No es necesario ejecutar manualmente el build ni la sincronización.
- El backend se encarga de compilar y dejar listo el panel de administración en cada inicio.
- Si hay un error en el build, el backend no se inicia.

--- 