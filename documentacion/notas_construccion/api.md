# Descripción General

Se trata del sistema de construccion de sitios en si, recibe las ordenes del panel de Administración
y contiene toda la lógica necesaria para la construcción del sitio

# Funcionalidades
## Autenticación de Usuario Administrador
--- Se debe configurar credenciales del Bot y del Chat asociado al mismo en archivo .env
--- Autenticación en 2 factores basado en Bot de Telegram
--- El admin solicita al bot enlace de acceso temporal
--- El admin ingresa al enlace y se le proporciona permisos de edición

## Páginas
Se definen como una plantilla HTML mustacheable
Admiten referencias a Scripts JS y hojas de Estilo

- Endpoint de creación de página
- Endpoint de edicóon de página
- Endpoint de eliminación de página

## Tipos de contenido
Son definiciones de estructuras de datos con campos personalizados
Se definen a partir de un nombre y tipo de dato

- Endpoint de creación de tipo de contenido
- Endpoint de edición de tipo de contenido
- Endpoint de eliminación de tipo de contenido

## Formateadores
Se usan para formatear información, por ej fechas y valores monetarios
Son usados por los tipos de contenido

- Numerico decimal
- Tipo Moneda
- Fecha Hora

## Vistas
Se definen como una plantilla HTML mustaccheable
Admiten referencias a Scripts JS y hojas de estilo

- Endpoint de creación de vista
- Endpoint de edición de vista
- Endpoint de elimminación de vista

## Contenido Multimedia
### Imágenes
### Audio
### Video

## Aprobación de Contenido

## Constructor de sitio
Proceso interno encargado de la actualización del sitio estatico
Lleva seguimiento de los recursos modificados para la actualización de las plantillas
Genera la miniatura a partir de los diferentes brakpoints
Se asegura que el contenido multimedia sea cacheado correctamente
Guarda la información en el sitio estáticos

## Generador de templates por referencia
Genera una sección del template a partir de referencia de sitio ya existente
- Hace una copia del HTML
- Identifica todas las hojas de estilo asociadas y genera una copia de las mismas

## Configuraacines
- TELEGRAM_TOKEN
- TELEGRAM_CHAT_ID
- TELEGRAM_USER_ADMIN
- TELEGRAM_USER_CHECKER
- BREAK_POINTS