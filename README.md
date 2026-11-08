# Programación de Sistemas en Tiempo Real · guía de estudio

Guía completa para aprobar la asignatura: teoría desde cero, prácticas, exámenes resueltos, hojas, demostraciones, autoevaluación, simulacros, formularios y plan de estudio.

- **Web (multipágina, instalable como app):** `index.html` (GitHub Pages)
- **HTML maestro de un solo archivo:** `guia.html`
- **PDF:** carpeta `pdf/` (guía completa, versión Acrobat con botones de mostrar/ocultar solución, exámenes resueltos, hojas resueltas, formulario de una página)
- **Scripts de las prácticas:** `scripts_practicas/`
- **Fuentes y generador:** `fuente/` (contenido en mini-DSL, código verificado, scripts de Python)

## Regenerar

```
cd fuente
python3 tools/build.py        # HTML maestro y web multipágina en dist/
python3 tools/build_pdf.py all   # PDF (requiere xelatex, rsvg-convert)
```

El contenido está en `fuente/content/*.md` (formato descrito en `fuente/tools/dsl.py`). Las fórmulas usan MathJax (se carga desde un CDN).
