# API - Backend del Static CMS

## Descripción General

La API es el sistema de construcción de sitios que recibe las órdenes del panel de administración y contiene toda la lógica necesaria para la construcción del sitio estático.

## Autenticación de Usuario Administrador

### Sistema de Autenticación en 2 Factores

El sistema utiliza autenticación en dos factores basada en un bot de Telegram:

1. **Configuración del Bot**: Se deben configurar las credenciales del bot y del chat asociado en el archivo `.env`
2. **Solicitud de Acceso**: El administrador solicita un enlace de acceso temporal al bot
3. **Verificación**: El administrador ingresa al enlace y se le proporcionan permisos de edición

### Variables de Entorno Requeridas

```env
TELEGRAM_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_USER_ADMIN=admin_user_id
TELEGRAM_USER_CHECKER=checker_user_id
```

## Funcionalidades Principales

### 1. Gestión de Páginas

Las páginas se definen como plantillas HTML mustacheables que admiten referencias a scripts JS y hojas de estilo.

#### Endpoints Disponibles

- `POST /api/pages` - Creación de página
- `PUT /api/pages/:id` - Edición de página
- `DELETE /api/pages/:id` - Eliminación de página

### 2. Tipos de Contenido

Los tipos de contenido son definiciones de estructuras de datos con campos personalizados. Se definen a partir de un nombre y tipo de dato.

#### Endpoints Disponibles

- `POST /api/content-types` - Creación de tipo de contenido
- `PUT /api/content-types/:id` - Edición de tipo de contenido
- `DELETE /api/content-types/:id` - Eliminación de tipo de contenido

### 3. Formateadores

Los formateadores se utilizan para formatear información como fechas y valores monetarios. Son utilizados por los tipos de contenido.

#### Tipos de Formateadores Disponibles

- **Numérico decimal** - Para valores numéricos con decimales
- **Tipo Moneda** - Para valores monetarios
- **Fecha Hora** - Para fechas y timestamps

### 4. Vistas

Las vistas se definen como plantillas HTML mustacheables que admiten referencias a scripts JS y hojas de estilo.

#### Endpoints Disponibles

- `POST /api/views` - Creación de vista
- `PUT /api/views/:id` - Edición de vista
- `DELETE /api/views/:id` - Eliminación de vista

### 5. Contenido Multimedia

El sistema soporta diferentes tipos de contenido multimedia:

#### Tipos Soportados
- **Imágenes** - Con generación automática de miniaturas
- **Audio** - Archivos de audio
- **Video** - Archivos de video

### 6. Aprobación de Contenido

Sistema de flujo de trabajo para la aprobación de contenido antes de su publicación.

## Constructor de Sitio

### Proceso Interno

El constructor de sitio es un proceso interno encargado de la actualización del sitio estático:

1. **Seguimiento de Recursos**: Lleva seguimiento de los recursos modificados para la actualización de las plantillas
2. **Generación de Miniaturas**: Genera miniaturas a partir de los diferentes breakpoints
3. **Cache de Multimedia**: Se asegura que el contenido multimedia sea cacheado correctamente
4. **Guardado de Información**: Guarda la información en el sitio estático

### Breakpoints

Los breakpoints se configuran mediante la variable de entorno `BREAK_POINTS` y se utilizan para generar miniaturas responsivas.

## Generador de Templates por Referencia

### Funcionalidad

Genera una sección del template a partir de referencia de sitio ya existente:

1. **Copia del HTML**: Hace una copia del HTML de referencia
2. **Identificación de Estilos**: Identifica todas las hojas de estilo asociadas
3. **Generación de Copias**: Genera una copia de las hojas de estilo identificadas

## Configuración

### Variables de Entorno

```env
# Telegram Bot Configuration
TELEGRAM_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_USER_ADMIN=admin_user_id
TELEGRAM_USER_CHECKER=checker_user_id

# Responsive Breakpoints
BREAK_POINTS=320,768,1024,1440

# Database Configuration
DATABASE_PATH=./database.sqlite

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Base de Datos

### SQLite

El sistema utiliza SQLite como base de datos principal. Las tablas principales incluyen:

- **Páginas** - Almacena información de las páginas del sitio
- **Tipos de Contenido** - Define las estructuras de datos
- **Vistas** - Almacena las plantillas de vistas
- **Imágenes** - Gestiona el contenido multimedia
- **Formateadores** - Configuración de formateadores

### Estructura de Tabla de Imágenes

```sql
CREATE TABLE images (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    alt TEXT,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    original_id INTEGER,
    height INTEGER,
    width INTEGER,
    FOREIGN KEY (original_id) REFERENCES images(id)
);
```

## Seguridad

### Rate Limiting

El sistema implementa rate limiting para proteger contra ataques de fuerza bruta y abuso de la API.

### Autenticación

- Autenticación en dos factores mediante Telegram
- Tokens de sesión temporales
- Verificación de permisos por endpoint

## Desarrollo

### Instalación

```bash
npm install
```

### Ejecución en Desarrollo

```bash
npm run dev
```

### Ejecución en Producción

```bash
npm start
``` 

## Servir contenido estático (directorio public)

### Variable de entorno: SERVIR_CONTENIDO

- **Descripción**: Permite activar o desactivar el servido de archivos estáticos generados en el directorio `public` (raíz del proyecto).
- **Valor por defecto**: `true`
- **Ubicación**: Archivo `.env` de la API

```env
SERVIR_CONTENIDO=true
```

Si está en `true`, la API servirá automáticamente los archivos generados en el directorio `public` (por ejemplo, `index.html`, `/pages/`, `/assets/`, etc.).

### ¿Cómo probar que se está sirviendo el contenido?

1. Asegúrate de tener archivos generados en el directorio `public` (por ejemplo, ejecutando el generador de sitio).
2. Inicia la API normalmente (`npm run dev:api` o `npm start`).
3. Accede desde tu navegador a:
   - `http://localhost:3000/index.html` (o el puerto configurado)
   - `http://localhost:3000/pages/tu-pagina.html`
   - `http://localhost:3000/assets/tu-archivo.js`
