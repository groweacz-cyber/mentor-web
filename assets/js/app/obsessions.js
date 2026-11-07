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
  'Zapsáno. Myšlenka přišla, ale to neznamená, že je pravdivá nebo důležitá. Nemusíte ji dál řešit.',
  'Zapsáno. Vtíravá myšlenka je jen myšlenka. Můžete se vrátit k tomu, co jste dělal/a.',
  'Zapsáno. Obsese přišla, ale kompulzi dělat nemusíte. Když se ozve nutkání, zapište ji v trackeru kompulzí.',
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
    out.push({ t, label: new Date(t).toLocaleDateString('cs-CZ', { weekday: 'short' }), obs: obs.length, level: avg(obs), cmp: inDay(d.compulsions, k).length });
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
    h('option', { value: 'other' }, 'Jiné nebo nevím'),
    TOPICS.map(([v, name]) => h('option', { value: v }, name)));
  select.value = topic;
  select.addEventListener('change', () => { topic = select.value; });

  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'Co se právě objevilo?'),
      h('div', { class: 'field' }, h('label', { for: 'obs-topic' }, 'Téma obsese'), select),
      slider('obs-int', 'Jak silná byla úzkost nebo nátlak?', '0 = žádná, 10 = nejsilnější', 5),
      h('div', { class: 'big-actions' }, h('button', { class: 'btn big', type: 'button', onclick: log }, 'Zapsat obsesi')),
      msg ? h('p', { class: 'banner banner-soft', role: 'status' }, msg) : null,
      h('p', { class: 'small' }, 'Zapisujte jen krátce. Zápis nemá nahradit rozebírání myšlenky, nemusíte hledat její příčinu ani odpověď.')),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Dnes'),
      h('p', {}, 'Zapsané obsese: ', h('strong', {}, String(today.obs))),
      today.level == null ? null : h('p', {}, 'Průměrná síla: ', h('strong', {}, Math.round(today.level) + ' / 10')),
      h('p', {}, 'Zapsané kompulze: ', h('strong', {}, String(today.cmp)))),
    h('div', { class: 'card app-card' },
      h('h3', {}, 'Posledních 7 dní: obsese a kompulze'),
      h('div', { class: 'bars', role: 'img', 'aria-label': 'Týdenní přehled: obsese ' + obsWeek + ', kompulze ' + cmpWeek }, week.map((x) => h('div', { class: 'bar-col' },
        h('div', { class: 'bar-pair' },
          h('div', { class: 'bar-stack bar-obs', style: 'height:' + (x.obs / max) * 100 + '%' }),
          h('div', { class: 'bar-stack bar-cmp', style: 'height:' + (x.cmp / max) * 100 + '%' })),
        h('span', { class: 'bar-label' }, x.label)))),
      h('ul', { class: 'legend' }, h('li', {}, h('span', { class: 'sw seg-obs' }), 'Obsese (' + obsWeek + ')'), h('li', {}, h('span', { class: 'sw seg-did' }), 'Kompulze (' + cmpWeek + ')')),
      h('p', { class: 'small' }, 'Kompulze navazují na obsese. Čísla nejsou výkon, slouží jen k tomu, abyste viděli souvislosti a že se věci hýbou.'),
      h('a', { class: 'btn btn-ghost', href: '/aplikace/kompulze' }, 'Tracker kompulzí')),
    fortnight.some((x) => x.level != null)
      ? h('div', { class: 'card app-card' },
        h('h3', {}, 'Síla obsesí za 14 dní'),
        lineChart([{ name: 'Průměrná síla za den', cls: 's-peak', values: fortnight.map((x) => x.level) }], fortnight.map((x) => fmtDate(x.t)), 'Průměrná denní síla obsesí za posledních 14 dní'),
        h('p', { class: 'small' }, 'Dny bez záznamu zůstávají prázdné.'))
      : null,
    last ? h('button', { class: 'linklike', type: 'button', onclick: () => { d.obsessions.pop(); save(); msg = null; render(); } }, 'Smazat poslední záznam') : null,
  ].filter(Boolean));
}

if (gate(root)) render();
