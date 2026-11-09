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
  parts.push(h('p', { class: 'callout-inline' }, 'I-CBT is a professional method. This is only an accompanying understanding of doubt and does not replace work with a professional.'));

  // odpočet
  if (!ic.startedAt) {
    const sel = h('select', { id: 'wk' }, [4, 5, 6, 7, 8].map((w) => h('option', { value: w, selected: w === ic.weeks }, w + ' weeks')));
    parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'Time frame'),
      h('p', {}, 'The Pop path counts on 4–8 weeks of stabilisation and understanding. Then you move on to gradual exposures.'),
      h('div', { class: 'field' }, h('label', { for: 'wk' }, 'How many weeks you will give it'), sel),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { ic.weeks = +sel.value; ic.startedAt = Date.now(); save(); render('The countdown has started.'); } }, 'Start the countdown'))));
  } else {
    const w = Math.floor((Date.now() - ic.startedAt) / (7 * 86400000)) + 1;
    const done = w > ic.weeks;
    parts.push(h('div', { class: 'card app-card' + (done ? ' suggest' : '') }, h('h2', {}, done ? 'Time to move on to exposures' : 'Week ' + w + ' of ' + ic.weeks),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': ic.weeks, 'aria-valuenow': Math.min(w, ic.weeks), 'aria-label': 'Progress through the I-CBT phase' }, h('span', { style: 'width:' + Math.min(100, (w / ic.weeks) * 100) + '%' })),
      h('p', {}, done ? 'The planned weeks have passed. Try moving on to gradual exposures. It is a hint; you set the pace.' : 'When the countdown finishes, the app will invite you to move on to exposures.'),
      h('div', { class: 'actions' }, done ? h('a', { class: 'btn', href: '/aplikace/denik' }, 'To the diary') : null,
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { ic.startedAt = null; save(); render(); } }, 'Cancel the countdown'))));
  }

  // lekce
  parts.push(h('h2', {}, 'Short lessons'));
  parts.push(h('div', { class: 'lessons' }, ICBT_LESSONS.map((l, i) => h('details', { class: 'card app-card' }, h('summary', {}, (i + 1) + '. ' + l.t), h('p', {}, l.x)))));

  // cvičení
  const F = [
    ['q1', 'Doubt (what if…)'],
    ['q2', 'What does it come from: from what I perceived, or from an image?'],
    ['q3', 'What do I know about it from direct experience?'],
    ['q4', 'How do I want to live regardless of it?'],
  ].map(([k, l]) => ({ k, l, el: h('input', { type: 'text', id: k, maxlength: 140 }) }));
  parts.push(h('div', { class: 'card app-card' }, h('h2', {}, 'What does this doubt rest on?'),
    h('p', { class: 'hint' }, 'Briefly, max. 140 characters per field. The point is not to find certainty but to tell where the doubt comes from.'),
    F.map((f) => h('div', { class: 'field' }, h('label', { for: f.k }, f.l), f.el)),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      const e = { id: uid(), at: Date.now() };
      F.forEach((f) => { e[f.k] = f.el.value.trim(); });
      if (!F.some((f) => e[f.k])) return;
      ic.notes.push(e);
      if (ic.notes.length > 20) ic.notes.shift();
      save();
      render('Saved. Nothing more is needed; go on.');
    } }, 'Save'))));
  if (ic.notes.length) parts.push(h('ul', { class: 'log' }, ic.notes.slice(-4).reverse().map((e) => h('li', {}, h('strong', {}, fmtDate(e.at)), ' · ' + (e.q1 || '–')))));
  root.replaceChildren(...parts);
}

if (gate(root)) render();
