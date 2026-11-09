// Úvodní stránka: self-check posuvník a tlačítka rezervace.
// Nic se neukládá (žádný localStorage) ani neodesílá (žádné požadavky na server, žádná analytika).
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function noMotion() {
    return reduced.matches || document.documentElement.classList.contains('motion-off');
  }

  /* ===== Self-check posuvník ===== */
  var range = document.getElementById('sc-range');
  if (range) {
    var out = document.getElementById('sc-out');
    var msg = document.getElementById('sc-msg');
    var cta = document.getElementById('sc-cta');
    var TEXTS = {
      low: 'Dobrý den. I ty se počítají. Sebedůvěra roste ze zvládnutých chvil.',
      mid: 'Nutkání tu je, a vy přesto čtete dál. To je přesně ten krok, ze kterého roste sebedůvěra.',
      high: 'Vím, jaké to je. Nejste v tom sami.'
    };

    var sync = function () {
      var v = parseInt(range.value, 10);
      out.textContent = v;
      range.setAttribute('aria-valuetext', v + ' z 10');
      range.style.setProperty('--p', (v / 10) * 100 + '%');
      return v;
    };
    var show = function () {
      var v = sync();
      var text = v <= 3 ? TEXTS.low : v <= 6 ? TEXTS.mid : TEXTS.high;
      if (msg.textContent !== text) msg.textContent = text;
      cta.hidden = false;
    };
    sync();
    range.addEventListener('input', show);
    range.addEventListener('change', show);
    range.addEventListener('click', show);
    range.addEventListener('keyup', function (e) {
      if (e.key === 'Home' || e.key === 'End') show();
    });

  }

  // Rezervace jde přes stejný souhlasový krok jako tlačítko Reservanto; bez widgetu se otevře /kontakt.
  var bookLinks = document.querySelectorAll('[data-book]');
  for (var bi = 0; bi < bookLinks.length; bi++) {
    bookLinks[bi].addEventListener('click', function (e) {
      var widgetBtn = document.querySelector('.reservanto-button');
      if (widgetBtn) {
        e.preventDefault();
        widgetBtn.click();
      }
    });
  }
}());
