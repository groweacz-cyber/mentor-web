// Stav běhů semináře podle dnešního data v Praze. Stránka se generuje při sestavení webu, takže po dni uzavření
// (4 dny před prvním setkáním) se stav upraví až tady. Server stav při rezervaci vždy kontroluje znovu.
// Na /seminare navíc otevírá záložku programu podle kotvy v adrese (#pro-lidi-s-ocd, #pro-blizke). Bez tohoto skriptu záložky fungují dál.
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

  // Záložky programů: upozornění „není otevřený žádný termín“ a obecné tlačítko rezervace podle skutečného stavu běhů.
  var zalozky = document.querySelectorAll('[data-program-tab]');
  for (var z = 0; z < zalozky.length; z++) {
    var maOtevreny = !!zalozky[z].querySelector('[data-beh][data-stav="otevreno"]');
    var zadny = zalozky[z].querySelector('[data-run-none]');
    if (zadny) zadny.hidden = maOtevreny;
    var obecne = zalozky[z].querySelector('[data-rezervovat-program]');
    if (obecne && !maOtevreny && obecne.parentNode) obecne.parentNode.removeChild(obecne);
  }

  // Vždy je otevřená nejvýš jedna záložka. Atribut name to zajišťuje sám, tohle je záloha pro starší prohlížeče.
  function zavriOstatni(zalozka) {
    for (var k = 0; k < zalozky.length; k++) {
      if (zalozky[k] !== zalozka) zalozky[k].open = false;
    }
  }
  for (var t = 0; t < zalozky.length; t++) {
    zalozky[t].addEventListener('toggle', function () { if (this.open) zavriOstatni(this); });
  }

  function otevriPodleKotvy() {
    var id = '';
    try { id = decodeURIComponent((window.location.hash || '').slice(1)); } catch (e) { id = ''; }
    if (!id) return;
    var cil = document.getElementById(id);
    if (!cil || !cil.hasAttribute('data-program-tab')) return;
    cil.open = true;
    zavriOstatni(cil);
    if (cil.scrollIntoView) cil.scrollIntoView();
  }
  otevriPodleKotvy();
  window.addEventListener('hashchange', otevriPodleKotvy);
}());
