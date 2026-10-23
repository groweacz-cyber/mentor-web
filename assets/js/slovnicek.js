// Vysvětlivky pojmů ze slovníčku: najetí myší, zaostření klávesnicí i klepnutí na mobilu. Nic se neukládá ani neodesílá.
(function () {
  'use strict';

  var wraps = document.querySelectorAll('.gl-wrap');
  if (!wraps.length) return;

  function closeAll(except) {
    for (var i = 0; i < wraps.length; i++) {
      if (wraps[i] === except) continue;
      wraps[i].classList.remove('open');
      wraps[i].classList.remove('dismissed');
      var b = wraps[i].querySelector('.gl');
      if (b) b.setAttribute('aria-expanded', 'false');
    }
  }

  // Okno s vysvětlivkou přesuneme k pravému okraji, kdyby přesahovalo displej.
  function place(w) {
    window.requestAnimationFrame(function () {
      var pop = w.querySelector('.gl-pop');
      if (!pop) return;
      pop.classList.remove('gl-right');
      var r = pop.getBoundingClientRect();
      if (r.right > window.innerWidth - 8) pop.classList.add('gl-right');
    });
  }

  for (var i = 0; i < wraps.length; i++) {
    (function (w) {
      var btn = w.querySelector('.gl');
      if (!btn) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = w.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        closeAll(w);
        if (open) place(w);
      });
      w.addEventListener('mouseenter', function () { w.classList.remove('dismissed'); place(w); });
      w.addEventListener('mouseleave', function () { w.classList.remove('dismissed'); });
      w.addEventListener('focusin', function () { place(w); });
      w.addEventListener('focusout', function () { w.classList.remove('dismissed'); });
    }(wraps[i]));
  }

  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.gl-wrap')) closeAll(null);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAll(null);
      // Esc zavře i vysvětlivku zobrazenou jen zaostřením nebo najetím (WCAG 1.4.13)
      for (var k = 0; k < wraps.length; k++) wraps[k].classList.add('dismissed');
    }
  });
}());
