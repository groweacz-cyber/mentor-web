// Lišta cookies a Meta Pixel. Pixel se načte teprve po souhlasu; bez něj se nestahuje žádný skript Mety.
// Volba se ukládá jen v prohlížeči (localStorage), platí 12 měsíců.
(function () {
  'use strict';
  var KLIC = 'ocdmentor-cookies';
  var PIXEL_ID = '1121273126977507';
  var PLATNOST = 365 * 24 * 3600 * 1000;

  function precti() {
    try {
      var v = JSON.parse(localStorage.getItem(KLIC));
      if (v && v.v === 1 && typeof v.marketing === 'boolean' && Date.now() - v.t < PLATNOST) return v;
    } catch (e) { /* bez úložiště se zeptáme znovu */ }
    return null;
  }
  function zapis(marketing) {
    try { localStorage.setItem(KLIC, JSON.stringify({ v: 1, marketing: marketing, t: Date.now() })); } catch (e) { /* ignorováno */ }
  }

  function smazCookiesMety() {
    var hostitel = location.hostname;
    var casti = hostitel.split('.');
    var domeny = ['', hostitel];
    if (casti.length > 2) domeny.push(casti.slice(-2).join('.'));
    ['_fbp', '_fbc'].forEach(function (jmeno) {
      domeny.forEach(function (d) {
        document.cookie = jmeno + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function nactiPixel() {
    if (window.fbq) { window.fbq('consent', 'grant'); return; }
    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    n('init', PIXEL_ID);
    n('track', 'PageView');
  }

  function odvolej() {
    if (window.fbq) window.fbq('consent', 'revoke');
    smazCookiesMety();
  }

  var lista = document.getElementById('cookie-banner');
  var ano = document.getElementById('cookie-accept');
  var ne = document.getElementById('cookie-reject');
  var nastaveni = document.getElementById('cookie-settings');

  function zobraz(zaostrit) {
    if (!lista) return;
    lista.hidden = false;
    if (zaostrit && ano) ano.focus();
  }
  function skryj() {
    if (lista) lista.hidden = true;
  }

  var volba = precti();
  if (volba && volba.marketing) nactiPixel();
  if (!volba) zobraz(false);

  if (ano) ano.addEventListener('click', function () { zapis(true); nactiPixel(); skryj(); if (nastaveni) nastaveni.focus(); });
  if (ne) ne.addEventListener('click', function () { zapis(false); odvolej(); skryj(); if (nastaveni) nastaveni.focus(); });
  if (nastaveni) nastaveni.addEventListener('click', function () { zobraz(true); });
  if (lista) lista.addEventListener('keydown', function (e) { if (e.key === 'Escape' && precti()) skryj(); });
})();
