/* 02 · UNA WEB TIENE DOS MUNDOS — frontend (salón) | backend (cocina) · database (almacén) · API (comanda) */
import { TEXT } from '../content/chapters.js';
import { esc, $, $$ } from '../ui/shared.js';

const T = TEXT['dos-mundos'];

/* Texto centrado que cruza ambas mitades: dos copias recortadas (oscura a la izquierda, clara a la derecha). */
const split = (tag, cls, text, id = '') => `
  <div class="split-text ${cls}" data-r>
    <${tag} class="st-a"${id ? ` id="${id}"` : ''}>${esc(text)}</${tag}>
    <${tag} class="st-b" aria-hidden="true">${esc(text)}</${tag}>
  </div>`;

export default {
  steps: 6,
  cams: [
    { p: [0, 6.8, 17], t: [0, 0.2, 0] },
    { p: [0, 6.4, 16.2], t: [0, 0.1, 0] },
    { p: [0, 6.4, 16.2], t: [0, 0.1, 0] },
    { p: [0, 6.4, 16.2], t: [0, 0.1, 0] },
    { p: [0, 6.0, 15.6], t: [0, 0.2, 0] },
    { p: [0, 7.2, 19], t: [0, 0.1, 0] },
  ],
  fog: [20, 50],

  mount(stage, entry) {
    stage.insertAdjacentHTML('beforeend', `
      ${split('h2', 'dm-title h1', T.title, `${entry.meta.id}-h`)}
      <div class="dm-side dm-front theme-light" data-r>
        <p class="label accent">${esc(T.front.name)}</p>
        <p class="h2">${esc(T.front.desc)}</p>
      </div>
      <div class="dm-side dm-back theme-dark" data-r>
        <p class="label accent">${esc(T.back.name)}</p>
        <p class="h2">${esc(T.back.desc)}</p>
      </div>
      <div class="dm-caps caps">
        ${split('p', 'dm-cap lead', T.caps[0])}
        <p class="dm-cap-l lead theme-light" data-r>${esc(T.caps[1])}</p>
        <p class="dm-cap-r lead theme-dark" data-r>${esc(T.caps[2])}</p>
        <p class="dm-cap-r lead theme-dark" data-r><b class="accent">${esc(T.db[0])}</b> · ${esc(T.db[1])}</p>
        ${split('p', 'dm-cap lead', `${T.api[0]} · ${T.api[1]}`)}
        ${split('p', 'dm-cap h2', T.caps[5])}
      </div>
    `);
  },

  scene(K) {
    const L = K.matsFor('light');
    const D = K.matsFor('dark');
    const PL = K.palFor('light');
    const left = K.group([0, 0, 0]);
    const right = K.group([0, 0, 0]);
    const rb = (w, h, d, r = 0.06) => K.rbox(w, h, d, r);

    // Plataformas
    const slabL = K.mesh(rb(7.2, 0.3, 4.8, 0.08), L.inset, [-3.75, -1.25, 0], left);
    const slabR = K.mesh(rb(7.2, 0.3, 4.8, 0.08), D.body2, [3.75, -1.25, 0], right);
    const wall = K.group([0, 0, 0]);
    K.mesh(rb(0.18, 2.6, 1.6, 0.04), D.top, [0, 0.2, -1.6], wall);
    K.mesh(rb(0.18, 2.6, 1.6, 0.04), D.top, [0, 0.2, 1.6], wall);
    K.mesh(rb(0.18, 0.6, 1.6, 0.04), D.top, [0, -0.8, 0], wall);
    K.mesh(rb(0.18, 0.5, 1.6, 0.04), D.top, [0, 1.25, 0], wall);

    // Frontend (salón): mesa, menú, decoración, mesero
    const table = K.group([-4.9, -1.1, 0.2], left);
    K.shadow(2.6, 2.2, { at: [-4.9, -1.09, 0.2], parent: left, opacity: 0.25 });
    K.mesh(K.cyl(1.0, 0.08), L.body, [0, 0.86, 0], table);
    K.mesh(K.cyl(0.08, 0.84), L.body2, [0, 0.42, 0], table);
    const menu = K.mesh(rb(0.62, 0.86, 0.04, 0.03), L.top, [-0.35, 1.32, -0.2], table);
    menu.rotation.set(-0.25, 0.35, 0);
    const deco = K.group([0.45, 0.9, -0.1], table);
    K.mesh(K.cyl(0.13, 0.36), L.body2, [0, 0.18, 0], deco);
    K.mesh(K.sph(0.2), L.body, [0, 0.5, 0], deco);
    const waiter = K.node('user', { at: [-2.3, -0.25, 0.9], theme: 'light', parent: left, scale: 0.85 });
    K.shadow(1.6, 1.4, { at: [-2.3, -1.09, 0.9], parent: left, opacity: 0.25 });
    const fLabels = [
      K.label(T.front.items[0][0], T.front.items[0][1], { at: [-4.9, -1.35, 1.5], cls: 'pill', theme: 'light', parent: left }),
      K.label(T.front.items[1][0], T.front.items[1][1], { at: [-6.0, 1.0, 0.0], cls: 'pill', theme: 'light', parent: left, center: [1, 0.5] }),
      K.label(T.front.items[2][0], T.front.items[2][1], { at: [-3.8, 0.95, -0.1], cls: 'pill', theme: 'light', parent: left, center: [0, 0.5] }),
      K.label(T.front.items[3][0], T.front.items[3][1], { at: [-2.3, -1.35, 2.0], cls: 'pill', theme: 'light', parent: left }),
    ];
    const frontParts = [table, waiter.obj];

    // Backend (cocina): cocina, pedidos, procesos, inventario
    const kitchen = K.group([2.9, -1.1, -0.4], right);
    K.mesh(rb(2.0, 0.95, 1.3, 0.06), D.body, [0, 0.47, 0], kitchen);
    const burners = [-0.5, 0.5].map((x) => { const t = K.mesh(K.tor(0.24, 0.04), K.accentMat('signal', K.P), [x, 0.97, 0], kitchen); t.rotation.x = Math.PI / 2; return t; });
    const orders = K.group([1.2, -1.1, 1.3], right);
    [0, 1, 2, 3].forEach((i) => K.mesh(rb(0.55, 0.035, 0.75, 0.01), D.top, [0, 0.05 + i * 0.06, 0], orders).rotation.y = i * 0.12);
    const gear = K.node('logic', { at: [4.6, 0.2, -1.7], scale: 0.55, parent: right });
    const shelf = K.group([6.25, -1.1, -0.9], right);
    [0.45, 1.05].forEach((y) => K.mesh(rb(1.4, 0.06, 0.7, 0.02), D.top, [0, y, 0], shelf));
    [[-0.4, 0.62], [0, 0.62], [0.35, 1.22], [-0.3, 1.22]].forEach(([x, y]) => K.mesh(rb(0.3, 0.3, 0.3, 0.04), D.body, [x, y, 0], shelf));
    K.mesh(rb(0.06, 1.2, 0.7, 0.02), D.top, [-0.72, 0.6, 0], shelf);
    K.mesh(rb(0.06, 1.2, 0.7, 0.02), D.top, [0.72, 0.6, 0], shelf);
    const bLabels = [
      K.label(T.back.items[0][0], T.back.items[0][1], { at: [2.9, 0.15, -0.4], cls: 'pill', parent: right, center: [0.5, 1] }),
      K.label(T.back.items[1][0], T.back.items[1][1], { at: [1.2, -1.35, 2.1], cls: 'pill', parent: right }),
      K.label(T.back.items[2][0], T.back.items[2][1], { at: [4.6, -0.85, -1.2], cls: 'pill', parent: right, center: [0.5, 0] }),
      K.label(T.back.items[3][0], T.back.items[3][1], { at: [6.25, 0.25, -0.9], cls: 'pill', parent: right, center: [0.5, 1] }),
    ];
    const backParts = [kitchen, orders, gear.obj, shelf];

    // Database = almacén (sube desde abajo)
    const db = K.node('db', { at: [5.2, -0.62, 1.55], scale: 0.62, parent: right, label: T.db[0], labelCls: 'pill' });

    // API = comanda que cruza la ventanilla; regresa un plato
    const ticketPath = K.curveOf([[-1.9, 0.5, 0.9], [-0.7, 0.75, 0.4], [0, 0.55, 0], [0.7, 0.2, 0.6], [1.2, -0.6, 1.3]]);
    const platePath = K.curveOf([[2.2, 0.0, -0.1], [0.8, 0.45, -0.1], [0, 0.4, 0], [-1.0, 0.45, 0.4], [-1.9, 0.35, 0.9]]);
    const apiLine = K.link(null, { curve: ticketPath, width: 2.6 });
    const ticket = K.group([0, 0, 0]);
    K.mesh(rb(0.42, 0.56, 0.03, 0.02), K.matsFor('light').body, [0, 0, 0], ticket);
    K.mesh(K.boxGeo(0.3, 0.05, 0.035), K.accentMat('signal', PL), [0, 0.15, 0], ticket).material.color.setHex(PL.signal);
    K.mesh(K.boxGeo(0.24, 0.035, 0.035), L.inset, [0, 0.02, 0], ticket);
    K.mesh(K.boxGeo(0.28, 0.035, 0.035), L.inset, [0, -0.08, 0], ticket);
    const plate = K.group([0, 0, 0]);
    K.mesh(K.cyl(0.3, 0.05, 32), D.body, [0, 0, 0], plate);
    K.mesh(K.sph(0.13), K.matsFor('dark').ok, [0, 0.1, 0], plate);
    const apiLabel = K.label(T.api[0], 'la comanda', { at: [0, 1.75, 0], cls: 'pill is-signal', center: [0.5, 1] });
    const tmp = new K.THREE.Vector3();

    const s = K.state({ front: 0, back: 0, db: 0, ticket: 0, ticketShow: 0, plate: 0, plateShow: 0, spread: 0, slab: 0, fl: 0, bl: 0 }, (st) => {
      const sl = Math.max(0.0001, st.slab);
      slabL.scale.set(1, sl, 1); slabR.scale.set(1, sl, 1);
      wall.scale.set(1, Math.max(0.0001, st.slab), 1);
      frontParts.forEach((o, i) => { const v = Math.max(0.0001, Math.min(1, st.front * 1.6 - i * 0.3)); o.scale.setScalar(v); o.visible = v > 0.002; });
      backParts.forEach((o, i) => { const v = Math.max(0.0001, Math.min(1, st.back * 1.9 - i * 0.3)); o.scale.setScalar(v); o.visible = v > 0.002; });
      waiter.s.show = Math.min(1, st.front * 1.6 - 0.3);
      gear.s.show = Math.min(1, st.back * 1.9 - 0.6);
      burners.forEach((b) => K.setAccent(b.material, st.back > 0.9 ? 1 : 0));
      fLabels.forEach((l, i) => { l.s.o = Math.min(1, Math.max(0, st.fl * 2 - i * 0.25)); l.s.y = (1 - l.s.o) * 8; });
      bLabels.forEach((l, i) => { l.s.o = Math.min(1, Math.max(0, st.bl * 2 - i * 0.25)); l.s.y = (1 - l.s.o) * 8; });
      db.s.show = st.db; db.s.lift = (1 - st.db) * -1.6; db.s.on = st.db;
      ticket.visible = st.ticketShow > 0.01;
      if (ticket.visible) { ticketPath.getPointAt(Math.min(1, st.ticket), tmp); ticket.position.copy(tmp); ticket.rotation.y = 0.3; }
      plate.visible = st.plateShow > 0.01;
      if (plate.visible) { platePath.getPointAt(Math.min(1, st.plate), tmp); plate.position.copy(tmp); }
      apiLabel.s.o = st.ticketShow > 0.01 || st.spread > 0 ? 1 : 0; apiLabel.s.y = 0;
      left.position.x = -st.spread * 0.9;
      right.position.x = st.spread * 0.9;
    });
    return { s, apiLine };
  },

  build(ctx, r, entry) {
    const st = entry.stage;
    const panel = document.getElementById('bg-split');
    // Fondo dividido: aparece en la entrada; al salir, el hueso cubre todo (entra el cap. 03, claro)
    ctx.fromTo(panel, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 50% 0 0)', duration: 0.55, ease: 'power3.inOut' }, 0.35);
    ctx.to(panel, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power2.inOut' }, entry.steps + 0.05);
    ctx.set(panel, { clipPath: 'inset(0 100% 0 0)' }, entry.steps + 0.999);

    ctx.show($(st, '.dm-title'), ctx.at(0, 0.45));
    ctx.hide($(st, '.dm-title'), ctx.at(1, 0));
    const caps = $$(st, '.dm-caps > *');
    ctx.caps(caps);
    ctx.show($(st, '.dm-front'), ctx.at(1, 0.3));
    ctx.show($(st, '.dm-back'), ctx.at(2, 0.3));

    if (!r.s) return;
    ctx.to(r.s, { slab: 1, duration: 0.5, ease: 'power3.out' }, ctx.at(0, 0.5));
    ctx.to(r.s, { front: 1, duration: 0.6, ease: 'power3.out' }, ctx.at(1, 0));
    ctx.to(r.s, { fl: 1, duration: 0.5 }, ctx.at(1, 0.35));
    ctx.to(r.s, { back: 1, duration: 0.6, ease: 'power3.out' }, ctx.at(2, 0));
    ctx.to(r.s, { bl: 1, duration: 0.5 }, ctx.at(2, 0.35));
    ctx.to(r.s, { db: 1, duration: 0.6, ease: 'power3.out' }, ctx.at(3, 0.1));
    // API: la comanda cruza y regresa el plato
    ctx.to(r.s, { ticketShow: 1, duration: 0.05 }, ctx.at(4, 0));
    ctx.to(r.s, { ticket: 1, duration: 0.4, ease: 'power1.inOut' }, ctx.at(4, 0.02));
    ctx.to(r.apiLine.s, { draw: 1, hot: 1, duration: 0.4, ease: 'power1.inOut' }, ctx.at(4, 0.02));
    ctx.to(r.s, { plateShow: 1, duration: 0.05 }, ctx.at(4, 0.5));
    ctx.to(r.s, { plate: 1, duration: 0.42, ease: 'power1.inOut' }, ctx.at(4, 0.52));
    // Separados, pero conectados
    ctx.to(r.s, { ticketShow: 0, plateShow: 0, duration: 0.1 }, ctx.at(5, 0));
    ctx.to(r.s, { spread: 1, duration: 0.6, ease: 'power3.inOut' }, ctx.at(5, 0.1));
  },
};
