/* ════════════════════════════════════════════════════════════════
   ARRANQUE
   1. Monta los capítulos (texto disponible de inmediato).
   2. Carga el escenario 3D en un chunk aparte (si hay WebGL).
   3. Construye las timelines y activa la navegación.
   ════════════════════════════════════════════════════════════════ */
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/chapters.css';

import { CHAPTERS } from './content/chapters.js';
import { registry } from './chapters/index.js';
import { initScroll, ScrollTrigger, resizeScroll } from './core/scroll.js';
import { createDirector } from './core/director.js';
import { motion } from './core/motion.js';
import { initKeyboard } from './core/keyboard.js';
import { createPresenter } from './core/presenter.js';
import { initHud } from './ui/hud.js';
import { initMenu } from './ui/menu.js';
import { initNotesPanel } from './ui/notes-panel.js';
import { keyHandlers } from './ui/shared.js';

const params = new URLSearchParams(location.search);

async function start() {
  if (motion.reduced) document.documentElement.classList.add('rm');
  initScroll();

  const director = createDirector({ chapters: CHAPTERS, registry, root: document.getElementById('chapters') });
  const hud = initHud(director);
  const menu = initMenu(director);
  const notesPanel = initNotesPanel(director);
  const blackoutEl = document.getElementById('blackout');
  const blackout = () => { blackoutEl.hidden = !blackoutEl.hidden; };
  blackoutEl.addEventListener('click', blackout);
  const presenter = createPresenter({ director, onOpenFallback: () => notesPanel.toggle(true), actions: { blackout } });
  document.getElementById('btn-notes').addEventListener('click', (e) => (e.shiftKey ? notesPanel.toggle() : presenter.openNotes()));
  initKeyboard({ director, menu, presenter, notesPanel, blackout, extraHandlers: keyHandlers });

  document.addEventListener('presentacion:goto', (e) => {
    const { id, step = 0 } = e.detail || {};
    const idx = director.list.findIndex((x) => x.meta.id === id);
    if (idx >= 0) director.jumpTo(idx, step);
  });

  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);

  let stage = null;
  const wantGL = params.get('gl') !== '0';
  if (wantGL) {
    try {
      const mod = await import('./three/stage.js');
      if (mod.webglAvailable()) {
        stage = mod.createStage({ canvas: document.getElementById('gl'), labelsEl: document.getElementById('labels'), motion });
      }
    } catch (err) {
      console.warn('[3D] no disponible, se usa el modo 2D', err);
      stage = null;
    }
  }
  if (!stage) document.body.classList.add('no-webgl');

  director.build(stage);
  stage?.precompile();
  ScrollTrigger.refresh();
  director.refresh();
  resizeScroll(); // Lenis debe conocer la nueva altura antes de cualquier salto

  const id = decodeURIComponent(location.hash.slice(1));
  const idx = director.list.findIndex((e) => e.meta.id === id);
  if (idx > 0) director.jumpTo(idx, 0);
  requestAnimationFrame(() => {
    document.body.classList.remove('is-loading');
    hud.setReady();
  });

  if (params.has('debug')) debugOverlay(director, stage);
  window.__presentacion = { director, stage };
}

function debugOverlay(director, stage) {
  const el = document.createElement('pre');
  el.style.cssText = 'position:fixed;left:8px;bottom:36px;z-index:99;margin:0;padding:8px 10px;background:rgba(0,0,0,.75);color:#9fdcaa;font:11px/1.4 monospace;border-radius:6px;pointer-events:none';
  document.body.appendChild(el);
  let frames = 0, last = performance.now(), fps = 0;
  const loop = () => {
    frames++;
    const now = performance.now();
    if (now - last > 500) { fps = Math.round((frames * 1000) / (now - last)); frames = 0; last = now; }
    const c = director.current();
    const info = stage ? stage.info() : { calls: '-', triangles: '-', dpr: '-' };
    el.textContent = `fps ${fps}  calls ${info.calls}  tris ${info.triangles}  dpr ${info.dpr}\ncap ${director.list[c.index]?.meta.id} paso ${c.step + 1}/${director.list[c.index]?.steps}`;
    requestAnimationFrame(loop);
  };
  loop();
}

start();
