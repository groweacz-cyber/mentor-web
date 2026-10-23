// Otáčecí karty Mýtus → Realita. Bez JavaScriptu jsou obě strany vidět pod sebou. Nic se neukládá ani neodesílá.
(function () {
  'use strict';

  var cards = document.querySelectorAll('.myth-card');
  if (!cards.length) return;

  function set(card, flipped) {
    var btn = card.querySelector('.myth-flip');
    var front = card.querySelector('.myth-front');
    var back = card.querySelector('.myth-back');
    card.classList.toggle('is-flipped', flipped);
    btn.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    btn.textContent = flipped ? 'Otočit zpět na mýtus' : 'Otočit na realitu';
    front.setAttribute('aria-hidden', flipped ? 'true' : 'false');
    back.setAttribute('aria-hidden', flipped ? 'false' : 'true');
  }

  for (var i = 0; i < cards.length; i++) {
    (function (card) {
      card.classList.add('is-ready');
      set(card, false);
      card.querySelector('.myth-flip').addEventListener('click', function () {
        set(card, !card.classList.contains('is-flipped'));
      });
    }(cards[i]));
  }
}());
