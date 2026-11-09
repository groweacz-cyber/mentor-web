// Modul I-CBT (pop cesta): krátké lekce, cvičení „Na čem tahle pochybnost stojí?“, odpočet 4–8 týdnů.
import { data, save, uid, fmtDate } from './store.js';
import { h, boot, gate, $ } from './ui.js';
import { ICBT_LESSONS } from './data.js';

const root = $('#app-root');
boot(root);

function render(note) {
  const d = data();
  const ic = d.icbt;
  const parts = [];
  if (note) parts.push(h('p', { class: 'banner banner-ok', role: 'status' }, note));
  parts.push(h('p', { class: 'callout-inline' }, 'I-CBT je odborná metóda. Tu je len sprievodné porozumenie pochybnosti, nenahrádza prácu s odborníkom.'));

  // odpočet
  if (!ic.startedAt) {
    const sel = h('select', { id: 'wk' }, [4, 5, 6, 7, 8].map((w) => h('option', { value: w, selected: w === ic.weeks }, w + ' týždňov')));
    parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'Časový rámec'),
      h('p', {}, 'Pop cesta rátá so 4–8 týždňami stabilizácie a porozumenia. Potom sa prechádza k postupným expozíciám.'),
      h('div', { class: 'field' }, h('label', { for: 'wk' }, 'Koľko týždňov si dáte'), sel),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { ic.weeks = +sel.value; ic.startedAt = Date.now(); save(); render('Odpočet sa začal.'); } }, 'Začať odpočet'))));
  } else {
    const w = Math.floor((Date.now() - ic.startedAt) / (7 * 86400000)) + 1;
    const done = w > ic.weeks;
    parts.push(h('div', { class: 'card app-card' + (done ? ' suggest' : '') }, h('h2', {}, done ? 'Čas prejsť k expozíciám' : 'Týždeň ' + w + ' z ' + ic.weeks),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': ic.weeks, 'aria-valuenow': Math.min(w, ic.weeks), 'aria-label': 'Postup I-CBT fázy' }, h('span', { style: 'width:' + Math.min(100, (w / ic.weeks) * 100) + '%' })),
      h('p', {}, done ? 'Plánované týždne uplynuli. Skúste prejsť k postupným expozíciám. Je to nápoveda, tempo určujete vy.' : 'Keď odpočet dobehne, aplikácia vás vyzve na prechod k expozíciám.'),
      h('div', { class: 'actions' }, done ? h('a', { class: 'btn', href: '/aplikace/denik' }, 'Do denníka') : null,
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { ic.startedAt = null; save(); render(); } }, 'Zrušiť odpočet'))));
  }

  // lekce
  parts.push(h('h2', {}, 'Krátke lekcie'));
  parts.push(h('div', { class: 'lessons' }, ICBT_LESSONS.map((l, i) => h('details', { class: 'card app-card' }, h('summary', {}, (i + 1) + '. ' + l.t), h('p', {}, l.x)))));

  // cvičení
  const F = [
    ['q1', 'Pochybnosť (čo keby…)'],
    ['q2', 'Z čoho vychádza: z toho, čo som vnímal/a, alebo z predstavy?'],
    ['q3', 'Čo o tom viem z priamej skúsenosti?'],
    ['q4', 'Ako chcem žiť bez ohľadu na ňu?'],
  ].map(([k, l]) => ({ k, l, el: h('input', { type: 'text', id: k, maxlength: 140 }) }));
  parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'Na čom stojí táto pochybnosť?'),
    h('p', { class: 'hint' }, 'Krátko, max. 140 znakov na pole. Nejde o to nájsť istotu, ale rozlíšiť, odkiaľ pochybnosť pochádza.'),
    F.map((f) => h('div', { class: 'field' }, h('label', { for: f.k }, f.l), f.el)),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      const e = { id: uid(), at: Date.now() };
      F.forEach((f) => { e[f.k] = f.el.value.trim(); });
      if (!F.some((f) => e[f.k])) return;
      ic.notes.push(e);
      if (ic.notes.length > 20) ic.notes.shift();
      save();
      render('Zapísané. Viac nie je potrebné, choďte ďalej.');
    } }, 'Uložiť'))));
  if (ic.notes.length) parts.push(h('ul', { class: 'log' }, ic.notes.slice(-4).reverse().map((e) => h('li', {}, h('strong', {}, fmtDate(e.at)), ' · ' + (e.q1 || '–')))));
  root.replaceChildren(...parts);
}

if (gate(root)) render();
