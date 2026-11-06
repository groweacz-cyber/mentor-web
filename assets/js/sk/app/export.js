// Export pro terapeuta: přehled pro tisk nebo uložení do PDF (tiskový dialog prohlížeče). Nic se neodesílá.
import { data, fmtDate, fmtDateLong, latestAssessment } from './store.js';
import { h, boot, gate, lineChart, $ } from './ui.js';
import { pathLabel, KIND_LABEL } from './data.js';

const root = $('#app-root');
boot(root);

const OPTS = [
  ['ass', 'Dotazníky a rebríček', true],
  ['exp', 'Expozičný denník s grafom', true],
  ['cmp', 'Kompulzie (týždenné súčty)', true],
  ['wk', 'Sebaprijatie a sebadôvera', true],
  ['vis', 'Vízia', false],
  ['roots', 'Korene (míľniky)', false],
  ['txt', 'Expozičné texty', false],
];

function table(head, rows) {
  return h('table', { class: 'rep-table' }, h('thead', {}, h('tr', {}, head.map((x) => h('th', {}, x)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, String(c)))))));
}

function build(sel) {
  const d = data();
  const out = [h('h2', {}, 'Prehľad z aplikácie'), h('p', { class: 'small' }, 'Vytvorené ' + fmtDateLong(Date.now()) + '. Prehľad zostavil používateľ sám, nie je to zdravotnícka dokumentácia ani diagnóza.')];
  if (sel.ass && d.assessments.length) {
    out.push(h('h3', {}, 'Dotazníky'));
    out.push(table(['Dátum', 'Cesta', 'Sebaprijatie', 'Sebadôvera', 'Čas denne'], d.assessments.map((a) => [fmtDate(a.at), pathLabel(a.reco.path), a.pillars.accept, a.pillars.trust, a.impact.time || '–'])));
    const a = latestAssessment();
    out.push(h('h3', {}, 'Témy z posledného dotazníka'));
    out.push(table(['Téma', 'Úzkosť 0–10'], a.topics.filter((t) => t.score > 0).sort((x, y) => x.score - y.score).map((t) => [t.name, t.score])));
  }
  if (sel.exp && d.exposures.length) {
    out.push(h('h3', {}, 'Expozičný denník'));
    const ex = d.exposures.slice(-20);
    out.push(lineChart([{ name: 'Pred', cls: 's-before', values: ex.map((e) => e.before) }, { name: 'Maximum', cls: 's-peak', values: ex.map((e) => e.peak) }, { name: 'Po 15 min', cls: 's-after', values: ex.map((e) => e.after) }], ex.map((e) => fmtDate(e.at)), 'Vývoj úzkosti v expozíciách'));
    out.push(table(['Dátum', 'Téma', 'Pred', 'Max', 'Po', 'Chuť na kompulziu'], d.exposures.slice(-30).map((e) => [fmtDate(e.at), e.topicName, e.before, e.peak, e.after, e.urge ? 'ano' : 'ne'])));
  }
  if (sel.cmp && d.compulsions.length) {
    out.push(h('h3', {}, 'Kompulzie podľa týždňov'));
    const by = {};
    d.compulsions.forEach((c) => { const k = fmtDate(c.at - ((new Date(c.at).getDay() + 6) % 7) * 86400000); by[k] = by[k] || { r: 0, x: 0 }; by[k][c.outcome === 'resisted' ? 'r' : 'x']++; });
    out.push(table(['Týždeň od', 'Odolal/a', 'Urobil/a'], Object.entries(by).map(([k, v]) => [k, v.r, v.x])));
    const kinds = {};
    d.compulsions.forEach((c) => { kinds[KIND_LABEL[c.kind]] = (kinds[KIND_LABEL[c.kind]] || 0) + 1; });
    out.push(h('p', { class: 'small' }, 'Podle typu: ' + Object.entries(kinds).map(([k, v]) => k + ' ' + v).join(', ')));
  }
  if (sel.wk && d.weeks.length) {
    out.push(h('h3', {}, 'Sebaprijatie a sebadôvera po týždňoch'));
    out.push(table(['Týždeň', 'Sebaprijatie', 'Sebadôvera'], d.weeks.slice(-16).map((w) => [fmtDate(w.at), w.accept, w.trust])));
  }
  if (sel.vis && d.vision) out.push(h('h3', {}, 'Vízia'), h('p', {}, d.vision.text));
  if (sel.roots && d.roots.length) out.push(h('h3', {}, 'Korene'), h('ul', {}, d.roots.map((r) => h('li', {}, (r.when || '–') + ': ' + r.what))));
  if (sel.txt && d.texts.length) out.push(h('h3', {}, 'Expozičné texty'), ...d.texts.slice(-3).map((t) => h('p', {}, t.parts.join(' '))));
  if (out.length <= 2) out.push(h('p', {}, 'Pre vybrané časti zatiaľ nie sú žiadne dáta.'));
  return out;
}

function render() {
  const sel = {};
  OPTS.forEach(([k, , on]) => { sel[k] = on; });
  const report = h('div', { id: 'report', class: 'report' });
  const refresh = () => report.replaceChildren(...build(sel));
  const boxes = h('fieldset', { class: 'checks no-print' }, h('legend', {}, 'Čo zahrnúť'), OPTS.map(([k, l, on]) => {
    const cb = h('input', { type: 'checkbox', checked: on });
    cb.addEventListener('change', () => { sel[k] = cb.checked; refresh(); });
    return h('label', { class: 'check' }, cb, ' ' + l);
  }));
  root.replaceChildren(
    h('p', { class: 'banner banner-soft no-print' }, 'Vyberte, čo chcete ukázať terapeutovi. Citlivé časti (vízia, korene, texty) sú v predvolenom stave vypnuté. Tlačidlo otvorí tlač, v nej zvoľte „Uložiť ako PDF“. Nič sa neodosiela.'),
    boxes,
    h('div', { class: 'actions no-print' }, h('button', { class: 'btn', type: 'button', onclick: () => window.print() }, 'Tlač alebo uložiť ako PDF')),
    report);
  refresh();
}

if (gate(root)) render();
