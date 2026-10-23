// Interaktivní smyčka OCD na úvodní stránce. Texty jsou v smycka-faze.js.
// Nic se neukládá ani neodesílá, žádné automatické přehrávání.
(function () {
  'use strict';

  var root = document.getElementById('lp-root');
  var data = window.OCD_SMYCKA;
  if (!root || !data || !data.faze || !data.faze.length) return;
  while (root.firstChild) root.removeChild(root.firstChild);

  var faze = data.faze;
  var n = faze.length;
  var current = 0;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function pos(i, r) {
    var a = (i * 2 * Math.PI) / n;
    return [50 + r * Math.sin(a), 50 - r * Math.cos(a)];
  }
  function detailBlocks(parent, f) {
    var p1 = el('p', 'lp-label', 'Co se děje');
    var t1 = el('p', 'lp-text', f.co);
    var p2 = el('p', 'lp-label', 'Co s tím dělá metoda');
    var t2 = el('p', 'lp-text', f.metoda);
    parent.appendChild(p1); parent.appendChild(t1); parent.appendChild(p2); parent.appendChild(t2);
  }

  var grid = el('div', 'lp-grid');

  /* ===== Kruh (desktop) ===== */
  var circle = el('div', 'lp-circle');
  circle.setAttribute('role', 'group');
  circle.setAttribute('aria-label', 'Fáze smyčky OCD');

  var svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'lp-ring');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  var R = 37;
  for (var s = 0; s < n; s++) {
    var a = pos(s, R), b = pos((s + 1) % n, R);
    var arc = document.createElementNS(SVGNS, 'path');
    arc.setAttribute('d', 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 0 1 ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2));
    arc.setAttribute('class', 'lp-arc' + (faze[s].zlom ? ' lp-arc-break' : ''));
    svg.appendChild(arc);
    var midAngle = ((s + 0.5) * 360) / n;
    var m = pos(s + 0.5, R);
    var head = document.createElementNS(SVGNS, 'path');
    head.setAttribute('d', 'M-2.4 -2.8 L2.4 0 L-2.4 2.8 Z');
    head.setAttribute('transform', 'translate(' + m[0].toFixed(2) + ' ' + m[1].toFixed(2) + ') rotate(' + midAngle.toFixed(2) + ')');
    head.setAttribute('class', 'lp-head' + (faze[s].zlom ? ' lp-head-break' : ''));
    svg.appendChild(head);
  }
  circle.appendChild(svg);

  var center = el('p', 'lp-center', data.stred);
  circle.appendChild(center);

  var nodes = [];
  faze.forEach(function (f, i) {
    var p = pos(i, R);
    var btn = el('button', 'lp-node' + (f.zlom ? ' is-break' : ''));
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.style.left = p[0].toFixed(2) + '%';
    btn.style.top = p[1].toFixed(2) + '%';
    btn.appendChild(el('span', 'lp-num', String(i + 1)));
    btn.appendChild(el('span', 'lp-name', f.nazev));
    btn.addEventListener('click', function () { select(i); });
    circle.appendChild(btn);
    nodes.push(btn);
  });
  grid.appendChild(circle);

  /* ===== Panel + ovládání (desktop) ===== */
  var side = el('div', 'lp-side');
  var panel = el('div', 'lp-panel');
  panel.setAttribute('aria-live', 'polite');
  side.appendChild(panel);
  var controls = el('div', 'lp-controls');
  var prev = el('button', 'btn btn-ghost btn-sm', 'Předchozí fáze');
  var next = el('button', 'btn btn-ghost btn-sm', 'Další fáze');
  prev.type = 'button'; next.type = 'button';
  prev.addEventListener('click', function () { select((current - 1 + n) % n); });
  next.addEventListener('click', function () { select((current + 1) % n); });
  controls.appendChild(prev); controls.appendChild(next);
  side.appendChild(controls);
  grid.appendChild(side);

  /* ===== Seznam / akordeon (mobil) ===== */
  var list = el('ol', 'lp-list');
  var items = [], details = [];
  faze.forEach(function (f, i) {
    var li = el('li', 'lp-li' + (f.zlom ? ' is-break' : ''));
    var btn = el('button', 'lp-item');
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.appendChild(el('span', 'lp-num', String(i + 1)));
    btn.appendChild(el('span', 'lp-name', f.nazev));
    btn.addEventListener('click', function () { select(i); });
    var det = el('div', 'lp-detail');
    det.setAttribute('aria-live', 'polite');
    detailBlocks(det, f);
    det.hidden = true;
    li.appendChild(btn);
    li.appendChild(det);
    li.appendChild(el('span', 'lp-down', i < n - 1 ? '↓' : data.znovu));
    list.appendChild(li);
    items.push(btn);
    details.push(det);
  });
  grid.appendChild(list);

  root.appendChild(grid);

  function select(i) {
    current = i;
    for (var k = 0; k < n; k++) {
      var on = k === i;
      nodes[k].setAttribute('aria-pressed', on ? 'true' : 'false');
      items[k].setAttribute('aria-pressed', on ? 'true' : 'false');
      details[k].hidden = !on;
    }
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    var h = el('h3', 'lp-title', (i + 1) + '. ' + faze[i].nazev);
    panel.appendChild(h);
    detailBlocks(panel, faze[i]);
  }

  select(0);
}());
