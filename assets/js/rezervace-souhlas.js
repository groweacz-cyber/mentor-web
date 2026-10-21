(function () {
  'use strict';

  var modal   = document.getElementById('rsv-modal');
  if (!modal) return;

  var consent = document.getElementById('rsv-consent');
  var confirm = document.getElementById('rsv-confirm');
  var cancel  = document.getElementById('rsv-cancel');
  var pending = null;

  function resetModal() {
    consent.checked  = false;
    confirm.disabled = true;
    pending = null;
  }

  consent.addEventListener('change', function () {
    confirm.disabled = !consent.checked;
  });

  confirm.addEventListener('click', function () {
    if (!consent.checked) return;
    var btn = pending;
    resetModal();
    modal.close();
    if (btn) {
      btn._rsvOk = true;
      btn.click();
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
    if (btn._rsvOk) { btn._rsvOk = false; return; }
    e.stopImmediatePropagation();
    e.preventDefault();
    pending = btn;
    resetModal();
    modal.showModal();
  }, true);
}());
