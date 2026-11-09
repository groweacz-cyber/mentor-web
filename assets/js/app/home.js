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
    if (!cb.checked) { msg.textContent = 'Pro pokračování potvrďte souhlas.'; cb.focus(); return; }
    d.consent = { at: Date.now() };
    save();
    render();
  };
  return h('div', { class: 'card app-card' },
    h('h2', {}, 'Než začnete'),
    h('ul', { class: 'rules' },
      h('li', {}, 'Aplikace je doplněk odborné péče, nenahrazuje ji. Není to terapie ani diagnóza.'),
      h('li', {}, 'Údaje o zdraví jsou citlivé. Zůstávají jen ve vašem zařízení, v úložišti prohlížeče. Nikam se neodesílají.'),
      h('li', {}, 'Data můžete kdykoli exportovat a úplně smazat v sekci Data.'),
      h('li', {}, 'Po smazání dat prohlížeče nebo při změně zařízení o ně přijdete, pokud je neexportujete.')),
    h('label', { class: 'check' }, cb, ' Rozumím a souhlasím se zpracováním údajů o svém zdravotním stavu ve svém zařízení za účelem používání aplikace. Souhlas mohu kdykoli odvolat smazáním dat.'),
    h('p', { class: 'small' }, 'Podrobnosti najdete v ', h('a', { href: '/ochrana-osobnich-udaju' }, 'zásadách ochrany osobních údajů'), '.'),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: go }, 'Pokračovat')),
    msg);
}

function tile(href, title, text) {
  return h('a', { class: 'tile', href }, h('strong', {}, title), h('span', {}, text));
}

function dashboard() {
  const out = [];
  const c = cardOfDay();
  out.push(h('div', { class: 'card app-card principle' }, h('p', { class: 'eyebrow' }, 'Karta dne'), h('h3', {}, c.t), h('p', {}, c.x), h('a', { href: '/aplikace/principy' }, 'Všechny karty principů')));
  out.push(h('div', { class: 'tiles' },
    tile('/aplikace/obsese', 'Tracker obsesí', 'Denní záznam témat a síly'),
    tile('/aplikace/kompulze', 'Tracker kompulzí', 'Rychlý záznam jedním ťuknutím'),
    tile('/aplikace/text', 'Expoziční text', 'Napsat a zkontrolovat text'),
    tile('/aplikace/denik', 'Expoziční deník', 'Časovač a graf vývoje'),
    tile('/aplikace/vice', 'Další nástroje', 'Kruh OCD, vize, export')));
  return out;
}

function render() {
  root.replaceChildren(...(hasConsent() ? dashboard() : [consentCard()]));
}
render();
