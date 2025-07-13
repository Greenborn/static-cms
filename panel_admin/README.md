# Panel de Administración - Static CMS

Panel de administración web para gestionar el contenido del Static CMS. Desarrollado con React, TypeScript y Tailwind CSS.

## 🚀 Características

- **Interfaz moderna y responsiva** con Tailwind CSS
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

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: Tailwind CSS, Lucide React (iconos)
- **Estado**: React Query, React Hook Form
- **Navegación**: React Router DOM
- **Notificaciones**: React Hot Toast
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

El panel estará disponible en `http://localhost:3001`

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Layout.tsx      # Layout principal con sidebar
│   ├── ui/             # Componentes de UI básicos
│   └── forms/          # Componentes de formularios
├── hooks/              # Custom hooks
│   ├── useAuth.ts      # Hook de autenticación
│   └── useApi.ts       # Hook para llamadas API
├── pages/              # Páginas de la aplicación
│   ├── Login.tsx       # Página de autenticación
│   ├── Dashboard.tsx   # Dashboard principal
│   ├── Pages.tsx       # Gestión de páginas
│   ├── ContentTypes.tsx # Tipos de contenido
│   ├── Views.tsx       # Vistas y plantillas
│   ├── Media.tsx       # Gestor multimedia
│   ├── Formatters.tsx  # Formateadores
│   ├── SiteBuilder.tsx # Constructor de sitio
│   └── Settings.tsx    # Configuraciones
├── services/           # Servicios y API
│   └── api.ts          # Cliente API
├── types/              # Tipos TypeScript
│   └── index.ts        # Definiciones de tipos
├── utils/              # Utilidades
├── App.tsx             # Componente principal
├── main.tsx            # Punto de entrada
└── index.css           # Estilos globales
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
```tsx
<button className="btn btn-primary">Botón Primario</button>
<button className="btn btn-secondary">Botón Secundario</button>
<button className="btn btn-outline">Botón Outline</button>
```

### Inputs
```tsx
<input className="input" placeholder="Texto..." />
```

### Cards
```tsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Título</h3>
    <p className="card-description">Descripción</p>
  </div>
  <div className="card-content">
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

```typescript
// vite.config.ts
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

### React Query
- Cache inteligente de datos
- Refetch automático en background
- Optimistic updates
- Error handling centralizado

### Autenticación
- Context API para estado global
- Persistencia en localStorage
- Interceptores de Axios para tokens
- Logout automático en errores 401

## 🚀 Despliegue

### Build de Producción
```bash
npm run build
```

### Servir Build
```bash
npm run preview
```

### Configuración de Servidor

Para producción, configurar el servidor web para servir la aplicación SPA:

```nginx
# Nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 🔍 Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linting
npm run lint:fix     # Linting con auto-fix
```

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

## 🐛 Troubleshooting

### Errores Comunes

1. **Error de conexión al API**
   - Verificar que el backend esté ejecutándose
   - Comprobar la URL en `VITE_API_URL`

2. **Error de autenticación**
   - Limpiar localStorage
   - Verificar configuración de Telegram

3. **Error de build**
   - Verificar dependencias: `npm install`
   - Limpiar cache: `npm run build -- --force`

### Logs de Desarrollo

Los logs se muestran en la consola del navegador. Para debugging:

```typescript
// Habilitar logs detallados
localStorage.setItem('debug', 'true')
```

## 📚 Referencias

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
- [Vite](https://vitejs.dev/guide/)

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](../LICENSE) para detalles. 