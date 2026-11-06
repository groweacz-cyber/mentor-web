// Přehled aplikace: souhlas, doporučení cesty, rychlé akce, karta dne.
import { data, save, hasConsent, latestAssessment, fmtDateLong } from './store.js';
import { h, boot, $, crisisBlock } from './ui.js';
import { cardOfDay, pathLabel, riskLevel, buildLadder, recommendedStart } from './data.js';

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
      h('li', {}, 'Aplikácia sprevádza odbornú starostlivosť, nenahrádza ju. Nie je to terapia ani diagnóza.'),
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
  const a = latestAssessment();
  const out = [];
  const risk = a ? riskLevel(a.safety) : 'none';
  if (risk === 'high') {
    out.push(crisisBlock());
    out.push(h('p', {}, 'Podľa vašich odpovedí v dotazníku odporúčam najprv kontakt s odborníkom. Samostatnú prácu s aplikáciou teraz neodporúčam.'));
  }
  if (!a) {
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Začnite vstupným dotazníkom'),
      h('p', {}, 'Z odpovedí vznikne váš rebríček tém a odporúčanie cesty. Zaberie asi 10 minút a môžete ho kedykoľvek prerušiť.'),
      h('a', { class: 'btn', href: '/aplikace/start' }, d.draft ? 'Pokračovať v dotazníku' : 'Vyplniť dotazník')));
  } else {
    const items = buildLadder(a);
    const rec = recommendedStart(items, d.progress.done);
    const active = items.find((i) => i.id === d.progress.active) || rec;
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Odporúčaná cesta: ' + pathLabel(a.reco.path)),
      h('p', { class: 'small' }, 'Podľa dotazníka z ' + fmtDateLong(a.at) + '. Je to nápoveda, nie rozhodnutie. Cesty možno kombinovať.'),
      h('ul', { class: 'rules' }, a.reco.reasons.map((r) => h('li', {}, r))),
      h('p', {}, active ? 'Aktuálna téma: ' : 'Rebríček je zatiaľ prázdny. ', active ? h('strong', {}, active.name + ' (' + active.score + '/10)') : null),
      h('div', { class: 'actions' },
        h('a', { class: 'btn', href: '/aplikace/denik' }, 'Začať expozíciu'),
        h('a', { class: 'btn btn-ghost', href: '/aplikace/zebricek' }, 'Rebríček'))));
    if (Date.now() - a.at > 30 * 86400000) {
      out.push(h('p', { class: 'callout-inline' }, 'Uplynul mesiac od posledného dotazníka. Chcete ho zopakovať a porovnať? ', h('a', { href: '/aplikace/start' }, 'Zopakovať dotazník')));
    }
  }
  const c = cardOfDay();
  out.push(h('div', { class: 'card app-card principle' }, h('p', { class: 'eyebrow' }, 'Karta dňa'), h('h3', {}, c.t), h('p', {}, c.x), h('a', { href: '/aplikace/principy' }, 'Všetkých 12 princípov')));
  out.push(h('div', { class: 'tiles' },
    tile('/aplikace/kompulze', 'Tracker kompulzií', 'Rýchly záznam jedným ťuknutím'),
    tile('/aplikace/text', 'Expozičný text', 'Napísať a skontrolovať text'),
    tile('/aplikace/denik', 'Expozičný denník', 'Časovač a graf vývoja'),
    tile('/aplikace/vice', 'Ďalšie nástroje', 'Kruh OCD, I-CBT, vízia, export')));
  return out;
}

function render() {
  root.replaceChildren(...(hasConsent() ? dashboard() : [consentCard()]));
}
render();
