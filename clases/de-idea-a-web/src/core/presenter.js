/* Presentador: sincroniza la ventana de notas (notas.html) mediante
   BroadcastChannel y acepta comandos remotos (siguiente, anterior, saltar…).
   Si el navegador bloquea la ventana emergente, abre el panel de respaldo. */

export const CHANNEL = 'e1577-de-idea-a-web';

export function createPresenter({ director, onOpenFallback, actions }) {
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;
  let win = null;

  const snapshot = () => {
    const c = director.current();
    const e = director.list[Math.max(0, c.index)];
    return { type: 'state', id: e.meta.id, index: c.index, step: c.step, steps: e.steps, total: director.list.length, t: Date.now() };
  };
  const post = () => bc?.postMessage(snapshot());
  director.on('step', post);

  if (bc) {
    bc.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.type === 'hello') post();
      if (m.type === 'cmd') {
        if (m.cmd === 'next') director.next();
        if (m.cmd === 'prev') director.prev();
        if (m.cmd === 'home') director.home();
        if (m.cmd === 'end') director.end();
        if (m.cmd === 'jump' && Number.isInteger(m.index)) director.jumpTo(m.index);
        if (m.cmd === 'blackout') actions.blackout?.();
      }
    };
  }

  function openNotes() {
    if (win && !win.closed) { win.focus(); return; }
    const w = Math.min(560, screen.availWidth || 560);
    const h = Math.min(860, screen.availHeight || 860);
    try { win = window.open('notas.html', 'e1577-notas', `popup=yes,width=${w},height=${h}`); } catch { win = null; }
    if (!win || !bc) onOpenFallback?.(true);
    else setTimeout(post, 600);
  }

  return { openNotes, post };
}
