// Kořeny: časová osa životních milníků. Pochopit, ne rozebírat donekonečna.
import { data, save, uid } from './store.js';
import { h, boot, gate, $ } from './ui.js';

const root = $('#app-root');
boot(root);

function render() {
  const d = data();
  const when = h('input', { type: 'text', id: 'kd', maxlength: 20, placeholder: 'Např. 2018 nebo „na střední“' });
  const what = h('input', { type: 'text', id: 'kc', maxlength: 120, placeholder: 'Co se stalo nebo změnilo, jednou větou' });
  root.replaceChildren(
    h('p', { class: 'banner banner-soft' }, 'Cílem je pochopit, odkud strach přišel, bez viny a bez nekonečného rozebírání. Příběh vysvětluje, expozice léčí. Bolestné vzpomínky a trauma patří k terapeutovi.'),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Nový milník'),
      h('div', { class: 'field' }, h('label', { for: 'kd' }, 'Kdy'), when),
      h('div', { class: 'field' }, h('label', { for: 'kc' }, 'Co ', h('span', { class: 'hint' }, 'Max. 120 znaků.')), what),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        if (!what.value.trim()) return;
        if (d.roots.length >= 15) return;
        d.roots.push({ id: uid(), when: when.value.trim(), what: what.value.trim() });
        save();
        render();
      } }, 'Přidat'))),
    d.roots.length >= 15 ? h('p', { class: 'small' }, 'Je jich dost. Pro porozumění stačí hrubá osa, víc rozebírat netřeba.') : null,
    d.roots.length ? h('ol', { class: 'timeline' }, d.roots.map((r) => h('li', {}, h('strong', {}, r.when || '–'), ' ' + r.what + ' ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { d.roots.splice(d.roots.indexOf(r), 1); save(); render(); } }, 'Smazat')))) : h('p', { class: 'hint' }, 'Zatím nic. Stačí pár bodů.'));
}

if (gate(root)) render();
