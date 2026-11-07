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
  'Zapísané. Myšlienka prišla, ale to neznamená, že je pravdivá alebo dôležitá. Nemusíte ju ďalej riešiť.',
  'Zapísané. Vtieravá myšlienka je len myšlienka. Môžete sa vrátiť k tomu, čo ste robili.',
  'Zapísané. Obsesia prišla, ale kompulziu robiť nemusíte. Keď sa ozve nutkanie, zapíšte ho v trackeri kompulzií.',
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
    out.push({ t, label: new Date(t).toLocaleDateString('sk-SK', { weekday: 'short' }), obs: obs.length, nov: obs.filter((x) => x.repeat === false).length, rep: obs.filter((x) => x.repeat === true).length, level: avg(obs), cmp: inDay(d.compulsions, k).length });
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
  const novelty = h('fieldset', { class: 'chips' }, h('legend', {}, 'Je to nová téma, alebo sa opakuje?'), [['new', 'Nová téma', !isRepeat], ['repeat', 'Opakuje sa', isRepeat]].map(([v, l, on]) => {
    const r = h('input', { type: 'radio', name: 'obs-novelty', value: v, checked: on });
    r.addEventListener('change', () => { repeat = v === 'repeat'; });
    return h('label', { class: 'chip' }, r, h('span', {}, l));
  }), h('p', { class: 'hint' }, 'Predvybrané podľa vašich skorších záznamov, môžete zmeniť.'));

  const select = h('select', { id: 'obs-topic' },
    h('option', { value: 'other' }, 'Iné alebo neviem'),
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
      h('h2', {}, 'Čo sa práve objavilo?'),
      h('div', { class: 'field' }, h('label', { for: 'obs-topic' }, 'Téma obsesie'), select),
      novelty,
      slider('obs-int', 'Ako silná bola úzkosť alebo nátlak?', '0 = žiadna, 10 = najsilnejšia', 5),
      h('div', { class: 'big-actions' }, h('button', { class: 'btn big', type: 'button', onclick: log }, 'Zapísať obsesiu')),
      msg ? h('p', { class: 'banner banner-soft', role: 'status' }, msg) : null,
      h('p', { class: 'small' }, 'Zapisujte len krátko. Zápis nemá nahradiť rozoberanie myšlienky, nemusíte hľadať jej príčinu ani odpoveď.')),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Dnes'),
      h('p', {}, 'Zapísané obsesie: ', h('strong', {}, String(today.obs))),
      today.level == null ? null : h('p', {}, 'Priemerná sila: ', h('strong', {}, Math.round(today.level) + ' / 10')),
      today.obs ? h('p', {}, 'Nové témy: ', h('strong', {}, String(today.nov)), ', opakujúce sa: ', h('strong', {}, String(today.rep))) : null,
      h('p', {}, 'Zapísané kompulzie: ', h('strong', {}, String(today.cmp)))),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Posledných 7 dní: obsesie a kompulzie'),
      h('div', { class: 'bars', role: 'img', 'aria-label': 'Týždenný prehľad: obsesie ' + obsWeek + ', kompulze ' + cmpWeek }, week.map((x) => h('div', { class: 'bar-col' },
        h('div', { class: 'bar-pair' },
          h('div', { class: 'bar-stack', style: 'height:' + (x.obs / max) * 100 + '%' }, h('span', { class: 'seg seg-new', style: 'flex:' + x.nov }), h('span', { class: 'seg seg-obs', style: 'flex:' + x.rep }), h('span', { class: 'seg seg-unk', style: 'flex:' + (x.obs - x.nov - x.rep) })),
          h('div', { class: 'bar-stack bar-cmp', style: 'height:' + (x.cmp / max) * 100 + '%' })),
        h('span', { class: 'bar-label' }, x.label)))),
      h('ul', { class: 'legend' }, h('li', {}, h('span', { class: 'sw seg-new' }), 'Nová téma (' + newWeek + ')'), h('li', {}, h('span', { class: 'sw seg-obs' }), 'Opakujúca sa téma (' + repWeek + ')'), unkWeek ? h('li', {}, h('span', { class: 'sw seg-unk' }), 'Bez určenia (' + unkWeek + ')') : null, h('li', {}, h('span', { class: 'sw seg-did' }), 'Kompulzie (' + cmpWeek + ')')),
      h('p', { class: 'small' }, 'Kompulzie nadväzujú na obsesie. Čísla nie sú výkon, slúžia len na to, aby ste videli súvislosti a že sa veci hýbu.'),
      h('a', { class: 'btn btn-ghost', href: '/aplikace/kompulze' }, 'Tracker kompulzií')),
    fortnight.some((x) => x.level != null)
      ? h('div', { class: 'card app-card' },
        h('h3', {}, 'Sila obsesií za 14 dní'),
        lineChart([{ name: 'Priemerná sila za deň', cls: 's-peak', values: fortnight.map((x) => x.level) }], fortnight.map((x) => fmtDate(x.t)), 'Priemerná denná sila obsesií za posledných 14 dní'),
        h('p', { class: 'small' }, 'Dni bez záznamu zostávajú prázdne.'))
      : null,
    last ? h('button', { class: 'linklike', type: 'button', onclick: () => { d.obsessions.pop(); save(); msg = null; render(); } }, 'Vymazať posledný záznam') : null,
  ].filter(Boolean));
}

if (gate(root)) render();
