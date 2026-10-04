/* Índice de capítulos (tecla M) y ayuda de atajos (tecla ?). */
import { motion, setReduced, setLite } from '../core/motion.js';
import { COURSE } from '../content/chapters.js';

let lastFocus = null;

function trapFocus(el) {
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll('button, input, [href]')].filter((x) => !x.disabled && x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

export function initMenu(director) {
  const menu = document.getElementById('menu');
  const help = document.getElementById('help');

  menu.innerHTML = `
    <div class="menu-head">
      <h2 class="menu-title" id="menu-title">Capítulos</h2>
      <button class="menu-close" type="button" data-close>Cerrar · Esc</button>
    </div>
    <div class="menu-grid">
      ${director.list.map((e) => `
        <button class="menu-item" type="button" data-go="${e.index}">
          <span class="mi-num">${e.meta.num}</span><span>${e.meta.nav}</span><span class="mi-theme ${e.meta.theme}" aria-hidden="true"></span>
        </button>`).join('')}
    </div>
    <div class="menu-options">
      <label><input type="checkbox" id="opt-motion" ${motion.reduced ? 'checked' : ''}> Reducir movimiento</label>
      <label><input type="checkbox" id="opt-lite" ${motion.lite ? 'checked' : ''}> 3D ligero (menos carga para la computadora)</label>
      <span>Los cambios se aplican al recargar la página.</span>
      ${COURSE.previous ? `<a class="menu-prev" href="${COURSE.previous.href}">← ${COURSE.previous.title}</a>` : ''}
    </div>`;

  help.innerHTML = `
    <div class="help-head">
      <h2 class="help-title" id="help-title">Atajos de teclado</h2>
      <button class="help-close" type="button" data-close>Cerrar · Esc</button>
    </div>
    <div class="help-grid">
      <div><span>Siguiente paso</span><kbd>↓ · → · PageDown · Espacio</kbd></div>
      <div><span>Paso anterior</span><kbd>↑ · ← · PageUp · Shift+Espacio</kbd></div>
      <div><span>Inicio</span><kbd>Home</kbd></div>
      <div><span>Cierre</span><kbd>End</kbd></div>
      <div><span>Índice de capítulos</span><kbd>M</kbd></div>
      <div><span>Notas del profesor (ventana aparte)</span><kbd>N</kbd></div>
      <div><span>Notas dentro de la página</span><kbd>Shift+N</kbd></div>
      <div><span>Pantalla completa</span><kbd>F</kbd></div>
      <div><span>Pausa (pantalla en negro)</span><kbd>B</kbd></div>
      <div><span>Esta ayuda</span><kbd>?</kbd></div>
      <div><span>Quiz: responder</span><kbd>1 · 2 · 3 · 4</kbd></div>
    </div>
    <p class="help-note">Para que solo tú veas las notas en Google Meet, comparte únicamente la pestaña (o la ventana) de la presentación y abre las notas con N: se abren en una ventana aparte.</p>`;

  trapFocus(menu);
  trapFocus(help);

  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) { close(menu); director.jumpTo(Number(b.dataset.go)); }
    if (e.target.closest('[data-close]')) close(menu);
  });
  help.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(help); });
  menu.querySelector('#opt-motion').addEventListener('change', (e) => { setReduced(e.target.checked); toast('Recarga la página para aplicar el cambio (F5).'); });
  menu.querySelector('#opt-lite').addEventListener('change', (e) => { setLite(e.target.checked); toast('Recarga la página para aplicar el cambio (F5).'); });

  document.querySelectorAll('[data-open-menu]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(menu, director); }));

  return {
    toggleMenu: () => (menu.hidden ? open(menu, director) : close(menu)),
    toggleHelp: () => (help.hidden ? open(help) : close(help)),
    closeAll: () => { let any = !menu.hidden || !help.hidden; close(menu); close(help); return any; },
    isOpen: () => !menu.hidden || !help.hidden,
  };
}

function open(el, director) {
  lastFocus = document.activeElement;
  el.hidden = false;
  if (director) {
    const i = director.current().index;
    el.querySelectorAll('.menu-item').forEach((b, j) => b.classList.toggle('is-current', j === i));
    (el.querySelector('.menu-item.is-current') || el.querySelector('button'))?.focus();
  } else el.querySelector('button')?.focus();
}
function close(el) {
  if (el.hidden) return;
  el.hidden = true;
  lastFocus?.focus?.();
}

let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
}
