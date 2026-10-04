/* 01 · EL VIAJE DE UNA URL — usuario → navegador → internet → servidor → archivos → navegador → página */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT.url;
const N = T.nodes;

export default {
  steps: 6,
  cams: [
    { p: [-2.6, 1.6, 13.5], t: [-2.6, 0, 0] },
    { p: [-1.2, 1.7, 14.5], t: [-1.2, 0, 0] },
    { p: [0.3, 1.6, 15], t: [0.3, -0.1, 0] },
    { p: [0.8, 1.2, 15], t: [0.8, -0.55, 0] },
    { p: [0, 1.4, 15.5], t: [0, -0.4, 0] },
    { p: [0, 1.9, 17], t: [0, -0.35, 0] },
  ],
  fog: [18, 48],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      <div class="block b-tl"><h2 class="h1" id="${entry.meta.id}-h">${esc(T.title)}</h2></div>
      <div class="block b-bl caps url-caps">${T.caps.map((c) => `<p class="lead strong" data-r>${esc(c)}</p>`).join('')}</div>
      <ul class="legend url-legend" data-r aria-label="Leyenda">${T.legend.map(([t, c]) => `<li><span class="lg-dot ${c}"></span>${esc(t)}</li>`).join('')}</ul>
      <div class="fallback flow" aria-hidden="true">${Object.values(N).map((n) => `<span class="chip">${esc(n[0])}</span>`).join('<span class="arrow">→</span>')}</div>
    `);
  },

  scene(K) {
    const user = K.node('user', { at: [-6.3, 0, 0], label: N.user[0], sub: N.user[1] });
    const browser = K.node('browser', { at: [-3.5, 0, 0], label: N.browser[0], sub: N.browser[1] });
    const page = K.node('page', { at: [-3.5, 0.05, 0.25], label: N.page[0], sub: N.page[1], accent: 'ok' });
    const internet = K.node('globe', { at: [0.4, 0.1, -0.6], label: N.internet[0], sub: N.internet[1] });
    const server = K.node('server', { at: [4.1, 0.35, 0], label: N.server[0], sub: N.server[1] });
    const files = K.node('files', { at: [4.1, -2.45, 0.2], label: N.files[0], sub: N.files[1], scale: 0.9, accent: 'ok' });
    [user, browser, internet, server].forEach((n) => K.shadow(2.6, 1.6, { at: [n.obj.position.x, -1.05, n.obj.position.z], opacity: 0.35 }));

    const u2b = K.link([[-5.65, 0.05, 0], [-4.75, 0.05, 0]], { width: 2.4 });
    const req = K.link([[-2.25, 0.35, 0], [-0.9, 1.75, -0.4], [0.4, 1.95, -0.6], [1.9, 1.6, -0.3], [3.15, 0.55, 0]], { width: 2.8 });
    const s2f = K.link([[5.05, -0.15, 0.2], [5.55, -1.0, 0.2], [5.15, -1.85, 0.2]], { width: 2.4, hotColor: K.P.ok });
    const res = K.link([[3.2, -2.5, 0.2], [1.8, -2.75, -0.3], [0.4, -2.55, -0.6], [-1.2, -2.2, -0.3], [-2.6, -0.85, 0]], { width: 2.8, hotColor: K.P.ok });
    const reqPulse = K.pulse(req.curve, { size: 0.13 });
    const resPulses = [0, 1, 2].map(() => K.pulse(res.curve, { color: 'ok', size: 0.11 }));
    return { user, browser, page, internet, server, files, u2b, req, s2f, res, reqPulse, resPulses };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    ctx.show($(st, '.b-tl'), ctx.at(0, 0.2), { y: 30, d: 0.6 });
    ctx.caps($$(st, '.url-caps > p'));
    ctx.show($(st, '.url-legend'), ctx.at(1, 0.3));
    if (!r.user) return;
    const pop = { show: 1, duration: 0.5, ease: 'back.out(1.5)' };

    // 0 · usuario y navegador
    ctx.to(r.user.s, pop, ctx.at(0, 0.3));
    ctx.to(r.browser.s, pop, ctx.at(0, 0.45));
    ctx.to(r.u2b.s, { draw: 1, hot: 1, duration: 0.3 }, ctx.at(0, 0.7));
    ctx.to(r.browser.s, { on: 1, duration: 0.3 }, ctx.at(0, 0.8));

    // 1 · la petición viaja hacia internet
    ctx.to(r.internet.s, pop, ctx.at(1, 0));
    ctx.to(r.req.s, { draw: 0.5, hot: 1, duration: 0.5, ease: 'power2.inOut' }, ctx.at(1, 0.15));
    ctx.to(r.reqPulse.s, { show: 1, duration: 0.05 }, ctx.at(1, 0.15));
    ctx.to(r.reqPulse.s, { p: 0.5, duration: 0.5, ease: 'power2.inOut' }, ctx.at(1, 0.15));
    ctx.to(r.internet.s, { on: 1, duration: 0.2 }, ctx.at(1, 0.75));

    // 2 · llega al servidor
    ctx.to(r.server.s, pop, ctx.at(2, 0));
    ctx.to(r.req.s, { draw: 1, duration: 0.45 }, ctx.at(2, 0.1));
    ctx.to(r.reqPulse.s, { p: 1, duration: 0.45 }, ctx.at(2, 0.1));
    ctx.to(r.reqPulse.s, { show: 0, duration: 0.1 }, ctx.at(2, 0.7));
    ctx.to(r.server.s, { on: 1, duration: 0.2 }, ctx.at(2, 0.65));

    // 3 · responde con archivos y datos
    ctx.to(r.s2f.s, { draw: 1, hot: 1, duration: 0.35 }, ctx.at(3, 0));
    ctx.to(r.files.s, pop, ctx.at(3, 0.25));
    ctx.to(r.files.s, { on: 1, duration: 0.2 }, ctx.at(3, 0.6));

    // 4 · la respuesta regresa
    ctx.to(r.res.s, { draw: 1, hot: 1, duration: 0.55 }, ctx.at(4, 0));
    r.resPulses.forEach((p, i) => {
      ctx.to(p.s, { show: 1, duration: 0.05 }, ctx.at(4, 0.05 + i * 0.1));
      ctx.to(p.s, { p: 1, duration: 0.55, ease: 'power1.inOut' }, ctx.at(4, 0.05 + i * 0.1));
      ctx.to(p.s, { show: 0, duration: 0.08 }, ctx.at(4, 0.75 + i * 0.08));
    });
    ctx.to(r.internet.s, { on: 0.4, duration: 0.3 }, ctx.at(4, 0.2));

    // 5 · el navegador construye la página
    ctx.to(r.browser.s, { show: 0, duration: 0.35, ease: 'power2.in' }, ctx.at(5, 0));
    ctx.to(r.page.s, { show: 1, on: 1, duration: 0.55, ease: 'back.out(1.4)' }, ctx.at(5, 0.3));
  },
};
