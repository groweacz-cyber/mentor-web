// Kvíz „Metal, nebo Pop?“. Odpovědi jsou jen v paměti stránky: nic se neukládá ani neodesílá.
// Sdílí se výhradně odkaz na kvíz, nikdy výsledek.
(function () {
  'use strict';

  var root = document.getElementById('kviz-root');
  var data = window.OCD_KVIZ;
  if (!root || !data || !data.otazky || !data.otazky.length) return;

  var qs = data.otazky;
  var total = qs.length;
  var answers = [];   // index zvolené odpovědi pro každou otázku
  var step = 0;
  var shareUrl = root.getAttribute('data-url') || window.location.href;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }
  function clear() { while (root.firstChild) root.removeChild(root.firstChild); }
  function focusHeading(h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: false }); }

  function renderQuestion(userAction) {
    clear();
    var q = qs[step];
    var card = el('div', 'kviz-card');

    card.appendChild(el('p', 'kviz-progress', 'Question ' + (step + 1) + ' of ' + total));
    var bar = el('div', 'kviz-bar');
    bar.setAttribute('aria-hidden', 'true');
    var fill = el('span');
    fill.style.width = ((step + 1) / total) * 100 + '%';
    bar.appendChild(fill);
    card.appendChild(bar);

    var h = el('h2', 'kviz-q', q.q);
    card.appendChild(h);

    var box = el('div', 'kviz-answers');
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Answers');
    q.a.forEach(function (ans, i) {
      var b = el('button', 'kviz-a', ans.t);
      b.type = 'button';
      b.setAttribute('aria-pressed', answers[step] === i ? 'true' : 'false');
      b.addEventListener('click', function () {
        answers[step] = i;
        answers.length = step + 1;
        if (step + 1 < total) { step++; renderQuestion(true); } else { renderResult(); }
      });
      box.appendChild(b);
    });
    card.appendChild(box);

    if (step > 0) {
      var back = el('button', 'btn btn-ghost btn-sm kviz-back', 'Back');
      back.type = 'button';
      back.addEventListener('click', function () { step--; renderQuestion(true); });
      card.appendChild(back);
    }
    root.appendChild(card);
    if (userAction) focusHeading(h);
  }

  function score() {
    var sum = 0;
    for (var i = 0; i < total; i++) sum += qs[i].a[answers[i]].p;
    return sum;
  }

  function renderResult() {
    var sum = score();
    var key = sum <= data.hranice.metalMax ? 'metal' : sum <= data.hranice.mezMax ? 'mezi' : 'pop';
    var res = data.vysledky[key];
    clear();
    var card = el('div', 'kviz-card kviz-result');
    card.appendChild(el('p', 'kviz-progress', 'Indicative result'));
    var h = el('h2', 'kviz-q', res.nazev);
    card.appendChild(h);
    card.appendChild(el('p', 'kviz-lead', res.text));
    card.appendChild(el('p', 'kviz-cesta', data.spolecne.cesta));
    card.appendChild(el('p', 'small disclaimer', data.spolecne.upozorneni));

    var cta = el('div', 'cta');
    var book = el('a', 'btn btn-cta', 'Book a free introductory consultation');
    book.href = '/kontakt';
    book.setAttribute('data-book', '');
    var form = el('a', 'btn btn-ghost', 'Fill in the intake questionnaire');
    form.href = '/dotaznik';
    var again = el('button', 'btn btn-ghost', 'Try again');
    again.type = 'button';
    again.addEventListener('click', function () { answers = []; step = 0; renderQuestion(true); });
    var share = el('button', 'btn btn-ghost', 'Send the quiz to someone');
    share.type = 'button';
    cta.appendChild(book); cta.appendChild(form); cta.appendChild(again); cta.appendChild(share);
    card.appendChild(cta);

    var msg = el('p', 'msg');
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    card.appendChild(msg);

    share.addEventListener('click', function () {
      var payload = { title: 'Metal or Pop?', text: 'A short quiz on which path in peer mentoring for OCD suits you.', url: shareUrl };
      if (navigator.share) {
        navigator.share(payload).catch(function () {});
        return;
      }
      var done = function () { msg.className = 'msg ok'; msg.textContent = 'The link to the quiz has been copied.'; };
      var fail = function () { msg.className = 'msg'; msg.textContent = 'Link to the quiz: ' + shareUrl; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(done, fail);
      } else {
        fail();
      }
    });

    root.appendChild(card);
    focusHeading(h);
  }

  renderQuestion(false);
}());
