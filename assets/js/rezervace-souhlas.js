(function () {
  'use strict';

  var modal   = document.getElementById('rsv-modal');
  if (!modal) return;

  var consentVop = document.getElementById('rsv-consent-vop');
  var consentStart = document.getElementById('rsv-consent-start');
  var confirm = document.getElementById('rsv-confirm');
  var cancel  = document.getElementById('rsv-cancel');
  var pending = null;

  function resetModal() {
    consentVop.checked   = false;
    consentStart.checked = false;
    confirm.disabled = true;
    pending = null;
  }

  function refresh() {
    confirm.disabled = !(consentVop.checked && consentStart.checked);
  }
  consentVop.addEventListener('change', refresh);
  consentStart.addEventListener('change', refresh);

  confirm.addEventListener('click', function () {
    if (!(consentVop.checked && consentStart.checked)) return;
    var btn = pending;
    resetModal();
    modal.close();
    if (btn && typeof btn.onclick === 'function') {
      btn.onclick.call(btn);
    }
  });

  cancel.addEventListener('click', function () {
    resetModal();
    modal.close();
  });

  // ESC key: browser fires 'cancel' then closes dialog; reset state.
  modal.addEventListener('cancel', function () {
    resetModal();
  });

  // Capture-phase intercept: fires before Reservanto's inline onclick.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.reservanto-button') : null;
    if (!btn) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    resetModal();   // reset state first (clears pending, unchecks both boxes, disables)
    pending = btn;  // then store reference — after reset so it isn't cleared
    modal.showModal();
  }, true);

  // Cizí skript vytváří tlačítko jako <a> bez href (roboti ho neberou jako odkaz a nejde na něj tabulátorem).
  // Dáme mu záložní odkaz na /kontakt; samotné kliknutí řeší souhlasový krok výše.
  function addFallbackHref() {
    var btns = document.querySelectorAll('.reservanto-button:not([href])');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('href', '/kontakt');
  }
  addFallbackHref();
  if (window.MutationObserver) {
    var obs = new MutationObserver(addFallbackHref);
    obs.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(function () { obs.disconnect(); }, 15000);
  }
}());
