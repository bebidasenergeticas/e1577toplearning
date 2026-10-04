/* Ventana de notas del profesor: se sincroniza con la presentación
   (BroadcastChannel) y puede controlarla a distancia. */
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/notes.css';
import { CHAPTERS } from './content/chapters.js';
import { NOTES } from './content/notes.js';
import { CHANNEL } from './core/presenter.js';
import { esc } from './ui/shared.js';

const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;
const $ = (id) => document.getElementById(id);
let last = null;
let lastSeen = 0;

function send(cmd, extra = {}) { bc?.postMessage({ type: 'cmd', cmd, ...extra }); }

function render(st) {
  last = st;
  lastSeen = Date.now();
  const meta = CHAPTERS[st.index] || CHAPTERS[0];
  const n = NOTES[meta.id] || {};
  const next = CHAPTERS[st.index + 1];
  $('n-title').textContent = `${meta.num} · ${meta.nav}`;
  $('n-meta').textContent = `Paso ${st.step + 1} de ${st.steps}${n.tiempo ? ` · ${n.tiempo} min sugeridos` : ''} · capítulo ${st.index + 1} de ${st.total}`;
  const pasos = n.pasos ? `<ol class="n-steps">${n.pasos.map((p, i) => `<li class="${i === st.step ? 'is-now' : i < st.step ? 'is-done' : ''}">${esc(p)}</li>`).join('')}</ol>` : '';
  $('n-body').innerHTML = `
    ${pasos ? `<section class="n-sec"><h2>Pasos</h2>${pasos}</section>` : ''}
    <section class="n-sec key"><h2>Idea clave</h2><p>${esc(n.idea)}</p></section>
    <section class="n-sec ask"><h2>Pregunta para el grupo</h2><p>${esc(n.pregunta)}</p></section>
    <section class="n-sec"><h2>Analogía</h2><p>${esc(n.analogia)}</p></section>
    <section class="n-sec"><h2>Cómo conducir</h2><p>${esc(n.manejo)}</p></section>
    <section class="n-sec"><h2>Transición</h2><p>${esc(n.transicion)}</p>${next ? `<p class="n-next">Siguiente: <b>${esc(next.num)} · ${esc(next.nav)}</b></p>` : ''}</section>`;
  $('n-status').textContent = 'Conectado a la presentación.';
  $('n-status').classList.add('ok');
  document.querySelectorAll('#n-index button').forEach((b, i) => b.classList.toggle('is-current', i === st.index));
}

if (bc) {
  bc.onmessage = (ev) => { if (ev.data?.type === 'state') render(ev.data); };
  bc.postMessage({ type: 'hello' });
  setInterval(() => { if (Date.now() - lastSeen > 4000) bc.postMessage({ type: 'hello' }); }, 2000);
} else {
  $('n-status').textContent = 'Este navegador no permite sincronizar ventanas. Usa Shift+N en la presentación.';
}

$('n-index').innerHTML = CHAPTERS.map((c, i) => `<button type="button" data-jump="${i}"><span>${esc(c.num)}</span> ${esc(c.nav)}</button>`).join('');
$('n-index').addEventListener('click', (e) => { const b = e.target.closest('[data-jump]'); if (b) send('jump', { index: Number(b.dataset.jump) }); });
document.querySelector('.n-controls').addEventListener('click', (e) => { const b = e.target.closest('[data-cmd]'); if (b) send(b.dataset.cmd); });

window.addEventListener('keydown', (e) => {
  if (e.target.closest?.('summary, input')) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); send('next'); }
  if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); send('prev'); }
  if (e.key === 'Home') { e.preventDefault(); send('home'); }
  if (e.key === 'End') { e.preventDefault(); send('end'); }
  if (e.key === 'b' || e.key === 'B') send('blackout');
});

/* Reloj y cronómetro de clase */
let running = false, startAt = 0, acc = 0;
const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
setInterval(() => {
  const d = new Date();
  $('n-time').textContent = d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  $('n-elapsed').textContent = fmt(acc + (running ? Date.now() - startAt : 0));
}, 500);
$('n-timer-btn').addEventListener('click', () => {
  if (running) { acc += Date.now() - startAt; running = false; $('n-timer-btn').textContent = 'Continuar'; }
  else { startAt = Date.now(); running = true; $('n-timer-btn').textContent = 'Pausar'; }
});
$('n-timer-reset').addEventListener('click', () => { acc = 0; startAt = Date.now(); if (!running) $('n-timer-btn').textContent = 'Iniciar'; });

let big = false;
$('n-size').addEventListener('click', () => { big = !big; document.documentElement.classList.toggle('big', big); });

if (last) render(last);
