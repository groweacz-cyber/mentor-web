// Expoziční deník: výběr expozice, časovač 10–15 minut, záznam, graf a nabídka posunu o stupeň výš.
import { data, save, uid, latestAssessment, dayKey, fmtDate } from './store.js';
import { h, boot, gate, slider, lineChart, $ } from './ui.js';
import { buildLadder, recommendedStart } from './data.js';

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
  const items = buildLadder(latestAssessment());
  return { d, items };
}

function setup(note) {
  const { d, items } = ladder();
  if (!items.length) {
    root.replaceChildren(h('div', { class: 'card app-card' }, h('h2', {}, 'Ladder first'), h('p', {}, 'The diary needs the themes from the questionnaire.'), h('a', { class: 'btn', href: '/aplikace/start' }, 'Fill in the questionnaire')));
    return;
  }
  const want = new URLSearchParams(location.search).get('t');
  const rec = recommendedStart(items, d.progress.done);
  const pre = [want, d.progress.active, rec && rec.id].find((id) => id && items.some((i) => i.id === id)) || items[0].id;
  const sel = h('select', { id: 'tema' }, items.map((i) => h('option', { value: i.id, selected: i.id === pre }, i.name + ' (' + i.score + '/10)')));
  const desc = h('input', { type: 'text', id: 'popis', maxlength: 140, placeholder: 'E.g. I touch a door handle and do not wash my hands' });
  const before = slider('pred', 'Anxiety before starting', '', 0);
  const dur = h('fieldset', { class: 'chips' }, h('legend', {}, 'Length'), [10, 15].map((m) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'dur', value: m, checked: m === 15 }), h('span', {}, m + ' minutes'))));
  const start = () => {
    d.timer = { status: 'running', topicId: sel.value, desc: desc.value.trim(), before: +before.querySelector('input').value, durationMs: +dur.querySelector('input:checked').value * 60000, startedAt: Date.now(), pausedAt: null, paused: 0 };
    save();
    view();
  };
  root.replaceChildren(...[
    note ? h('p', { class: 'banner banner-ok', role: 'status' }, note) : null,
    suggestion(),
    h('div', { class: 'card app-card' },
      h('h2', {}, 'New exposure'),
      h('div', { class: 'field' }, h('label', { for: 'tema' }, 'Theme'), sel),
      h('div', { class: 'field' }, h('label', { for: 'popis' }, 'What you will expose yourself to ', h('span', { class: 'hint' }, 'Max. 140 characters.')), desc),
      before, dur,
      h('p', { class: 'callout-inline' }, 'During an exposure without protection: no reassurance, no checking and no music to drown out the anxiety. The fear is allowed to be present.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: start }, 'Start'))),
    history()].filter(Boolean));
}

function timerView() {
  const d = data();
  const t = d.timer;
  const items = buildLadder(latestAssessment());
  const topic = (items.find((i) => i.id === t.topicId) || { name: 'Theme' }).name;
  const clock = h('div', { class: 'clock', role: 'timer', 'aria-live': 'off' });
  const ring = h('div', { class: 'timer' }, clock);
  const pauseBtn = h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => {
    if (t.pausedAt) { t.paused += Date.now() - t.pausedAt; t.pausedAt = null; t.status = 'running'; } else { t.pausedAt = Date.now(); t.status = 'paused'; }
    save(); paint();
  } }, 'Pause');
  const finish = () => { clearInterval(tick); t.status = 'finished'; t.finishedAt = Date.now(); t.pausedAt = null; save(); view(); };
  function paint() {
    const left = t.durationMs - elapsed(t);
    clock.textContent = mmss(left);
    ring.style.setProperty('--pct', Math.min(100, Math.max(0, (100 * elapsed(t)) / t.durationMs)) + '%');
    pauseBtn.textContent = t.pausedAt ? 'Continue' : 'Pause';
    if (left <= 0) finish();
  }
  root.replaceChildren(h('div', { class: 'card app-card center' },
    h('p', { class: 'eyebrow' }, topic), h('p', {}, t.desc || 'Exposure'), ring,
    h('p', { class: 'hint' }, 'Stay in the fear without protection. The anxiety is allowed to be there; you carry on.'),
    h('div', { class: 'actions center' }, pauseBtn, h('button', { class: 'btn btn-ghost', type: 'button', onclick: finish }, 'End early'))));
  clearInterval(tick);
  tick = setInterval(paint, 500);
  paint();
}

