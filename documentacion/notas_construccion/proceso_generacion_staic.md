# Descripción

Aqui se describe el proceso secuencial de generación del sitio estático

## 1 - Identificación de contenido multimedia - Imágenes

En el caso de las imágenes de acuerdo a su ancho se generan las miniaturasn
Se genera una miniatura de acuerdo a su ancho
Si el ancho de una imagen es mayor al definido por un endpoint se genera una miniatura del mismo tamaño que el endpoint
Todas las imágenes tanto la original como las miniaturas se guardan en el directorio publico, se identifican por un
codigo alfanumércio buscando el nombre mas corto posible

En una tabla de Imágenes de SQLite se guarda la referencia de la misma indicando
- ID - Integer
- Nombre - String
- Alt - String
- Es Miniatura - Boolean
- Id Original - Integer
- Alto - integer pixeles
- Ancho - Integer pixeles