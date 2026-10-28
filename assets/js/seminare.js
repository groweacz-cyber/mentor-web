// Stav běhů semináře podle dnešního data v Praze. Stránka se generuje při sestavení webu, takže po dni uzavření
// (4 dny před prvním setkáním) se stav upraví až tady. Server stav při rezervaci vždy kontroluje znovu.
(function () {
  'use strict';

  function dnes() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }
  }

  var today = dnes();
  var otevrene = document.querySelectorAll('[data-beh][data-stav="otevreno"]');
  for (var i = 0; i < otevrene.length; i++) {
    var el = otevrene[i];
    if (today < el.getAttribute('data-uzavreni-od')) continue;
    el.setAttribute('data-stav', 'uzavreno');
    var badge = el.querySelector('[data-stav-text]');
    if (badge) {
      badge.textContent = 'Uzavřeno';
      badge.className = 'badge badge--muted';
      badge.setAttribute('data-stav-text', '');
    }
    var cta = el.querySelector('[data-rezervovat]');
    if (cta && cta.parentNode) cta.parentNode.removeChild(cta);
    var radio = el.querySelector('input[type="radio"]');
    if (radio) {
      radio.checked = false;
      radio.disabled = true;
    }
  }

  var zadny = document.querySelector('[data-run-none]');
  if (zadny) zadny.hidden = !!document.querySelector('[data-beh][data-stav="otevreno"]');
}());
