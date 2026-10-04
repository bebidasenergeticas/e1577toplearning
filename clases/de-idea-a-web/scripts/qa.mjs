/* ════════════════════════════════════════════════════════════════
   QA AUTOMATIZADO (Playwright)
   Uso:  npm run build && npm run qa
   Opciones (variables de entorno):
     QA_URL       usar un servidor ya iniciado (p. ej. http://localhost:4173/)
     CHROME_PATH  ruta a un Chromium (si Playwright no tiene uno instalado)
     QA_SHOTS=0   no guardar capturas
     QA_ONLY      lista de viewports, p. ej. "1920x1080,390x844"
   Resultado: qa-output/report.md (+ capturas por viewport)
   ════════════════════════════════════════════════════════════════ */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'qa-output');
const SHOTS = process.env.QA_SHOTS !== '0';
const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '1366x768-reduce', width: 1366, height: 768, reduce: true },
].filter((v) => !process.env.QA_ONLY || process.env.QA_ONLY.split(',').includes(v.name));

const results = [];
const fail = (area, msg) => results.push({ ok: false, area, msg });
const pass = (area, msg) => results.push({ ok: true, area, msg });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer() {
  if (process.env.QA_URL) return { url: process.env.QA_URL, stop() {} };
  if (!existsSync(resolve(ROOT, 'dist/index.html'))) throw new Error('Falta dist/: ejecuta "npm run build" primero.');
  const port = 4199;
  const proc = spawn(process.execPath, [resolve(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(port), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://localhost:${port}/`); if (r.ok) break; } catch { /* esperando */ }
    await sleep(250);
  }
  return { url: `http://localhost:${port}/`, stop: () => proc.kill() };
}

function launchOpts() {
  const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  return process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, args } : { args };
}

async function openPage(browser, url, vp, extra = '') {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: !!vp.mobile, hasTouch: !!vp.mobile,
    reducedMotion: vp.reduce ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url + extra, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__presentacion && !document.body.classList.contains('is-loading'), null, { timeout: 30000 });
  await sleep(600);
  return { ctx, page, errors };
}

const goStep = (page, index, step) => page.evaluate(([i, s]) => {
  const d = window.__presentacion.director;
  window.scrollTo(0, d.positionOf(i, s));
}, [index, step]);
const current = (page) => page.evaluate(() => {
  const d = window.__presentacion.director;
  const c = d.current();
  return { id: d.list[c.index].meta.id, index: c.index, step: c.step };
});

/* Textos visibles fuera de la pantalla o recortados en el paso actual */
const layoutIssues = (page) => page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight, tol = 2;
  const d = window.__presentacion.director;
  const c = d.current();
  const stage = d.list[c.index].stage;
  const skip = '.rs-screen, .mp, .fe-scene, .cd-pane, .pv, .er-page, .sr-only, .fallback, .kicker';
  const opacity = (el) => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const issues = [];
  const els = [...stage.querySelectorAll('p, h1, h2, h3, li, button, pre, span, b, td, th'), ...document.querySelectorAll('#labels .l3-in')];
  for (const el of els) {
    if (el.closest(skip)) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    if (opacity(el) < 0.35) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const txt = el.textContent.trim().slice(0, 50);
    // etiquetas 3D completamente fuera de cámara: no se ven, no cuentan
    if (el.matches('.l3-in') && (r.right < 0 || r.left > vw || r.bottom < 0 || r.top > vh)) continue;
    if (r.left < -tol || r.right > vw + tol || r.top < -tol || r.bottom > vh + tol) issues.push(`fuera de pantalla: "${txt}" (${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)})`);
    if (el.scrollWidth > el.clientWidth + 3 && getComputedStyle(el).overflow !== 'visible') issues.push(`recortado: "${txt}"`);
  }
  // código: líneas más anchas que su contenedor
  stage.querySelectorAll('pre.code, .ex-json').forEach((pre) => { if (opacity(pre) > 0.35 && pre.scrollWidth > pre.clientWidth + 3) issues.push(`código recortado: "${pre.textContent.trim().slice(0, 40)}"`); });
  return issues;
});

