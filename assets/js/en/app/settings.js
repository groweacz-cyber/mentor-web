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
  if (monthly) evs.push(ev('A moment for the questionnaire', 'Would you like to repeat the questionnaire and compare how things stand? It takes a few minutes, with no pressure.', 'FREQ=MONTHLY'));
  if (daily) evs.push(ev('A moment for yourself', 'How are you today? If you like, note down a short entry.', 'FREQ=DAILY'));
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OCD aplikace//CS', ...evs, 'END:VCALENDAR'].join('\r\n');
}

function render(note, bad) {
  const d = data();
  const stats = [
    ['Questionnaires', d.assessments.length], ['Exposure', d.exposures.length], ['Texts', d.texts.length], ['Compulsion entries', d.compulsions.length],
  ];
  const file = h('input', { type: 'file', id: 'imp', accept: 'application/json,.json' });
  file.addEventListener('change', () => {
    const f = file.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { importJson(String(r.result)); render('The data has been loaded.'); } catch (e) { render('The file could not be loaded. Check that it is an export from this app.', true); }
    };
    r.readAsText(f);
  });
  let armed = false;
  const del = h('button', { class: 'btn btn-ghost', type: 'button' }, 'Delete all data');
  del.addEventListener('click', () => {
    if (!armed) { armed = true; del.textContent = 'Really delete? Click again'; return; }
    wipe();
    render('All data and consent have been deleted from this device.');
  });
  root.replaceChildren(...[
    note ? h('p', { class: 'banner ' + (bad ? 'banner-warn' : 'banner-ok'), role: 'status' }, note) : null,
    h('div', { class: 'card app-card' }, h('h2', {}, 'What is stored'),
      h('p', {}, d.consent ? 'Consent given ' + fmtDateLong(d.consent.at) + '. The data is only on this device and in this browser.' : 'Consent has not been given yet and nothing is stored.'),
      h('ul', { class: 'rules' }, stats.map(([k, v]) => h('li', {}, k + ': ' + v)))),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Backup and transfer'),
      h('p', {}, 'The export creates a file with your data. Save it in a safe place or load it on another device. Whoever has the file sees everything that is in it.'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([exportJson()], { type: 'application/json' })), download: 'ocd-aplikace-data.json' });
        document.body.append(a); a.click(); a.remove();
      } }, 'Export data')),
      h('div', { class: 'field' }, h('label', { for: 'imp' }, 'Load data from a file (overwrites the existing)'), file)),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Calendar reminders'),
      h('p', {}, 'A website without a server cannot send notifications. Download a calendar file that will remind you of the questionnaire or a moment for yourself. The messages are always neutral and encouraging. You switch them off by deleting the event in your calendar.'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rm', checked: true }), ' Once a month: repeat the questionnaire'),
      h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'rd' }), ' Every day: a moment for yourself'),
      h('div', { class: 'field' }, h('label', { for: 'rt' }, 'Time'), h('input', { type: 'time', id: 'rt', value: '19:00' })),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([makeIcs($('#rm').checked, $('#rd').checked, $('#rt').value)], { type: 'text/calendar' })), download: 'pripominky.ics' });
        document.body.append(a); a.click(); a.remove();
      } }, 'Download the calendar'))),
    h('div', { class: 'card app-card' }, h('h2', {}, 'Deletion and withdrawal of consent'),
      h('p', {}, 'Deleting removes all data and consent from this device. It cannot be undone.'),
      h('div', { class: 'actions' }, del)),
    h('p', { class: 'small' }, 'No data is sent to a server and we use no analytics. Details in the ', h('a', { href: '/ochrana-osobnich-udaju' }, 'privacy policy'), '.'),
  ].filter(Boolean));
}

render();
