# Static CMS - Documentación

## Descripción General

Static CMS es un constructor de sitios estáticos que consta de un panel de administración (sección privada) y una sección pública. El diseño estético se realiza mediante plantillas mustacheables.

## Arquitectura del Sistema

El sistema está compuesto por tres módulos principales:

1. **Front Panel de Control** - Panel de administración para gestionar contenido
2. **Back - API - Constructor de sitio** - API que recibe órdenes del panel y construye el sitio
3. **Sitio estático generado** - Resultado final del proceso de construcción

## Estructura de Directorios

```
static-cms/
├── api/           # Backend API
├── panel_admin/   # Panel de administración
├── public/        # Sitio estático generado
└── template/      # Plantillas mustacheables
```

## Tecnologías Utilizadas

### API (Backend)
- **NodeJS + Express Framework** - Servidor web y API REST
- **SQLite** - Base de datos
- **Ratelimit** - Limitación de velocidad de requests
- **Mustache** - Motor de plantillas

### Panel Admin (Frontend)
- **VueJS** - Framework frontend (TypeScript prohibido)
- **Axios** - Cliente HTTP
- **Bootstrap** - Framework CSS

### Sitio Estático
- **HTML Minificado** - Optimización de tamaño
- **JS Minificado** - Optimización de JavaScript
- **CSS Minificado** - Optimización de estilos

## Documentación por Módulos

- [API y Backend](./api/README.md) - Documentación completa de la API
- [Panel de Administración](./panel-admin/README.md) - Guía del panel de control
- [Proceso de Generación](./generacion/README.md) - Proceso de construcción del sitio estático
- [Configuración](./configuracion/README.md) - Variables de entorno y configuración

## Inicio Rápido

1. Configurar variables de entorno (ver [Configuración](./configuracion/README.md))
2. Iniciar la API backend
3. Acceder al panel de administración
4. Configurar contenido y plantillas
5. Generar el sitio estático

## Licencia

Ver archivo [LICENSE](../LICENSE) para más detalles. 