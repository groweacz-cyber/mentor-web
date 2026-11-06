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
      ? h('p', { class: 'banner banner-warn' }, 'Vízia teraz opisuje zdravotný stav (napr. „bez OCD“, „zdravý“). Skúste opísať život: čo robíte, s kým ste, kam chodíte, čo vás baví.')
      : h('p', { class: 'banner banner-ok' }, 'Vyzerá to ako opis života. Pekné.')) : '');
    return bad;
  };
  root.replaceChildren(...[
    note ? h('p', { class: 'banner banner-ok', role: 'status' }, note) : null,
    h('div', { class: 'card app-card' }, h('h2', {}, 'Život, ktorý chcem žiť'),
      h('p', { class: 'hint' }, 'Opíšte obyčajný dobrý deň. Vízia opisuje život, nie absenciu choroby. Nepoužíva sa ako odpoveď na strach. Max. 600 znakov.'),
      h('div', { class: 'field' }, h('label', { for: 'vz' }, 'Moja vízia'), t),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: check }, 'Skontrolovať'),
        h('button', { class: 'btn', type: 'button', onclick: () => { check(); d.vision = { text: t.value.trim(), at: Date.now() }; save(); render('Uložené ' + fmtDateLong(Date.now()) + '.'); } }, 'Uložiť')),
      out),
  ].filter(Boolean));
}

if (gate(root)) render();
