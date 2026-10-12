// Data a nastavení: export, import, úplné smazání, odvolání souhlasu.
import { data, save, exportJson, importJson, wipe, fmtDateLong } from './store.js';
import { h, boot, $ } from './ui.js';

const root = $('#app-root');
boot(root);

function render(note, bad) {
  const d = data();
  const stats = [
    ['Dotazníky', d.assessments.length], ['Expozice', d.exposures.length], ['Texty', d.texts.length], ['Záznamy kompulzí', d.compulsions.length],
  ];
  const file = h('input', { type: 'file', id: 'imp', accept: 'application/json,.json' });
  file.addEventListener('change', () => {
    const f = file.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { importJson(String(r.result)); render('Data byla načtena.'); } catch (e) { render('Soubor se nepodařilo načíst. Zkontrolujte, že je to export z této aplikace.', true); }
    };
    r.readAsText(f);
  });
  let armed = false;
  const del = h('button', { class: 'btn btn-ghost', type: 'button' }, 'Smazat všechna data');
  del.addEventListener('click', () => {
    if (!armed) { armed = true; del.textContent = 'Opravdu smazat? Klikněte znovu'; return; }
    wipe();
    render('Všechna data i souhlas byly smazány z tohoto zařízení.');
  });
  root.replaceChildren(...[
    note ? h('p', { class: 'banner ' + (bad ? 'banner-warn' : 'banner-ok'), role: 'status' }, note) : null,
    h('div', { class: 'card app-card' }, h('h2', {}, 'Co je uloženo'),
      h('p', {}, d.consent ? 'Souhlas udělen ' + fmtDateLong(d.consent.at) + '. Data jsou jen v tomto zařízení a prohlížeči.' : 'Souhlas zatím nebyl udělen a nic není uloženo.'),
      h('ul', { class: 'rules' }, stats.map(([k, v]) => h('li', {}, k + ': ' + v)))),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Záloha a přenos'),
      h('p', {}, 'Export vytvoří soubor s vašimi daty. Uložte ho na bezpečné místo nebo ho načtěte na jiném zařízení. Kdo soubor má, vidí všechno, co je v něm.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' })), download: 'ocd-aplikace-data.json' });
        document.body.append(a); a.click(); a.remove();
      } }, 'Exportovat data')),
      h('div', { class: 'field' }, h('label', { for: 'imp' }, 'Načíst data ze souboru (přepíše stávající)'), file)),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Smazání a odvolání souhlasu'),
      h('p', {}, 'Smazáním odstraníte všechna data i souhlas z tohoto zařízení. Nelze to vrátit.'),
      h('div', { class: 'actions' }, del)),
    h('p', { class: 'small' }, 'Žádná data se neodesílají na server a nepoužíváme analytiku. Podrobnosti v ', h('a', { href: '/ochrana-osobnich-udaju' }, 'zásadách ochrany osobních údajů'), '.'),
  ].filter(Boolean));
}

render();
