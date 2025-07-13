# Plantillas - Static CMS

Sistema de plantillas para el Static CMS. Contiene las plantillas base, componentes reutilizables y configuraciones de diseño que se utilizan para generar el sitio web estático.

## 📁 Estructura

```
template/
├── base/                   # Plantillas base
│   ├── layout.html        # Plantilla principal
│   ├── head.html          # Sección head
│   ├── header.html        # Encabezado del sitio
│   ├── footer.html        # Pie de página
│   ├── navigation.html    # Navegación principal
│   └── meta.html          # Meta tags dinámicos
├── components/            # Componentes reutilizables
│   ├── card.html          # Componente de tarjeta
│   ├── button.html        # Componente de botón
│   ├── form.html          # Componente de formulario
│   ├── gallery.html       # Galería de imágenes
│   ├── pagination.html    # Paginación
│   └── breadcrumb.html    # Migas de pan
├── pages/                 # Plantillas de páginas
│   ├── home.html          # Página de inicio
│   ├── page.html          # Página genérica
│   ├── blog.html          # Lista de blog
│   ├── post.html          # Post individual
│   ├── contact.html       # Página de contacto
│   ├── about.html         # Página acerca de
│   └── error.html         # Páginas de error
├── content-types/         # Plantillas por tipo de contenido
│   ├── article.html       # Tipo: Artículo
│   ├── product.html       # Tipo: Producto
│   ├── event.html         # Tipo: Evento
│   └── testimonial.html   # Tipo: Testimonio
├── assets/                # Recursos de plantillas
│   ├── css/               # Estilos base
│   │   ├── main.css       # Estilos principales
│   │   ├── components.css # Estilos de componentes
│   │   └── utilities.css  # Clases utilitarias
│   ├── js/                # JavaScript base
│   │   ├── main.js        # Script principal
│   │   ├── navigation.js  # Navegación
│   │   └── utils.js       # Utilidades
│   └── images/            # Imágenes base
│       ├── logo.svg       # Logo del sitio
│       ├── favicon.ico    # Favicon
│       └── placeholder.jpg # Imagen placeholder
├── config/                # Configuraciones
│   ├── site.json          # Configuración del sitio
│   ├── theme.json         # Configuración del tema
│   └── seo.json           # Configuración SEO
└── helpers/               # Funciones helper
    ├── date.js            # Formateo de fechas
    ├── text.js            # Manipulación de texto
    ├── image.js           # Procesamiento de imágenes
    └── seo.js             # Generación de SEO
```

## 🎨 Sistema de Plantillas

### Motor de Plantillas

El sistema utiliza un motor de plantillas personalizado con las siguientes características:

- **Sintaxis simple**: `{{ variable }}` y `{% if condition %}`
- **Herencia**: Plantillas base con bloques reutilizables
- **Componentes**: Snippets reutilizables
- **Helpers**: Funciones para formateo y manipulación
- **Variables globales**: Configuración del sitio disponible en todas las plantillas

### Sintaxis Básica

```html
<!-- Variables -->
<h1>{{ page.title }}</h1>
<p>{{ page.content }}</p>

<!-- Condicionales -->
{% if page.featured_image %}
  <img src="{{ page.featured_image.url }}" alt="{{ page.featured_image.alt }}">
{% endif %}

<!-- Bucles -->
{% for post in posts %}
  <article>
    <h2>{{ post.title }}</h2>
    <p>{{ post.excerpt }}</p>
  </article>
{% endfor %}

<!-- Inclusión de componentes -->
{% include "components/card.html" with post %}

<!-- Herencia -->
{% extends "base/layout.html" %}
{% block content %}
  <!-- Contenido específico -->
{% endblock %}
```

## 🏗️ Plantillas Base

### layout.html

```html
<!DOCTYPE html>
<html lang="{{ site.language }}">
<head>
  {% include "base/head.html" %}
</head>
<body class="{{ page.template_class }}">
  {% include "base/header.html" %}
  
  <main id="main" class="main-content">
    {% block content %}{% endblock %}
  </main>
  
  {% include "base/footer.html" %}
  
  {% include "base/scripts.html" %}
</body>
</html>
```

### head.html

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{% block title %}{{ page.title }} - {{ site.name }}{% endblock %}</title>

{% include "base/meta.html" %}

<!-- Estilos -->
<link rel="stylesheet" href="{{ site.assets_url }}/css/main.css">
<link rel="stylesheet" href="{{ site.assets_url }}/css/components.css">

<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="{{ site.assets_url }}/images/favicon.ico">

