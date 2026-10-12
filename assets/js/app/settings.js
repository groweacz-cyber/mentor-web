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
  if (monthly) evs.push(ev('Chvilka na dotazník', 'Chcete zopakovat dotazník a porovnat, jak se věci mají? Zabere to pár minut, bez tlaku.', 'FREQ=MONTHLY'));
  if (daily) evs.push(ev('Chvilka pro sebe', 'Jak se dnes máte? Pokud chcete, zapište si krátký záznam.', 'FREQ=DAILY'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OCD aplikace//CS', ...evs, 'END:VCALENDAR'].join('\r\n');
}

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
    h('div', { class: 'card app-card' }, h('h2', {}, 'Připomínky v kalendáři'),
      h('p', {}, 'Web bez serveru nemůže posílat notifikace. Stáhněte si kalendářový soubor, který vám připomene dotazník nebo chvilku pro sebe. Zprávy jsou vždy neutrální a povzbudivé. Vypnete je smazáním události v kalendáři.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rm', checked: true }), ' Jednou měsíčně: zopakovat dotazník'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rd' }), ' Každý den: chvilka pro sebe'),
      h('div', { class: 'field' }, h('label', { for: 'rt' }, 'Čas'), h('input', { type: 'time', id: 'rt', value: '19:00' })),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([makeIcs($('#rm').checked, $('#rd').checked, $('#rt').value)], { type: 'text/calendar' })), download: 'pripominky.ics' });
        document.body.append(a); a.click(); a.remove();
      } }, 'Stáhnout kalendář'))),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Smazání a odvolání souhlasu'),
      h('p', {}, 'Smazáním odstraníte všechna data i souhlas z tohoto zařízení. Nelze to vrátit.'),
      h('div', { class: 'actions' }, del)),
    h('p', { class: 'small' }, 'Žádná data se neodesílají na server a nepoužíváme analytiku. Podrobnosti v ', h('a', { href: '/ochrana-osobnich-udaju' }, 'zásadách ochrany osobních údajů'), '.'),
  ].filter(Boolean));
}

render();
