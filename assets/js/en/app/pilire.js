// Týdenní hodnocení sebepřijetí a sebedůvěry 0–10 s grafem.
import { data, save, weekKey, fmtDate } from './store.js';
import { h, boot, gate, slider, lineChart, $ } from './ui.js';

const root = $('#app-root');
boot(root);

function render(note) {
  const d = data();
  const key = weekKey(Date.now());
  const cur = d.weeks.find((w) => w.key === key);
  const a = slider('wa', 'Self-acceptance', '– 0 = I do not accept myself at all, 10 = I accept myself completely', cur ? cur.accept : 5);
  const b = slider('wb', 'Self-trust', '– 0 = I do not believe I can cope with difficulties, 10 = I believe that when a difficulty comes, I will find a way to deal with it', cur ? cur.trust : 5);
  const parts = [];
  if (note) parts.push(h('p', { class: 'banner banner-ok', role: 'status' }, note));
  parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'This week'),
    h('p', { class: 'hint' }, 'Once a week and a rough estimate are enough. The number is only a guide, not a grade.'), a, b,
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      const rec = { key, at: Date.now(), accept: +a.querySelector('input').value, trust: +b.querySelector('input').value };
      const i = d.weeks.findIndex((w) => w.key === key);
      if (i >= 0) d.weeks[i] = rec; else d.weeks.push(rec);
      save();
      render('Saved.');
    } }, cur ? 'Update' : 'Save'))));
  if (d.weeks.length > 1) {
    const ws = d.weeks.slice(-16);
    parts.push(h('h2', {}, 'Progress'));
    parts.push(lineChart([{ name: 'Self-acceptance', cls: 's-acc', values: ws.map((w) => w.accept) }, { name: 'Self-trust', cls: 's-trust', values: ws.map((w) => w.trust) }], ws.map((w) => fmtDate(w.at)), 'Weekly progress of self-acceptance and self-trust'));
  }
  root.replaceChildren(...parts);
}

if (gate(root)) render();
