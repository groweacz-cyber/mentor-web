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
    return h('div', { class: 'field' }, h('label', { for: id }, label, ' ', h('span', { class: 'hint' }, hint + ' Max. ' + max + ' znakov, stačí heslovito.')), t);
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
      ['Mapa tém', () => {
        const box = h('div', {}, h('p', { class: 'hint' }, 'Ku každej téme nastavte, ako silnú úzkosť vám dnes spôsobuje. 0 = žiadnu. Čo sa vás netýka, nechajte na 0.'));
        TOPICS.forEach(([id, name, desc]) => {
          const s = slider('t-' + id, name, '– ' + desc, D.topics[id] || 0);
          s.querySelector('input').addEventListener('input', (e) => { D.topics[id] = +e.target.value; save(); });
          box.append(s);
        });
        const nm = h('input', { type: 'text', id: 'cn', maxlength: 40 });
        nm.value = D.custom.name;
        nm.addEventListener('input', () => { D.custom.name = nm.value; save(); });
        box.append(h('div', { class: 'field' }, h('label', { for: 'cn' }, 'Vlastná téma ', h('span', { class: 'hint' }, '(nepovinné)')), nm));
        const cs = slider('sk', 'Úzkosť pri vlastnej téme', '', D.custom.score);
        cs.querySelector('input').addEventListener('input', (e) => { D.custom.score = +e.target.value; save(); });
        box.append(cs);
        return box;
      }],
      ['Kompulzie', () => h('div', {},
        h('p', { class: 'hint' }, 'Čo robíte, aby napätie rýchlo opadlo? Zaškrtnite, čo platí.'),
        h('h3', {}, 'Viditeľné'), checks(COMPULSIONS.visible, D.comp.visible),
        h('h3', {}, 'Mentálne'), checks(COMPULSIONS.mental, D.comp.mental),
        h('h3', {}, 'Uisťovanie'), checks(COMPULSIONS.reassurance, D.comp.reassurance),
        area('co', 'Iné', '(nepovinné)', D.comp, 'other', 200))],
      ['Vyhýbanie sa', () => area('av', 'Čomu sa vyhýbate?', 'Miesta, ľudia, predmety, situácie, témy.', D, 'avoid', 300)],
      ['Dopad na život', () => {
        const sel = h('select', { id: 'ti' }, h('option', { value: '' }, '– vyberte –'), TIME_OPTIONS.map((t) => h('option', { value: t, selected: D.impact.time === t }, t)));
        sel.addEventListener('change', () => { D.impact.time = sel.value; save(); });
        return h('div', {},
          h('div', { class: 'field' }, h('label', { for: 'ti' }, 'Koľko času denne vám OCD zaberá?'), sel),
          h('p', { class: 'hint' }, 'Čo vám OCD obmedzuje?'), checks(IMPACT_LIMITS, D.impact.limits),
          area('im', 'Upresnenie', '(nepovinné)', D.impact, 'note', 200));
      }],
      ['Piliere', () => {
        const a = slider('pa', 'Sebaprijatie', '– 0 = neprijímam sa vôbec, 10 = prijímam sa celý/celá', D.pillars.accept);
        const b = slider('pb', 'Sebadôvera', '– 0 = neverím, že si s ťažkosťami poradím, 10 = verím, že keď príde ťažkosť, nájdem spôsob, ako ju riešiť', D.pillars.trust);
        a.querySelector('input').addEventListener('input', (e) => { D.pillars.accept = +e.target.value; save(); });
        b.querySelector('input').addEventListener('input', (e) => { D.pillars.trust = +e.target.value; save(); });
        return h('div', {}, h('p', { class: 'hint' }, 'Odhad dnešného stavu. Slúži len na to, aby ste neskôr videli pokrok.'), a, b);
      }],
      ['Míľniky (nepovinné)', () => area('mi', 'Kedy sa strach objavil alebo zosilnel?', 'Stačí rok alebo obdobie. Bolestivé spomienky a trauma patria k terapeutovi.', D, 'milestones', 300)],
      ['Výber cesty', () => {
        const a = slider('cb', 'Ako veľmi veríte, že sa obava môže splniť?', '– 0 = viem, že ide o OCD, 10 = som si istý/á', D.criteria.belief);
        const b = slider('cf', 'Ako sa vám darí fungovať v bežnom dni?', '– 0 = vôbec, 10 = bez ťažkostí', D.criteria.functioning);
        a.querySelector('input').addEventListener('input', (e) => { D.criteria.belief = +e.target.value; save(); });
        b.querySelector('input').addEventListener('input', (e) => { D.criteria.functioning = +e.target.value; save(); });
        return h('div', {}, a, b,
          radios('erp', 'Skúšali ste už expozíciu (ERP)?', [['zadne', 'Ne'], ['vzdal', 'Áno, vzdal/a som to alebo ma to zahltilo'], ['pomohlo', 'Áno, pomohlo to']], D.criteria, 'erp'),
          radios('rdy', 'Ste pripravení ísť do strachu hneď?', [['ano', 'Ano'], ['castecne', 'Čiastočne'], ['ne', 'Zatiaľ nie']], D.criteria, 'ready'));
      }],
      ['Bezpečnosť', () => h('div', {},
        h('p', { class: 'hint' }, 'Tri krátke otázky. Slúžia na vašu bezpečnosť, nie na hodnotenie.'),
        radios('s1', 'Cítim beznádej alebo že to nemá zmysel.', [['ne', 'Ne'], ['obcas', 'Občas'], ['casto', 'Často']], D.safety, 'hopeless'),
        radios('s2', 'Väčšinu dní mám smutnú, prázdnu náladu a nič ma netešia.', [['ne', 'Ne'], ['obcas', 'Občas'], ['casto', 'Často']], D.safety, 'depressed'),
        radios('s3', 'Mám myšlienky, že si ublížim alebo že nechcem žiť.', [['ne', 'Ne'], ['obcas', 'Občas'], ['casto', 'Často']], D.safety, 'harm'))],
    ];
    const msg = h('p', { class: 'msg', role: 'alert' });

    function show() {
      const i = D.step;
      const [title, build] = steps[i];
      const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': steps.length, 'aria-valuenow': i + 1, 'aria-label': 'Postup dotazníkom' }, h('span', { style: 'width:' + ((i + 1) / steps.length) * 100 + '%' }));
      const nav = h('div', { class: 'actions' },
        i > 0 ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => go(-1) }, 'Späť') : null,
        h('button', { class: 'btn', type: 'button', onclick: () => go(1) }, i === steps.length - 1 ? 'Dokončiť' : 'Ďalej'));
      msg.textContent = '';
      root.replaceChildren(
        h('p', { class: 'small' }, 'Krok ' + (i + 1) + ' z ' + steps.length), bar,
        h('div', { class: 'card app-card' }, h('h2', {}, title), build()), nav, msg,
        h('p', { class: 'small' }, 'Priebežne sa ukladá len vo vašom zariadení. Môžete kedykoľvek odísť a vrátiť sa.'));
      window.scrollTo(0, 0);
    }
    function go(dir) {
      if (dir > 0 && D.step === steps.length - 1) {
        const s = D.safety;
        if (!s.hopeless || !s.depressed || !s.harm) { msg.textContent = 'Odpovedzte prosím na všetky tri otázky.'; return; }
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
    if (fresh) out.push(h('h2', {}, 'Hotovo. Ďakujem, že ste to zvládli.'));
    else out.push(h('p', {}, 'Posledný dotazník: ' + fmtDateLong(a.at) + '.'));
    if (risk === 'high') {
      out.push(crisisBlock());
      out.push(h('p', {}, 'Podľa vašich odpovedí odporúčam najprv kontakt s odborníkom. Samostatnú prácu s aplikáciou teraz neodporúčam.'));
    } else if (risk === 'mild') {
      out.push(h('p', { class: 'callout-inline' }, 'Pri beznádeji alebo nálade ste uviedli „občas“. Spomeňte to pri najbližšej návšteve lekára alebo terapeuta. Keby to zosilnelo, ozvite sa skôr.'));
    }
    const notes = [];
    if (a.reco.path === 'pop') notes.push('Pop cesta: orientačne 4–8 týždňov stabilizácie a porozumenia pochybnosti (I-CBT), potom prechod k postupným expozíciám.');
    if (a.reco.path === 'metal') notes.push('Metal cesta: hneď expozície s prevenciou reakcie (ERP). ERP je odborná metóda, ideálne je mať pri nej aj odborníka.');
    if (a.reco.path === 'mezi') notes.push('Je to spektrum: môžete striedať stabilizáciu a expozície podľa dňa a sily.');
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Odporúčaná cesta: ' + pathLabel(a.reco.path)),
      h('p', { class: 'small' }, 'Je to nápoveda podľa kritérií, nie rozhodnutie. Cestu môžete kedykoľvek zmeniť alebo ich kombinovať.'),
      h('ul', { class: 'rules' }, a.reco.reasons.map((r) => h('li', {}, r))),
      notes.map((n) => h('p', {}, n))));
    if (prev) {
      out.push(h('div', { class: 'card app-card' }, h('h3', {}, 'Porovnanie s predchádzajúcim dotazníkom'),
        h('ul', { class: 'rules' },
          h('li', {}, 'Priemerná úzkosť pri témach: ' + avg(prev).toFixed(1) + ' → ' + avg(a).toFixed(1)),
          h('li', {}, 'Sebaprijatie: ' + prev.pillars.accept + ' → ' + a.pillars.accept),
          h('li', {}, 'Sebadôvera: ' + prev.pillars.trust + ' → ' + a.pillars.trust))));
    }
    out.push(h('div', { class: 'actions' },
      h('a', { class: 'btn', href: '/aplikace/zebricek' }, 'Zobraziť rebríček'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { d.draft = blankDraft(); save(); wizard(); } }, 'Zopakovať dotazník')));
    root.replaceChildren(...out);
    window.scrollTo(0, 0);
  }
}

if (gate(root)) run();