function recordView() {
  const { d, items } = ladder();
  const t = d.timer;
  const topic = items.find((i) => i.id === t.topicId);
  const peak = slider('vrchol', 'Highest anxiety during the exposure', '', 0);
  const after = slider('po', 'Anxiety after it ends (after 15 minutes)', '', 0);
  const did = h('input', { type: 'text', id: 'udelal', maxlength: 140 });
  const urge = h('fieldset', { class: 'chips' }, h('legend', {}, 'Did you feel like doing a compulsion?'), [['ano', 'Ano'], ['ne', 'Ne']].map(([v, l]) => h('label', { class: 'chip' }, h('input', { type: 'radio', name: 'urge', value: v, checked: v === 'ne' }), h('span', {}, l))));
  const save1 = () => {
    d.exposures.push({ id: uid(), at: t.startedAt, topicId: t.topicId, topicName: topic ? topic.name : '', desc: t.desc, before: t.before, peak: +peak.querySelector('input').value, after: +after.querySelector('input').value, urge: urge.querySelector('input:checked').value === 'ano', did: did.value.trim(), minutes: Math.round(Math.min(t.durationMs, elapsed(t, t.finishedAt || Date.now())) / 60000) });
    d.timer = null;
    save();
    setup('Saved. You managed it without protection, and that counts.');
  };
  root.replaceChildren(h('div', { class: 'card app-card' },
    h('h2', {}, 'Time is up. Note it down briefly.'), peak, after, urge,
    h('div', { class: 'field' }, h('label', { for: 'udelal' }, 'What you did ', h('span', { class: 'hint' }, 'Max. 140 characters, key words are enough.')), did),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: save1 }, 'Save'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { d.timer = null; save(); setup(); } }, 'Discard'))));
}

// Návrh posunu: poslední 3 expozice u tématu mají maximum ≤ 3 a spadají do ≥ 3 různých dnů.
function suggestion() {
  const { d, items } = ladder();
  d.progress.dismissed = d.progress.dismissed || {};
  const last = d.exposures[d.exposures.length - 1];
  if (!last) return null;
  const same = d.exposures.filter((e) => e.topicId === last.topicId).slice(-3);
  const ok = same.length === 3 && same.every((e) => e.peak <= 3) && new Set(same.map((e) => dayKey(e.at))).size >= 3;
  if (!ok || d.progress.dismissed[last.topicId] === last.at || d.progress.done.includes(last.topicId)) return null;
  const move = () => {
    d.progress.done.push(last.topicId);
    const idx = items.findIndex((i) => i.id === last.topicId);
    const next = items.slice(idx + 1).find((i) => !d.progress.done.includes(i.id));
    d.progress.active = next ? next.id : null;
    save();
    setup(next ? 'Moved on. Next theme: ' + next.name + '.' : 'You have completed the whole ladder. Consider a new questionnaire.');
  };
  return h('div', { class: 'card app-card suggest' },
    h('h3', {}, 'Offer: a step up?'),
    h('p', {}, 'Peak anxiety was low several days in a row. You can try the next step. It is only a hint; you decide.'),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: move }, 'Move up a step'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { d.progress.dismissed[last.topicId] = last.at; save(); setup(); } }, 'Stay with this theme')));
}

function history() {
  const d = data();
  const ex = d.exposures.slice(-20);
  if (!ex.length) return null;
  const parts = [h('h2', {}, 'Progress')];
  parts.push(lineChart(
    [{ name: 'Before', cls: 's-before', values: ex.map((e) => e.before) }, { name: 'Peak', cls: 's-peak', values: ex.map((e) => e.peak) }, { name: 'After 15 min', cls: 's-after', values: ex.map((e) => e.after) }],
    ex.map((e) => fmtDate(e.at)), 'Progress of anxiety before the exposure, at its peak and after it, last ' + ex.length + ' entries'));
  parts.push(h('ul', { class: 'log' }, ex.slice(-5).reverse().map((e) => h('li', {}, h('strong', {}, fmtDate(e.at) + ' · ' + e.topicName), ' · maximum ' + e.peak + '/10' + (e.urge ? ' · urge for a compulsion' : '')))));
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
