// Rezervační formulář semináře. Údaje se odesílají jen na /api/rezervace (POST, JSON). Nic se neposílá v adrese stránky
// a nic se neukládá do localStorage. Do sessionStorage se po úspěchu uloží jen odpověď serveru (platební údaje a termíny,
// bez jména a e-mailu), aby ji mohla zobrazit potvrzovací stránka.
(function () {
  'use strict';

  var form = document.getElementById('rez-form');
  if (!form) return;

  var KONTAKT = 'ocdmentor@gmail.com';
  var HLASKY = {
    beh: { povinne: 'Vyberte termín.', 'neznamy-beh': 'Vybraný termín neexistuje. Obnovte stránku a vyberte znovu.' },
    jmeno: { povinne: 'Vyplňte jméno.', neplatne: 'Jméno smí obsahovat jen písmena, mezery, tečku, pomlčku a apostrof (nejvýše 50 znaků).', 'neplatne-znaky': 'Jméno obsahuje nepovolené znaky.' },
    prijmeni: { povinne: 'Vyplňte příjmení.', neplatne: 'Příjmení smí obsahovat jen písmena, mezery, tečku, pomlčku a apostrof (nejvýše 50 znaků).', 'neplatne-znaky': 'Příjmení obsahuje nepovolené znaky.' },
    email: { povinne: 'Vyplňte e-mail.', neplatne: 'Zadejte platný e-mail, například jmeno@example.cz.', 'neplatne-znaky': 'E-mail obsahuje nepovolené znaky.' },
    email2: { povinne: 'Zadejte e-mail ještě jednou.', 'neshoduji-se': 'E-maily se neshodují.', 'neplatne-znaky': 'E-mail obsahuje nepovolené znaky.' },
    souhlasZpracovani: { povinne: 'Bez souhlasu se zpracováním jména a e-mailu rezervaci nelze odeslat.' },
    souhlasPovaha: { povinne: 'Potvrďte, že rozumíte povaze semináře.' },
    souhlasPodminky: { povinne: 'Pro rezervaci je nutný souhlas s obchodními podmínkami.' }
  };
  var POLE_ID = {
    jmeno: 'rez-jmeno', prijmeni: 'rez-prijmeni', email: 'rez-email', email2: 'rez-email2',
    souhlasZpracovani: 'rez-souhlas-zpracovani', souhlasPovaha: 'rez-souhlas-povaha', souhlasPodminky: 'rez-souhlas-podminky'
  };
  var PORADI = ['beh', 'jmeno', 'prijmeni', 'email', 'email2', 'souhlasZpracovani', 'souhlasPovaha', 'souhlasPodminky'];
  var EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
  var JMENO_RE = null;
  try { JMENO_RE = new RegExp('^\\p{L}[\\p{L}\\p{M} \'’.\\-]{0,49}$', 'u'); } catch (e) { JMENO_RE = null; }

  var souhrn = document.getElementById('rez-chyby');
  var stav = document.getElementById('rez-stav');
  var tlacitko = document.getElementById('rez-odeslat');

  function hodnota(id) { return form.elements[id] ? String(form.elements[id].value || '').trim() : ''; }
  function vybranyBeh() {
    var r = form.querySelector('input[name="beh"]:checked');
    return r ? r.value : '';
  }
  function idPole(pole) {
    if (pole === 'beh') {
      var prvni = form.querySelector('input[name="beh"]:not(:disabled)') || form.querySelector('input[name="beh"]');
      return prvni ? prvni.id : '';
    }
    return POLE_ID[pole];
  }

  function vycistit() {
    souhrn.hidden = true;
    souhrn.innerHTML = '';
    stav.textContent = '';
    stav.className = 'msg';
    for (var i = 0; i < PORADI.length; i++) {
      var p = PORADI[i];
      var err = document.getElementById('err-' + p);
      if (err) { err.hidden = true; err.textContent = ''; }
      var id = idPole(p);
      var el = id && document.getElementById(id);
      if (el) el.removeAttribute('aria-invalid');
    }
  }

  function zobrazChyby(chyby) {
    var polozky = [];
    for (var i = 0; i < PORADI.length; i++) {
      var p = PORADI[i];
      if (!chyby[p]) continue;
      var text = (HLASKY[p] && HLASKY[p][chyby[p]]) || 'Zkontrolujte toto pole.';
      var err = document.getElementById('err-' + p);
      if (err) { err.textContent = text; err.hidden = false; }
      var id = idPole(p);
      var el = id && document.getElementById(id);
      if (el) el.setAttribute('aria-invalid', 'true');
      polozky.push({ id: id, text: text });
    }
    if (!polozky.length) return;
    var html = '<p><strong>Formulář obsahuje chyby, opravte je prosím:</strong></p><ul>';
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
    if (!d.beh) c.beh = 'povinne';
    if (!d.jmeno) c.jmeno = 'povinne'; else if (JMENO_RE && !JMENO_RE.test(d.jmeno)) c.jmeno = 'neplatne';
    if (!d.prijmeni) c.prijmeni = 'povinne'; else if (JMENO_RE && !JMENO_RE.test(d.prijmeni)) c.prijmeni = 'neplatne';
    if (!d.email) c.email = 'povinne'; else if (d.email.length > 254 || !EMAIL_RE.test(d.email)) c.email = 'neplatne';
    if (!d.email2) c.email2 = 'povinne'; else if (!c.email && d.email.toLowerCase() !== d.email2.toLowerCase()) c.email2 = 'neshoduji-se';
    if (!d.souhlasZpracovani) c.souhlasZpracovani = 'povinne';
    if (!d.souhlasPovaha) c.souhlasPovaha = 'povinne';
    if (!d.souhlasPodminky) c.souhlasPodminky = 'povinne';
    return c;
  }

  souhrn.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var cil = document.getElementById(a.getAttribute('href').slice(1));
    if (cil) { e.preventDefault(); cil.focus(); }
  });

  // Předvybraný termín z odkazu „Rezervovat místo“ (v adrese je jen označení běhu, žádné osobní údaje).
  try {
    var predvolba = new URLSearchParams(window.location.search).get('beh');
    var radio = predvolba && form.querySelector('input[name="beh"][value="' + predvolba.replace(/[^a-z0-9-]/g, '') + '"]');
    if (radio && !radio.disabled) radio.checked = true;
  } catch (e) { /* bez předvolby */ }

  var zahajeno = Date.now();
  function doba() {
    return window.performance && performance.now ? Math.round(performance.now()) : Date.now() - zahajeno;
  }

  function chybaServeru(status, j) {
    if (j && j.kod === 'neplatny-vstup' && j.chyby) { zobrazChyby(j.chyby); return; }
    var texty = {
      'prilis-rychle': 'Formulář byl odeslán příliš rychle. Zkuste to prosím za chvíli znovu.',
      'beh-neni-otevreny': 'Tento termín už není k dispozici. Obnovte stránku a vyberte jiný.',
      'prilis-mnoho-pokusu': 'Příliš mnoho pokusů. Zkuste to prosím později, nebo mi napište na ' + KONTAKT + '.',
      'email-selhal': 'Rezervaci se nepodařilo dokončit, e-mail s platebními údaji nešel odeslat. Zkuste to prosím znovu, nebo mi napište na ' + KONTAKT + '.'
    };
    zobrazZpravu((j && texty[j.kod]) || 'Něco se pokazilo na straně serveru. Zkuste to prosím znovu, nebo mi napište na ' + KONTAKT + '.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    vycistit();
    var d = {
      jmeno: hodnota('jmeno'),
      prijmeni: hodnota('prijmeni'),
      email: hodnota('email'),
      email2: hodnota('email2'),
      beh: vybranyBeh(),
      souhlasZpracovani: !!form.elements.souhlasZpracovani.checked,
      souhlasPovaha: !!form.elements.souhlasPovaha.checked,
      souhlasPodminky: !!form.elements.souhlasPodminky.checked,
      web: form.elements.web ? form.elements.web.value : '',
      doba: doba()
    };
    var chyby = zkontroluj(d);
    if (Object.keys(chyby).length) { zobrazChyby(chyby); return; }

    tlacitko.disabled = true;
    stav.textContent = 'Odesílám rezervaci…';
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
        window.location.assign('/seminare/rezervace/potvrzeni');
        return;
      }
      stav.textContent = '';
      tlacitko.disabled = false;
      chybaServeru(o.status, o.j);
    }).catch(function () {
      stav.textContent = '';
      tlacitko.disabled = false;
      zobrazZpravu('Nepodařilo se spojit se serverem. Zkontrolujte připojení a zkuste to znovu, nebo mi napište na ' + KONTAKT + '.');
    });
  });
}());
