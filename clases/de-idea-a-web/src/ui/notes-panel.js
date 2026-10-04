/* Panel de notas DENTRO de la página (respaldo). Es visible para cualquiera
   que vea esta pestaña: por eso muestra una advertencia. */
import { NOTES } from '../content/notes.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initNotesPanel(director) {
  const panel = document.getElementById('notes-panel');
  let open = false;

  function render() {
    if (!open) return;
    const c = director.current();
    const e = director.list[Math.max(0, c.index)];
    const n = NOTES[e.meta.id] || {};
    const next = director.list[c.index + 1];
    const stepNote = n.pasos?.[c.step];
    panel.innerHTML = `
      <p class="np-warn">Visible si compartes esta pestaña o tu pantalla completa. Para notas privadas usa N (ventana aparte).</p>
      <div class="np-head"><h2>${esc(e.meta.num)} · ${esc(e.meta.nav)}</h2><button type="button" data-np-close>Cerrar</button></div>
      <p><strong>Paso ${c.step + 1} de ${e.steps}</strong>${n.tiempo ? ` · ${n.tiempo} min sugeridos` : ''}</p>
      ${stepNote ? `<div class="np-sec"><h3>Este paso</h3><p>${esc(stepNote)}</p></div>` : ''}
      <div class="np-sec"><h3>Idea clave</h3><p>${esc(n.idea)}</p></div>
      <div class="np-sec"><h3>Pregunta</h3><p>${esc(n.pregunta)}</p></div>
      <div class="np-sec"><h3>Analogía</h3><p>${esc(n.analogia)}</p></div>
      <div class="np-sec"><h3>Cómo conducir</h3><p>${esc(n.manejo)}</p></div>
      <div class="np-sec"><h3>Transición</h3><p>${esc(n.transicion)}${next ? ` → <em>${esc(next.meta.nav)}</em>` : ''}</p></div>`;
  }

  panel.addEventListener('click', (e) => { if (e.target.closest('[data-np-close]')) toggle(false); });
  director.on('step', render);

  function toggle(v = !open) {
    open = v;
    panel.hidden = !open;
    render();
  }
  return { toggle };
}
