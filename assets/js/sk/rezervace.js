// Rezervační formulář semináře. Údaje se odesílají jen na /api/rezervace (POST, JSON). Nic se neposílá v adrese stránky
// (v adrese je jen označení programu a běhu) a nic se neukládá do localStorage. Do sessionStorage se po úspěchu uloží jen
// odpověď serveru (platební údaje a termíny, bez jména a e-mailu), aby ji mohla zobrazit potvrzovací stránka.
(function () {
  'use strict';

  var form = document.getElementById('rez-form');
  if (!form) return;

  var KONTAKT = 'ocdmentor@gmail.com';
  var HLASKY = {
    program: { povinne: 'Vyberte program.', 'neznamy-program': 'Vybraný program neexistuje. Obnovte stránku a vyberte znova.' },
    beh: { povinne: 'Vyberte termín.', 'neznamy-beh': 'Vybraný termín k tomuto programu nepatrí. Obnovte stránku a vyberte znova.' },
    jmeno: { povinne: 'Vyplňte meno.', neplatne: 'Meno smie obsahovať len písmená, medzery, bodku, pomlčku a apostrof (najviac 50 znakov).', 'neplatne-znaky': 'Meno obsahuje nepovolené znaky.' },
    prijmeni: { povinne: 'Vyplňte priezvisko.', neplatne: 'Priezvisko smie obsahovať len písmená, medzery, bodku, pomlčku a apostrof (najviac 50 znakov).', 'neplatne-znaky': 'Priezvisko obsahuje nepovolené znaky.' },
    email: { povinne: 'Vyplňte e-mail.', neplatne: 'Zadajte platný e-mail, napríklad meno@example.sk.', 'neplatne-znaky': 'E-mail obsahuje nepovolené znaky.' },
    telefon: { povinne: 'Vyplňte telefónne číslo.', neplatne: 'Zadajte platné telefónne číslo, napríklad 777 123 456 alebo +421 900 123 456.', 'neplatne-znaky': 'Telefón obsahuje nepovolené znaky.' },
    email2: { povinne: 'Zadajte e-mail ešte raz.', 'neshoduji-se': 'E-maily sa nezhodujú.', 'neplatne-znaky': 'E-mail obsahuje nepovolené znaky.' },
    souhlasZpracovani: { povinne: 'Bez súhlasu so spracovaním mena, e-mailu a telefónu rezerváciu nemožno odoslať.' },
    souhlasPovaha: { povinne: 'Potvrďte, že rozumiete povahe seminára.' },
    souhlasPodminky: { povinne: 'Na rezerváciu je nutný súhlas s obchodnými podmienkami.' }
  };
  // Pole, jejichž prvky mají v každém programu vlastní id (přípona = id programu).
  var PO_PROGRAMECH = { beh: 1, souhlasZpracovani: 1, souhlasPovaha: 1, souhlasPodminky: 1 };
  var POLE_ID = {
    program: 'program-', jmeno: 'rez-jmeno', prijmeni: 'rez-prijmeni', email: 'rez-email', email2: 'rez-email2', telefon: 'rez-telefon',
    souhlasZpracovani: 'rez-souhlas-zpracovani-', souhlasPovaha: 'rez-souhlas-povaha-', souhlasPodminky: 'rez-souhlas-podminky-'
  };
  var PORADI = ['program', 'beh', 'jmeno', 'prijmeni', 'email', 'email2', 'telefon', 'souhlasZpracovani', 'souhlasPovaha', 'souhlasPodminky'];
  var EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
  var TELEFON_ZNAKY = /^[0-9 +()\-.\/]{1,30}$/;
  function telefonPlatny(v) {
    if (!TELEFON_ZNAKY.test(v)) return false;
    var t = v.replace(/[\s().\-\/]/g, '');
    if (t.indexOf('00') === 0) t = '+' + t.slice(2);
    if (/^\d{9}$/.test(t)) t = '+420' + t;
    return /^\+[1-9]\d{8,14}$/.test(t);
  }
  var JMENO_RE = null;
  try { JMENO_RE = new RegExp('^\\p{L}[\\p{L}\\p{M} \'’.\\-]{0,49}$', 'u'); } catch (e) { JMENO_RE = null; }

  var souhrn = document.getElementById('rez-chyby');
  var stav = document.getElementById('rez-stav');
  var tlacitko = document.getElementById('rez-odeslat');

  function hodnota(id) { return form.elements[id] ? String(form.elements[id].value || '').trim() : ''; }

  // ---------- program ----------
  function vybranyProgram() {
    var r = form.querySelector('input[name="program"]:checked');
    return r ? r.value : '';
  }
  function zobrazProgram(id) {
    var bloky = form.querySelectorAll('[data-program]');
    for (var i = 0; i < bloky.length; i++) {
      var b = bloky[i];
      if (!b.classList.contains('program-blok') && !b.classList.contains('program-souhlasy')) continue;
      b.hidden = b.getAttribute('data-program') !== id;
    }
  }
  function vybranyBeh(program) {
    var r = program && form.querySelector('#blok-' + program + ' input[name="beh"]:checked');
    return r ? r.value : '';
  }
  function zaskrtnuto(kod, program) {
    var el = program && form.querySelector('#souhlasy-' + program + ' input[name="' + kod + '"]');
    return !!(el && el.checked);
  }
  function idPole(pole, program) {
    if (pole === 'program') {
      var prvni = form.querySelector('input[name="program"]');
      return prvni ? prvni.id : '';
    }
    if (pole === 'beh') {
      if (!program) return '';
      var r = form.querySelector('#blok-' + program + ' input[name="beh"]:not(:disabled)') || form.querySelector('#blok-' + program + ' input[name="beh"]');
      return r ? r.id : '';
    }
    return PO_PROGRAMECH[pole] ? POLE_ID[pole] + program : POLE_ID[pole];
  }
  function idChyby(pole, program) { return 'err-' + pole + (PO_PROGRAMECH[pole] ? '-' + program : ''); }

  function vycistit() {
    souhrn.hidden = true;
    souhrn.innerHTML = '';
    stav.textContent = '';
    stav.className = 'msg';
    var chyby = form.querySelectorAll('.field-err');
    for (var i = 0; i < chyby.length; i++) { chyby[i].hidden = true; chyby[i].textContent = ''; }
    var neplatne = form.querySelectorAll('[aria-invalid]');
    for (var j = 0; j < neplatne.length; j++) neplatne[j].removeAttribute('aria-invalid');
  }

  function zobrazChyby(chyby, program) {
    var polozky = [];
    for (var i = 0; i < PORADI.length; i++) {
      var p = PORADI[i];
      if (!chyby[p]) continue;
      var text = (HLASKY[p] && HLASKY[p][chyby[p]]) || 'Skontrolujte toto pole.';
      var err = document.getElementById(idChyby(p, program));
      if (err) { err.textContent = text; err.hidden = false; }
      var id = idPole(p, program);
      var el = id && document.getElementById(id);
      if (el) el.setAttribute('aria-invalid', 'true');
      polozky.push({ id: id, text: text });
    }
    if (!polozky.length) return;
    var html = '<p><strong>Formulár obsahuje chyby, opravte ich prosím:</strong></p><ul>';
    for (var j = 0; j < polozky.length; j++) {
      html += '<li><a href="#' + polozky[j].id + '">' + polozky[j].text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</a></li>';
    }
    souhrn.innerHTML = html + '</ul>';
    souhrn.hidden = false;
    souhrn.focus();
  }

  function zobrazZpravu(text) {
    souhrn.innerHTML = '';
    var p = document.createElement('p');
    var s = document.createElement('strong');
    s.textContent = text;
    p.appendChild(s);
    souhrn.appendChild(p);
    souhrn.hidden = false;
    souhrn.focus();
  }

  // Kontrola v prohlížeči jen pro pohodlí, server vše kontroluje znovu.
  function zkontroluj(d) {
    var c = {};
    if (!d.program) c.program = 'povinne';
    if (d.program && !d.beh) c.beh = 'povinne';
    if (!d.jmeno) c.jmeno = 'povinne'; else if (JMENO_RE && !JMENO_RE.test(d.jmeno)) c.jmeno = 'neplatne';
    if (!d.prijmeni) c.prijmeni = 'povinne'; else if (JMENO_RE && !JMENO_RE.test(d.prijmeni)) c.prijmeni = 'neplatne';
    if (!d.email) c.email = 'povinne'; else if (d.email.length > 254 || !EMAIL_RE.test(d.email)) c.email = 'neplatne';
    if (!d.email2) c.email2 = 'povinne'; else if (!c.email && d.email.toLowerCase() !== d.email2.toLowerCase()) c.email2 = 'neshoduji-se';
    if (!d.telefon) c.telefon = 'povinne'; else if (!telefonPlatny(d.telefon)) c.telefon = 'neplatne';
    if (d.program) {
      if (!d.souhlasZpracovani) c.souhlasZpracovani = 'povinne';
      if (!d.souhlasPovaha) c.souhlasPovaha = 'povinne';
      if (!d.souhlasPodminky) c.souhlasPodminky = 'povinne';
    }
    return c;
  }

  souhrn.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var cil = document.getElementById(a.getAttribute('href').slice(1));
    if (cil) { e.preventDefault(); cil.focus(); }
  });

  // Přepnutí programu: zobrazí se jeho blok a jeho souhlasy, v adrese zůstane jen označení programu.
  var volbyProgramu = form.querySelectorAll('input[name="program"]');
  function naProgram(id, zmenitAdresu) {
    zobrazProgram(id);
    if (zmenitAdresu && window.history && history.replaceState) {
      try { history.replaceState(null, '', window.location.pathname + '?program=' + encodeURIComponent(id)); } catch (e) { /* adresa se nezmění */ }
    }
  }
  for (var v = 0; v < volbyProgramu.length; v++) {
    volbyProgramu[v].addEventListener('change', function () { if (this.checked) naProgram(this.value, true); });
  }

  // Předvolba z odkazu „Rezervovat místo“ (v adrese je jen označení programu a běhu, žádné osobní údaje).
  // Starý odkaz jen s během se převede na jeho program.
  try {
    var parametry = new URLSearchParams(window.location.search);
    var program = (parametry.get('program') || '').replace(/[^a-z0-9-]/g, '');
    var behPredvolba = (parametry.get('beh') || '').replace(/[^a-z0-9-]/g, '');
    var radioBeh = behPredvolba && form.querySelector('input[name="beh"][value="' + behPredvolba + '"]');
    if (!program && radioBeh) {
      var blokBehu = radioBeh.closest('[data-program]');
      program = blokBehu ? blokBehu.getAttribute('data-program') : '';
    }
    var radioProgram = program && form.querySelector('input[name="program"][value="' + program + '"]');
    if (radioProgram) {
      radioProgram.checked = true;
      naProgram(program, false);
      if (radioBeh && !radioBeh.disabled && radioBeh.closest('#blok-' + program)) radioBeh.checked = true;
    }
  } catch (e) { /* bez předvolby */ }

  var zahajeno = Date.now();
  function doba() {
    return window.performance && performance.now ? Math.round(performance.now()) : Date.now() - zahajeno;
  }

  function chybaServeru(status, j, program) {
    if (j && j.kod === 'neplatny-vstup' && j.chyby) { zobrazChyby(j.chyby, program); return; }
    var texty = {
      'prilis-rychle': 'Formulár bol odoslaný príliš rýchlo. Skúste to prosím o chvíľu znova.',
      'beh-neni-otevreny': 'Tento termín už nie je k dispozícii. Obnovte stránku a vyberte iný.',
      'prilis-mnoho-pokusu': 'Príliš veľa pokusov. Skúste to prosím neskôr, alebo mi napíšte na ' + KONTAKT + '.',
      'email-selhal': 'Rezerváciu sa nepodarilo dokončiť, e-mail s platobnými údajmi sa nepodarilo odoslať. Skúste to prosím znova, alebo mi napíšte na ' + KONTAKT + '.'
    };
    zobrazZpravu((j && texty[j.kod]) || 'Niečo sa pokazilo na strane servera. Skúste to prosím znova, alebo mi napíšte na ' + KONTAKT + '.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    vycistit();
    var program = vybranyProgram();
    var d = {
      program: program,
      jmeno: hodnota('jmeno'),
      prijmeni: hodnota('prijmeni'),
      email: hodnota('email'),
      email2: hodnota('email2'),
      telefon: hodnota('telefon'),
      beh: vybranyBeh(program),
      souhlasZpracovani: zaskrtnuto('souhlasZpracovani', program),
      souhlasPovaha: zaskrtnuto('souhlasPovaha', program),
      souhlasPodminky: zaskrtnuto('souhlasPodminky', program),
      web: form.elements.web ? form.elements.web.value : '',
      jazyk: document.documentElement.lang === 'en' ? 'en' : document.documentElement.lang === 'sk' ? 'sk' : 'sk',
      doba: doba()
    };
    var chyby = zkontroluj(d);
    if (Object.keys(chyby).length) { zobrazChyby(chyby, program); return; }

    tlacitko.disabled = true;
    stav.textContent = 'Odosielam rezerváciu…';
    fetch('/api/rezervace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d),
      credentials: 'omit',
      cache: 'no-store'
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, j: j }; }, function () { return { status: r.status, j: null }; });
    }).then(function (o) {
      if (o.status === 200 && o.j && o.j.ok) {
        try { sessionStorage.setItem('sem-rezervace', JSON.stringify(o.j)); } catch (err) { /* potvrzení pak ukáže jen pokyn k e-mailu */ }
        window.location.assign('/sk/seminare/rezervacia/potvrdenie');
        return;
      }
      stav.textContent = '';
      tlacitko.disabled = false;
      chybaServeru(o.status, o.j, program);
    }).catch(function () {
      stav.textContent = '';
      tlacitko.disabled = false;
      zobrazZpravu('Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie a skúste to znova, alebo mi napíšte na ' + KONTAKT + '.');
    });
  });
}());
