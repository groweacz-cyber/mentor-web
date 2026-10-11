// Převede formulář na text. Nic se neodesílá na server ani neukládá.
(function () {
  var EMAIL = 'EMAIL@DOPLNIT.cz';
  var BRAND = '[NÁZEV]';
  var form = document.getElementById('dotaznik');
  var msg = document.getElementById('msg');
  var box = document.getElementById('vystup');
  var out = document.getElementById('vystup-text');

  // živé zobrazení hodnot posuvníků
  form.querySelectorAll('input[type="range"]').forEach(function (r) {
    var o = r.parentNode.querySelector('output');
    r.addEventListener('input', function () { o.textContent = r.value; });
  });

  function build() {
    var lines = ['Vstupní dotazník – ' + BRAND, ''];
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
      msg.textContent = 'Pro odeslání je potřeba zaškrtnout souhlas se zpracováním.';
      c.focus();
      return false;
    }
    return true;
  }

  document.getElementById('btn-mail').addEventListener('click', function () {
    if (!check()) return;
    var text = build();
    var url = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Vstupní dotazník') + '&body=' + encodeURIComponent(text);
    if (url.length > 1900) {
      out.value = text; box.hidden = false;
      msg.className = 'msg';
      msg.textContent = 'Odpovědi jsou příliš dlouhé pro předvyplněný e-mail. Zkopírujte text níže a vložte ho do e-mailu.';
      return;
    }
    msg.className = 'msg ok';
    msg.textContent = 'Otevírám e-mail. Pokud se nic neotevře, použijte „Vytvořit text ke zkopírování“.';
    window.location.href = url;
  });

  document.getElementById('btn-text').addEventListener('click', function () {
    if (!check()) return;
    out.value = build(); box.hidden = false;
    msg.className = 'msg ok';
    msg.textContent = 'Text je připraven níže. Pošlete ho na ' + EMAIL + '.';
  });

  document.getElementById('btn-copy').addEventListener('click', function () {
    out.select();
    var done = function () { msg.className = 'msg ok'; msg.textContent = 'Zkopírováno.'; };
    if (navigator.clipboard) navigator.clipboard.writeText(out.value).then(done, function () { document.execCommand('copy'); done(); });
    else { document.execCommand('copy'); done(); }
  });
})();
