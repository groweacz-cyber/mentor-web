// Export pro terapeuta: přehled pro tisk nebo uložení do PDF (tiskový dialog prohlížeče). Nic se neodesílá.
import { data, fmtDate, fmtDateLong, latestAssessment } from './store.js';
import { h, boot, gate, lineChart, $ } from './ui.js';
import { pathLabel, KIND_LABEL } from './data.js';

const root = $('#app-root');
boot(root);

const OPTS = [
  ['ass', 'Dotazníky a žebříček', true],
  ['exp', 'Expoziční deník s grafem', true],
  ['cmp', 'Kompulze (týdenní součty)', true],
  ['wk', 'Sebepřijetí a sebevíra', true],
  ['vis', 'Vize', false],
  ['roots', 'Kořeny (milníky)', false],
  ['txt', 'Expoziční texty', false],
];

function table(head, rows) {
  return h('table', { class: 'rep-table' }, h('thead', {}, h('tr', {}, head.map((x) => h('th', {}, x)))), h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, String(c)))))));
}

function build(sel) {
  const d = data();
  const out = [h('h2', {}, 'Přehled z aplikace'), h('p', { class: 'small' }, 'Vytvořeno ' + fmtDateLong(Date.now()) + '. Přehled sestavil uživatel sám, není to zdravotnická dokumentace ani diagnóza.')];
  if (sel.ass && d.assessments.length) {
    out.push(h('h3', {}, 'Dotazníky'));
    out.push(table(['Datum', 'Cesta', 'Sebepřijetí', 'Sebevíra', 'Čas denně'], d.assessments.map((a) => [fmtDate(a.at), pathLabel(a.reco.path), a.pillars.accept, a.pillars.trust, a.impact.time || '–'])));
    const a = latestAssessment();
    out.push(h('h3', {}, 'Témata z posledního dotazníku'));
    out.push(table(['Téma', 'Úzkost 0–10'], a.topics.filter((t) => t.score > 0).sort((x, y) => x.score - y.score).map((t) => [t.name, t.score])));
  }
  if (sel.exp && d.exposures.length) {
    out.push(h('h3', {}, 'Expoziční deník'));
    const ex = d.exposures.slice(-20);
    out.push(lineChart([{ name: 'Před', cls: 's-before', values: ex.map((e) => e.before) }, { name: 'Maximum', cls: 's-peak', values: ex.map((e) => e.peak) }, { name: 'Po 15 min', cls: 's-after', values: ex.map((e) => e.after) }], ex.map((e) => fmtDate(e.at)), 'Vývoj úzkosti v expozicích'));
    out.push(table(['Datum', 'Téma', 'Před', 'Max', 'Po', 'Chuť na kompulzi'], d.exposures.slice(-30).map((e) => [fmtDate(e.at), e.topicName, e.before, e.peak, e.after, e.urge ? 'ano' : 'ne'])));
  }
  if (sel.cmp && d.compulsions.length) {
    out.push(h('h3', {}, 'Kompulze podle týdnů'));
    const by = {};
    d.compulsions.forEach((c) => { const k = fmtDate(c.at - ((new Date(c.at).getDay() + 6) % 7) * 86400000); by[k] = by[k] || { r: 0, x: 0 }; by[k][c.outcome === 'resisted' ? 'r' : 'x']++; });
    out.push(table(['Týden od', 'Odolal/a', 'Udělal/a'], Object.entries(by).map(([k, v]) => [k, v.r, v.x])));
    const kinds = {};
    d.compulsions.forEach((c) => { kinds[KIND_LABEL[c.kind]] = (kinds[KIND_LABEL[c.kind]] || 0) + 1; });
    out.push(h('p', { class: 'small' }, 'Podle typu: ' + Object.entries(kinds).map(([k, v]) => k + ' ' + v).join(', ')));
  }
  if (sel.wk && d.weeks.length) {
    out.push(h('h3', {}, 'Sebepřijetí a sebevíra po týdnech'));
    out.push(table(['Týden', 'Sebepřijetí', 'Sebevíra'], d.weeks.slice(-16).map((w) => [fmtDate(w.at), w.accept, w.trust])));
  }
  if (sel.vis && d.vision) out.push(h('h3', {}, 'Vize'), h('p', {}, d.vision.text));
  if (sel.roots && d.roots.length) out.push(h('h3', {}, 'Kořeny'), h('ul', {}, d.roots.map((r) => h('li', {}, (r.when || '–') + ': ' + r.what))));
  if (sel.txt && d.texts.length) out.push(h('h3', {}, 'Expoziční texty'), ...d.texts.slice(-3).map((t) => h('p', {}, t.parts.join(' '))));
  if (out.length <= 2) out.push(h('p', {}, 'Pro vybrané části zatím nejsou žádná data.'));
  return out;
}

function render() {
  const sel = {};
  OPTS.forEach(([k, , on]) => { sel[k] = on; });
  const report = h('div', { id: 'report', class: 'report' });
  const refresh = () => report.replaceChildren(...build(sel));
  const boxes = h('fieldset', { class: 'checks no-print' }, h('legend', {}, 'Co zahrnout'), OPTS.map(([k, l, on]) => {
    const cb = h('input', { type: 'checkbox', checked: on });
    cb.addEventListener('change', () => { sel[k] = cb.checked; refresh(); });
    return h('label', { class: 'check' }, cb, ' ' + l);
  }));
  root.replaceChildren(
    h('p', { class: 'banner banner-soft no-print' }, 'Vyberte, co chcete ukázat terapeutovi. Citlivé části (vize, kořeny, texty) jsou ve výchozím stavu vypnuté. Tlačítko otevře tisk, v něm zvolte „Uložit jako PDF“. Nic se neodesílá.'),
    boxes,
    h('div', { class: 'actions no-print' }, h('button', { class: 'btn', type: 'button', onclick: () => window.print() }, 'Tisk nebo uložit jako PDF')),
    report);
  refresh();
}

if (gate(root)) render();