<!-- Preload crítico -->
<link rel="preload" href="{{ site.assets_url }}/css/critical.css" as="style">
```

### header.html

```html
<header class="site-header">
  <div class="container">
    <div class="header-content">
      <div class="logo">
        <a href="{{ site.url }}">
          <img src="{{ site.assets_url }}/images/logo.svg" alt="{{ site.name }}">
        </a>
      </div>
      
      {% include "base/navigation.html" %}
      
      <button class="mobile-menu-toggle" aria-label="Menú">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</header>
```

## 🧩 Componentes

### card.html

```html
<article class="card {{ card.class }}">
  {% if card.image %}
    <div class="card-image">
      <img src="{{ card.image.url }}" alt="{{ card.image.alt }}">
    </div>
  {% endif %}
  
  <div class="card-content">
    <h3 class="card-title">
      <a href="{{ card.url }}">{{ card.title }}</a>
    </h3>
    
    {% if card.excerpt %}
      <p class="card-excerpt">{{ card.excerpt }}</p>
    {% endif %}
    
    {% if card.date %}
      <time class="card-date" datetime="{{ card.date.iso }}">
        {{ card.date.formatted }}
      </time>
    {% endif %}
  </div>
</article>
```

### button.html

```html
<a href="{{ button.url }}" 
   class="btn btn-{{ button.style }} btn-{{ button.size }}"
   {% if button.external %}target="_blank" rel="noopener"{% endif %}>
  {{ button.text }}
  {% if button.icon %}
    <i class="icon-{{ button.icon }}"></i>
  {% endif %}
</a>
```

### gallery.html

```html
<div class="gallery {{ gallery.class }}">
  {% for image in gallery.images %}
    <figure class="gallery-item">
      <a href="{{ image.full_url }}" class="gallery-link">
        <img src="{{ image.thumbnail_url }}" 
             alt="{{ image.alt }}"
             loading="lazy">
      </a>
      {% if image.caption %}
        <figcaption class="gallery-caption">
          {{ image.caption }}
        </figcaption>
      {% endif %}
    </figure>
  {% endfor %}
</div>
```

## 📄 Plantillas de Páginas

### home.html

```html
{% extends "base/layout.html" %}

{% block content %}
<section class="hero">
  <div class="container">
    <h1>{{ site.hero.title }}</h1>
    <p>{{ site.hero.subtitle }}</p>
    {% if site.hero.button %}
      {% include "components/button.html" with site.hero.button %}
    {% endif %}
  </div>
</section>

<section class="featured-content">
  <div class="container">
    <h2>Contenido Destacado</h2>
    <div class="grid">
      {% for post in featured_posts %}
        {% include "components/card.html" with post %}
      {% endfor %}
    </div>
  </div>
</section>
{% endblock %}
```

### page.html

```html
{% extends "base/layout.html" %}

{% block content %}
<article class="page">
  <header class="page-header">
    <div class="container">
      <h1>{{ page.title }}</h1>
      {% if page.excerpt %}
        <p class="page-excerpt">{{ page.excerpt }}</p>
      {% endif %}
    </div>
  </header>
  
  <div class="page-content">
    <div class="container">
      {% if page.featured_image %}
        <img src="{{ page.featured_image.url }}" 
             alt="{{ page.featured_image.alt }}"
             class="page-image">
      {% endif %}
      
      <div class="content">
        {{ page.content | safe }}
      </div>
    </div>
  </div>
</article>
{% endblock %}
```

### blog.html

```html
{% extends "base/layout.html" %}

{% block content %}
<section class="blog">
  <div class="container">
    <header class="blog-header">
      <h1>{{ page.title }}</h1>
      {% if page.description %}
        <p>{{ page.description }}</p>
      {% endif %}
    </header>
    
    <div class="blog-grid">
      {% for post in posts %}
        {% include "components/card.html" with post %}
      {% endfor %}
    </div>
    
    {% if pagination %}
      {% include "components/pagination.html" with pagination %}
    {% endif %}
  </div>
</section>
{% endblock %}
```

## 🎯 Tipos de Contenido

### article.html

```html
{% extends "base/layout.html" %}

