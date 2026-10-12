// Tracker kompulzí: rychlé ťuknutí, podpůrná zpráva bez výčitek, týdenní přehled.
import { data, save, uid, dayKey } from './store.js';
import { h, boot, gate, $ } from './ui.js';
import { KIND_LABEL, MSG_DID, MSG_RESISTED } from './data.js';

const root = $('#app-root');
boot(root);
let kind = 'mental';
let msg = null;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function week() {
  const d = data();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const t = Date.now() - i * 86400000;
    const k = dayKey(t);
    const list = d.compulsions.filter((c) => dayKey(c.at) === k);
    days.push({ label: new Date(t).toLocaleDateString('cs-CZ', { weekday: 'short' }), res: list.filter((c) => c.outcome === 'resisted').length, did: list.filter((c) => c.outcome === 'did').length });
  }
  return days;
}

function log(outcome) {
  const d = data();
  d.compulsions.push({ id: uid(), at: Date.now(), outcome, kind });
  save();
  msg = { ok: outcome === 'resisted', text: pick(outcome === 'resisted' ? MSG_RESISTED : MSG_DID) };
  render();
}

function render() {
  const d = data();
  const days = week();
  const max = Math.max(1, ...days.map((x) => x.res + x.did));
  const res = days.reduce((s, x) => s + x.res, 0);
  const did = days.reduce((s, x) => s + x.did, 0);
  const kinds = h('fieldset', { class: 'chips' }, h('legend', {}, 'Typ kompulze'), Object.entries(KIND_LABEL).map(([v, l]) => {
    const r = h('input', { type: 'radio', name: 'kind', value: v, checked: v === kind });
    r.addEventListener('change', () => { kind = v; });
    return h('label', { class: 'chip' }, r, h('span', {}, l));
  }));
  const last = d.compulsions[d.compulsions.length - 1];
  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'Co se právě stalo?'), kinds,
      h('div', { class: 'big-actions' },
        h('button', { class: 'btn big resisted', type: 'button', onclick: () => log('resisted') }, 'Odolal/a jsem'),
        h('button', { class: 'btn btn-ghost big', type: 'button', onclick: () => log('did') }, 'Udělal/a jsem')),
      msg ? h('p', { class: 'banner ' + (msg.ok ? 'banner-ok' : 'banner-soft'), role: 'status' }, msg.text) : null),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Posledních 7 dní'),
      h('div', { class: 'bars', role: 'img', 'aria-label': 'Týdenní přehled: odolal/a jsem ' + res + ', udělal/a jsem ' + did }, days.map((x) => h('div', { class: 'bar-col' },
        h('div', { class: 'bar-stack', style: 'height:' + ((x.res + x.did) / max) * 100 + '%' }, h('span', { class: 'seg seg-res', style: 'flex:' + x.res }), h('span', { class: 'seg seg-did', style: 'flex:' + x.did })),
        h('span', { class: 'bar-label' }, x.label)))),
      h('ul', { class: 'legend' }, h('li', {}, h('span', { class: 'sw seg-res' }), 'Odolal/a jsem (' + res + ')'), h('li', {}, h('span', { class: 'sw seg-did' }), 'Udělal/a jsem (' + did + ')')),
      h('p', { class: 'small' }, 'Čísla nejsou výkon. Slouží jen k tomu, abyste viděli, že se věci hýbou. Žádná „série“ se nepřerušuje.'),
      last ? h('button', { class: 'linklike', type: 'button', onclick: () => { d.compulsions.pop(); save(); msg = null; render(); } }, 'Smazat poslední záznam') : null),
  ].filter(Boolean));
}

if (gate(root)) render();
