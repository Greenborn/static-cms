# Proceso de Generación del Sitio Estático

## Descripción General

Este documento describe el proceso secuencial de generación del sitio estático, desde la identificación de contenido multimedia hasta la publicación final.

## 1. Identificación de Contenido Multimedia - Imágenes

### Proceso de Generación de Miniaturas

El sistema procesa las imágenes de acuerdo a su ancho y genera miniaturas automáticamente:

1. **Análisis de Dimensiones**: Se analiza el ancho de cada imagen
2. **Comparación con Breakpoints**: Si el ancho de una imagen es mayor al definido por un breakpoint, se genera una miniatura del mismo tamaño
3. **Generación de Miniaturas**: Se crean miniaturas para cada breakpoint configurado

### Almacenamiento de Imágenes

Todas las imágenes (originales y miniaturas) se guardan en el directorio público con las siguientes características:

- **Identificación**: Se identifican por un código alfanumérico buscando el nombre más corto posible
- **Organización**: Se mantiene una estructura organizada en el directorio público
- **Optimización**: Las imágenes se optimizan para reducir el tamaño de archivo

### Base de Datos de Imágenes

En la tabla `images` de SQLite se guarda la referencia de cada imagen con los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Identificador único de la imagen |
| `name` | String | Nombre del archivo de imagen |
| `alt` | String | Texto alternativo para accesibilidad |
| `is_thumbnail` | Boolean | Indica si es una miniatura |
| `original_id` | Integer | ID de la imagen original (para miniaturas) |
| `height` | Integer | Alto en píxeles |
| `width` | Integer | Ancho en píxeles |

### Ejemplo de Estructura de Datos

```sql
-- Imagen original
INSERT INTO images (id, name, alt, is_thumbnail, original_id, height, width) 
VALUES (1, 'hero-image.jpg', 'Imagen principal', FALSE, NULL, 800, 1200);

-- Miniatura generada
INSERT INTO images (id, name, alt, is_thumbnail, original_id, height, width) 
VALUES (2, 'hero-image-768.jpg', 'Imagen principal', TRUE, 1, 512, 768);
```

## 2. Procesamiento de Plantillas Mustache

### Compilación de Templates

1. **Lectura de Plantillas**: Se leen las plantillas HTML mustacheables
2. **Inyección de Datos**: Se inyectan los datos dinámicos en las plantillas
3. **Generación de HTML**: Se genera el HTML final con los datos aplicados

### Gestión de Recursos

- **Scripts JS**: Se referencian y optimizan los scripts JavaScript
- **Hojas de Estilo**: Se procesan y optimizan las hojas de estilo CSS
- **Dependencias**: Se resuelven las dependencias entre recursos

## 3. Optimización de Contenido

### Minificación

El sistema aplica minificación a todos los archivos generados:

- **HTML Minificado**: Elimina espacios en blanco, comentarios y optimiza la estructura
- **JS Minificado**: Comprime y optimiza el código JavaScript
- **CSS Minificado**: Reduce el tamaño de las hojas de estilo

### Optimización de Imágenes

- **Compresión**: Se aplica compresión optimizada para web
- **Formatos Modernos**: Se utilizan formatos como WebP cuando es posible
- **Lazy Loading**: Se implementa carga diferida para mejorar el rendimiento

## 4. Generación de Estructura de Directorios

### Organización de Archivos

```
public/
├── index.html
├── pages/
│   ├── about.html
│   └── contact.html
├── assets/
│   ├── css/
│   │   └── styles.min.css
│   ├── js/
│   │   └── scripts.min.js
│   └── images/
│       ├── hero-image.jpg
│       └── thumbnails/
│           ├── hero-image-320.jpg
│           ├── hero-image-768.jpg
│           └── hero-image-1024.jpg
└── media/
    ├── audio/
    └── video/
```

## 5. Cache y Control de Versiones

### Sistema de Cache

- **Cache de Recursos**: Se implementa cache para recursos estáticos
- **Invalidación Inteligente**: Solo se regeneran los recursos modificados
- **Headers de Cache**: Se configuran headers apropiados para optimización

### Control de Versiones

- **Seguimiento de Cambios**: Se mantiene un registro de los recursos modificados
- **Actualización Incremental**: Solo se actualizan los archivos que han cambiado
- **Backup Automático**: Se crean copias de seguridad antes de actualizaciones

## 6. Validación y Testing

### Validación de Contenido

- **Validación HTML**: Se verifica que el HTML generado sea válido
- **Verificación de Enlaces**: Se comprueban que todos los enlaces funcionen
- **Optimización SEO**: Se aplican optimizaciones básicas de SEO

### Testing Automatizado

- **Pruebas de Rendimiento**: Se miden los tiempos de carga
- **Verificación de Responsividad**: Se comprueba que el sitio funcione en diferentes dispositivos
- **Validación de Accesibilidad**: Se verifican estándares básicos de accesibilidad

## 7. Despliegue

### Proceso de Publicación

1. **Generación Completa**: Se genera todo el sitio estático
2. **Validación Final**: Se ejecutan las validaciones finales
3. **Sincronización**: Se sincronizan los archivos con el servidor de producción
4. **Verificación Post-Despliegue**: Se verifica que el sitio funcione correctamente

### Configuración de Servidor

- **Headers de Seguridad**: Se configuran headers de seguridad apropiados
- **Compresión Gzip**: Se habilita compresión para mejorar el rendimiento
- **CDN Integration**: Se integra con CDN para distribución global

## Monitoreo y Mantenimiento

### Logs y Métricas

- **Logs de Generación**: Se mantienen logs detallados del proceso de generación
- **Métricas de Rendimiento**: Se recopilan métricas de rendimiento del sitio
- **Alertas**: Se configuran alertas para problemas críticos

### Mantenimiento Regular

- **Limpieza de Cache**: Se limpia el cache periódicamente
- **Optimización de Base de Datos**: Se optimiza la base de datos SQLite
- **Actualización de Dependencias**: Se mantienen las dependencias actualizadas 

## Inclusión automática de style.css minificado

A partir de la versión actual, el constructor de sitios realiza lo siguiente:

- Lee el archivo `template/base/style.css`.
- Minifica el CSS usando CleanCSS.
- Guarda el resultado como `public/assets/css/style.min.css`.
- Inserta automáticamente la referencia `<link rel="stylesheet" href="/assets/css/style.min.css">` en el `<head>` del `index.html` generado.

Esto garantiza que los estilos base estén siempre presentes y optimizados en el sitio generado. 

## Inclusión automática de scripts.js minificado

El constructor de sitios también realiza lo siguiente:

- Lee el archivo `template/base/scripts.js`.
- Minifica el JS usando Terser.
- Guarda el resultado como `public/assets/js/scripts.min.js`.
- Inserta automáticamente la referencia `<script src="/assets/js/scripts.min.js"></script>` antes de `</body>` en el `index.html` generado.

Esto garantiza que los scripts base estén siempre presentes y optimizados en el sitio generado. 

## Copia, mustacheo y minificación de archivos HTML base

Durante la construcción del sitio, el sistema:

- Toma todos los archivos `.html` ubicados en `template/base` (excepto `index.html`).
- Procesa cada archivo con Mustache (`Mustache.render`) usando los datos dinámicos (`templateData`).
- Minifica el HTML resultante.
- Copia el archivo final al directorio público (`public/`).

Esto permite tener archivos base reutilizables, optimizados y personalizados según la configuración y datos del sitio. 