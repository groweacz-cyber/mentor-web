// Týdenní hodnocení sebepřijetí a sebedůvěry 0–10 s grafem.
import { data, save, weekKey, fmtDate } from './store.js';
import { h, boot, gate, slider, lineChart, $ } from './ui.js';

const root = $('#app-root');
boot(root);

function render(note) {
  const d = data();
  const key = weekKey(Date.now());
  const cur = d.weeks.find((w) => w.key === key);
  const a = slider('wa', 'Sebepřijetí', '– 0 = nepřijímám se vůbec, 10 = přijímám se celý/celá', cur ? cur.accept : 5);
  const b = slider('wb', 'Sebedůvěra', '– 0 = nevěřím, že si s obtížemi poradím, 10 = věřím, že když přijde obtíž, najdu způsob, jak ji řešit', cur ? cur.trust : 5);
  const parts = [];
  if (note) parts.push(h('p', { class: 'banner banner-ok', role: 'status' }, note));
  parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'Tento týden'),
    h('p', { class: 'hint' }, 'Stačí jednou týdně a hrubý odhad. Číslo je jen orientace, ne známka.'), a, b,
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      const rec = { key, at: Date.now(), accept: +a.querySelector('input').value, trust: +b.querySelector('input').value };
      const i = d.weeks.findIndex((w) => w.key === key);
      if (i >= 0) d.weeks[i] = rec; else d.weeks.push(rec);
      save();
      render('Uloženo.');
    } }, cur ? 'Aktualizovat' : 'Uložit'))));
  if (d.weeks.length > 1) {
    const ws = d.weeks.slice(-16);
    parts.push(h('h2', {}, 'Vývoj'));
    parts.push(lineChart([{ name: 'Sebepřijetí', cls: 's-acc', values: ws.map((w) => w.accept) }, { name: 'Sebedůvěra', cls: 's-trust', values: ws.map((w) => w.trust) }], ws.map((w) => fmtDate(w.at)), 'Týdenní vývoj sebepřijetí a sebedůvěry'));
  }
  root.replaceChildren(...parts);
}

if (gate(root)) render();
