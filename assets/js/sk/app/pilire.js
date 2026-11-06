// Týdenní hodnocení sebepřijetí a sebedůvěry 0–10 s grafem.
import { data, save, weekKey, fmtDate } from './store.js';
import { h, boot, gate, slider, lineChart, $ } from './ui.js';

const root = $('#app-root');
boot(root);

function render(note) {
  const d = data();
  const key = weekKey(Date.now());
  const cur = d.weeks.find((w) => w.key === key);
  const a = slider('wa', 'Sebaprijatie', '– 0 = neprijímam sa vôbec, 10 = prijímam sa celý/celá', cur ? cur.accept : 5);
  const b = slider('wb', 'Sebadôvera', '– 0 = neverím, že si s ťažkosťami poradím, 10 = verím, že keď príde ťažkosť, nájdem spôsob, ako ju riešiť', cur ? cur.trust : 5);
  const parts = [];
  if (note) parts.push(h('p', { class: 'banner banner-ok', role: 'status' }, note));
  parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'Tento týždeň'),
    h('p', { class: 'hint' }, 'Stačí raz týždenne a hrubý odhad. Číslo je len orientácia, nie známka.'), a, b,
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      const rec = { key, at: Date.now(), accept: +a.querySelector('input').value, trust: +b.querySelector('input').value };
      const i = d.weeks.findIndex((w) => w.key === key);
      if (i >= 0) d.weeks[i] = rec; else d.weeks.push(rec);
      save();
      render('Uložené.');
    } }, cur ? 'Aktualizovať' : 'Uložiť'))));
  if (d.weeks.length > 1) {
    const ws = d.weeks.slice(-16);
    parts.push(h('h2', {}, 'Vývoj'));
    parts.push(lineChart([{ name: 'Sebaprijatie', cls: 's-acc', values: ws.map((w) => w.accept) }, { name: 'Sebadôvera', cls: 's-trust', values: ws.map((w) => w.trust) }], ws.map((w) => fmtDate(w.at)), 'Týždenný vývoj sebaprijatia a sebadôvery'));
  }
  root.replaceChildren(...parts);
}

if (gate(root)) render();