async function sweep(browser, url, vp) {
  const { ctx, page, errors } = await openPage(browser, url, vp);
  const chapters = await page.evaluate(() => window.__presentacion.director.list.map((e) => ({ id: e.meta.id, steps: e.steps })));
  const dir = resolve(OUT, vp.name);
  if (SHOTS) mkdirSync(dir, { recursive: true });
  let issueCount = 0;
  for (let i = 0; i < chapters.length; i++) {
    for (let s = 0; s < chapters[i].steps; s++) {
      await goStep(page, i, s);
      await sleep(vp.reduce ? 350 : 750);
      const iss = await layoutIssues(page);
      iss.forEach((m) => fail(`layout ${vp.name}`, `${chapters[i].id} paso ${s + 1}: ${m}`));
      issueCount += iss.length;
      if (SHOTS) await page.screenshot({ path: resolve(dir, `${String(i).padStart(2, '0')}-${chapters[i].id}-${s + 1}.png`) });
    }
  }
  if (!issueCount) pass(`layout ${vp.name}`, `${chapters.reduce((a, c) => a + c.steps, 0)} pasos sin textos fuera de pantalla ni recortados`);
  if (errors.length) errors.forEach((e) => fail(`consola ${vp.name}`, e)); else pass(`consola ${vp.name}`, 'sin errores');
  await ctx.close();
}

