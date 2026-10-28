// Vstupní dotazník: osm krátkých kroků, výsledek a doporučení cesty. Vlastní otázky, nic z chráněných škál.
import { data, save, uid, latestAssessment, fmtDateLong } from './store.js';
import { h, boot, gate, slider, $, crisisBlock } from './ui.js';
import { TOPICS, COMPULSIONS, IMPACT_LIMITS, TIME_OPTIONS, recommend, riskLevel, pathLabel, buildLadder, recommendedStart } from './data.js';

const root = $('#app-root');
boot(root);

const blankDraft = () => ({
  step: 0,
  topics: {},
  custom: { name: '', score: 0 },
  comp: { visible: [], mental: [], reassurance: [], other: '' },
  avoid: '',
  impact: { time: '', limits: [], note: '' },
  pillars: { accept: 5, trust: 5 },
  milestones: '',
  criteria: { belief: 5, functioning: 5, erp: '', ready: '' },
  safety: { hopeless: '', depressed: '', harm: '' },
});

function run() {
  const d = data();
  const last = latestAssessment();
  if (d.draft) wizard();
  else if (last) summary(last);
  else { d.draft = blankDraft(); save(); wizard(); }

  function checks(list, arr) {
    return h('div', { class: 'checks' }, list.map((t) => {
      const cb = h('input', { type: 'checkbox', checked: arr.includes(t) });
      cb.addEventListener('change', () => {
        const i = arr.indexOf(t);
        if (cb.checked && i < 0) arr.push(t);
        if (!cb.checked && i >= 0) arr.splice(i, 1);
        save();
      });
      return h('label', { class: 'check' }, cb, ' ' + t);
    }));
  }
  function area(id, label, hint, obj, key, max) {
    const t = h('textarea', { id, rows: 4, maxlength: max });
    t.value = obj[key] || '';
    t.addEventListener('input', () => { obj[key] = t.value; save(); });
    return h('div', { class: 'field' }, h('label', { for: id }, label, ' ', h('span', { class: 'hint' }, hint + ' Max. ' + max + ' znaků, stačí heslovitě.')), t);
  }
  function radios(name, label, opts, obj, key) {
    return h('fieldset', { class: 'chips' }, h('legend', {}, label), opts.map(([v, t]) => {
      const r = h('input', { type: 'radio', name, value: v, checked: obj[key] === v });
      r.addEventListener('change', () => { obj[key] = v; save(); });
      return h('label', { class: 'chip' }, r, h('span', {}, t));
    }));
  }

  function wizard() {
    const D = d.draft;
    const steps = [
      ['Mapa témat', () => {
        const box = h('div', {}, h('p', { class: 'hint' }, 'Ke každému tématu nastavte, jak silnou úzkost vám dnes způsobuje. 0 = žádnou. Co se vás netýká, nechte na 0.'));
        TOPICS.forEach(([id, name, desc]) => {
          const s = slider('t-' + id, name, '– ' + desc, D.topics[id] || 0);
          s.querySelector('input').addEventListener('input', (e) => { D.topics[id] = +e.target.value; save(); });
          box.append(s);
        });
        const nm = h('input', { type: 'text', id: 'cn', maxlength: 40 });
        nm.value = D.custom.name;
        nm.addEventListener('input', () => { D.custom.name = nm.value; save(); });
        box.append(h('div', { class: 'field' }, h('label', { for: 'cn' }, 'Vlastní téma ', h('span', { class: 'hint' }, '(nepovinné)')), nm));
        const cs = slider('cs', 'Úzkost u vlastního tématu', '', D.custom.score);
        cs.querySelector('input').addEventListener('input', (e) => { D.custom.score = +e.target.value; save(); });
        box.append(cs);
        return box;
      }],
      ['Kompulze', () => h('div', {},
        h('p', { class: 'hint' }, 'Co děláte, aby napětí rychle opadlo? Zaškrtněte, co platí.'),
        h('h3', {}, 'Viditelné'), checks(COMPULSIONS.visible, D.comp.visible),
        h('h3', {}, 'Mentální'), checks(COMPULSIONS.mental, D.comp.mental),
        h('h3', {}, 'Ujišťování'), checks(COMPULSIONS.reassurance, D.comp.reassurance),
        area('co', 'Jiné', '(nepovinné)', D.comp, 'other', 200))],
      ['Vyhýbání', () => area('av', 'Čemu se vyhýbáte?', 'Místa, lidé, předměty, situace, témata.', D, 'avoid', 300)],
      ['Dopad na život', () => {
        const sel = h('select', { id: 'ti' }, h('option', { value: '' }, '– vyberte –'), TIME_OPTIONS.map((t) => h('option', { value: t, selected: D.impact.time === t }, t)));
        sel.addEventListener('change', () => { D.impact.time = sel.value; save(); });
        return h('div', {},
          h('div', { class: 'field' }, h('label', { for: 'ti' }, 'Kolik času denně vám OCD zabírá?'), sel),
          h('p', { class: 'hint' }, 'Co vám OCD omezuje?'), checks(IMPACT_LIMITS, D.impact.limits),
          area('im', 'Upřesnění', '(nepovinné)', D.impact, 'note', 200));
      }],
      ['Pilíře', () => {
        const a = slider('pa', 'Sebepřijetí', '– 0 = nepřijímám se vůbec, 10 = přijímám se celý/celá', D.pillars.accept);
        const b = slider('pb', 'Sebedůvěra', '– 0 = nevěřím, že si s obtížemi poradím, 10 = věřím, že když přijde obtíž, najdu způsob, jak ji řešit', D.pillars.trust);
        a.querySelector('input').addEventListener('input', (e) => { D.pillars.accept = +e.target.value; save(); });
        b.querySelector('input').addEventListener('input', (e) => { D.pillars.trust = +e.target.value; save(); });
        return h('div', {}, h('p', { class: 'hint' }, 'Odhad dnešního stavu. Slouží jen k tomu, abyste později viděli pokrok.'), a, b);
      }],
      ['Milníky (nepovinné)', () => area('mi', 'Kdy se strach objevil nebo zesílil?', 'Stačí rok nebo období. Bolestné vzpomínky a trauma patří k terapeutovi.', D, 'milestones', 300)],
      ['Výběr cesty', () => {
        const a = slider('cb', 'Jak moc věříte, že se obava může splnit?', '– 0 = vím, že jde o OCD, 10 = jsem si jistý/á', D.criteria.belief);
        const b = slider('cf', 'Jak se vám daří fungovat v běžném dni?', '– 0 = vůbec, 10 = bez potíží', D.criteria.functioning);
        a.querySelector('input').addEventListener('input', (e) => { D.criteria.belief = +e.target.value; save(); });
        b.querySelector('input').addEventListener('input', (e) => { D.criteria.functioning = +e.target.value; save(); });
        return h('div', {}, a, b,
          radios('erp', 'Zkoušeli jste už expozici (ERP)?', [['zadne', 'Ne'], ['vzdal', 'Ano, vzdal/a jsem to nebo mě to zahltilo'], ['pomohlo', 'Ano, pomohlo to']], D.criteria, 'erp'),
          radios('rdy', 'Jste připraveni jít do strachu hned?', [['ano', 'Ano'], ['castecne', 'Částečně'], ['ne', 'Zatím ne']], D.criteria, 'ready'));
      }],
      ['Bezpečnost', () => h('div', {},
        h('p', { class: 'hint' }, 'Tři krátké otázky. Slouží k vaší bezpečnosti, ne k hodnocení.'),
        radios('s1', 'Cítím beznaděj nebo že to nemá smysl.', [['ne', 'Ne'], ['obcas', 'Občas'], ['casto', 'Často']], D.safety, 'hopeless'),
        radios('s2', 'Většinu dní mám smutnou, prázdnou náladu a nic mě netěší.', [['ne', 'Ne'], ['obcas', 'Občas'], ['casto', 'Často']], D.safety, 'depressed'),
        radios('s3', 'Mám myšlenky, že si ublížím nebo že nechci žít.', [['ne', 'Ne'], ['obcas', 'Občas'], ['casto', 'Často']], D.safety, 'harm'))],
    ];
    const msg = h('p', { class: 'msg', role: 'alert' });

    function show() {
      const i = D.step;
      const [title, build] = steps[i];
      const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': steps.length, 'aria-valuenow': i + 1, 'aria-label': 'Postup dotazníkem' }, h('span', { style: 'width:' + ((i + 1) / steps.length) * 100 + '%' }));
      const nav = h('div', { class: 'actions' },
        i > 0 ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => go(-1) }, 'Zpět') : null,
        h('button', { class: 'btn', type: 'button', onclick: () => go(1) }, i === steps.length - 1 ? 'Dokončit' : 'Dál'));
      msg.textContent = '';
      root.replaceChildren(
        h('p', { class: 'small' }, 'Krok ' + (i + 1) + ' z ' + steps.length), bar,
        h('div', { class: 'card app-card' }, h('h2', {}, title), build()), nav, msg,
        h('p', { class: 'small' }, 'Průběžně se ukládá jen ve vašem zařízení. Můžete kdykoli odejít a vrátit se.'));
      window.scrollTo(0, 0);
    }
    function go(dir) {
      if (dir > 0 && D.step === steps.length - 1) {
        const s = D.safety;
        if (!s.hopeless || !s.depressed || !s.harm) { msg.textContent = 'Odpovězte prosím na všechny tři otázky.'; return; }
        finish();
        return;
      }
      D.step = Math.max(0, Math.min(steps.length - 1, D.step + dir));
      save();
      show();
    }
    function finish() {
      const topics = TOPICS.map(([id, name]) => ({ id, name, score: D.topics[id] || 0 }));
      if (D.custom.name.trim() && D.custom.score > 0) topics.push({ id: 'vlastni-' + uid(), name: D.custom.name.trim(), score: D.custom.score });
      const reco = recommend(D.criteria);
      const a = { id: uid(), at: Date.now(), topics, comp: D.comp, avoid: D.avoid, impact: D.impact, pillars: D.pillars, milestones: D.milestones, criteria: D.criteria, safety: D.safety, reco };
      d.assessments.push(a);
      d.draft = null;
      const items = buildLadder(a);
      const rec = recommendedStart(items, d.progress.done);
      if (!items.some((i) => i.id === d.progress.active)) d.progress.active = rec ? rec.id : null;
      save();
      summary(a, true);
    }
    show();
  }

  function avg(a) {
    const t = a.topics.filter((x) => x.score > 0);
    return t.length ? t.reduce((s, x) => s + x.score, 0) / t.length : 0;
  }

  function summary(a, fresh) {
    const risk = riskLevel(a.safety);
    const prev = d.assessments.length > 1 ? d.assessments[d.assessments.length - 2] : null;
    const out = [];
    if (fresh) out.push(h('h2', {}, 'Hotovo. Děkuji, že jste to zvládli.'));
    else out.push(h('p', {}, 'Poslední dotazník: ' + fmtDateLong(a.at) + '.'));
    if (risk === 'high') {
      out.push(crisisBlock());
      out.push(h('p', {}, 'Podle vašich odpovědí doporučuji nejdřív kontakt s odborníkem. Samostatnou práci s aplikací teď nedoporučuji.'));
    } else if (risk === 'mild') {
      out.push(h('p', { class: 'callout-inline' }, 'U beznaděje nebo nálady jste uvedli „občas“. Zmiňte to při nejbližší návštěvě lékaře nebo terapeuta. Kdyby to zesílilo, ozvěte se dřív.'));
    }
    const notes = [];
    if (a.reco.path === 'pop') notes.push('Pop cesta: orientačně 4–8 týdnů stabilizace a porozumění pochybnosti (I-CBT), pak přechod k postupným expozicím.');
    if (a.reco.path === 'metal') notes.push('Metal cesta: rovnou expozice se zábranou reakce (ERP). ERP je odborná metoda, ideální je mít při ní i odborníka.');
    if (a.reco.path === 'mezi') notes.push('Je to spektrum: můžete střídat stabilizaci a expozice podle dne a síly.');
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Doporučená cesta: ' + pathLabel(a.reco.path)),
      h('p', { class: 'small' }, 'Je to nápověda podle kritérií, ne rozhodnutí. Cestu můžete kdykoli změnit nebo je kombinovat.'),
      h('ul', { class: 'rules' }, a.reco.reasons.map((r) => h('li', {}, r))),
      notes.map((n) => h('p', {}, n))));
    if (prev) {
      out.push(h('div', { class: 'card app-card' }, h('h3', {}, 'Porovnání s předchozím dotazníkem'),
        h('ul', { class: 'rules' },
          h('li', {}, 'Průměrná úzkost u témat: ' + avg(prev).toFixed(1) + ' → ' + avg(a).toFixed(1)),
          h('li', {}, 'Sebepřijetí: ' + prev.pillars.accept + ' → ' + a.pillars.accept),
          h('li', {}, 'Sebedůvěra: ' + prev.pillars.trust + ' → ' + a.pillars.trust))));
    }
    out.push(h('div', { class: 'actions' },
      h('a', { class: 'btn', href: '/aplikace/zebricek' }, 'Zobrazit žebříček'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { d.draft = blankDraft(); save(); wizard(); } }, 'Zopakovat dotazník')));
    root.replaceChildren(...out);
    window.scrollTo(0, 0);
  }
}

if (gate(root)) run();
