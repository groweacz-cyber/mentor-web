// Plovoucí lišta „Konzultace zdarma“ na mobilu. Jde zavřít, nezakrývá obsah (stránka dostane odsazení)
// a skrývá se při rezervaci. Zavření se pamatuje jen po dobu návštěvy (sessionStorage, nic citlivého).
(function () {
  'use strict';

  var bar = document.getElementById('float-cta');
  if (!bar) return;
  var link = bar.querySelector('.float-book');
  var close = bar.querySelector('.float-close');
  var body = document.body;
  var closed = false;

  try { closed = sessionStorage.getItem('ocd-lista-zavrena') === '1'; } catch (e) { closed = false; }

  function reservationOpen() {
    if (document.querySelector('dialog[open]')) return true;
    var f = document.querySelectorAll('iframe');
    for (var i = 0; i < f.length; i++) {
      if (/reservanto/i.test(f[i].src) && /Modal/.test(f[i].src) && f[i].offsetWidth > 100 && f[i].offsetHeight > 100) return true;
    }
    return false;
  }

  function update() {
    var show = !closed && window.scrollY > 500 && !reservationOpen();
    bar.hidden = !show;
    body.classList.toggle('has-float', show);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  if (window.MutationObserver) new MutationObserver(update).observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });

  close.addEventListener('click', function () {
    closed = true;
    try { sessionStorage.setItem('ocd-lista-zavrena', '1'); } catch (e) { /* bez ukládání */ }
    update();
  });

  // Rezervace jde přes stejný souhlasový krok jako tlačítko Reservanto; bez widgetu se otevře /kontakt.
  link.addEventListener('click', function (e) {
    var widgetBtn = document.querySelector('.reservanto-button');
    if (widgetBtn) {
      e.preventDefault();
      widgetBtn.click();
    }
  });

  update();
}());