async function functional(browser, url) {
  const vp = VIEWPORTS[0] || { name: '1920x1080', width: 1920, height: 1080 };
  const { ctx, page, errors } = await openPage(browser, url, { ...vp, mobile: false, reduce: false });
  const key = async (k, wait = 1500) => { await page.keyboard.press(k); await sleep(wait); };

  // Teclado
  await key('ArrowDown'); let c = await current(page);
  c.id === 'intro' && c.step === 1 ? pass('teclado', '↓ avanza un paso') : fail('teclado', `↓ esperado intro/2, obtenido ${c.id}/${c.step + 1}`);
  await key('PageDown'); await key('Space'); c = await current(page);
  c.id === 'url' && c.step === 0 ? pass('teclado', 'PageDown y Espacio avanzan (cruza al capítulo 01)') : fail('teclado', `PageDown+Espacio: ${c.id}/${c.step + 1}`);
  await key('ArrowUp'); c = await current(page);
  c.id === 'intro' && c.step === 2 ? pass('teclado', '↑ retrocede') : fail('teclado', `↑: ${c.id}/${c.step + 1}`);
  await key('PageUp'); c = await current(page);
  c.step === 1 ? pass('teclado', 'PageUp retrocede') : fail('teclado', `PageUp: ${c.id}/${c.step + 1}`);
  await key('End', 1200); c = await current(page);
  c.id === 'cierre' && c.step === 0 ? pass('teclado', 'End → cierre') : fail('teclado', `End: ${c.id}/${c.step + 1}`);
  await key('Home', 1200); c = await current(page);
  c.id === 'intro' && c.step === 0 ? pass('teclado', 'Home → inicio') : fail('teclado', `Home: ${c.id}/${c.step + 1}`);

  // Índice
  await key('m', 300);
  const menuOpen = await page.isVisible('#menu');
  menuOpen ? pass('índice', 'M abre el índice') : fail('índice', 'M no abre el índice');
  await page.click('#menu .menu-item[data-go="5"]'); await sleep(1200);
  c = await current(page);
  c.id === 'backend' ? pass('índice', 'clic salta a 05 · backend') : fail('índice', `salto: ${c.id}`);
  const hash = await page.evaluate(() => location.hash);
  hash === '#backend' ? pass('URL', 'el hash refleja el capítulo (#backend) sin recargar') : fail('URL', `hash: ${hash}`);
  await key('?', 300);
  (await page.isVisible('#help')) ? pass('ayuda', '? abre la ayuda') : fail('ayuda', '? no abre');
  await key('Escape', 300);
  (await page.isHidden('#help')) ? pass('ayuda', 'Esc cierra') : fail('ayuda', 'Esc no cierra');

  // Notas: ventana aparte sincronizada + control remoto
  const [popup] = await Promise.all([page.waitForEvent('popup', { timeout: 5000 }).catch(() => null), page.click('#btn-notes')]);
  if (popup) {
    await popup.waitForLoadState('networkidle');
    await sleep(900);
    const title = await popup.textContent('#n-title');
    /backend/i.test(title) ? pass('notas', `ventana de notas sincronizada («${title.trim()}»)`) : fail('notas', `título de notas: ${title}`);
    const before = await current(page);
    await popup.click('[data-cmd="next"]'); await sleep(1500);
    const after = await current(page);
    after.step === before.step + 1 ? pass('notas', 'el botón Siguiente de la ventana controla la presentación') : fail('notas', `control remoto: ${before.step} → ${after.step}`);
    const t2 = await popup.textContent('#n-meta');
    /Paso 2/.test(t2) ? pass('notas', 'la ventana actualiza el paso') : fail('notas', `meta: ${t2}`);
    await popup.close();
  } else fail('notas', 'no se abrió la ventana de notas');
  await page.keyboard.press('Shift+N'); await sleep(300);
  const panel = await page.isVisible('#notes-panel');
  const warn = panel && /Visible si compartes/.test(await page.textContent('#notes-panel'));
  panel && warn ? pass('notas', 'Shift+N abre el panel de respaldo con advertencia') : fail('notas', 'panel de respaldo');
  await page.keyboard.press('Shift+N'); await sleep(200);
  (await page.isHidden('#notes-panel')) ? pass('notas', 'notas ocultas por defecto / al cerrar') : fail('notas', 'el panel no se cierra');

  // Actividad
  const aIdx = await page.evaluate(() => window.__presentacion.director.list.findIndex((e) => e.meta.id === 'actividad'));
  await goStep(page, aIdx, 0); await sleep(900);
  const flows = { finanzas: 'Landing', derecho: 'Web', inmobiliaria: 'Propiedad', ventas: 'Producto' };
  for (const [id, first] of Object.entries(flows)) {
    await page.click(`.ac-chip[data-id="${id}"]`); await sleep(700);
    const got = await page.textContent('.ac-top .ac-node span');
    got.trim() === first ? pass('actividad', `chip ${id} → ${first} …`) : fail('actividad', `chip ${id}: ${got}`);
  }
  await page.fill('#ac-input', 'Soy abogado'); await page.press('#ac-input', 'Enter'); await sleep(700);
  (await page.textContent('.ac-top .ac-node span')).trim() === 'Web' ? pass('actividad', 'texto libre «abogado» → Derecho') : fail('actividad', 'texto libre abogado');
  await page.fill('#ac-input', 'Panadería artesanal'); await page.press('#ac-input', 'Enter'); await sleep(700);
  const ex = await page.textContent('.ac-example');
  /Panadería artesanal/.test(ex) ? pass('actividad', 'profesión sin coincidencia → plantilla genérica con su nombre') : fail('actividad', `genérica: ${ex}`);
  await page.fill('#ac-input', '<img src=x onerror=alert(1)>'); await page.press('#ac-input', 'Enter'); await sleep(500);
  (await page.$('.ac-example img')) ? fail('actividad', 'el texto escrito se inserta como HTML') : pass('actividad', 'el texto escrito se inserta como texto (sin HTML)');

  // Quiz
  const qIdx = await page.evaluate(() => window.__presentacion.director.list.findIndex((e) => e.meta.id === 'quiz'));
  await goStep(page, qIdx, 0); await sleep(900);
  await page.focus('.qz-next'); await page.keyboard.press('Enter'); await sleep(200);
  const answers = ['2', '1', '1', '4', '2'];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press(answers[i]); await sleep(200);
    const fb = await page.textContent('.qz-fb');
    if (!/Correcto|No exactamente/.test(fb)) fail('quiz', `pregunta ${i + 1} sin retroalimentación`);
    await page.keyboard.press('Enter'); await sleep(200);
  }
  const score = await page.textContent('.qz-score');
  /4\s*\/\s*5/.test(score) ? pass('quiz', '5 preguntas con retroalimentación; puntaje 4/5 con una incorrecta') : fail('quiz', `puntaje: ${score}`);
  (await page.$('.qz-go')) ? pass('quiz', 'sugiere repasar el capítulo fallado') : fail('quiz', 'sin enlace de repaso');
  await page.keyboard.press('Enter'); await sleep(200);
  /5 preguntas/.test(await page.textContent('.qz-body')) ? pass('quiz', 'se puede repetir') : fail('quiz', 'no reinicia');

  // Enlace profundo y resize
  await page.goto('about:blank');
  await page.goto(url + '#codeweb', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__presentacion && !document.body.classList.contains('is-loading'));
  await sleep(1200);
  c = await current(page);
  c.id === 'codeweb' ? pass('URL', 'enlace profundo #codeweb abre el capítulo') : fail('URL', `deep link: ${c.id}`);
  await page.setViewportSize({ width: 1366, height: 768 }); await sleep(800);
  await page.setViewportSize({ width: 1920, height: 1080 }); await sleep(800);
  c = await current(page);
  c.id === 'codeweb' ? pass('resize', 'tras cambiar de tamaño se mantiene el capítulo') : fail('resize', `tras resize: ${c.id}`);

  if (errors.length) errors.forEach((e) => fail('consola funcional', e)); else pass('consola funcional', 'sin errores');
  await ctx.close();
}

