/* Utilidades compartidas por los capítulos. */

/* Manejadores de teclado extra (p. ej. el quiz registra 1–4). Devuelven true si consumen la tecla. */
export const keyHandlers = [];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => [...root.querySelectorAll(sel)];

/* Resaltado de sintaxis mínimo (solo para lectura; no pretende ser completo). */
export function highlight(code, lang) {
  const e = esc(code);
  if (lang === 'html') {
    return e.replace(/(&lt;\/?)([a-z0-9]+)([^&]*?)(&gt;)/gi, (m, a, tag, attrs, b) =>
      `<span class="tk-punc">${a}</span><span class="tk-tag">${tag}</span>${attrs.replace(/([a-z-]+)=(&quot;.*?&quot;)/gi, '<span class="tk-attr">$1</span>=<span class="tk-str">$2</span>')}<span class="tk-punc">${b}</span>`);
  }
  if (lang === 'css') {
    return e
      .replace(/^([a-z0-9.#\s]+?)(\s*\{)/gim, '<span class="tk-tag">$1</span>$2')
      .replace(/([a-z-]+)(\s*:)/g, '<span class="tk-prop">$1</span>$2')
      .replace(/(#[0-9a-f]{3,6}|\b\d+px\b)/gi, '<span class="tk-num">$1</span>');
  }
  if (lang === 'js' || lang === 'json') {
    return e
      .replace(/(&quot;.*?&quot;)/g, '<span class="tk-str">$1</span>')
      .replace(/\b(const|let|function|return|=&gt;)\b/g, '<span class="tk-attr">$1</span>')
      .replace(/\.([a-zA-Z]+)\(/g, '.<span class="tk-fn">$1</span>(');
  }
  return e;
}

/* JSON con colores (clave / valor). */
export function jsonLines(pairs) {
  return pairs.map(([k, v], i) =>
    `  <span class="tk-key">"${esc(k)}"</span><span class="tk-punc">: </span><span class="tk-str">"${esc(v)}"</span>${i < pairs.length - 1 ? '<span class="tk-punc">,</span>' : ''}`);
}

/* Normaliza texto para comparar (minúsculas, sin acentos). */
export const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
