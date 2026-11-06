// Kořeny: časová osa životních milníků. Pochopit, ne rozebírat donekonečna.
import { data, save, uid } from './store.js';
import { h, boot, gate, $ } from './ui.js';

const root = $('#app-root');
boot(root);

function render() {
  const d = data();
  const when = h('input', { type: 'text', id: 'kd', maxlength: 20, placeholder: 'Napr. 2018 alebo „na strednej“' });
  const what = h('input', { type: 'text', id: 'kc', maxlength: 120, placeholder: 'Čo sa stalo alebo zmenilo, jednou vetou' });
  root.replaceChildren(
    h('p', { class: 'banner banner-soft' }, 'Cieľom je pochopiť, odkiaľ strach prišiel, bez viny a bez nekonečného rozoberania. Príbeh vysvetľuje, expozícia lieči. Bolestivé spomienky a trauma patria k terapeutovi.'),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Nový míľnik'),
      h('div', { class: 'field' }, h('label', { for: 'kd' }, 'Kdy'), when),
      h('div', { class: 'field' }, h('label', { for: 'kc' }, 'Co ', h('span', { class: 'hint' }, 'Max. 120 znakov.')), what),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        if (!what.value.trim()) return;
        if (d.roots.length >= 15) return;
        d.roots.push({ id: uid(), when: when.value.trim(), what: what.value.trim() });
        save();
        render();
      } }, 'Pridať'))),
    d.roots.length >= 15 ? h('p', { class: 'small' }, 'Je ich dosť. Na porozumenie stačí hrubá os, viac rozoberať netreba.') : null,
    d.roots.length ? h('ol', { class: 'timeline' }, d.roots.map((r) => h('li', {}, h('strong', {}, r.when || '–'), ' ' + r.what + ' ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { d.roots.splice(d.roots.indexOf(r), 1); save(); render(); } }, 'Vymazať')))) : h('p', { class: 'hint' }, 'Zatiaľ nič. Stačí pár bodov.'));
}

if (gate(root)) render();
