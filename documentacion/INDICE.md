# Índice de Documentación - Static CMS

## Documentación General

- [README Principal](./README.md) - Visión general del proyecto y guía de inicio rápido

## Módulos del Sistema

### Backend y API
- [API y Backend](./api/README.md) - Documentación completa de la API REST
  - Autenticación con Telegram
  - Gestión de páginas, tipos de contenido y vistas
  - Procesamiento de contenido multimedia
  - Constructor de sitio estático
  - Configuración de base de datos SQLite

### Panel de Administración
- [Panel de Administración](./panel-admin/README.md) - Guía completa del panel de control
  - Arquitectura de componentes VueJS
  - Gestión de contenido multimedia
  - Editor de plantillas mustache
  - Integración con la API
  - Configuración de seguridad

### Proceso de Generación
- [Proceso de Generación](./generacion/README.md) - Proceso de construcción del sitio estático
  - Identificación y procesamiento de imágenes
  - Generación de miniaturas responsivas
  - Compilación de plantillas mustache
  - Optimización y minificación
  - Despliegue y cache

### Configuración del Sistema
- [Configuración](./configuracion/README.md) - Variables de entorno y configuración
  - Configuración del bot de Telegram
  - Variables de entorno por entorno
  - Configuración de servidor web (Nginx/Apache)
  - Estructura de base de datos
  - Scripts de backup y monitoreo

## Guías de Uso

### Para Desarrolladores
1. **Configuración Inicial**:
   - Leer [README Principal](./README.md)
   - Configurar variables de entorno según [Configuración](./configuracion/README.md)
   - Inicializar base de datos

2. **Desarrollo de la API**:
   - Revisar [API y Backend](./api/README.md)
   - Configurar autenticación de Telegram
   - Implementar endpoints según especificación

3. **Desarrollo del Panel**:
   - Revisar [Panel de Administración](./panel-admin/README.md)
   - Configurar VueJS sin TypeScript
   - Implementar componentes según arquitectura

### Para Administradores
1. **Configuración del Sistema**:
   - Seguir guía de [Configuración](./configuracion/README.md)
   - Configurar bot de Telegram
   - Configurar servidor web

2. **Gestión de Contenido**:
   - Usar panel de administración según [Panel de Administración](./panel-admin/README.md)
   - Crear tipos de contenido
   - Gestionar páginas y vistas

3. **Generación de Sitio**:
   - Entender proceso según [Proceso de Generación](./generacion/README.md)
   - Monitorear logs de generación
   - Verificar optimización de recursos

## Estructura de Archivos

```
documentacion/
├── README.md                    # Documentación principal
├── INDICE.md                    # Este archivo - índice completo
├── api/
│   └── README.md               # Documentación de la API
├── panel-admin/
│   └── README.md               # Documentación del panel
├── generacion/
│   └── README.md               # Proceso de generación
└── configuracion/
    └── README.md               # Configuración del sistema
```

## Tecnologías Documentadas

### Backend
- **NodeJS + Express** - Servidor web y API REST
- **SQLite** - Base de datos
- **Mustache** - Motor de plantillas
- **Telegram Bot API** - Autenticación en dos factores

### Frontend
- **VueJS** - Framework frontend (sin TypeScript)
- **Axios** - Cliente HTTP
- **Bootstrap** - Framework CSS

### Procesamiento
- **Generación de Miniaturas** - Imágenes responsivas
- **Minificación** - HTML, CSS, JS
- **Optimización** - Compresión y cache

## Flujo de Trabajo

### 1. Configuración Inicial
1. Configurar variables de entorno
2. Inicializar base de datos
3. Configurar bot de Telegram
4. Configurar servidor web

### 2. Desarrollo
1. Desarrollar API backend
2. Desarrollar panel de administración
3. Crear plantillas mustache
4. Configurar tipos de contenido

### 3. Producción
1. Generar sitio estático
2. Optimizar recursos
3. Configurar cache
4. Monitorear rendimiento

## Referencias Técnicas

### Base de Datos
- Estructura de tablas SQLite
- Relaciones entre entidades
- Índices y optimizaciones

### API REST
- Endpoints disponibles
- Formatos de request/response
- Códigos de estado HTTP
- Autenticación y autorización

### Plantillas
- Sintaxis Mustache
- Variables disponibles
- Estructura de datos
- Ejemplos de uso

## Troubleshooting

### Problemas Comunes
1. **Autenticación de Telegram** - Verificar tokens y configuración
2. **Generación de Imágenes** - Verificar librerías y permisos
3. **Base de Datos** - Verificar permisos y estructura
4. **Rate Limiting** - Ajustar límites según necesidades

### Logs y Debugging
- Ubicación de archivos de log
- Niveles de logging
- Interpretación de errores
- Herramientas de debugging

## Contribución

### Estándares de Documentación
- Usar Markdown para todos los archivos
- Incluir ejemplos de código
- Mantener estructura consistente
- Actualizar índice cuando se agreguen nuevos documentos

### Mantenimiento
- Revisar documentación regularmente
- Actualizar según cambios en el código
- Verificar enlaces y referencias
- Solicitar feedback de usuarios

## Contacto y Soporte

Para preguntas sobre la documentación o el sistema:
- Revisar sección de troubleshooting
- Consultar logs del sistema
- Verificar configuración según guías
- Contactar al equipo de desarrollo 