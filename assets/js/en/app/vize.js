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
      ? h('p', { class: 'banner banner-warn' }, 'The vision currently describes a state of health (e.g. "without OCD", "healthy"). Try describing a life: what you do, who you are with, where you go, what you enjoy.')
      : h('p', { class: 'banner banner-ok' }, 'This looks like a description of a life. Lovely.')) : '');
    return bad;
  };
  root.replaceChildren(...[
    note ? h('p', { class: 'banner banner-ok', role: 'status' }, note) : null,
    h('div', { class: 'card app-card' }, h('h2', {}, 'The life I want to live'),
      h('p', { class: 'hint' }, 'Describe an ordinary good day. A vision describes a life, not the absence of illness. It is not used as an answer to fear. Max. 600 characters.'),
      h('div', { class: 'field' }, h('label', { for: 'vz' }, 'My vision'), t),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: check }, 'Check'),
        h('button', { class: 'btn', type: 'button', onclick: () => { check(); d.vision = { text: t.value.trim(), at: Date.now() }; save(); render('Saved ' + fmtDateLong(Date.now()) + '.'); } }, 'Save')),
      out),
  ].filter(Boolean));
}

if (gate(root)) render();
