// Expoziční deník: výběr expozice, časovač 10–15 minut, záznam, graf a nabídka posunu o stupeň výš.
import { data, save, uid, fmtDate } from './store.js';
import { h, boot, gate, slider, lineChart, $ } from './ui.js';
import { TOPICS } from './data.js';

const root = $('#app-root');
boot(root);
let tick = null;

const mmss = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
const elapsed = (t, now = Date.now()) => now - t.startedAt - t.paused - (t.pausedAt ? now - t.pausedAt : 0);

function ladder() {
  const d = data();
  const items = TOPICS.map(([id, name]) => ({ id, name }));
  return { d, items };
}

function setup(note) {
  const { d, items } = ladder();
  const want = new URLSearchParams(location.search).get('t');
  const last = d.exposures[d.exposures.length - 1];
  const pre = [want, last && last.topicId].find((id) => id && items.some((i) => i.id === id)) || items[0].id;
  const sel = h('select', { id: 'tema' }, items.map((i) => h('option', { value: i.id, selected: i.id === pre }, i.name)));
  const desc = h('input', { type: 'text', id: 'popis', maxlength: 140, placeholder: 'Napr. dotknem sa kľučky a nebudem si umývať ruky' });
  const before = slider('pred', 'Úzkosť pred začiatkom', '', 0);
  const dur = h('fieldset', { class: 'chips' }, h('legend', {}, 'Dĺžka'), [10, 15].map((m) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'dur', value: m, checked: m === 15 }), h('span', {}, m + ' minút'))));
  const start = () => {
    d.timer = { status: 'running', topicId: sel.value, desc: desc.value.trim(), before: +before.querySelector('input').value, durationMs: +dur.querySelector('input:checked').value * 60000, startedAt: Date.now(), pausedAt: null, paused: 0 };
    save();
    view();
  };
  root.replaceChildren(...[
    note ? h('p', { class: 'banner banner-ok', role: 'status' }, note) : null,
    h('div', { class: 'card app-card' },
      h('h2', {}, 'Nová expozícia'),
      h('div', { class: 'field' }, h('label', { for: 'tema' }, 'Téma'), sel),
      h('div', { class: 'field' }, h('label', { for: 'popis' }, 'Čomu sa vystavíte ', h('span', { class: 'hint' }, 'Max. 140 znakov.')), desc),
      before, dur,
      h('p', { class: 'callout-inline' }, 'Počas expozície bez ochrany: žiadne uisťovanie, kontrola ani hudba na prehlušenie úzkosti. Strach smie byť prítomný.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: start }, 'Začať'))),
    history()].filter(Boolean));
}

function timerView() {
  const d = data();
  const t = d.timer;
  const { items } = ladder();
  const topic = (items.find((i) => i.id === t.topicId) || { name: 'Téma' }).name;
  const clock = h('div', { class: 'clock', role: 'timer', 'aria-live': 'off' });
  const ring = h('div', { class: 'timer' }, clock);
  const pauseBtn = h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => {
    if (t.pausedAt) { t.paused += Date.now() - t.pausedAt; t.pausedAt = null; t.status = 'running'; } else { t.pausedAt = Date.now(); t.status = 'paused'; }
    save(); paint();
  } }, 'Pozastaviť');
  const finish = () => { clearInterval(tick); t.status = 'finished'; t.finishedAt = Date.now(); t.pausedAt = null; save(); view(); };
  function paint() {
    const left = t.durationMs - elapsed(t);
    clock.textContent = mmss(left);
    ring.style.setProperty('--pct', Math.min(100, Math.max(0, (100 * elapsed(t)) / t.durationMs)) + '%');
    pauseBtn.textContent = t.pausedAt ? 'Pokračovať' : 'Pozastaviť';
    if (left <= 0) finish();
  }
  root.replaceChildren(h('div', { class: 'card app-card center' },
    h('p', { class: 'eyebrow' }, topic), h('p', {}, t.desc || 'Expozícia'), ring,
    h('p', { class: 'hint' }, 'Zostaňte v strachu bez ochrany. Úzkosť smie byť, vy konáte ďalej.'),
    h('div', { class: 'actions center' }, pauseBtn, h('button', { class: 'btn btn-ghost', type: 'button', onclick: finish }, 'Ukončiť skôr'))));
  clearInterval(tick);
  tick = setInterval(paint, 500);
  paint();
}

function recordView() {
  const { d, items } = ladder();
  const t = d.timer;
  const topic = items.find((i) => i.id === t.topicId);
  const peak = slider('vrchol', 'Najvyššia úzkosť počas expozície', '', 0);
  const after = slider('po', 'Úzkosť po skončení (po 15 minútach)', '', 0);
  const did = h('input', { type: 'text', id: 'udelal', maxlength: 140 });
  const urge = h('fieldset', { class: 'chips' }, h('legend', {}, 'Mali ste chuť na kompulziu?'), [['ano', 'Ano'], ['ne', 'Ne']].map(([v, l]) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'urge', value: v, checked: v === 'ne' }), h('span', {}, l))));
  const save1 = () => {
    d.exposures.push({ id: uid(), at: t.startedAt, topicId: t.topicId, topicName: topic ? topic.name : '', desc: t.desc, before: t.before, peak: +peak.querySelector('input').value, after: +after.querySelector('input').value, urge: urge.querySelector('input:checked').value === 'ano', did: did.value.trim(), minutes: Math.round(Math.min(t.durationMs, elapsed(t, t.finishedAt || Date.now())) / 60000) });
    d.timer = null;
    save();
    setup('Zapísané. Zvládli ste to bez ochrany a to sa počíta.');
  };
  root.replaceChildren(h('div', { class: 'card app-card' },
    h('h2', {}, 'Čas vypršal. Zapíšte to krátko.'), peak, after, urge,
    h('div', { class: 'field' }, h('label', { for: 'udelal' }, 'Čo ste robili ', h('span', { class: 'hint' }, 'Max. 140 znakov, stačí heslovito.')), did),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: save1 }, 'Uložiť'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { d.timer = null; save(); setup(); } }, 'Zahodiť'))));
}

function history() {
  const d = data();
  const ex = d.exposures.slice(-20);
  if (!ex.length) return null;
  const parts = [h('h2', {}, 'Vývoj')];
  parts.push(lineChart(
    [{ name: 'Pred', cls: 's-before', values: ex.map((e) => e.before) }, { name: 'Maximum', cls: 's-peak', values: ex.map((e) => e.peak) }, { name: 'Po 15 min', cls: 's-after', values: ex.map((e) => e.after) }],
    ex.map((e) => fmtDate(e.at)), 'Vývoj úzkosti pred expozíciou, v maxime a po nej, posledných ' + ex.length + ' záznamov'));
  parts.push(h('ul', { class: 'log' }, ex.slice(-5).reverse().map((e) => h('li', {}, h('strong', {}, fmtDate(e.at) + ' · ' + e.topicName), ' · maximum ' + e.peak + '/10' + (e.urge ? ' · chuť na kompulziu' : '')))));
  return h('div', {}, parts);
}

function view() {
  clearInterval(tick);
  const t = data().timer;
  if (t && t.status === 'finished') recordView();
  else if (t) timerView();
  else setup();
}

if (gate(root)) view();
