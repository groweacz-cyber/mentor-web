// Kořeny: časová osa životních milníků. Pochopit, ne rozebírat donekonečna.
import { data, save, uid } from './store.js';
import { h, boot, gate, $ } from './ui.js';

const root = $('#app-root');
boot(root);

function render() {
  const d = data();
  const when = h('input', { type: 'text', id: 'kd', maxlength: 20, placeholder: 'E.g. 2018 or "at secondary school"' });
  const what = h('input', { type: 'text', id: 'kc', maxlength: 120, placeholder: 'What happened or changed, in one sentence' });
  root.replaceChildren(
    h('p', { class: 'banner banner-soft' }, 'The aim is to understand where the fear came from, without blame and without endless analysing. A story explains; exposure heals. Painful memories and trauma belong with a therapist.'),
    h('div', { class: 'card app-card' }, h('h2', {}, 'New milestone'),
      h('div', { class: 'field' }, h('label', { for: 'kd' }, 'Kdy'), when),
      h('div', { class: 'field' }, h('label', { for: 'kc' }, 'Co ', h('span', { class: 'hint' }, 'Max. 120 characters.')), what),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        if (!what.value.trim()) return;
        if (d.roots.length >= 15) return;
        d.roots.push({ id: uid(), when: when.value.trim(), what: what.value.trim() });
        save();
        render();
      } }, 'Add'))),
    d.roots.length >= 15 ? h('p', { class: 'small' }, 'There are enough. A rough timeline is enough for understanding; there is no need to analyse further.') : null,
    d.roots.length ? h('ol', { class: 'timeline' }, d.roots.map((r) => h('li', {}, h('strong', {}, r.when || '–'), ' ' + r.what + ' ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { d.roots.splice(d.roots.indexOf(r), 1); save(); render(); } }, 'Delete')))) : h('p', { class: 'hint' }, 'Nothing yet. A few points are enough.'));
}

if (gate(root)) render();
