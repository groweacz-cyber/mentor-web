// Stav běhů semináře podle dnešního data v Praze. Stránka se generuje při sestavení webu, takže po dni uzavření
// (4 dny před prvním setkáním) se stav upraví až tady. Server stav při rezervaci vždy kontroluje znovu.
// Na přehledu /seminare navíc přesměruje staré kotvy z doby, kdy byly programy záložkami (#pro-blizke, #pro-lidi-s-ocd), na stránky programů.
(function () {
  'use strict';

  // Mapování kotev na adresy je v HTML přehledu (data-stare-kotvy), generuje ho build z data/seminare.json.
  try {
    var kotvy = document.querySelector('[data-stare-kotvy]');
    var id = decodeURIComponent((window.location.hash || '').slice(1));
    if (kotvy && id) {
      var mapa = JSON.parse(kotvy.getAttribute('data-stare-kotvy'));
      if (Object.prototype.hasOwnProperty.call(mapa, id)) {
        window.location.replace(mapa[id]);
        return;
      }
    }
  } catch (e) { /* bez přesměrování */ }

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
      badge.textContent = 'Closed';
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

  // Stránka programu: upozornění „není otevřený žádný termín“ a obecné tlačítko rezervace podle skutečného stavu běhů.
  var maOtevreny = !!document.querySelector('[data-beh][data-stav="otevreno"]');
  var zadny = document.querySelector('[data-run-none]');
  if (zadny) zadny.hidden = maOtevreny;
  var obecne = document.querySelector('[data-rezervovat-program]');
  if (obecne && !maOtevreny && obecne.parentNode) obecne.parentNode.removeChild(obecne);
}());
