/* 00 · INTRO — ¿Qué pasa realmente cuando abres una página web? */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.intro;

/* Pantalla de la laptop: un navegador donde se escribe la URL */
export function drawBrowser(ctx, w, h, d) {
  const typed = Math.floor(d.typed || 0);
  const url = (d.url || T.url).slice(0, typed);
  ctx.fillStyle = '#f3f0e9';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e4dfd4';
  ctx.fillRect(0, 0, w, 120);
  ['#d0c9bb', '#d0c9bb', '#d0c9bb'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(46 + i * 38, 60, 11, 0, Math.PI * 2); ctx.fill(); });
  // Barra de direcciones
  const bx = 170, by = 26, bw = w - 220, bh = 68;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, bx, by, bw, bh, 34); ctx.fill();
  if (d.enter > 0.5) { ctx.strokeStyle = '#1a4fe0'; ctx.lineWidth = 4; roundRect(ctx, bx, by, bw, bh, 34); ctx.stroke(); }
  ctx.font = '500 40px "Geist Mono Variable", monospace';
  ctx.textBaseline = 'middle';
  if (!typed) { ctx.fillStyle = '#9a958b'; ctx.fillText('Escribe una dirección', bx + 36, by + bh / 2 + 1); }
  else { ctx.fillStyle = '#161616'; ctx.fillText(url, bx + 36, by + bh / 2 + 1); }
  if (d.enter < 0.5) {
    const cx = bx + 36 + (typed ? ctx.measureText(url).width + 6 : 0);
    ctx.fillStyle = '#1a4fe0'; ctx.fillRect(cx, by + 16, 4, bh - 32);
  }
  // Carga
  const load = d.load || 0;
  if (load > 0) {
    ctx.fillStyle = '#1a4fe0';
    ctx.fillRect(0, 118, w * load, 6);
    ctx.fillStyle = '#53514c';
    ctx.font = '500 34px "Geist Variable", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(load < 1 ? 'Buscando la página…' : 'Petición enviada', w / 2, h / 2 + 30);
    ctx.textAlign = 'left';
  } else {
    // página en blanco con un indicio de contenido
    ctx.fillStyle = '#e8e3d9';
    roundRect(ctx, w / 2 - 170, h / 2 - 10, 340, 26, 13); ctx.fill();
    roundRect(ctx, w / 2 - 110, h / 2 + 40, 220, 22, 11); ctx.fill();
  }
}
drawBrowser.key = (d) => `${Math.floor(d.typed || 0)}|${d.enter > 0.5}|${Math.round((d.load || 0) * 30)}`;

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default {
  steps: 3,
  cams: [
    { p: [0, 2.4, 15], t: [0, 1.4, 0] },
    { p: [0, 4.0, 13.6], t: [0, 2.15, 0] },
    { p: [0, 3.4, 11.2], t: [0, 1.75, 0] },
  ],
  fog: [14, 40],

  mount(stage) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="intro-hero"><div class="intro-hero-in">
        <p class="label intro-eyebrow"><span class="in">${esc(T.eyebrow)}</span></p>
        <h1 class="h-display intro-title" id="intro-h"><span class="in">${T.title.map(esc).join('<br>')}</span></h1>
        <p class="lead intro-sub"><span class="in">${esc(T.sub)}</span></p>
      </div></div>
      <div class="block b-bl caps intro-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <p class="intro-scroll label" aria-hidden="true"><span class="in">${esc(T.scroll)} <i>↓</i></span></p>
    `);
  },

  scene(K) {
    const grid = new K.THREE.GridHelper(80, 80, K.P.line, K.P.line);
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    grid.position.y = -0.1;
    K.root.add(grid);
    const lap = K.laptop({ at: [0, 0, 0], draw: drawBrowser });
    lap.s.show = 0;
    lap.s.open = 0.25;
    lap.data = { typed: 0, enter: 0, load: 0, url: T.url };
    const curve = K.curveOf([[0, 1.55, 0.25], [0, 3.2, -3], [0.4, 5.5, -10], [1, 7, -18]]);
    const trail = K.link(null, { curve, width: 2.4 });
    const pulse = K.pulse(curve, { size: 0.14 });
    return { lap, trail, pulse, grid };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const hero = $(st, '.intro-hero-in');
    const caps = $$(st, '.intro-caps > p');
    const scrollHint = $(st, '.intro-scroll');

    // Paso 1: el título sube y aparece la laptop
    // y relativo: lleva el bloque del título a la parte superior de la pantalla
    const lift = () => -(hero.offsetTop - window.innerHeight * 0.1);
    ctx.to(hero, { y: lift, scale: 0.5, duration: 0.7, ease: 'power3.inOut' }, ctx.at(1, 0));
    ctx.to($(st, '.intro-sub'), { opacity: 0, duration: 0.3 }, ctx.at(1, 0));
    ctx.to(scrollHint, { opacity: 0, duration: 0.2 }, ctx.at(1, 0));
    ctx.caps(caps, [1, 2]);
    if (r.lap) {
      ctx.to(r.lap.s, { show: 1, duration: 0.7, ease: 'power3.out' }, ctx.at(1, 0.1));
      ctx.fromTo(r.lap.s, { lift: -1.2 }, { lift: 0, duration: 0.7, ease: 'power3.out' }, ctx.at(1, 0.1));
      ctx.to(r.lap.s, { open: 1, duration: 0.6, ease: 'power2.inOut' }, ctx.at(1, 0.35));
      // Paso 2: se escribe la URL y se presiona Enter
      ctx.to(r.lap.data, { typed: T.url.length, duration: 0.32, ease: 'none' }, 2.1);
      ctx.to(r.lap.data, { enter: 1, duration: 0.02 }, 2.46);
      ctx.to(r.lap.data, { load: 1, duration: 0.3, ease: 'none' }, 2.5);
      // Salida: el pulso deja la pantalla y nos lleva al capítulo 01
      ctx.to(r.pulse.s, { show: 1, duration: 0.05 }, 3.02);
      ctx.to(r.pulse.s, { p: 1, duration: 0.6, ease: 'power2.in' }, 3.05);
      ctx.to(r.trail.s, { draw: 1, hot: 1, duration: 0.6, ease: 'power2.in' }, 3.05);
    }
  },
};
