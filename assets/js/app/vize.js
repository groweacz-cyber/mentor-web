// Cílová vize: popis života, ne absence nemoci. Upozornění na formulace o zdravotním stavu.
import { data, save, fmtDateLong } from './store.js';
import { h, boot, gate, $ } from './ui.js';
import { norm, VISION_HEALTH } from './data.js';

const root = $('#app-root');
boot(root);

function render(note) {
  const d = data();
  const t = h('textarea', { id: 'vz', rows: 8, maxlength: 600 });
  t.value = d.vision ? d.vision.text : '';
  const out = h('div', { 'aria-live': 'polite' });
  const check = () => {
    const bad = VISION_HEALTH.some((r) => r.test(norm(t.value)));
    out.replaceChildren(t.value.trim() ? (bad
      ? h('p', { class: 'banner banner-warn' }, 'Vize teď popisuje zdravotní stav (např. „bez OCD“, „zdravý“). Zkuste popsat život: co děláte, s kým jste, kam chodíte, co vás baví.')
      : h('p', { class: 'banner banner-ok' }, 'Vypadá to jako popis života. Pěkné.')) : '');
    return bad;
  };
  root.replaceChildren(...[
    note ? h('p', { class: 'banner banner-ok', role: 'status' }, note) : null,
    h('div', { class: 'card app-card' }, h('h2', {}, 'Život, který chci žít'),
      h('p', { class: 'hint' }, 'Popište obyčejný dobrý den. Vize popisuje život, ne absenci nemoci. Nepoužívá se jako odpověď na strach. Max. 600 znaků.'),
      h('div', { class: 'field' }, h('label', { for: 'vz' }, 'Moje vize'), t),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: check }, 'Zkontrolovat'),
        h('button', { class: 'btn', type: 'button', onclick: () => { check(); d.vision = { text: t.value.trim(), at: Date.now() }; save(); render('Uloženo ' + fmtDateLong(Date.now()) + '.'); } }, 'Uložit')),
      out),
  ].filter(Boolean));
}

if (gate(root)) render();
