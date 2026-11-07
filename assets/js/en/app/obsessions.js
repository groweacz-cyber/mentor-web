// Tracker obsesí: rychlý denní záznam (téma a síla), dnešní souhrn, týdenní srovnání s kompulzemi a vývoj síly.
import { data, save, uid, dayKey, fmtDate } from './store.js';
import { h, boot, gate, slider, lineChart, $ } from './ui.js';
import { TOPICS } from './data.js';

const root = $('#app-root');
boot(root);
let topic = 'other';
let msg = null;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const MSG_LOGGED = [
  'Logged. The thought came, but that does not mean it is true or important. You do not have to keep dealing with it.',
  'Logged. An intrusive thought is just a thought. You can go back to what you were doing.',
  'Logged. The obsession came, but you do not have to do the compulsion. If an urge appears, log it in the compulsion tracker.',
];

const inDay = (list, k) => list.filter((x) => dayKey(x.at) === k);
const avg = (list) => (list.length ? list.reduce((s, x) => s + x.intensity, 0) / list.length : null);

function days(n) {
  const d = data();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const t = Date.now() - i * 86400000;
    const k = dayKey(t);
    const obs = inDay(d.obsessions, k);
    out.push({ t, label: new Date(t).toLocaleDateString('en-GB', { weekday: 'short' }), obs: obs.length, level: avg(obs), cmp: inDay(d.compulsions, k).length });
  }
  return out;
}

function log() {
  const input = $('#obs-int');
  const intensity = input ? Number(input.value) : 5;
  const d = data();
  d.obsessions.push({ id: uid(), at: Date.now(), topic, intensity });
  save();
  msg = pick(MSG_LOGGED);
  render();
}

function render() {
  const d = data();
  const week = days(7);
  const fortnight = days(14);
  const today = week[week.length - 1];
  const max = Math.max(1, ...week.map((x) => Math.max(x.obs, x.cmp)));
  const obsWeek = week.reduce((s, x) => s + x.obs, 0);
  const cmpWeek = week.reduce((s, x) => s + x.cmp, 0);
  const last = d.obsessions[d.obsessions.length - 1];

  const select = h('select', { id: 'obs-topic' },
    h('option', { value: 'other' }, 'Other or not sure'),
    TOPICS.map(([v, name]) => h('option', { value: v }, name)));
  select.value = topic;
  select.addEventListener('change', () => { topic = select.value; });

  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'What just came up?'),
      h('div', { class: 'field' }, h('label', { for: 'obs-topic' }, 'Obsession theme'), select),
      slider('obs-int', 'How strong was the anxiety or pressure?', '0 = none, 10 = strongest', 5),
      h('div', { class: 'big-actions' }, h('button', { class: 'btn big', type: 'button', onclick: log }, 'Log an obsession')),
      msg ? h('p', { class: 'banner banner-soft', role: 'status' }, msg) : null,
      h('p', { class: 'small' }, 'Keep it short. Logging is not meant to replace analysing the thought; you do not need to look for its cause or an answer.')),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Today'),
      h('p', {}, 'Obsessions logged: ', h('strong', {}, String(today.obs))),
      today.level == null ? null : h('p', {}, 'Average strength: ', h('strong', {}, Math.round(today.level) + ' / 10')),
      h('p', {}, 'Compulsions logged: ', h('strong', {}, String(today.cmp)))),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Last 7 days: obsessions and compulsions'),
      h('div', { class: 'bars', role: 'img', 'aria-label': 'Weekly overview: obsessions ' + obsWeek + ', kompulze ' + cmpWeek }, week.map((x) => h('div', { class: 'bar-col' },
        h('div', { class: 'bar-pair' },
          h('div', { class: 'bar-stack bar-obs', style: 'height:' + (x.obs / max) * 100 + '%' }),
          h('div', { class: 'bar-stack bar-cmp', style: 'height:' + (x.cmp / max) * 100 + '%' })),
        h('span', { class: 'bar-label' }, x.label)))),
      h('ul', { class: 'legend' }, h('li', {}, h('span', { class: 'sw seg-obs' }), 'Obsessions (' + obsWeek + ')'), h('li', {}, h('span', { class: 'sw seg-did' }), 'Compulsions (' + cmpWeek + ')')),
      h('p', { class: 'small' }, 'Compulsions follow obsessions. The numbers are not a performance; they only help you see connections and that things are moving.'),
      h('a', { class: 'btn btn-ghost', href: '/aplikace/kompulze' }, 'Compulsion tracker')),
    fortnight.some((x) => x.level != null)
      ? h('div', { class: 'card app-card' },
        h('h3', {}, 'Strength of obsessions over 14 days'),
        lineChart([{ name: 'Average strength per day', cls: 's-peak', values: fortnight.map((x) => x.level) }], fortnight.map((x) => fmtDate(x.t)), 'Average daily strength of obsessions over the last 14 days'),
        h('p', { class: 'small' }, 'Days without a record stay empty.'))
      : null,
    last ? h('button', { class: 'linklike', type: 'button', onclick: () => { d.obsessions.pop(); save(); msg = null; render(); } }, 'Delete the last entry') : null,
  ].filter(Boolean));
}

if (gate(root)) render();
