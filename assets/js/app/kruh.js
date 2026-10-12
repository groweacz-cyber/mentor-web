// Kruh OCD: interaktivní kruh s nástrojem u každého článku a krátký rozbor epizody (max. 5 polí).
import { data, save, uid, fmtDate } from './store.js';
import { h, boot, gate, $ } from './ui.js';
import { CIRCLE } from './data.js';

const root = $('#app-root');
boot(root);

const FIELDS = [
  ['spoustec', 'Co epizodu spustilo?'],
  ['pochybnost', 'Jaká pochybnost přišla?'],
  ['udelal', 'Co jsem udělal/a?'],
  ['prerusit', 'Kde šlo kruh přerušit?'],
  ['pristi', 'Co zkusím příště?'],
];

function render(sel = 0, note) {
  const d = data();
  const n = CIRCLE.length;
  const ring = h('div', { class: 'ring-wrap' });
  ring.innerHTML = '<svg viewBox="0 0 100 100" class="ring" aria-hidden="true"><circle cx="50" cy="50" r="38" fill="none" stroke="#e7dfcf" stroke-width="3" stroke-dasharray="2 3"/></svg><span class="ring-center">Kruh<br>OCD</span>';
  CIRCLE.forEach((c, i) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2;
    ring.append(h('button', { type: 'button', class: 'node' + (i === sel ? ' on' : ''), style: 'left:' + (50 + 38 * Math.cos(a)) + '%;top:' + (50 + 38 * Math.sin(a)) + '%', 'aria-pressed': String(i === sel), onclick: () => render(i) }, h('span', { class: 'n' }, String(i + 1)), h('span', { class: 'nm' }, c.name)));
  });
  const c = CIRCLE[sel];
  const inputs = FIELDS.map(([k, l]) => ({ k, el: h('input', { type: 'text', id: 'ep-' + k, maxlength: 100 }), l }));
  const saveEp = () => {
    const e = { id: uid(), at: Date.now() };
    inputs.forEach((i) => { e[i.k] = i.el.value.trim(); });
    if (!inputs.some((i) => e[i.k])) return;
    d.episodes.push(e);
    if (d.episodes.length > 30) d.episodes.shift();
    save();
    render(sel, 'Zapsáno. Takhle krátce to stačí, nerozebírejte to dál.');
  };
  root.replaceChildren(...[
    note ? h('p', { class: 'banner banner-ok', role: 'status' }, note) : null,
    h('p', {}, 'OCD se točí v kruhu. Na každý článek má metoda nástroj. Klepněte na článek.'),
    ring,
    h('div', { class: 'card app-card', 'aria-live': 'polite' }, h('h2', {}, sel + 1 + '. ' + c.name), h('p', {}, c.x), h('a', { class: 'btn btn-ghost', href: c.href }, c.cta)),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Rozbor epizody'),
      h('p', { class: 'hint' }, 'Max. pět krátkých polí, jen kde se kruh dal přerušit. Žádné nekonečné rozepisování.'),
      inputs.map((i) => h('div', { class: 'field' }, h('label', { for: 'ep-' + i.k }, i.l), i.el)),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: saveEp }, 'Uložit'))),
    d.episodes.length ? h('div', {}, h('h3', {}, 'Poslední epizody'), h('ul', { class: 'log' }, d.episodes.slice(-4).reverse().map((e) => h('li', {}, h('strong', {}, fmtDate(e.at)), ' · přerušit: ' + (e.prerusit || '–') + ' · příště: ' + (e.pristi || '–'))))) : null,
  ].filter(Boolean));
}

if (gate(root)) render();
