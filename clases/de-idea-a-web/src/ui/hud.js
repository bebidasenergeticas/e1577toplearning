/* HUD: indicador de capítulo, riel lateral, pista de teclas, anuncio accesible y URL (#capitulo). */
import { CHAPTERS } from '../content/chapters.js';

const LAST_NUM = CHAPTERS.filter((c) => /^\d+$/.test(c.num)).map((c) => c.num).pop();

export function chapterLabel(meta) {
  return /^\d+$/.test(meta.num) ? `${meta.num} / ${LAST_NUM}` : meta.num;
}

export function initHud(director) {
  const hudCh = document.getElementById('hud-chapter');
  const rail = document.getElementById('rail');
  const live = document.getElementById('live');
  const hint = document.getElementById('keys-hint');

  rail.innerHTML = director.list.map((e) =>
    `<button type="button" data-go="${e.index}" aria-label="Ir al capítulo ${e.meta.num}: ${e.meta.nav}"><span class="rt">${e.meta.num} · ${e.meta.nav}</span></button>`
  ).join('');
  rail.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-go]');
    if (b) director.jumpTo(Number(b.dataset.go));
  });

  let ready = false;
  director.on('chapter', ({ index }) => {
    const e = director.list[index];
    hudCh.innerHTML = `<b>${chapterLabel(e.meta)}</b><span>${e.meta.nav}</span>`;
    rail.querySelectorAll('button').forEach((b, i) => b.classList.toggle('is-current', i === index));
    live.textContent = `Capítulo ${e.meta.num}: ${e.meta.nav}`;
    document.body.dataset.chapter = e.meta.id;
    if (ready) {
      const hash = index === 0 ? ' ' : `#${e.meta.id}`;
      try { history.replaceState(null, '', hash === ' ' ? location.pathname + location.search : hash); } catch { /* sin history */ }
    }
  });

  const hideHint = () => hint.classList.add('is-hidden');
  setTimeout(hideHint, 9000);
  window.addEventListener('keydown', hideHint, { once: true });

  return { setReady() { ready = true; } };
}
