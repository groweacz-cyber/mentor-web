// Export pro terapeuta: přehled pro tisk nebo uložení do PDF (tiskový dialog prohlížeče). Nic se neodesílá.
import { data, fmtDate, fmtDateLong, dayKey } from './store.js';
import { h, boot, gate, lineChart, $ } from './ui.js';
import { KIND_LABEL } from './data.js';

const root = $('#app-root');
boot(root);

const OPTS = [
  ['exp', 'Exposure diary with chart', true],
  ['obs', 'Obsessions (daily totals and strength)', true],
  ['cmp', 'Compulsions (weekly totals)', true],
  ['wk', 'Self-acceptance and self-trust', true],
  ['vis', 'Vision', false],
  ['roots', 'Roots (milestones)', false],
  ['txt', 'Exposure texts', false],
];

function table(head, rows) {
  return h('table', { class: 'rep-table' }, h('thead', {}, h('tr', {}, head.map((x) => h('th', {}, x)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, String(c)))))));
}

function build(sel) {
  const d = data();
  const out = [h('h2', {}, 'Overview from the app'), h('p', { class: 'small' }, 'Created ' + fmtDateLong(Date.now()) + '. The overview was compiled by the user; it is not medical documentation or a diagnosis.')];
  if (sel.exp && d.exposures.length) {
    out.push(h('h3', {}, 'Exposure diary'));
    const ex = d.exposures.slice(-20);
    out.push(lineChart([{ name: 'Before', cls: 's-before', values: ex.map((e) => e.before) }, { name: 'Peak', cls: 's-peak', values: ex.map((e) => e.peak) }, { name: 'After 15 min', cls: 's-after', values: ex.map((e) => e.after) }], ex.map((e) => fmtDate(e.at)), 'Progress of anxiety in exposures'));
    out.push(table(['Date', 'Theme', 'Before', 'Max', 'Po', 'Urge for a compulsion'], d.exposures.slice(-30).map((e) => [fmtDate(e.at), e.topicName, e.before, e.peak, e.after, e.urge ? 'ano' : 'ne'])));
  }
  if (sel.obs && d.obsessions.length) {
    out.push(h('h3', {}, 'Obsessions by day'));
    const rows = [];
    for (let i = 13; i >= 0; i--) {
      const t = Date.now() - i * 86400000;
      const k = dayKey(t);
      const o = d.obsessions.filter((x) => dayKey(x.at) === k);
      if (!o.length) continue;
      rows.push([fmtDate(t), o.length, o.filter((x) => x.repeat === false).length, o.filter((x) => x.repeat === true).length, Math.round(o.reduce((s, x) => s + x.intensity, 0) / o.length) + ' / 10', d.compulsions.filter((c) => dayKey(c.at) === k).length]);
    }
    out.push(table(['Date', 'Obsessions', 'Of which new themes', 'Of which recurring', 'Average strength', 'Compulsions'], rows));
  }
  if (sel.cmp && d.compulsions.length) {
    out.push(h('h3', {}, 'Compulsions by week'));
    const by = {};
    d.compulsions.forEach((c) => { const k = fmtDate(c.at - ((new Date(c.at).getDay() + 6) % 7) * 86400000); by[k] = by[k] || { r: 0, x: 0 }; by[k][c.outcome === 'resisted' ? 'r' : 'x']++; });
    out.push(table(['Week from', 'Odolal/a', 'Did it'], Object.entries(by).map(([k, v]) => [k, v.r, v.x])));
    const kinds = {};
    d.compulsions.forEach((c) => { kinds[KIND_LABEL[c.kind]] = (kinds[KIND_LABEL[c.kind]] || 0) + 1; });
    out.push(h('p', { class: 'small' }, 'Podle typu: ' + Object.entries(kinds).map(([k, v]) => k + ' ' + v).join(', ')));
  }
  if (sel.wk && d.weeks.length) {
    out.push(h('h3', {}, 'Self-acceptance and self-trust by week'));
    out.push(table(['Week', 'Self-acceptance', 'Self-trust'], d.weeks.slice(-16).map((w) => [fmtDate(w.at), w.accept, w.trust])));
  }
  if (sel.vis && d.vision) out.push(h('h3', {}, 'Vision'), h('p', {}, d.vision.text));
  if (sel.roots && d.roots.length) out.push(h('h3', {}, 'Roots'), h('ul', {}, d.roots.map((r) => h('li', {}, (r.when || '–') + ': ' + r.what))));
  if (sel.txt && d.texts.length) out.push(h('h3', {}, 'Exposure texts'), ...d.texts.slice(-3).map((t) => h('p', {}, t.parts.join(' '))));
  if (out.length <= 2) out.push(h('p', {}, 'There is no data for the selected parts yet.'));
  return out;
}

function render() {
  const sel = {};
  OPTS.forEach(([k, , on]) => { sel[k] = on; });
  const report = h('div', { id: 'report', class: 'report' });
  const refresh = () => report.replaceChildren(...build(sel));
  const boxes = h('fieldset', { class: 'checks no-print' }, h('legend', {}, 'What to include'), OPTS.map(([k, l, on]) => {
    const cb = h('input', { type: 'checkbox', checked: on });
    cb.addEventListener('change', () => { sel[k] = cb.checked; refresh(); });
    return h('label', { class: 'check' }, cb, ' ' + l);
  }));
  root.replaceChildren(
    h('p', { class: 'banner banner-soft no-print' }, 'Choose what you want to show your therapist. The sensitive parts (vision, roots, texts) are switched off by default. The button opens print; in it choose "Save as PDF". Nothing is sent.'),
    boxes,
    h('div', { class: 'actions no-print' }, h('button', { class: 'btn', type: 'button', onclick: () => window.print() }, 'Print or save as PDF')),
    report);
  refresh();
}

if (gate(root)) render();
