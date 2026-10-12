// Společné pomůcky: DOM, brána souhlasu, SOS okno, graf.
import { canStore, hasConsent } from './store.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Bezpečné vytváření prvků. Texty se vkládají jako textové uzly, nikdy jako HTML.
export function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}

export function gate(root) {
  if (hasConsent()) return true;
  root.replaceChildren(
    h('div', { class: 'card app-card' },
      h('h2', {}, 'Nejdřív souhlas'),
      h('p', {}, 'Než začnete, potvrďte na úvodní stránce aplikace, jak se zachází s vašimi údaji.'),
      h('a', { class: 'btn', href: '/aplikace' }, 'Přejít na úvod aplikace')));
  return false;
}

function initSos() {
  const dlg = $('#sos');
  const open = $('#sos-open');
  if (!dlg || !open) return;
  const show = () => (dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''));
  const hide = () => (dlg.close ? dlg.close() : dlg.removeAttribute('open'));
  open.addEventListener('click', show);
  $('#sos-close').addEventListener('click', hide);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) hide(); });
}

export function boot(root) {
  initSos();
  if (!canStore() && root) {
    root.before(h('p', { class: 'banner banner-warn', role: 'alert' }, 'Tento prohlížeč neumožňuje ukládání dat (možná soukromé okno). Vše, co zapíšete, zmizí po zavření stránky.'));
  }
}

export function crisisBlock() {
  return h('div', { class: 'banner banner-crisis', role: 'alert' },
    h('h2', {}, 'Potřebujete pomoc teď?'),
    h('p', {}, 'Nemusíte na to být sami. Volejte:'),
    h('ul', {},
      h('li', {}, h('a', { href: 'tel:116123' }, 'Linka první psychické pomoci 116 123')),
      h('li', {}, h('a', { href: 'tel:155' }, 'Záchranná služba 155')),
      h('li', {}, h('a', { href: 'tel:112' }, 'Tísňová linka 112'))),
    h('p', {}, 'Případně kontaktujte svého terapeuta nebo lékaře.'));
}

// Posuvník 0–10 s živou hodnotou.
export function slider(id, label, hint, value = 0) {
  const out = h('output', { for: id }, String(value));
  const input = h('input', { type: 'range', id, min: 0, max: 10, step: 1, value: String(value) });
  const sync = () => { out.textContent = input.value; input.style.setProperty('--p', input.value * 10 + '%'); };
  input.addEventListener('input', sync);
  sync();
  return h('div', { class: 'field' },
    h('label', { for: id }, label, hint ? h('span', { class: 'hint' }, ' ' + hint) : null),
    h('div', { class: 'range' }, input, out, h('span', { class: 'of' }, '/ 10')));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Jednoduchý SVG spojnicový graf 0–10. series: [{name, cls, values}], labels: popisky osy x.
export function lineChart(series, labels, summary) {
  const W = 340, H = 190, L = 28, R = 10, T = 10, B = 26;
  const n = labels.length;
  const x = (i) => (n === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const y = (v) => T + (H - T - B) * (1 - v / 10);
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(summary)}">`;
  for (const g of [0, 5, 10]) svg += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}"/><text class="tick" x="${L - 6}" y="${y(g) + 4}" text-anchor="end">${g}</text>`;
  const step = Math.max(1, Math.ceil(n / 6));
  labels.forEach((lb, i) => { if (i % step === 0 || i === n - 1) svg += `<text class="tick" x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(lb)}</text>`; });
  for (const s of series) {
    const pts = s.values.map((v, i) => (v == null ? null : [x(i), y(v)])).filter(Boolean);
    if (pts.length > 1) svg += `<polyline class="line ${s.cls}" points="${pts.map((p) => p.join(',')).join(' ')}"/>`;
    for (const p of pts) svg += `<circle class="dot ${s.cls}" cx="${p[0]}" cy="${p[1]}" r="3.5"/>`;
  }
  svg += '</svg>';
  const wrap = h('div', { class: 'chart-wrap' });
  wrap.innerHTML = svg; // jen čísla a vlastní popisky, vše escapováno
  wrap.append(h('ul', { class: 'legend' }, series.map((s) => h('li', {}, h('span', { class: 'sw ' + s.cls }), s.name))));
  return wrap;
}
