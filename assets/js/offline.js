// Tlačítko „Načíst znovu“ na stránce /offline (bez inline obslužné funkce, kvůli CSP).
(function () {
  'use strict';
  var b = document.getElementById('nacist-znovu');
  if (b) b.addEventListener('click', function () { window.location.reload(); });
}());
