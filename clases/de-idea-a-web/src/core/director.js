/* ════════════════════════════════════════════════════════════════
   DIRECTOR — crea los capítulos, sus timelines y coordina todo.
   ────────────────────────────────────────────────────────────────
   Cada capítulo ocupa `steps` pantallas de scroll. Su timeline va de
   0 a steps+1:
     [0 → 1]          entrada (la sección sube desde abajo)
     paso k en 1+k    (la composición del paso k está completa ahí)
     [steps → steps+1] salida (la sección se va hacia arriba)
   La transición hacia el paso k ocurre en [k+0.1, k+0.9]: así cada
   paso tiene una zona de reposo y siempre se ve una composición completa.
   ════════════════════════════════════════════════════════════════ */
import { gsap, ScrollTrigger, scrollY, scrollTo, onScroll, isScrolling, resizeScroll } from './scroll.js';
import { motion, safeVars } from './motion.js';

const DARK = [17, 17, 17];
const LIGHT = [243, 240, 233];
const DEFAULT_CAM = { p: [0, 0.4, 14], t: [0, 0, 0], fov: 32 };

export function createDirector({ chapters, registry, root }) {
  const list = [];
  const listeners = { chapter: new Set(), step: new Set(), frame: new Set() };
  let positions = [];        // [{y, chapter, step}]
  let unit = window.innerHeight;
  let current = { index: -1, step: -1 };
  let navigating = false;
  let snapTimer = 0;
  let stage3d = null;
  let built = false;
  let dirty = true;
  let lastY = -1;
  const snapEnabled = !motion.touch;

  /* ── 1. Montaje del DOM ── */
  chapters.forEach((meta, index) => {
    const mod = registry[meta.id];
    if (!mod) throw new Error(`Capítulo sin módulo: ${meta.id}`);
    const steps = mod.steps || 1;
    const section = document.createElement('section');
    section.className = `chapter theme-${meta.theme === 'light' ? 'light' : 'dark'}`;
    section.id = meta.id;
    section.dataset.index = index;
    section.style.setProperty('--steps', steps);
    section.setAttribute('aria-labelledby', `${meta.id}-h`);
    const stage = document.createElement('div');
    stage.className = 'stage';
    section.appendChild(stage);
    root.appendChild(section);
    const kicker = meta.id === 'intro' ? '' : `<p class="kicker" aria-hidden="true"><b>${meta.num}</b><span>—</span><span>${meta.nav}</span></p>`;
    stage.insertAdjacentHTML('afterbegin', kicker);
    const entry = { meta, mod, index, steps, section, stage, refs: {}, tl: null, st: null, cam: null, cams: null, island: null, top: 0 };
    mod.mount?.(stage, entry);
    list.push(entry);
  });

  /* ── 2. Contexto de animación que reciben los capítulos ── */
  function makeCtx(entry) {
    const tl = entry.tl;
    const add = (method, target, a, b, pos) => {
      if (!target || (Array.isArray(target) && !target.length)) return;
      const first = Array.isArray(target) ? target[0] : target;
      const proxy = !(first instanceof Element) && !(first instanceof NodeList);
      if (method === 'fromTo') {
        const parts = safeVars(b, proxy);
        if (parts.length === 1) tl.fromTo(target, a, { immediateRender: false, ...b }, pos);
        else parts.forEach((p) => {
          const from = {};
          for (const k in p) if (k in a) from[k] = a[k];
          tl.fromTo(target, from, { immediateRender: false, ...p }, pos);
        });
      } else {
        safeVars(a, proxy).forEach((p) => tl[method](target, p, b));
      }
    };
    const at = (k, f = 0) => k + 0.1 + f * 0.8;
    const show = (els, pos, { y = 22, d = 0.45, stagger = 0.05, ease = 'power3.out', x = 0 } = {}) => {
      add('fromTo', els, { opacity: 0, y, x }, { opacity: 1, y: 0, x: 0, duration: d, ease, stagger }, pos);
    };
    const hide = (els, pos, { y = -14, d = 0.3, stagger = 0, ease = 'power2.in' } = {}) => {
      add('to', els, { opacity: 0, y, duration: d, ease, stagger }, pos);
    };
    /* Muestra el elemento i en el paso first+i y lo oculta al llegar al siguiente. */
    const seq = (els, first = 0, { keepLast = true, y = 16 } = {}) => {
      const arr = [...els];
      arr.forEach((el, i) => {
        const k = first + i;
        show(el, at(k, 0.3), { y, d: 0.4 });
        if (i < arr.length - 1 || !keepLast) hide(el, at(k + 1, 0), { y: -10, d: 0.25 });
      });
    };
    /* Captions por paso: caps[k] se muestra en el paso k (vacío = nada). */
    const caps = (els, map) => {
      const arr = [...els];
      arr.forEach((el, i) => {
        const k = map ? map[i] : i;
        if (k == null || !el.textContent.trim()) return;
        show(el, at(k, 0.35), { y: 14, d: 0.35 });
        const next = map ? map[i + 1] : i + 1;
        if (next != null && next < entry.steps) hide(el, at(next, 0), { y: -8, d: 0.22 });
      });
    };
    return {
      tl, motion, entry, at, show, hide, seq, caps,
      T: (k) => 1 + k,
      to: (t, v, pos) => add('to', t, v, pos),
      fromTo: (t, f, v, pos) => add('fromTo', t, f, v, pos),
      set: (t, v, pos) => tl.set(t, v, pos),
      cam: null,
    };
  }

  /* ── 3. Construcción (después de cargar el 3D, si existe) ── */
  function build(stage) {
    stage3d = stage;
    list.forEach((entry) => {
      const { mod } = entry;
      entry.cams = (mod.cams || [DEFAULT_CAM]).map((c) => ({ ...DEFAULT_CAM, ...c }));
      const c0 = entry.cams[0];
      entry.cam = { px: c0.p[0], py: c0.p[1], pz: c0.p[2], tx: c0.t[0], ty: c0.t[1], tz: c0.t[2], fov: c0.fov };
      if (stage && mod.scene) {
        entry.island = stage.createIsland(entry.meta.id, entry.meta.theme);
        try {
          entry.refs = mod.scene(stage.kit.bind(entry.island), entry) || {};
        } catch (err) {
          console.warn(`[3D] escena ${entry.meta.id}`, err);
          entry.refs = {};
        }
      }
    });
    layoutIslands();

    list.forEach((entry) => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
      entry.tl = tl;
      const ctx = makeCtx(entry);
      ctx.cam = entry.cam;
      // Cámara: interpolación automática entre las poses de cada paso
      for (let k = 1; k < entry.cams.length; k++) {
        const c = entry.cams[k];
        ctx.to(entry.cam, { px: c.p[0], py: c.p[1], pz: c.p[2], tx: c.t[0], ty: c.t[1], tz: c.t[2], fov: c.fov, duration: 0.8, ease: c.ease || 'power2.inOut' }, k + 0.1);
      }
      try {
        entry.mod.build?.(ctx, entry.refs, entry);
      } catch (err) {
        console.error(`[timeline] ${entry.meta.id}`, err);
      }
      tl.set({}, {}, entry.steps + 1); // fija la duración total
      entry.st = ScrollTrigger.create({
        trigger: entry.section,
        start: 'top bottom',
        end: 'bottom top',
        animation: tl,
        scrub: true,
        invalidateOnRefresh: true,
      });
    });

    built = true;
    refresh();
    onScroll(() => { dirty = true; scheduleSnap(); });
    window.addEventListener('resize', debounce(onResize, 180));
    gsap.ticker.add(tick);
  }

  /* Separa las islas 3D verticalmente: la distancia entre islas vecinas
     equivale a la altura visible de cada una, para que el 3D se desplace
     al mismo ritmo que su sección al hacer scroll. */
  function layoutIslands() {
    let y = 0;
    list.forEach((entry, i) => {
      if (i > 0) {
        const prev = list[i - 1];
        y -= (visibleHeight(prev.cams[prev.cams.length - 1]) + visibleHeight(entry.cams[0])) / 2;
      }
      entry.offsetY = y;
      if (entry.island) entry.island.group.position.y = y;
    });
  }
  function visibleHeight(c) {
    const dx = c.p[0] - c.t[0], dy = c.p[1] - c.t[1], dz = c.p[2] - c.t[2];
    const d = Math.hypot(dx, dy, dz);
    return 2 * d * Math.tan((c.fov * Math.PI) / 360) * portraitFactor();
  }
  function portraitFactor() {
    const aspect = window.innerWidth / window.innerHeight;
    return Math.min(3.4, Math.max(1, Math.pow(1.7778 / aspect, aspect < 1 ? 0.9 : 1)));
  }

  /* ── 4. Posiciones de cada paso ── */
  function refresh() {
    unit = list[0].stage.offsetHeight || window.innerHeight;
    positions = [];
    const sy = scrollY();
    list.forEach((entry) => {
      entry.top = entry.section.getBoundingClientRect().top + sy;
      for (let k = 0; k < entry.steps; k++) positions.push({ y: entry.top + k * unit, index: entry.index, step: k });
    });
    dirty = true;
  }
  function onResize() {
    // Recordar dónde estábamos (capítulo + paso + fracción) antes de recalcular
    const keep = state();
    const e = list[keep.t < 0.5 ? keep.a : keep.a + 1];
    const rel = (keep.y - e.top) / unit;
    resizeScroll();
    ScrollTrigger.refresh();
    layoutIslands();
    refresh();
    const y = e.top + Math.max(-1, Math.min(e.steps, rel)) * unit;
    scrollTo(y, { immediate: true });
    ScrollTrigger.update();
    stage3d?.resize();
    dirty = true;
    emit('frame');
  }

  /* ── 5. Estado por frame ── */
  function state() {
    const y = scrollY();
    let a = 0, t = 0;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      const end = e.top + (e.steps - 1) * unit;
      if (y <= end + 0.5 || i === list.length - 1) { a = i; t = 0; break; }
      const next = list[i + 1];
      if (y < next.top - 0.5) { a = i; t = (y - end) / (next.top - end); break; }
    }
    return { y, a, t: Math.min(1, Math.max(0, t)) };
  }

  function tick(time, dt) {
    if (!built) return;
    const s = state();
    const changed = dirty || s.y !== lastY;
    lastY = s.y;
    dirty = false;

    if (changed) {
      const A = list[s.a], B = list[s.a + 1];
      const tt = motion.reduced ? (s.t < 0.5 ? 0 : 1) : smooth(s.t);
      // Fondo (mezcla entre temas)
      const va = themeVal(A.meta.theme), vb = B ? themeVal(B.meta.theme) : va;
      const mix = va + (vb - va) * smooth(s.t);
      const rgb = DARK.map((d, i) => Math.round(d + (LIGHT[i] - d) * mix));
      const bg = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
      document.getElementById('bg').style.backgroundColor = bg;
      document.documentElement.style.setProperty('--jump-bg', bg);

      // Capítulo y paso actuales
      const idx = s.t < 0.5 ? s.a : s.a + 1;
      const e = list[idx];
      const step = Math.max(0, Math.min(e.steps - 1, Math.round((s.y - e.top) / unit)));
      if (idx !== current.index) { current = { index: idx, step }; emit('chapter', current); emit('step', current); }
      else if (step !== current.step) { current = { index: idx, step }; emit('step', current); }

      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.getElementById('progress-bar').style.transform = `scaleX(${max > 0 ? Math.min(1, s.y / max) : 0})`;

      if (stage3d) stage3d.view(blendView(A, B, tt), [A, B && s.t > 0 ? B : null], mix, bg);
    }
    if (stage3d) stage3d.tick(time, dt, changed);
    emit('frame', s);
  }

  function blendView(A, B, t) {
    const ca = worldCam(A);
    if (!B || t <= 0) return ca;
    const cb = worldCam(B);
    const out = {};
    for (const k in ca) out[k] = ca[k] + (cb[k] - ca[k]) * t;
    return out;
  }
  function worldCam(e) {
    const c = e.cam;
    const f = portraitFactor();
    return {
      px: c.tx + (c.px - c.tx) * f, py: e.offsetY + c.ty + (c.py - c.ty) * f, pz: c.tz + (c.pz - c.tz) * f,
      tx: c.tx, ty: e.offsetY + c.ty, tz: c.tz, fov: c.fov,
      fogNear: (e.mod.fog?.[0] ?? 22) * f, fogFar: (e.mod.fog?.[1] ?? 60) * f,
    };
  }

  /* ── 6. Navegación ── */
  function nearestIndex(y) {
    let best = 0, bd = Infinity;
    positions.forEach((p, i) => { const d = Math.abs(p.y - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function stepBy(dir) {
    if (!positions.length) return;
    const y = scrollY();
    let target;
    if (dir > 0) target = positions.find((p) => p.y > y + 4);
    else target = [...positions].reverse().find((p) => p.y < y - 4);
    if (!target) return;
    goTo(target.y, { duration: Math.abs(target.y - y) > unit * 1.6 ? 1.6 : 1.1 });
  }
  function goTo(y, { immediate = false, duration } = {}) {
    navigating = true;
    clearTimeout(snapTimer);
    scrollTo(y, { immediate, duration, onComplete: () => { navigating = false; dirty = true; } });
    if (immediate) { navigating = false; dirty = true; }
  }
  /* Salto largo: cortina breve para no reproducir capítulos a toda velocidad. */
  function jumpTo(index, step = 0) {
    const e = list[index];
    if (!e) return;
    const y = e.top + Math.min(step, e.steps - 1) * unit;
    const cover = document.getElementById('jump-cover');
    if (Math.abs(y - scrollY()) < unit * 2.5 || motion.reduced) { goTo(y, { immediate: motion.reduced }); return; }
    cover.classList.add('is-on');
    setTimeout(() => {
      goTo(y, { immediate: true });
      requestAnimationFrame(() => requestAnimationFrame(() => cover.classList.remove('is-on')));
    }, 210);
  }
  function scheduleSnap() {
    if (!snapEnabled || navigating) return;
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      if (navigating || isScrolling()) return scheduleSnap();
      const y = scrollY();
      const p = positions[nearestIndex(y)];
      if (!p) return;
      const d = Math.abs(p.y - y);
      if (d > 3 && d < unit * 0.5) goTo(p.y, { duration: 0.7 });
    }, 260);
  }

  function emit(type, data) { for (const fn of listeners[type]) fn(data); }

  return {
    list,
    build,
    refresh,
    next: () => stepBy(1),
    prev: () => stepBy(-1),
    jumpTo,
    jumpToId(id, step = 0) { const e = list.find((x) => x.meta.id === id); if (e) jumpTo(e.index, step); },
    home: () => jumpTo(0, 0),
    end: () => jumpTo(list.length - 1, 0),
    current: () => current,
    on(type, fn) { listeners[type].add(fn); return () => listeners[type].delete(fn); },
    positionOf(index, step = 0) { const e = list[index]; return e ? e.top + step * unit : 0; },
    markDirty() { dirty = true; },
  };
}

function themeVal(theme) { return theme === 'light' ? 1 : 0; }
function smooth(t) { return t * t * (3 - 2 * t); }
function debounce(fn, ms) { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; }
