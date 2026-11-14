# Toll-Track · Mantenimiento 360 — Landing de ventas

Sitio estático (HTML + CSS + JS mínimo). Sin frameworks, sin base de datos, sin rastreadores, sin fuentes externas.

## Estructura

```
index.html          Landing (15 secciones, con comentarios de edición)
privacidad.html     Aviso de privacidad (BORRADOR sujeto a revisión legal)
terminos.html       Términos y condiciones (BORRADOR sujeto a revisión legal)
css/styles.css      Estilos. Los colores están en las variables de :root
js/main.js          Menú móvil y sombra de cabecera (nada más)
img/                Logo, capturas de la app y logo del cliente
_headers            Cabeceras de seguridad (CSP estricta) para Cloudflare Pages
robots.txt, sitemap.xml
dev-server.py       Solo para pruebas locales (aplica _headers). No publicar.
```

## Probar localmente

```bash
cd toll-track-site
python dev-server.py         # (en Windows: python o py) abre http://localhost:8080
```

Este servidor aplica la CSP de `_headers`. Abre la consola del navegador (F12): no debe haber errores de "Content Security Policy". Si agregas un `<script>`, `<style>` o `style=""` en línea, la CSP lo bloqueará: ponlo en un archivo aparte.

## Encontrar todo lo que falta reemplazar

```bash
grep -rn "\[\[" --include=*.html .
```

## Publicar en Cloudflare Pages

1. Borra `dev-server.py` y este README de la carpeta que subas (o déjalos: no se ejecutan).
2. Cloudflare → Workers & Pages → Create → Pages → "Upload assets" (o conecta un repositorio).
3. Sin comando de build. Directorio de salida: la raíz de la carpeta.
4. Después de publicar, revisa las cabeceras en https://securityheaders.com y la CSP en la consola del navegador.
