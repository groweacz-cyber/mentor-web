// Úvodní stránka: self-check posuvník a karta „Princip dne“.
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
      high: 'Vím, jaké to je. Nejste v tom sami a dá se z toho ven krok za krokem.'
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

  /* ===== Princip dne ===== */
  var text = document.getElementById('pd-text');
  var principles = window.OCD_PRINCIPY;
  if (text && principles && principles.length) {
    var num = document.getElementById('pd-num');
    var next = document.getElementById('pd-next');
    var n = principles.length;

    // Index podle data v Praze: každý den jiný, ve stejný den stejný pro všechny návštěvníky.
    var dayIndex = function () {
      var y, m, d;
      try {
        var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' })
          .format(new Date()).split('-');
        y = +p[0]; m = +p[1]; d = +p[2];
      } catch (err) {
        var t = new Date();
        y = t.getFullYear(); m = t.getMonth() + 1; d = t.getDate();
      }
      var doy = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
      return (doy - 1) % n;
    };

    var idx = dayIndex();
    var render = function () {
      text.textContent = principles[idx];
      num.textContent = 'Princip ' + (idx + 1) + ' z ' + n;
    };
    render();
    text.setAttribute('aria-live', 'polite');

    var busy = false;
    next.addEventListener('click', function () {
      if (busy) return;
      idx = (idx + 1) % n;
      if (noMotion()) { render(); return; }
      busy = true;
      var card = text.parentNode;
      card.classList.add('is-fading');
      window.setTimeout(function () {
        render();
        card.classList.remove('is-fading');
        busy = false;
      }, 280);
    });
  }
}());
