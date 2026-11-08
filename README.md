# Programación de Sistemas en Tiempo Real · Guía para aprobar

**Proyecto iniciado el 8 de noviembre de 2026.**

Guía de estudio interactiva de Programación de Sistemas en Tiempo Real (UPCT, GIEyA): C++ y STL, clases, herencia y polimorfismo, hilos, monitores, planificación y coma flotante.

Ábrela en: https://helionacon-ui.github.io/Programaci-n-en-tiempo-real/

Está dividida en varias páginas: portada con buscador, una página por tema (`tema-0.html` … `tema-7.html`), prácticas, exámenes resueltos paso a paso, hojas de problemas, demostraciones, autoevaluación, simulacros, formulario, glosario y plan de estudio. Todas comparten `style.css` y `app.js`, y el buscador busca en toda la guía. `guia-completa.html` es la misma guía en una sola página.

La página de simulacros incluye un **modo examen** con reloj de 2 h 30 min (la solución solo se ve al entregar y se calcula una nota estimada) y un **revisor de código** que detecta los fallos típicos antes de entregar. Las tarjetas y el test usan **repetición espaciada** y recuerdan en tu navegador lo que has fallado.

Cada tema lleva figuras (pulsa una para ampliarla), simuladores interactivos, ejemplos de código compilados y comprobados, cuadros de trucos y errores típicos, y vídeos recomendados de YouTube que se cargan al pulsar.

Se puede instalar como aplicación (pantalla de inicio en el móvil, «Instalar» en el ordenador) y funciona sin conexión después de abrirla una vez con internet.

## Descargas en PDF

- [Guía completa, PDF navegable](guia_tiempo_real.pdf) (cualquier visor)
- [Guía completa, PDF con botones](guia_tiempo_real_acrobat.pdf) (Adobe Acrobat / Reader: mostrar u ocultar cada solución)
- [Exámenes resueltos paso a paso](examenes_resueltos.pdf)
- [Hojas de problemas resueltas](hojas_resueltas.pdf)
- [Formulario en una página](formulario_1_pagina.pdf)

## Código

- `scripts_practicas/`: programas de las prácticas.
- `ejemplos/`: siete programas de trucos y ejemplos explicados (STL, clase completa, trampas del polimorfismo, hilos, plantilla de monitor, RM frente a EDF, coma flotante). Compilan con `g++ -std=c++17 -Wall -Wextra -pthread`.
- `fuente/`: contenido en mini-DSL, código verificado y generador en Python.

## Regenerar

```
cd fuente
python3 tools/build.py           # web multipágina y guía completa en dist/
python3 tools/build_pdf.py all   # PDF (requiere xelatex y rsvg-convert)
```