4. Si el archivo existe en `public`, debe descargarse o visualizarse directamente.
5. Si cambias `SERVIR_CONTENIDO=false` y reinicias la API, estos archivos ya **no** serán accesibles directamente.

> **Nota:** El directorio `public` es el destino de la generación estática del sitio. Si no existe o está vacío, no se servirá contenido. 

## API de Multimedia

La API de multimedia permite subir, listar y eliminar archivos (imágenes, documentos, etc.) en el CMS. Las imágenes subidas se almacenan en el directorio público y se generan miniaturas automáticamente según los breakpoints definidos.

### Endpoints principales

- **POST /api/media/upload**
  - Sube un archivo multimedia.
  - Genera miniaturas para cada breakpoint (por ejemplo: small, medium, large).
  - Responde con las URLs de la imagen original y de las miniaturas.
  - Requiere autenticación.

- **POST /api/media/upload-multiple**
  - Sube varios archivos a la vez (máx. 10).
  - Responde con la información de los archivos subidos.
  - Requiere autenticación.

- **GET /api/media/files**
  - Lista todos los archivos multimedia disponibles en el directorio público.
  - Incluye nombre, URL, tamaño y fechas.
  - Requiere autenticación.

- **DELETE /api/media/files/:filename**
  - Elimina un archivo específico del directorio público.
  - Requiere autenticación.

### Flujo de subida y generación de miniaturas

1. El usuario sube una imagen desde el panel de administración.
2. El backend guarda la imagen original en `public/i`.
3. Para cada breakpoint definido en la base de datos, se genera una miniatura y se guarda en una subcarpeta (por ejemplo, `public/i/small/imagen.jpg`).
4. La respuesta de la API incluye las URLs de la imagen original y de todas las miniaturas generadas.

### Ejemplo de respuesta (subida de imagen)

```json
{
  "message": "Archivo subido y optimizado exitosamente",
  "url": "/i/imagen-123.jpg",
  "file": {
    "originalName": "foto.jpg",
    "filename": "imagen-123.jpg",
    "mimetype": "image/jpeg",
    "size": 123456,
    "url": "/i/imagen-123.jpg",
    "resized": [
      {
        "nombre": "small",
        "url": "/i/small/imagen-123.jpg",
        "width": 320
      },
      {
        "nombre": "medium",
        "url": "/i/medium/imagen-123.jpg",
        "width": 640
      }
    ]
  }
}
```

### Notas de seguridad y validación
- Solo se permiten ciertos tipos de archivo (imágenes, PDF, Word, TXT).
- Tamaño máximo por archivo: 10MB.
- Todos los endpoints requieren autenticación.
- Los nombres de archivo se generan automáticamente para evitar colisiones. 

## Organización de multimedia por carpetas (categorías)

La galería multimedia permite organizar los archivos en "carpetas" virtuales, llamadas categorías. Cada archivo puede pertenecer a una sola categoría, y las categorías pueden ser creadas, listadas y eliminadas desde el panel o vía API.

### Endpoints principales

- `GET /api/media/categories` — Listar categorías
- `POST /api/media/categories` — Crear nueva categoría
- `DELETE /api/media/categories/:id` — Eliminar categoría
- `GET /api/media/files?category_id=ID` — Listar archivos por categoría
- `POST /api/media/upload` — Subir archivo con categoría
- `PATCH /api/media/files/:id` — Cambiar la categoría de un archivo
- `DELETE /api/media/files/:id` — Eliminar archivo

### Ejemplo de flujo

1. Crear una categoría:
   ```http
   POST /api/media/categories
   Content-Type: application/json
   {
     "name": "banners"
   }
   ```
2. Subir un archivo a la categoría:
   ```http
   POST /api/media/upload
   Content-Type: multipart/form-data
   file: imagen.jpg
   category_id: 1
   ```
3. Listar archivos de la categoría:
   ```http
   GET /api/media/files?category_id=1
   ```
4. Mover un archivo a otra categoría:
   ```http
   PATCH /api/media/files/5
   Content-Type: application/json
   {
     "category_id": 2
   }
   ```

### Notas
- Las categorías son virtuales y no afectan la ubicación física de los archivos.
- El sistema soporta autenticación JWT en todos los endpoints de multimedia.
- La documentación OpenAPI completa se encuentra en `openapi.yaml` para integración con Swagger u otras herramientas. 