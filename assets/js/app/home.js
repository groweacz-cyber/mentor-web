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
    if (!cb.checked) { msg.textContent = 'Pro pokračování potvrďte souhlas.'; cb.focus(); return; }
    d.consent = { at: Date.now() };
    save();
    render();
  };
  return h('div', { class: 'card app-card' },
    h('h2', {}, 'Než začnete'),
    h('ul', { class: 'rules' },
      h('li', {}, 'Aplikace doprovází odbornou péči, nenahrazuje ji. Není to terapie ani diagnóza.'),
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
  const a = latestAssessment();
  const out = [];
  const risk = a ? riskLevel(a.safety) : 'none';
  if (risk === 'high') {
    out.push(crisisBlock());
    out.push(h('p', {}, 'Podle vašich odpovědí v dotazníku doporučuji nejdřív kontakt s odborníkem. Samostatnou práci s aplikací teď nedoporučuji.'));
  }
  if (!a) {
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Začněte vstupním dotazníkem'),
      h('p', {}, 'Z odpovědí vznikne váš žebříček témat a doporučení cesty. Zabere asi 10 minut a můžete ho kdykoli přerušit.'),
      h('a', { class: 'btn', href: '/aplikace/start' }, d.draft ? 'Pokračovat v dotazníku' : 'Vyplnit dotazník')));
  } else {
    const items = buildLadder(a);
    const rec = recommendedStart(items, d.progress.done);
    const active = items.find((i) => i.id === d.progress.active) || rec;
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Doporučená cesta: ' + pathLabel(a.reco.path)),
      h('p', { class: 'small' }, 'Podle dotazníku z ' + fmtDateLong(a.at) + '. Je to nápověda, ne rozhodnutí. Cesty lze kombinovat.'),
      h('ul', { class: 'rules' }, a.reco.reasons.map((r) => h('li', {}, r))),
      h('p', {}, active ? 'Aktuální téma: ' : 'Žebříček je zatím prázdný. ', active ? h('strong', {}, active.name + ' (' + active.score + '/10)') : null),
      h('div', { class: 'actions' },
        h('a', { class: 'btn', href: '/aplikace/denik' }, 'Zahájit expozici'),
        h('a', { class: 'btn btn-ghost', href: '/aplikace/zebricek' }, 'Žebříček'))));
    if (Date.now() - a.at > 30 * 86400000) {
      out.push(h('p', { class: 'callout-inline' }, 'Uplynul měsíc od posledního dotazníku. Chcete ho zopakovat a porovnat? ', h('a', { href: '/aplikace/start' }, 'Zopakovat dotazník')));
    }
  }
  const c = cardOfDay();
  out.push(h('div', { class: 'card app-card principle' }, h('p', { class: 'eyebrow' }, 'Karta dne'), h('h3', {}, c.t), h('p', {}, c.x), h('a', { href: '/aplikace/principy' }, 'Všech 12 principů')));
  out.push(h('div', { class: 'tiles' },
    tile('/aplikace/kompulze', 'Tracker kompulzí', 'Rychlý záznam jedním ťuknutím'),
    tile('/aplikace/text', 'Expoziční text', 'Napsat a zkontrolovat text'),
    tile('/aplikace/denik', 'Expoziční deník', 'Časovač a graf vývoje'),
    tile('/aplikace/vice', 'Další nástroje', 'Kruh OCD, I-CBT, vize, export')));
  return out;
}

function render() {
  root.replaceChildren(...(hasConsent() ? dashboard() : [consentCard()]));
}
render();
