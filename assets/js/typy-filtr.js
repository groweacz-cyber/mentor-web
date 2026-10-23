// Filtr a vyhledávání v knihovně typů OCD. Karty jsou v HTML, skript je jen skrývá. Nic se neukládá ani neodesílá.
(function () {
  'use strict';

  var root = document.getElementById('typy-filtr');
  if (!root) return;
  var input = root.querySelector('input[type="search"]');
  var chips = root.querySelectorAll('.chip');
  var cards = document.querySelectorAll('.type-card');
  var count = document.getElementById('typy-pocet');
  var kat = '';

  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function apply() {
    var q = norm(input.value.trim());
    var shown = 0;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var show = (!kat || c.getAttribute('data-kat') === kat) && (!q || norm(c.getAttribute('data-text')).indexOf(q) > -1);
      c.hidden = !show;
      if (show) shown++;
    }
    count.textContent = shown === 0 ? 'Nic nenalezeno. Zkuste jiné slovo.' : 'Zobrazeno ' + shown + ' z ' + cards.length;
  }

  input.addEventListener('input', apply);
  for (var i = 0; i < chips.length; i++) {
    chips[i].addEventListener('click', function () {
      kat = this.getAttribute('data-kat');
      for (var j = 0; j < chips.length; j++) chips[j].setAttribute('aria-pressed', chips[j] === this ? 'true' : 'false');
      apply();
    });
  }
  apply();
}());
