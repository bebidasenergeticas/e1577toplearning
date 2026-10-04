# De una idea a una página web funcional con IA

Presentación interactiva (scroll + 3D) para la clase **E1577 · Inteligencia Artificial y Automatización**.
Reemplaza a PowerPoint: se navega con scroll o teclado y explica, para no programadores, qué es una web,
frontend, backend, APIs, webhooks, JSON, n8n, IA y agentes de codificación.

- **Publicada en:** `https://bebidasenergeticas.github.io/e1577toplearning/de-idea-a-web/`
- **Tecnología:** Vite + JavaScript sin framework + Three.js + GSAP/ScrollTrigger + Lenis. Sin backend.

---

## 1. Ejecutar en tu computadora

Necesitas [Node.js](https://nodejs.org) 20.19 o superior (recomendado 22).

```bash
cd clases/de-idea-a-web
npm install        # instala dependencias (solo la primera vez)
npm run dev        # abre http://localhost:5173
```

## 2. Compilar (build)

```bash
npm run build         # genera dist/ (para Netlify o Vercel)
npm run build:pages   # genera ../../de-idea-a-web/ (la carpeta que publica GitHub Pages)
npm run preview       # sirve el build localmente para revisarlo
```

## 3. Desplegar

| Dónde | Cómo |
|---|---|
| **GitHub Pages** (actual) | Ejecuta `npm run build:pages`, haz commit de la carpeta `de-idea-a-web/` (en la raíz del repo) y súbela a `main`. Pages ya publica la rama `main`. |
| **Netlify** | Nuevo sitio desde el repo → *Base directory*: `clases/de-idea-a-web` (el `netlify.toml` ya indica `npm run build` y `dist`). |
| **Vercel** | Nuevo proyecto desde el repo → *Root Directory*: `clases/de-idea-a-web`. Vercel detecta Vite (build `npm run build`, salida `dist`). |

El sitio usa rutas relativas (`base: './'`), así que funciona en cualquier subcarpeta.

## 4. Dónde cambiar cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| **Textos en pantalla** (títulos, frases, etiquetas) | `src/content/chapters.js` (objeto `TEXT`, agrupado por capítulo) |
| **Orden de los capítulos**, número visible, tema claro/oscuro | `src/content/chapters.js` (arreglo `CHAPTERS`) |
| **Notas del profesor** (idea, pregunta, analogía, transición, tiempo, pasos) | `src/content/notes.js` |
| **Preguntas del quiz** | `src/content/quiz.js` |
| **Profesiones de la actividad** | `src/content/professions.js` |
| **Colores y tipografía** | `src/styles/tokens.css` (y, para los objetos 3D, `src/three/palette.js`) |
| **Animación y 3D de un capítulo** | `src/chapters/<número>-<nombre>.js` |
| **Estilos de un capítulo** | `src/styles/chapters.css` (secciones comentadas por capítulo) |

### Agregar un capítulo nuevo

1. Copia un capítulo parecido de `src/chapters/` (por ejemplo `08-error.js` si es solo HTML, o `06-datos.js` si usa 3D).
2. Agrega sus textos en `TEXT` y una entrada en `CHAPTERS` (`src/content/chapters.js`), en la posición deseada.
3. Regístralo en `src/chapters/index.js`.
4. (Opcional) Agrega sus notas en `src/content/notes.js`.

Cada capítulo define `steps` (pasos de teclado), `mount()` (HTML), `build()` (animación por paso) y, si usa 3D,
`cams` (cámara por paso) y `scene()`. La animación del paso *k* va en `ctx.at(k, 0…1)`.

## 5. Uso en clase (Google Meet)

| Acción | Tecla |
|---|---|
| Siguiente / anterior paso | `↓ → PageDown Espacio` / `↑ ← PageUp Shift+Espacio` |
| Inicio / cierre | `Home` / `End` |
| Índice de capítulos | `M` (o el botón «Índice») |
| **Notas del profesor en ventana aparte** | `N` (o el botón «Notas») |
| Notas dentro de la página (respaldo) | `Shift+N` |
| Pantalla completa · Pausa en negro · Ayuda | `F` · `B` · `?` |
| Quiz | `1–4` responder · `Enter` continuar |

**Para que solo tú veas las notas:** en Meet comparte **solo la pestaña o la ventana de la presentación**
y abre las notas con `N`: se abren en otra ventana, sincronizada, desde la que también puedes avanzar.
El panel de respaldo (`Shift+N`) sí es visible si compartes esa pestaña; por eso muestra una advertencia.

Cada capítulo tiene su dirección: `…/de-idea-a-web/#backend`, `#codeweb`, etc. (útil para retomar).
En el índice puedes activar **Reducir movimiento** o **3D ligero** (si la computadora va lenta al compartir pantalla).

## 6. Calidad (QA)

```bash
npm run build && npm run qa
```

Recorre todos los capítulos y pasos en 1920×1080, 1440×900, 1366×768, móvil (390×844) y con movimiento
reducido; revisa errores de consola, textos fuera de pantalla, teclado, índice, notas, actividad, quiz,
enlace directo, cambio de tamaño, contraste y rendimiento. Resultado en `qa-output/report.md`.
Si Playwright no encuentra un navegador, instala uno con `npx playwright install chromium`
o indica uno con `CHROME_PATH=/ruta/a/chrome npm run qa`.

**Antes de la clase, prueba en tu propia laptop y en una llamada de Meet de prueba**: el QA automático
corre sin tarjeta gráfica, así que sus cifras de FPS no representan tu equipo.

## 7. Notas de contenido

- «Nova», «JP Consultores» y «Juan Pérez» son ficticios. Los datos del capítulo 14 están rotulados como ficticios.
- Las notas del profesor, las analogías adicionales, los tiempos sugeridos y los flujos de *Administración* y
  *Emprendimiento* son una **adaptación pedagógica** propuesta (no contenido oficial de Top Learning).
- La terminal del capítulo 10 es una simulación ilustrativa, no un registro real.
- No se guardan ni se envían datos: la actividad y el quiz funcionan solo en el navegador.

## 8. Estructura

```
clases/de-idea-a-web/
├─ index.html, notas.html        páginas (presentación y ventana de notas)
├─ src/content/                  TODO el texto editable
├─ src/styles/                   tokens (colores), base, UI, capítulos
├─ src/core/                     director (scroll + pasos), teclado, notas, movimiento reducido
├─ src/three/                    escenario 3D (render bajo demanda) y kit de piezas
├─ src/chapters/                 un archivo por capítulo
├─ src/ui/                       HUD, índice, panel de notas
└─ scripts/qa.mjs                QA automatizado
```

Licencias: GSAP (licencia estándar gratuita de GSAP), Three.js y Lenis (MIT), fuentes Geist (SIL OFL).
