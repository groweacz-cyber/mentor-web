// Kalkulačka „Kolik času mi bere OCD“. Nic se neukládá ani neodesílá, počítá se jen v prohlížeči.
(function () {
  'use strict';

  var root = document.getElementById('calc');
  var out = document.getElementById('calc-result');
  if (!root || !out) return;

  var inputs = root.querySelectorAll('input[type="range"]');
  var nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });

  function minLabel(v) {
    var n = parseInt(v, 10);
    if (!n) return '0 min';
    var h = Math.floor(n / 60);
    var m = n % 60;
    return (h ? h + ' h' : '') + (h && m ? ' ' : '') + (m ? m + ' min' : '');
  }

  function tile(num, label) {
    var d = document.createElement('div');
    d.className = 'calc-tile';
    var s = document.createElement('strong');
    s.textContent = num;
    var p = document.createElement('span');
    p.textContent = label;
    d.appendChild(s);
    d.appendChild(p);
    return d;
  }

  function update() {
    var total = 0;
    for (var i = 0; i < inputs.length; i++) {
      var v = parseInt(inputs[i].value, 10) || 0;
      total += v;
      var o = inputs[i].parentNode.querySelector('output');
      if (o) o.textContent = minLabel(v);
      inputs[i].style.setProperty('--p', (v / (parseInt(inputs[i].max, 10) || 480)) * 100 + '%');
      inputs[i].setAttribute('aria-valuetext', minLabel(v) + ' denně');
    }
    while (out.firstChild) out.removeChild(out.firstChild);
    if (!total) {
      var p = document.createElement('p');
      p.className = 'calc-empty';
      p.textContent = 'Posuňte posuvníky a uvidíte výsledek.';
      out.appendChild(p);
      return;
    }
    var hoursWeek = (total * 7) / 60;
    var daysYear = (total * 365) / 1440;
    var weekends = daysYear / 2;
    var lead = document.createElement('p');
    lead.className = 'calc-lead';
    lead.textContent = 'Dohromady ' + minLabel(total) + ' denně. To je:';
    out.appendChild(lead);
    var grid = document.createElement('div');
    grid.className = 'calc-tiles';
    grid.appendChild(tile(nf.format(hoursWeek), 'hodin týdně'));
    grid.appendChild(tile(nf.format(daysYear), 'dnů ročně (po 24 hodinách)'));
    grid.appendChild(tile(nf.format(weekends), 'víkendů ročně (po 2 dnech)'));
    out.appendChild(grid);
  }

  for (var i = 0; i < inputs.length; i++) inputs[i].addEventListener('input', update);
  update();
}());
