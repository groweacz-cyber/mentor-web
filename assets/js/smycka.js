// Dekorativní smyčka na stránce /metoda: s postupem scrollu přes čtyři pilíře se rozmotává
// z napjaté spirály do klidné, otevřené křivky. Žádné ukládání, žádné požadavky na server.
(function () {
  'use strict';

  var rail = document.getElementById('smycka');
  if (!rail) return;
  var svg = rail.querySelector('svg');
  var segs = rail.querySelectorAll('.lp-seg');
  var dot = rail.querySelector('.lp-dot');
  var layout = rail.parentNode;
  var pillars = layout.querySelectorAll('.pillars li');
  if (!svg || segs.length !== 4 || pillars.length !== 4) return;

  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqNarrow = window.matchMedia('(max-width: 56rem)');

  var N = 240;                 // počet bodů křivky
  var FRONT = 0.15;            // šířka „fronty“ rozmotávání (podíl délky linky)
  var TENSE = [63, 77, 102];   // tlumená tmavší barva (napětí)
  var WARM = [245, 146, 62];   // teplý akcent webu (uvolnění)

  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function mix(t) {
    return 'rgb(' + Math.round(lerp(TENSE[0], WARM[0], t)) + ',' + Math.round(lerp(TENSE[1], WARM[1], t)) + ',' + Math.round(lerp(TENSE[2], WARM[2], t)) + ')';
  }

  // f = 0 (napjatá spirála) … 4 (klidná otevřená křivka); active = index zvýrazněného úseku nebo -1
  function draw(f, active, horiz) {
    var along = 640, cross = horiz ? 96 : 140, cx = cross / 2, margin = 12;
    var rT = cross * 0.27, rO = cross * 0.11;
    var omT = Math.PI * 2 * 13, omO = Math.PI * 2 * 1.1;
    var L = along - 2 * margin - 2 * rT;
    var F = (f / 4) * (1 + FRONT);

    var l = [], th = [0], cum = [0], i, s, lm;
    for (i = 0; i <= N; i++) {
      s = i / N;
      l[i] = smooth((F - s) / FRONT);
      if (i > 0) {
        lm = (l[i] + l[i - 1]) / 2;
        th[i] = th[i - 1] + lerp(omT, omO, lm) / N;
        cum[i] = cum[i - 1] + lerp(0.3, 1, lm) / N;
      }
    }

    var pts = [];
    for (i = 0; i <= N; i++) {
      var R = lerp(rT, rO, l[i]);
      var k = lerp(1, 0, l[i]);
      var up = margin + (cum[i] / cum[N]) * L + k * R * (1 - Math.cos(th[i]));
      var c = cx + R * Math.sin(th[i]);
      pts.push(horiz ? [up, c] : [c, along - up]);
    }

    var per = N / 4;
    for (var q = 0; q < 4; q++) {
      var d = '', sum = 0;
      for (i = q * per; i <= (q + 1) * per; i++) {
        d += (i === q * per ? 'M' : 'L') + pts[i][0].toFixed(1) + ' ' + pts[i][1].toFixed(1);
        sum += l[i];
      }
      segs[q].setAttribute('d', d);
      segs[q].setAttribute('stroke', mix(sum / (per + 1)));
      segs[q].setAttribute('stroke-width', q === active ? 5 : 3.2);
      segs[q].setAttribute('opacity', active === -1 || q === active ? 1 : 0.5);
    }
    var last = pts[N];
    dot.setAttribute('cx', last[0].toFixed(1));
    dot.setAttribute('cy', last[1].toFixed(1));
    dot.setAttribute('opacity', l[N]);
  }

  // Průběh podle pozice scrollu: fáze i trvá od horní hrany pilíře i k horní hraně pilíře i+1.
  function progress() {
    var ref = window.innerHeight * 0.6;
    var edges = [];
    for (var i = 0; i < 4; i++) edges.push(pillars[i].getBoundingClientRect().top);
    edges.push(pillars[3].getBoundingClientRect().bottom);
    if (ref <= edges[0]) return 0;
    for (var j = 0; j < 4; j++) {
      if (ref < edges[j + 1]) return j + (ref - edges[j]) / (edges[j + 1] - edges[j]);
    }
    return 4;
  }

  var ticking = false;
  var lastKey = '';

  function render() {
    ticking = false;
    var horiz = mqNarrow.matches;
    svg.setAttribute('viewBox', horiz ? '0 0 640 96' : '0 0 140 640');
    if (mqReduce.matches) {
      draw(4, -1, horiz);
      return;
    }
    var f = progress();
    var active = f <= 0 ? -1 : Math.min(3, Math.floor(f));
    var key = f.toFixed(3) + '|' + active + '|' + horiz;
    if (key === lastKey) return;
    lastKey = key;
    draw(f, active, horiz);
  }

  function request() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(render); }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  if (mqReduce.addEventListener) {
    mqReduce.addEventListener('change', function () { lastKey = ''; request(); });
    mqNarrow.addEventListener('change', function () { lastKey = ''; request(); });
  }
  render();
}());
