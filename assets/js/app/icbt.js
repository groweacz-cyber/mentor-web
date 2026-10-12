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
  parts.push(h('p', { class: 'callout-inline' }, 'I-CBT je odborná metoda. Tady je jen doprovodné porozumění pochybnosti, nenahrazuje práci s odborníkem.'));

  // odpočet
  if (!ic.startedAt) {
    const sel = h('select', { id: 'wk' }, [4, 5, 6, 7, 8].map((w) => h('option', { value: w, selected: w === ic.weeks }, w + ' týdnů')));
    parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'Časový rámec'),
      h('p', {}, 'Pop cesta počítá se 4–8 týdny stabilizace a porozumění. Pak se přechází k postupným expozicím.'),
      h('div', { class: 'field' }, h('label', { for: 'wk' }, 'Kolik týdnů si dáte'), sel),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { ic.weeks = +sel.value; ic.startedAt = Date.now(); save(); render('Odpočet začal.'); } }, 'Zahájit odpočet'))));
  } else {
    const w = Math.floor((Date.now() - ic.startedAt) / (7 * 86400000)) + 1;
    const done = w > ic.weeks;
    parts.push(h('div', { class: 'card app-card' + (done ? ' suggest' : '') }, h('h2', {}, done ? 'Čas přejít k expozicím' : 'Týden ' + w + ' z ' + ic.weeks),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': ic.weeks, 'aria-valuenow': Math.min(w, ic.weeks), 'aria-label': 'Postup I-CBT fáze' }, h('span', { style: 'width:' + Math.min(100, (w / ic.weeks) * 100) + '%' })),
      h('p', {}, done ? 'Plánované týdny uplynuly. Zkuste přejít k postupným expozicím. Je to nápověda, tempo určujete vy.' : 'Až odpočet doběhne, aplikace vás vyzve k přechodu na expozice.'),
      h('div', { class: 'actions' }, done ? h('a', { class: 'btn', href: '/aplikace/zebricek' }, 'K žebříčku') : null,
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { ic.startedAt = null; save(); render(); } }, 'Zrušit odpočet'))));
  }

  // lekce
  parts.push(h('h2', {}, 'Krátké lekce'));
  parts.push(h('div', { class: 'lessons' }, ICBT_LESSONS.map((l, i) => h('details', { class: 'card app-card' }, h('summary', {}, (i + 1) + '. ' + l.t), h('p', {}, l.x)))));

  // cvičení
  const F = [
    ['q1', 'Pochybnost (co kdyby…)'],
    ['q2', 'Z čeho vychází: z toho, co jsem vnímal/a, nebo z představy?'],
    ['q3', 'Co o tom vím z přímé zkušenosti?'],
    ['q4', 'Jak chci žít bez ohledu na ni?'],
  ].map(([k, l]) => ({ k, l, el: h('input', { type: 'text', id: k, maxlength: 140 }) }));
  parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'Na čem tahle pochybnost stojí?'),
    h('p', { class: 'hint' }, 'Krátce, max. 140 znaků na pole. Nejde o to najít jistotu, ale rozlišit, odkud pochybnost pochází.'),
    F.map((f) => h('div', { class: 'field' }, h('label', { for: f.k }, f.l), f.el)),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      const e = { id: uid(), at: Date.now() };
      F.forEach((f) => { e[f.k] = f.el.value.trim(); });
      if (!F.some((f) => e[f.k])) return;
      ic.notes.push(e);
      if (ic.notes.length > 20) ic.notes.shift();
      save();
      render('Zapsáno. Víc není potřeba, jděte dál.');
    } }, 'Uložit'))));
  if (ic.notes.length) parts.push(h('ul', { class: 'log' }, ic.notes.slice(-4).reverse().map((e) => h('li', {}, h('strong', {}, fmtDate(e.at)), ' · ' + (e.q1 || '–')))));
  root.replaceChildren(...parts);
}

if (gate(root)) render();
