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
    days.push({ label: new Date(t).toLocaleDateString('en-GB', { weekday: 'short' }), res: list.filter((c) => c.outcome === 'resisted').length, did: list.filter((c) => c.outcome === 'did').length });
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
  const kinds = h('fieldset', { class: 'chips' }, h('legend', {}, 'Type of compulsion'), Object.entries(KIND_LABEL).map(([v, l]) => {
    const r = h('input', { type: 'radio', name: 'kind', value: v, checked: v === kind });
    r.addEventListener('change', () => { kind = v; });
    return h('label', { class: 'chip' }, r, h('span', {}, l));
  }));
  const last = d.compulsions[d.compulsions.length - 1];
  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'What has just happened?'), kinds,
      h('div', { class: 'big-actions' },
        h('button', { class: 'btn big resisted', type: 'button', onclick: () => log('resisted') }, 'I resisted'),
        h('button', { class: 'btn btn-ghost big', type: 'button', onclick: () => log('did') }, 'I did it')),
      msg ? h('p', { class: 'banner ' + (msg.ok ? 'banner-ok' : 'banner-soft'), role: 'status' }, msg.text) : null),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Last 7 days'),
      h('div', { class: 'bars', role: 'img', 'aria-label': 'Weekly overview: I resisted ' + res + ', I did it ' + did }, days.map((x) => h('div', { class: 'bar-col' },
        h('div', { class: 'bar-stack', style: 'height:' + ((x.res + x.did) / max) * 100 + '%' }, h('span', { class: 'seg seg-res', style: 'flex:' + x.res }), h('span', { class: 'seg seg-did', style: 'flex:' + x.did })),
        h('span', { class: 'bar-label' }, x.label)))),
      h('ul', { class: 'legend' }, h('li', {}, h('span', { class: 'sw seg-res' }), 'I resisted (' + res + ')'), h('li', {}, h('span', { class: 'sw seg-did' }), 'I did it (' + did + ')')),
      h('p', { class: 'small' }, 'The numbers are not a performance. They only help you see that things are moving. No "streak" is being broken.'),
      last ? h('button', { class: 'linklike', type: 'button', onclick: () => { d.compulsions.pop(); save(); msg = null; render(); } }, 'Delete the last entry') : null,
      h('p', { class: 'small' }, 'Compulsions follow obsessions. ', h('a', { href: '/aplikace/obsese' }, 'Log an obsession'))),
  ].filter(Boolean));
}

if (gate(root)) render();