{% block content %}
<article class="article">
  <header class="article-header">
    <div class="container">
      <h1>{{ article.title }}</h1>
      
      <div class="article-meta">
        <time datetime="{{ article.published_at.iso }}">
          {{ article.published_at.formatted }}
        </time>
        
        {% if article.author %}
          <span class="author">por {{ article.author.name }}</span>
        {% endif %}
        
        {% if article.category %}
          <span class="category">{{ article.category.name }}</span>
        {% endif %}
      </div>
      
      {% if article.excerpt %}
        <p class="article-excerpt">{{ article.excerpt }}</p>
      {% endif %}
    </div>
  </header>
  
  {% if article.featured_image %}
    <div class="article-image">
      <img src="{{ article.featured_image.url }}" 
           alt="{{ article.featured_image.alt }}">
    </div>
  {% endif %}
  
  <div class="article-content">
    <div class="container">
      {{ article.content | safe }}
    </div>
  </div>
  
  {% if article.tags %}
    <footer class="article-footer">
      <div class="container">
        <div class="tags">
          {% for tag in article.tags %}
            <a href="{{ tag.url }}" class="tag">{{ tag.name }}</a>
          {% endfor %}
        </div>
      </div>
    </footer>
  {% endif %}
</article>
{% endblock %}
```

## 🛠️ Helpers

### date.js

```javascript
// Formateo de fechas
function formatDate(date, format = 'long') {
  const d = new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('es-ES');
    case 'long':
      return d.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'relative':
      return getRelativeTime(d);
    default:
      return d.toISOString();
  }
}

// Tiempo relativo
function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
  return `Hace ${Math.floor(days / 365)} años`;
}
```

### text.js

```javascript
// Truncar texto
function truncate(text, length = 150, suffix = '...') {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + suffix;
}

// Slug de URL
function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Resaltar términos de búsqueda
function highlight(text, terms) {
  if (!terms || terms.length === 0) return text;
  
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}
```

### image.js

```javascript
// Generar srcset para imágenes responsivas
function generateSrcset(image, sizes = [320, 640, 960, 1280]) {
  return sizes
    .map(size => `${image.url}?w=${size} ${size}w`)
    .join(', ');
}

// Lazy loading
function lazyLoad(images) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}
```

## ⚙️ Configuración

### site.json

```json
{
  "name": "Mi Sitio Web",
  "description": "Descripción del sitio",
  "url": "https://misitio.com",
  "language": "es",
  "timezone": "America/Mexico_City",
  "assets_url": "/assets",
  "media_url": "/media",
  "social": {
    "facebook": "https://facebook.com/misitio",
    "twitter": "https://twitter.com/misitio",
    "instagram": "https://instagram.com/misitio"
  },
  "contact": {
    "email": "info@misitio.com",
    "phone": "+52 1 234 567 8900"
  }
}
```

### theme.json

```json
{
  "colors": {
    "primary": "#3b82f6",
    "secondary": "#64748b",
    "accent": "#f59e0b",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444"
  },
  "fonts": {
    "heading": "Inter, sans-serif",
    "body": "Inter, sans-serif"
  },
  "breakpoints": {
    "sm": "640px",
    "md": "768px",
    "lg": "1024px",
    "xl": "1280px"
  },
  "spacing": {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem"
  }
}
```

## 🎨 Estilos Base

### main.css

```css
/* Reset y base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  line-height: 1.6;
}

body {
  font-family: var(--font-body);
  color: var(--color-text);
  background-color: var(--color-background);
}

/* Variables CSS */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-text: #1f2937;
  --color-background: #ffffff;
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
}

/* Tipografía */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 1rem;
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.75rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1rem; }

/* Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main-content {
  min-height: 60vh;
  padding: 2rem 0;
}

/* Utilidades */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mt-8 { margin-top: 2rem; }

.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
```

## 🔧 Desarrollo

### Crear Nueva Plantilla

1. **Crear archivo**: `template/pages/nueva-pagina.html`
2. **Extender base**: `{% extends "base/layout.html" %}`
3. **Definir bloques**: `{% block content %}...{% endblock %}`
4. **Registrar en sistema**: Agregar a configuración de vistas

### Crear Nuevo Componente

1. **Crear archivo**: `template/components/nuevo-componente.html`
2. **Definir parámetros**: Variables esperadas
3. **Documentar uso**: Comentarios en el código
4. **Probar**: Verificar en diferentes contextos

### Variables Disponibles

#### Globales
- `site`: Configuración del sitio
- `theme`: Configuración del tema
- `user`: Usuario autenticado (si aplica)

#### Página
- `page`: Datos de la página actual
- `content`: Contenido procesado
- `meta`: Metadatos SEO

#### Listas
- `posts`: Lista de posts (en blog)
- `pages`: Lista de páginas
- `categories`: Categorías disponibles

## 📚 Referencias

- [HTML5 Semantic Elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Template Engine Best Practices](https://github.com/topics/template-engine)
- [Static Site Templates](https://www.staticgen.com/) 