async function perfTest(browser, url) {
  const { ctx, page } = await openPage(browser, url, { name: 'perf', width: 1920, height: 1080 }, '?debug');
  const stats = await page.evaluate(async () => {
    const d = window.__presentacion.director, st = window.__presentacion.stage;
    const out = { maxCalls: 0, maxTris: 0, chapter: '', fps: [] };
    for (let i = 0; i < d.list.length; i++) {
      const e = d.list[i];
      window.scrollTo(0, d.positionOf(i, e.steps - 1));
      await new Promise((r) => setTimeout(r, 450));
      if (st) { const inf = st.info(); if (inf.calls > out.maxCalls) { out.maxCalls = inf.calls; out.chapter = e.meta.id; } out.maxTris = Math.max(out.maxTris, inf.triangles); }
      let frames = 0; const t0 = performance.now();
      await new Promise((r) => { const f = () => { frames++; if (performance.now() - t0 < 400) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
      out.fps.push(Math.round(frames / ((performance.now() - t0) / 1000)));
    }
    return out;
  });
  const avg = Math.round(stats.fps.reduce((a, b) => a + b, 0) / stats.fps.length);
  stats.maxCalls <= 150 ? pass('rendimiento', `draw calls máx. ${stats.maxCalls} (${stats.chapter}) ≤ 150`) : fail('rendimiento', `draw calls ${stats.maxCalls} en ${stats.chapter}`);
  stats.maxTris <= 60000 ? pass('rendimiento', `triángulos máx. ${stats.maxTris} ≤ 60 000`) : fail('rendimiento', `triángulos ${stats.maxTris}`);
  pass('rendimiento', `FPS promedio en este contenedor (render por software, NO representativo de una GPU real): ${avg}`);
  await ctx.close();
}

/* Contraste WCAG de los pares de tokens */
function contrast() {
  const lum = (hex) => { const c = hex.match(/\w\w/g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const pairs = [
    ['oscuro: texto / fondo', '#f2f0eb', '#111111', 4.5], ['oscuro: texto-2 / fondo', '#a9a9ae', '#111111', 4.5], ['oscuro: texto-3 / fondo (grande)', '#7c7c82', '#111111', 3],
    ['oscuro: señal / fondo', '#5ba8ff', '#111111', 4.5], ['oscuro: ok / fondo', '#4cc38a', '#111111', 4.5], ['oscuro: error / fondo', '#e58a70', '#111111', 4.5], ['oscuro: texto-2 / superficie', '#a9a9ae', '#1d1d1f', 4.5],
    ['claro: texto / fondo', '#161616', '#f3f0e9', 4.5], ['claro: texto-2 / fondo', '#53514c', '#f3f0e9', 4.5], ['claro: texto-3 / fondo (grande)', '#7d7a73', '#f3f0e9', 3],
    ['claro: señal / fondo', '#1a4fe0', '#f3f0e9', 4.5], ['claro: ok / fondo', '#1b7a51', '#f3f0e9', 4.5], ['claro: error / fondo', '#b0452c', '#f3f0e9', 4.5], ['claro: texto-2 / superficie', '#53514c', '#ffffff', 4.5],
  ];
  for (const [name, a, b, min] of pairs) {
    const r = ratio(a, b);
    (r >= min ? pass : fail)('contraste', `${name}: ${r.toFixed(2)}:1 (mín. ${min})`);
  }
}

const server = await startServer();
const browser = await chromium.launch(launchOpts());
mkdirSync(OUT, { recursive: true });
try {
  contrast();
  for (const vp of VIEWPORTS) { console.log(`· recorriendo ${vp.name}`); await sweep(browser, server.url, vp); }
  console.log('· pruebas funcionales'); await functional(browser, server.url);
  console.log('· rendimiento'); await perfTest(browser, server.url);
} catch (err) {
  fail('qa', String(err && err.stack || err));
} finally {
  await browser.close();
  server.stop();
}

const bad = results.filter((r) => !r.ok);
const md = [`# QA · ${new Date().toISOString()}`, '', `**${results.length - bad.length} OK · ${bad.length} con problemas**`, '',
  ...results.map((r) => `- ${r.ok ? '✅' : '❌'} **${r.area}** — ${r.msg}`)].join('\n');
writeFileSync(resolve(OUT, 'report.md'), md);
console.log(md);
process.exit(bad.length ? 1 : 0);
