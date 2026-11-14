#!/usr/bin/env python3
"""
Servidor local para probar el sitio con las MISMAS cabeceras de _headers
(incluida la CSP), para detectar bloqueos antes de publicar.

Uso:   python3 dev-server.py        (abre http://localhost:8080)
Este archivo es solo para desarrollo: NO lo subas a Cloudflare Pages
(o agrégalo a un .gitignore / bórralo antes de publicar).
"""
import http.server
import pathlib
import socketserver

ROOT = pathlib.Path(__file__).parent
PORT = 8080


def load_global_headers():
    """Lee el bloque '/*' de _headers."""
    headers, in_block = {}, False
    for line in (ROOT / "_headers").read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line.startswith((" ", "\t")):
            in_block = line.strip() == "/*"
            continue
        if in_block and ":" in line:
            k, v = line.strip().split(":", 1)
            headers[k.strip()] = v.strip()
    return headers


HEADERS = load_global_headers()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def end_headers(self):
        for k, v in HEADERS.items():
            # HSTS y upgrade-insecure-requests no aplican a http://localhost
            if k == "Strict-Transport-Security":
                continue
            if k == "Content-Security-Policy":
                v = v.replace("; upgrade-insecure-requests", "")
            self.send_header(k, v)
        super().end_headers()


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Sirviendo en http://localhost:{PORT}  (Ctrl+C para detener)")
        httpd.serve_forever()
