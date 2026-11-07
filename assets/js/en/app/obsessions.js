// Tracker obsesí: rychlý denní záznam (téma a síla), dnešní souhrn, týdenní srovnání s kompulzemi a vývoj síly.
import { data, save, uid, dayKey, fmtDate } from './store.js';
import { h, boot, gate, slider, lineChart, $ } from './ui.js';
import { TOPICS } from './data.js';

const root = $('#app-root');
boot(root);
let topic = 'other';
let repeat = null; // null = předvybrat podle dřívějších záznamů
let msg = null;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const MSG_LOGGED = [
  'Logged. The thought came, but that does not mean it is true or important. You do not have to keep dealing with it.',
  'Logged. An intrusive thought is just a thought. You can go back to what you were doing.',
  'Logged. The obsession came, but you do not have to do the compulsion. If an urge appears, log it in the compulsion tracker.',
];

const inDay = (list, k) => list.filter((x) => dayKey(x.at) === k);
// Téma se považuje za opakující se, pokud už bylo zapsáno v některý dřívější den (u „Jiné nebo nevím“ to nelze poznat).
function seenBefore(t) {
  if (t === 'other') return false;
  const k = dayKey(Date.now());
  return data().obsessions.some((x) => x.topic === t && dayKey(x.at) !== k);
}
const avg = (list) => (list.length ? list.reduce((s, x) => s + x.intensity, 0) / list.length : null);

function days(n) {
  const d = data();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const t = Date.now() - i * 86400000;
    const k = dayKey(t);
    const obs = inDay(d.obsessions, k);
    out.push({ t, label: new Date(t).toLocaleDateString('en-GB', { weekday: 'short' }), obs: obs.length, nov: obs.filter((x) => x.repeat === false).length, rep: obs.filter((x) => x.repeat === true).length, level: avg(obs), cmp: inDay(d.compulsions, k).length });
  }
  return out;
}

function log() {
  const input = $('#obs-int');
  const intensity = input ? Number(input.value) : 5;
  const d = data();
  d.obsessions.push({ id: uid(), at: Date.now(), topic, intensity, repeat: repeat == null ? seenBefore(topic) : repeat });
  save();
  msg = pick(MSG_LOGGED);
  repeat = null;
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
  const newWeek = week.reduce((s, x) => s + x.nov, 0);
  const repWeek = week.reduce((s, x) => s + x.rep, 0);
  const unkWeek = obsWeek - newWeek - repWeek;
  const last = d.obsessions[d.obsessions.length - 1];

  const isRepeat = repeat == null ? seenBefore(topic) : repeat;
  const novelty = h('fieldset', { class: 'chips' }, h('legend', {}, 'Is this a new theme or a recurring one?'), [['new', 'New theme', !isRepeat], ['repeat', 'Recurring', isRepeat]].map(([v, l, on]) => {
    const r = h('input', { type: 'radio', name: 'obs-novelty', value: v, checked: on });
    r.addEventListener('change', () => { repeat = v === 'repeat'; });
    return h('label', { class: 'chip' }, r, h('span', {}, l));
  }), h('p', { class: 'hint' }, 'Pre-selected from your earlier records; you can change it.'));

  const select = h('select', { id: 'obs-topic' },
    h('option', { value: 'other' }, 'Other or not sure'),
    TOPICS.map(([v, name]) => h('option', { value: v }, name)));
  select.value = topic;
  select.addEventListener('change', () => {
    topic = select.value;
    repeat = null;
    const r = seenBefore(topic);
    const box = root.querySelector('input[name="obs-novelty"][value="' + (r ? 'repeat' : 'new') + '"]');
    if (box) box.checked = true;
  });

  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'What just came up?'),
      h('div', { class: 'field' }, h('label', { for: 'obs-topic' }, 'Obsession theme'), select),
      novelty,
      slider('obs-int', 'How strong was the anxiety or pressure?', '0 = none, 10 = strongest', 5),
      h('div', { class: 'big-actions' }, h('button', { class: 'btn big', type: 'button', onclick: log }, 'Log an obsession')),
      msg ? h('p', { class: 'banner banner-soft', role: 'status' }, msg) : null,
      h('p', { class: 'small' }, 'Keep it short. Logging is not meant to replace analysing the thought; you do not need to look for its cause or an answer.')),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Today'),
      h('p', {}, 'Obsessions logged: ', h('strong', {}, String(today.obs))),
      today.level == null ? null : h('p', {}, 'Average strength: ', h('strong', {}, Math.round(today.level) + ' / 10')),
      today.obs ? h('p', {}, 'New themes: ', h('strong', {}, String(today.nov)), ', recurring: ', h('strong', {}, String(today.rep))) : null,
      h('p', {}, 'Compulsions logged: ', h('strong', {}, String(today.cmp)))),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Last 7 days: obsessions and compulsions'),
      h('div', { class: 'bars', role: 'img', 'aria-label': 'Weekly overview: obsessions ' + obsWeek + ', kompulze ' + cmpWeek }, week.map((x) => h('div', { class: 'bar-col' },
        h('div', { class: 'bar-pair' },
          h('div', { class: 'bar-stack', style: 'height:' + (x.obs / max) * 100 + '%' }, h('span', { class: 'seg seg-new', style: 'flex:' + x.nov }), h('span', { class: 'seg seg-obs', style: 'flex:' + x.rep }), h('span', { class: 'seg seg-unk', style: 'flex:' + (x.obs - x.nov - x.rep) })),
          h('div', { class: 'bar-stack bar-cmp', style: 'height:' + (x.cmp / max) * 100 + '%' })),
        h('span', { class: 'bar-label' }, x.label)))),
      h('ul', { class: 'legend' }, h('li', {}, h('span', { class: 'sw seg-new' }), 'New theme (' + newWeek + ')'), h('li', {}, h('span', { class: 'sw seg-obs' }), 'Recurring theme (' + repWeek + ')'), unkWeek ? h('li', {}, h('span', { class: 'sw seg-unk' }), 'Not specified (' + unkWeek + ')') : null, h('li', {}, h('span', { class: 'sw seg-did' }), 'Compulsions (' + cmpWeek + ')')),
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
