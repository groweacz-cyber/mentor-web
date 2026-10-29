// Potvrzovací stránka rezervace: QR Platba (SVG), platební údaje s tlačítky „Kopírovat“, termíny a soubor .ics pro kalendář.
// Údaje přicházejí z odpovědi serveru uložené v sessionStorage jen pro tento panel. Nic se neodesílá dál.
(function () {
  'use strict';

  var raw = null;
  try { raw = sessionStorage.getItem('sem-rezervace'); } catch (e) { raw = null; }
  if (!raw) return;
  var d;
  try { d = JSON.parse(raw); } catch (e) { return; }
  if (!d || d.ok !== true || !/^[1-9]\d{9}$/.test(String(d.vs)) || typeof d.spd !== 'string' || d.spd.indexOf('SPD*1.0*') !== 0 || !d.terminy || !d.terminy.length) return;

  var DNY = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
  function cz(iso) { var p = iso.split('-'); return Number(p[2]) + '. ' + Number(p[1]) + '. ' + p[0]; }
  function den(iso) { var p = iso.split('-'); return DNY[new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay()]; }
  function kc(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Kč'; }
  function skupiny(iban) { return iban.replace(/(.{4})/g, '$1 ').trim(); }
  function set(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }

  set('pay-castka', kc(d.castka));
  set('pay-ucet', d.ucet);
  set('pay-iban', skupiny(d.iban));
  set('pay-vs', d.vs);
  set('pay-majitel', d.majitel);
  set('pay-splatnost', 'do ' + cz(d.splatnost));
  set('pay-beh', d.beh && d.beh.nazev ? d.beh.nazev + ', online 1:1 přes Google Meet nebo WhatsApp, ' + d.delkaMinut + ' minut' : '');
  var seznam = document.getElementById('pay-terminy');
  for (var i = 0; i < d.terminy.length; i++) {
    var li = document.createElement('li');
    li.textContent = den(d.terminy[i].datum) + ' ' + cz(d.terminy[i].datum) + ' v ' + d.terminy[i].cas;
    seznam.appendChild(li);
  }

  // QR kód: alfanumerický režim (nejmenší kód), když řetězec obsahuje jen povolené znaky; úroveň opravy chyb M podle standardu.
  var box = document.getElementById('qr');
  if (box && typeof qrcode === 'function') {
    try {
      var qr = qrcode(0, 'M');
      qr.addData(d.spd, /^[0-9A-Z $%*+\-.\/:]+$/.test(d.spd) ? 'Alphanumeric' : 'Byte');
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
      box.setAttribute('aria-label', 'QR kód pro platbu semináře, částka ' + kc(d.castka) + ', variabilní symbol ' + d.vs);
    } catch (e) {
      box.textContent = 'QR kód se nepodařilo vytvořit. Použijte platební údaje vedle.';
    }
  }

  // Kopírování
  var hodnoty = { castka: String(d.castka), ucet: d.ucet, iban: d.iban, vs: d.vs };
  var nazvy = { castka: 'Částka', ucet: 'Číslo účtu', iban: 'IBAN', vs: 'Variabilní symbol' };
  var hlaseni = document.getElementById('kopirovano');
  var casovac = null;
  function oznam(text) {
    if (!hlaseni) return;
    hlaseni.textContent = '';
    clearTimeout(casovac);
    window.setTimeout(function () { hlaseni.textContent = text; }, 30);
    casovac = window.setTimeout(function () { hlaseni.textContent = ''; }, 4000);
  }
  function zalozniKopie(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  var tl = document.querySelectorAll('[data-copy]');
  for (var k = 0; k < tl.length; k++) {
    tl[k].addEventListener('click', function () {
      var klic = this.getAttribute('data-copy');
      var text = hodnoty[klic];
      var hotovo = function () { oznam(nazvy[klic] + ' zkopírováno.'); };
      var selhalo = function () { oznam(zalozniKopie(text) ? nazvy[klic] + ' zkopírováno.' : 'Kopírování se nepodařilo, údaj označte a zkopírujte ručně.'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(hotovo, selhalo);
      else selhalo();
    });
  }

  // Kalendář (.ics): časová zóna Europe/Prague, název události „Seminář“.
  function skladej(radek) {
    var out = '';
    var bajty = 0;
    for (var c = 0; c < radek.length; c++) {
      var kod = radek.charCodeAt(c);
      var b = kod < 0x80 ? 1 : kod < 0x800 ? 2 : 3;
      if (bajty + b > 74) { out += '\r\n '; bajty = 1; }
      out += radek.charAt(c);
      bajty += b;
    }
    return out;
  }
  function esc(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function dvoj(n) { return ('0' + n).slice(-2); }
  function ics() {
    var ted = new Date();
    var razitko = ted.getUTCFullYear() + dvoj(ted.getUTCMonth() + 1) + dvoj(ted.getUTCDate()) + 'T' + dvoj(ted.getUTCHours()) + dvoj(ted.getUTCMinutes()) + dvoj(ted.getUTCSeconds()) + 'Z';
    var r = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Seminar//CS', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE', 'TZID:Europe/Prague',
      'BEGIN:STANDARD', 'DTSTART:19701025T030000', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'TZNAME:CET', 'END:STANDARD',
      'BEGIN:DAYLIGHT', 'DTSTART:19700329T020000', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'TZNAME:CEST', 'END:DAYLIGHT',
      'END:VTIMEZONE'];
    for (var j = 0; j < d.terminy.length; j++) {
      var t = d.terminy[j];
      var ymd = t.datum.replace(/-/g, '');
      var hm = t.cas.split(':');
      var konecMin = Number(hm[0]) * 60 + Number(hm[1]) + Number(d.delkaMinut || 60);
      r.push('BEGIN:VEVENT',
        'UID:sem-' + d.vs + '-' + (j + 1) + '@seminare',
        'DTSTAMP:' + razitko,
        'DTSTART;TZID=Europe/Prague:' + ymd + 'T' + hm[0] + hm[1] + '00',
        'DTEND;TZID=Europe/Prague:' + ymd + 'T' + dvoj(Math.floor(konecMin / 60)) + dvoj(konecMin % 60) + '00',
        'SUMMARY:Seminář',
        'DESCRIPTION:' + esc('Online setkání 1:1 přes Google Meet nebo WhatsApp. Po připsání platby se ozvu já e-mailem.'),
        'LOCATION:Online (Google Meet nebo WhatsApp)',
        'END:VEVENT');
    }
    r.push('END:VCALENDAR');
    return r.map(skladej).join('\r\n') + '\r\n';
  }
  var icsTl = document.getElementById('ics-btn');
  if (icsTl) {
    icsTl.addEventListener('click', function () {
      var blob = new Blob([ics()], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'seminar.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  var em = document.getElementById('potvrzeni-email');
  if (em && d.emailOdeslan !== false) em.hidden = false;
  document.getElementById('potvrzeni-data').hidden = false;
  document.getElementById('potvrzeni-nic').hidden = true;
}());
