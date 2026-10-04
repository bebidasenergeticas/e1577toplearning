/* Movimiento reducido: respeta prefers-reduced-motion y permite activarlo
   manualmente desde el índice (se recuerda en este navegador).
   En modo reducido las timelines conservan los fundidos de opacidad, pero
   los desplazamientos se vuelven cortes instantáneos. */

const KEY = 'e1577:reduce-motion';
const KEY_LITE = 'e1577:lite-3d';
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

function readPref(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writePref(key, v) {
  try { v === null ? localStorage.removeItem(key) : localStorage.setItem(key, v); } catch { /* sin almacenamiento */ }
}

const forced = new URLSearchParams(location.search).get('motion');
const pref = readPref(KEY);

export const motion = {
  reduced: forced === 'reduce' ? true : forced === 'full' ? false : pref === '1' ? true : pref === '0' ? false : mq.matches,
  lite: readPref(KEY_LITE) === '1',
  touch: window.matchMedia('(hover: none) and (pointer: coarse)').matches,
};

export function setReduced(v) {
  writePref(KEY, v ? '1' : '0');
}
export function setLite(v) {
  writePref(KEY_LITE, v ? '1' : '0');
}

const MOTION_PROPS = ['x', 'y', 'z', 'xPercent', 'yPercent', 'scale', 'scaleX', 'scaleY', 'rotation', 'rotationX', 'rotationY', 'rotate', 'px', 'py', 'pz', 'tx', 'ty', 'tz', 'rx', 'ry', 'rz', 's', 'sx', 'sy', 'sz', 'lift', 'spread', 'open', 'explode', 'p', 'width', 'height', 'clipPath', 'left', 'top', 'show', 'draw', 'typed', '--w', '--h'];
const snapStart = (t) => (t > 0 ? 1 : 0);

/* Divide un tween en «opacidad suave» + «movimiento instantáneo» si hay movimiento reducido. */
const FADE_ONLY = ['on', 'hot', 'o', 'opacity', 'table', 'autoAlpha', 'color', 'backgroundColor'];
const CONTROL = ['duration', 'delay', 'stagger', 'onUpdate', 'immediateRender', 'ease', 'yoyo', 'repeat', 'attr'];

/* En estados 3D (objetos JS), todo lo que no sea opacidad/encendido se trata como movimiento. */
export function safeVars(vars, proxy = false) {
  if (!motion.reduced) return [vars];
  const moving = {};
  const rest = {};
  let hasMove = false;
  for (const k in vars) {
    const isMove = proxy ? !FADE_ONLY.includes(k) && !CONTROL.includes(k) : MOTION_PROPS.includes(k);
    if (isMove) { moving[k] = vars[k]; hasMove = true; } else rest[k] = vars[k];
  }
  if (!hasMove) return [vars];
  const common = {};
  for (const k of ['duration', 'delay', 'stagger', 'onUpdate', 'immediateRender']) if (k in rest) common[k] = rest[k];
  const out = [{ ...moving, ...common, ease: snapStart }];
  const fadeKeys = Object.keys(rest).filter((k) => !(k in common) && k !== 'ease');
  if (fadeKeys.length) out.push({ ...rest, ease: 'none' });
  return out;
}
