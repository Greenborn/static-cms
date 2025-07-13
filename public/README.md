# Sitio Público - Static CMS

Directorio que contiene el sitio web estático generado por el Static CMS. Este directorio se sirve directamente por el servidor web en producción.

## 📁 Estructura

```
public/
├── index.html              # Página principal
├── pages/                  # Páginas generadas
│   ├── about.html         # Página "Acerca de"
│   ├── contact.html       # Página "Contacto"
│   └── blog/              # Páginas de blog
│       ├── index.html     # Lista de posts
│       ├── post-1.html    # Post individual
│       └── post-2.html    # Post individual
├── assets/                 # Recursos estáticos
│   ├── css/               # Hojas de estilo
│   │   ├── main.css       # Estilos principales
│   │   └── components.css # Estilos de componentes
│   ├── js/                # JavaScript
│   │   ├── main.js        # Script principal
│   │   └── utils.js       # Utilidades
│   └── images/            # Imágenes optimizadas
│       ├── logo.png       # Logo del sitio
│       ├── hero.jpg       # Imagen hero
│       └── thumbnails/    # Miniaturas generadas
├── media/                  # Archivos multimedia
│   ├── uploads/           # Archivos subidos
│   │   ├── images/        # Imágenes
│   │   ├── documents/     # Documentos
│   │   └── videos/        # Videos
│   └── thumbnails/        # Miniaturas automáticas
├── sitemap.xml            # Mapa del sitio
├── robots.txt             # Instrucciones para crawlers
└── .htaccess              # Configuración Apache (opcional)
```

## 🚀 Generación

El contenido de este directorio se genera automáticamente por el **Constructor de Sitio** del panel de administración.

### Proceso de Generación

1. **Análisis de contenido**: El constructor lee todas las páginas, tipos de contenido y vistas
2. **Procesamiento de plantillas**: Aplica las plantillas HTML correspondientes
3. **Formateo de contenido**: Ejecuta los formateadores configurados
4. **Optimización de recursos**: Comprime y optimiza CSS, JS e imágenes
5. **Generación de archivos**: Crea los archivos HTML estáticos
6. **Generación de metadatos**: Crea sitemap.xml y robots.txt

### Comandos de Generación

```bash
# Generación completa del sitio
curl -X POST http://localhost:3000/api/site-builder/build

# Generación de una página específica
curl -X POST http://localhost:3000/api/site-builder/build-page/1

# Limpieza del directorio público
curl -X POST http://localhost:3000/api/site-builder/clean
```

## 🌐 Configuración del Servidor Web

### Apache (.htaccess)

```apache
# Habilitar compresión
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache de archivos estáticos
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Headers de seguridad
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Redirección de errores
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html
```

### Nginx

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/html/public;
    index index.html;

    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache de archivos estáticos
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Headers de seguridad
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Manejo de rutas SPA (si es necesario)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Páginas de error
    error_page 404 /404.html;
    error_page 500 /500.html;
}
```

## 📊 Optimización

### Compresión de Archivos

- **CSS**: Minificado y comprimido
- **JavaScript**: Minificado y comprimido
- **Imágenes**: Optimizadas y convertidas a formatos modernos (WebP)
- **HTML**: Minificado y optimizado

### Cache y CDN

- **Cache de navegador**: Headers apropiados para archivos estáticos
- **CDN**: Configuración para distribución global
- **Service Workers**: Para cache offline (opcional)

### SEO

- **Meta tags**: Generados automáticamente
- **Sitemap**: Actualizado en cada build
- **Robots.txt**: Configurado para crawlers
- **Schema.org**: Marcado estructurado (opcional)

## 🔧 Mantenimiento

### Limpieza Automática

El constructor limpia automáticamente archivos obsoletos:

- Archivos HTML de páginas eliminadas
- Imágenes no utilizadas
- Archivos temporales de build

### Backup

Se recomienda hacer backup antes de cada generación:

```bash
# Backup del directorio público
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz public/

# Restaurar backup
tar -xzf backup-20231201-143022.tar.gz
```

### Monitoreo

- **Logs de generación**: Revisar logs del constructor
- **Validación HTML**: Verificar sintaxis de archivos generados
- **Pruebas de rendimiento**: Lighthouse, PageSpeed Insights

## 🚨 Consideraciones de Seguridad

### Headers de Seguridad

```apache
# Prevenir clickjacking
Header always set X-Frame-Options DENY

# Prevenir MIME sniffing
Header always set X-Content-Type-Options nosniff

# Protección XSS
Header always set X-XSS-Protection "1; mode=block"

# Política de referrer
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

### Permisos de Archivos

```bash
# Permisos seguros para archivos
find public/ -type f -exec chmod 644 {} \;

# Permisos para directorios
find public/ -type d -exec chmod 755 {} \;
```

### Validación de Contenido

- **Sanitización**: Todo el contenido se sanitiza antes de la generación
- **Validación**: Verificación de tipos de archivo en uploads
- **Escaneo**: Análisis de malware en archivos subidos

## 📈 Rendimiento

### Métricas Objetivo

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Optimizaciones

- **Lazy loading**: Para imágenes y recursos pesados
- **Critical CSS**: CSS crítico inline
- **Preload**: Recursos importantes precargados
- **Resource hints**: DNS prefetch, preconnect

## 🔍 Troubleshooting

### Problemas Comunes

1. **Archivos no encontrados (404)**
   - Verificar que la generación se completó correctamente
   - Revisar logs del constructor
   - Comprobar permisos de archivos

2. **Imágenes no cargan**
   - Verificar rutas relativas en HTML
   - Comprobar que las miniaturas se generaron
   - Revisar permisos de directorio media/

3. **CSS/JS no se aplica**
   - Verificar rutas en HTML generado
   - Comprobar que los archivos existen
   - Revisar cache del navegador

### Logs de Debug

```bash
# Ver logs de generación
tail -f /var/log/static-cms/build.log

# Verificar estructura de archivos
tree public/ -L 3

# Comprobar tamaños de archivos
du -sh public/*
```

## 📚 Referencias

- [Web Performance Best Practices](https://web.dev/performance/)
- [SEO Best Practices](https://developers.google.com/search/docs)
- [Security Headers](https://owasp.org/www-project-secure-headers/)
- [Static Site Generators](https://www.staticgen.com/) 