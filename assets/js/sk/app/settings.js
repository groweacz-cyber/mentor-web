// Data a nastavení: export, import, úplné smazání, odvolání souhlasu.
import { data, save, exportJson, importJson, wipe, fmtDateLong, uid } from './store.js';
import { h, boot, $ } from './ui.js';

const root = $('#app-root');
boot(root);

// Připomínky přes kalendář (.ics): web bez serveru nemůže posílat notifikace, kalendář je připomene sám.
function makeIcs(monthly, daily, time) {
  const pad = (n) => String(n).padStart(2, '0');
  const t = new Date(Date.now() + 86400000);
  const ymd = t.getFullYear() + pad(t.getMonth() + 1) + pad(t.getDate());
  const [hh, mm] = (time || '19:00').split(':');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ev = (summary, desc, rule) => ['BEGIN:VEVENT', 'UID:' + uid() + '@ocd-aplikace', 'DTSTAMP:' + stamp, 'DTSTART:' + ymd + 'T' + hh + mm + '00', 'DURATION:PT10M', 'RRULE:' + rule, 'SUMMARY:' + summary, 'DESCRIPTION:' + desc, 'END:VEVENT'].join('\r\n');
  const evs = [];
  if (monthly) evs.push(ev('Chvíľka na dotazník', 'Chcete zopakovať dotazník a porovnať, ako sa veci majú? Zaberie to pár minút, bez tlaku.', 'FREQ=MONTHLY'));
  if (daily) evs.push(ev('Chvíľka pre seba', 'Ako sa dnes máte? Ak chcete, zapíšte si krátky záznam.', 'FREQ=DAILY'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OCD aplikace//CS', ...evs, 'END:VCALENDAR'].join('\r\n');
}

function render(note, bad) {
  const d = data();
  const stats = [
    ['Dotazníky', d.assessments.length], ['Expozícia', d.exposures.length], ['Texty', d.texts.length], ['Záznamy obsesií', d.obsessions.length], ['Záznamy kompulzií', d.compulsions.length],
  ];
  const file = h('input', { type: 'file', id: 'imp', accept: 'application/json,.json' });
  file.addEventListener('change', () => {
    const f = file.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { importJson(String(r.result)); render('Dáta boli načítané.'); } catch (e) { render('Súbor sa nepodarilo načítať. Skontrolujte, že je to export z tejto aplikácie.', true); }
    };
    r.readAsText(f);
  });
  let armed = false;
  const del = h('button', { class: 'btn btn-ghost', type: 'button' }, 'Vymazať všetky dáta');
  del.addEventListener('click', () => {
    if (!armed) { armed = true; del.textContent = 'Naozaj vymazať? Kliknite znova'; return; }
    wipe();
    render('Všetky dáta aj súhlas boli vymazané z tohto zariadenia.');
  });
  root.replaceChildren(...[
    note ? h('p', { class: 'banner ' + (bad ? 'banner-warn' : 'banner-ok'), role: 'status' }, note) : null,
    h('div', { class: 'card app-card' }, h('h2', {}, 'Čo je uložené'),
      h('p', {}, d.consent ? 'Súhlas udelený ' + fmtDateLong(d.consent.at) + '. Dáta sú len v tomto zariadení a prehliadači.' : 'Súhlas zatiaľ nebol udelený a nič nie je uložené.'),
      h('ul', { class: 'rules' }, stats.map(([k, v]) => h('li', {}, k + ': ' + v)))),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Záloha a prenos'),
      h('p', {}, 'Export vytvorí súbor s vašimi dátami. Uložte ho na bezpečné miesto alebo ho načítajte na inom zariadení. Kto súbor má, vidí všetko, čo je v ňom.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' })), download: 'ocd-aplikace-data.json' });
        document.body.append(a); a.click(); a.remove();
      } }, 'Exportovať dáta')),
      h('div', { class: 'field' }, h('label', { for: 'imp' }, 'Načítať dáta zo súboru (prepíše existujúce)'), file)),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Pripomienky v kalendári'),
      h('p', {}, 'Web bez servera nemôže posielať notifikácie. Stiahnite si kalendárový súbor, ktorý vám pripomenie dotazník alebo chvíľku pre seba. Správy sú vždy neutrálne a povzbudivé. Vypnete ich vymazaním udalosti v kalendári.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rm', checked: true }), ' Raz mesačne: zopakovať dotazník'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rd' }), ' Každý deň: chvíľka pre seba'),
      h('div', { class: 'field' }, h('label', { for: 'rt' }, 'Čas'), h('input', { type: 'time', id: 'rt', value: '19:00' })),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([makeIcs($('#rm').checked, $('#rd').checked, $('#rt').value)], { type: 'text/calendar' })), download: 'pripominky.ics' });
        document.body.append(a); a.click(); a.remove();
      } }, 'Stiahnuť kalendár'))),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Vymazanie a odvolanie súhlasu'),
      h('p', {}, 'Vymazaním odstránite všetky dáta aj súhlas z tohto zariadenia. Nedá sa to vrátiť.'),
      h('div', { class: 'actions' }, del)),
    h('p', { class: 'small' }, 'Žiadne dáta sa neodosielajú na server a nepoužívame analytiku. Podrobnosti v ', h('a', { href: '/ochrana-osobnich-udaju' }, 'zásadách ochrany osobných údajov'), '.'),
  ].filter(Boolean));
}

render();
