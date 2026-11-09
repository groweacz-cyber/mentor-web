// Přehled aplikace: souhlas, rychlé akce, karta dne.
import { data, save, hasConsent } from './store.js';
import { h, boot, $ } from './ui.js';
import { cardOfDay } from './data.js';

const root = $('#app-root');
boot(root);
const d = data();

function consentCard() {
  const cb = h('input', { type: 'checkbox', id: 'souhlas' });
  const msg = h('p', { class: 'msg', role: 'status' });
  const go = () => {
    if (!cb.checked) { msg.textContent = 'Na pokračovanie potvrďte súhlas.'; cb.focus(); return; }
    d.consent = { at: Date.now() };
    save();
    render();
  };
  return h('div', { class: 'card app-card' },
    h('h2', {}, 'Skôr než začnete'),
    h('ul', { class: 'rules' },
      h('li', {}, 'Aplikácia je doplnok odbornej starostlivosti, nenahrádza ju. Nie je to terapia ani diagnóza.'),
      h('li', {}, 'Údaje o zdraví sú citlivé. Zostávajú len vo vašom zariadení, v úložisku prehliadača. Nikam sa neodosielajú.'),
      h('li', {}, 'Dáta môžete kedykoľvek exportovať a úplne vymazať v sekcii Dáta.'),
      h('li', {}, 'Po vymazaní dát prehliadača alebo pri zmene zariadenia o ne prídete, ak ich neexportujete.')),
    h('label', { class: 'check' }, cb, ' Rozumiem a súhlasím so spracovaním údajov o svojom zdravotnom stave vo svojom zariadení na účel používania aplikácie. Súhlas môžem kedykoľvek odvolať vymazaním dát.'),
    h('p', { class: 'small' }, 'Podrobnosti nájdete v ', h('a', { href: '/ochrana-osobnich-udaju' }, 'zásadách ochrany osobných údajov'), '.'),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: go }, 'Pokračovať')),
    msg);
}

function tile(href, title, text) {
  return h('a', { class: 'tile', href }, h('strong', {}, title), h('span', {}, text));
}

function dashboard() {
  const out = [];
  const c = cardOfDay();
  out.push(h('div', { class: 'card app-card principle' }, h('p', { class: 'eyebrow' }, 'Karta dňa'), h('h3', {}, c.t), h('p', {}, c.x), h('a', { href: '/aplikace/principy' }, 'Všetky karty princípov')));
  out.push(h('div', { class: 'tiles' },
    tile('/aplikace/obsese', 'Tracker obsesií', 'Denný záznam tém a sily'),
    tile('/aplikace/kompulze', 'Tracker kompulzií', 'Rýchly záznam jedným ťuknutím'),
    tile('/aplikace/text', 'Expozičný text', 'Napísať a skontrolovať text'),
    tile('/aplikace/denik', 'Expozičný denník', 'Časovač a graf vývoja'),
    tile('/aplikace/vice', 'Ďalšie nástroje', 'Kruh OCD, vízia, export')));
  return out;
}

function render() {
  root.replaceChildren(...(hasConsent() ? dashboard() : [consentCard()]));
}
render();
