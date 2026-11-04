// Převede formulář na text. Nic se neodesílá na server ani neukládá.
(function () {
  var EMAIL = 'ocdmentor@gmail.com';
  var BRAND = 'OCD mentor';
  var form = document.getElementById('dotaznik');
  var msg = document.getElementById('msg');
  var box = document.getElementById('vystup');
  var out = document.getElementById('vystup-text');

  // živé zobrazení hodnot posuvníků a vyplnění jejich dráhy
  form.querySelectorAll('input[type="range"]').forEach(function (r) {
    var o = r.parentNode.querySelector('output');
    function sync() {
      o.textContent = r.value;
      r.style.setProperty('--p', (r.value / (r.max || 10)) * 100 + '%');
    }
    r.addEventListener('input', sync);
    sync();
  });

  function build() {
    var lines = ['Intake questionnaire – ' + BRAND, ''];
    form.querySelectorAll('fieldset[data-section]').forEach(function (fs) {
      var title = fs.getAttribute('data-section');
      if (!title) return;
      var part = [];
      fs.querySelectorAll('input[type="range"]').forEach(function (r) {
        var isTopic = /^tema\d/.test(r.name);
        if (isTopic && r.value === '0') return;
        part.push(r.getAttribute('data-label') + ': ' + r.value + '/10');
      });
      var groups = {};
      fs.querySelectorAll('input[type="checkbox"]:checked').forEach(function (c) {
        (groups[c.name] = groups[c.name] || []).push(c.value);
      });
      Object.keys(groups).forEach(function (g) { part.push('- ' + groups[g].join('; ')); });
      fs.querySelectorAll('input[type="text"], select, textarea').forEach(function (f) {
        var v = f.value.trim();
        if (v) part.push((f.getAttribute('data-label') || f.name) + ': ' + v);
      });
      if (part.length) { lines.push('## ' + title); lines = lines.concat(part, ['']); }
    });
    return lines.join('\n');
  }

  function check() {
    var c = document.getElementById('souhlas');
    if (!c.checked) {
      msg.className = 'msg';
      msg.textContent = 'To send, you need to tick the consent to processing.';
      c.focus();
      return false;
    }
    return true;
  }

  document.getElementById('btn-mail').addEventListener('click', function () {
    if (!check()) return;
    var text = build();
    var url = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Intake questionnaire') + '&body=' + encodeURIComponent(text);
    if (url.length > 1900) {
      out.value = text; box.hidden = false;
      msg.className = 'msg';
      msg.textContent = 'The answers are too long for a pre-filled e-mail. Copy the text below and paste it into an e-mail.';
      return;
    }
    msg.className = 'msg ok';
    msg.textContent = 'Opening your e-mail. If nothing opens, use "Create text to copy".';
    window.location.href = url;
  });

  document.getElementById('btn-text').addEventListener('click', function () {
    if (!check()) return;
    out.value = build(); box.hidden = false;
    msg.className = 'msg ok';
    msg.textContent = 'The text is ready below. Send it to ' + EMAIL + '.';
  });

  document.getElementById('btn-copy').addEventListener('click', function () {
    out.select();
    var done = function () { msg.className = 'msg ok'; msg.textContent = 'Copied.'; };
    if (navigator.clipboard) navigator.clipboard.writeText(out.value).then(done, function () { document.execCommand('copy'); done(); });
    else { document.execCommand('copy'); done(); }
  });
})();
