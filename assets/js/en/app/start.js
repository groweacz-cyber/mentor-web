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
    return h('div', { class: 'field' }, h('label', { for: id }, label, ' ', h('span', { class: 'hint' }, hint + ' Max. ' + max + ' characters, key words are enough.')), t);
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
      ['Map of themes', () => {
        const box = h('div', {}, h('p', { class: 'hint' }, 'For each theme set how strong an anxiety it causes you today. 0 = none. Leave on 0 whatever does not concern you.'));
        TOPICS.forEach(([id, name, desc]) => {
          const s = slider('t-' + id, name, '– ' + desc, D.topics[id] || 0);
          s.querySelector('input').addEventListener('input', (e) => { D.topics[id] = +e.target.value; save(); });
          box.append(s);
        });
        const nm = h('input', { type: 'text', id: 'cn', maxlength: 40 });
        nm.value = D.custom.name;
        nm.addEventListener('input', () => { D.custom.name = nm.value; save(); });
        box.append(h('div', { class: 'field' }, h('label', { for: 'cn' }, 'Own theme ', h('span', { class: 'hint' }, '(optional)')), nm));
        const cs = slider('en', 'Anxiety about your own theme', '', D.custom.score);
        cs.querySelector('input').addEventListener('input', (e) => { D.custom.score = +e.target.value; save(); });
        box.append(cs);
        return box;
      }],
      ['Compulsions', () => h('div', {},
        h('p', { class: 'hint' }, 'What do you do to make the tension drop quickly? Tick whatever applies.'),
        h('h3', {}, 'Visible'), checks(COMPULSIONS.visible, D.comp.visible),
        h('h3', {}, 'Mental'), checks(COMPULSIONS.mental, D.comp.mental),
        h('h3', {}, 'Reassurance'), checks(COMPULSIONS.reassurance, D.comp.reassurance),
        area('co', 'Other', '(optional)', D.comp, 'other', 200))],
      ['Avoidance', () => area('av', 'What do you avoid?', 'Places, people, objects, situations, topics.', D, 'avoid', 300)],
      ['Impact on life', () => {
        const sel = h('select', { id: 'ti' }, h('option', { value: '' }, '– choose –'), TIME_OPTIONS.map((t) => h('option', { value: t, selected: D.impact.time === t }, t)));
        sel.addEventListener('change', () => { D.impact.time = sel.value; save(); });
        return h('div', {},
          h('div', { class: 'field' }, h('label', { for: 'ti' }, 'How much time a day does OCD take?'), sel),
          h('p', { class: 'hint' }, 'What does OCD limit for you?'), checks(IMPACT_LIMITS, D.impact.limits),
          area('im', 'Details', '(optional)', D.impact, 'note', 200));
      }],
      ['Pillars', () => {
        const a = slider('pa', 'Self-acceptance', '– 0 = I do not accept myself at all, 10 = I accept myself completely', D.pillars.accept);
        const b = slider('pb', 'Self-trust', '– 0 = I do not believe I can cope with difficulties, 10 = I believe that when a difficulty comes, I will find a way to deal with it', D.pillars.trust);
        a.querySelector('input').addEventListener('input', (e) => { D.pillars.accept = +e.target.value; save(); });
        b.querySelector('input').addEventListener('input', (e) => { D.pillars.trust = +e.target.value; save(); });
        return h('div', {}, h('p', { class: 'hint' }, 'An estimate of today\'s state. It serves only so that you can see progress later.'), a, b);
      }],
      ['Milestones (optional)', () => area('mi', 'When did the fear appear or get stronger?', 'A year or a period is enough. Painful memories and trauma belong with a therapist.', D, 'milestones', 300)],
      ['Choice of path', () => {
        const a = slider('cb', 'How much do you believe the worry may come true?', '– 0 = I know it is OCD, 10 = I am sure', D.criteria.belief);
        const b = slider('cf', 'How well do you manage in an ordinary day?', '– 0 = not at all, 10 = without difficulty', D.criteria.functioning);
        a.querySelector('input').addEventListener('input', (e) => { D.criteria.belief = +e.target.value; save(); });
        b.querySelector('input').addEventListener('input', (e) => { D.criteria.functioning = +e.target.value; save(); });
        return h('div', {}, a, b,
          radios('erp', 'Have you tried exposure (ERP) before?', [['zadne', 'Ne'], ['vzdal', 'Yes, I gave it up or it overwhelmed me'], ['pomohlo', 'Yes, it helped']], D.criteria, 'erp'),
          radios('rdy', 'Are you ready to go into the fear straight away?', [['ano', 'Ano'], ['castecne', 'Partly'], ['ne', 'Not yet']], D.criteria, 'ready'));
      }],
      ['Safety', () => h('div', {},
        h('p', { class: 'hint' }, 'Three short questions. They are for your safety, not for assessment.'),
        radios('s1', 'I feel hopeless or that it has no point.', [['ne', 'Ne'], ['obcas', 'Sometimes'], ['casto', 'Often']], D.safety, 'hopeless'),
        radios('s2', 'Most days I have a sad, empty mood and nothing gives me joy.', [['ne', 'Ne'], ['obcas', 'Sometimes'], ['casto', 'Often']], D.safety, 'depressed'),
        radios('s3', 'I have thoughts of harming myself or of not wanting to live.', [['ne', 'Ne'], ['obcas', 'Sometimes'], ['casto', 'Often']], D.safety, 'harm'))],
    ];
    const msg = h('p', { class: 'msg', role: 'alert' });

    function show() {
      const i = D.step;
      const [title, build] = steps[i];
      const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': steps.length, 'aria-valuenow': i + 1, 'aria-label': 'Progress through the questionnaire' }, h('span', { style: 'width:' + ((i + 1) / steps.length) * 100 + '%' }));
      const nav = h('div', { class: 'actions' },
        i > 0 ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => go(-1) }, 'Back') : null,
        h('button', { class: 'btn', type: 'button', onclick: () => go(1) }, i === steps.length - 1 ? 'Finish' : 'Next'));
      msg.textContent = '';
      root.replaceChildren(
        h('p', { class: 'small' }, 'Step ' + (i + 1) + ' of ' + steps.length), bar,
        h('div', { class: 'card app-card' }, h('h2', {}, title), build()), nav, msg,
        h('p', { class: 'small' }, 'It saves progressively only on your device. You can leave and come back at any time.'));
      window.scrollTo(0, 0);
    }
    function go(dir) {
      if (dir > 0 && D.step === steps.length - 1) {
        const s = D.safety;
        if (!s.hopeless || !s.depressed || !s.harm) { msg.textContent = 'Please answer all three questions.'; return; }
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
    if (fresh) out.push(h('h2', {}, 'Done. Thank you for managing it.'));
    else out.push(h('p', {}, 'Last questionnaire: ' + fmtDateLong(a.at) + '.'));
    if (risk === 'high') {
      out.push(crisisBlock());
      out.push(h('p', {}, 'Based on your answers I recommend contacting a professional first. I do not recommend working with the app on your own right now.'));
    } else if (risk === 'mild') {
      out.push(h('p', { class: 'callout-inline' }, 'For hopelessness or mood you answered "sometimes". Mention it at your next visit to a doctor or therapist. If it got stronger, get in touch sooner.'));
    }
    const notes = [];
    if (a.reco.path === 'pop') notes.push('Pop path: roughly 4–8 weeks of stabilisation and understanding of doubt (I-CBT), then a move to gradual exposures.');
    if (a.reco.path === 'metal') notes.push('Metal path: straight into exposures with response prevention (ERP). ERP is a professional method; ideally you have a professional with you for it.');
    if (a.reco.path === 'mezi') notes.push('It is a spectrum: you can alternate stabilisation and exposures according to the day and your strength.');
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Recommended path: ' + pathLabel(a.reco.path)),
      h('p', { class: 'small' }, 'It is a hint based on criteria, not a decision. You can change the path or combine paths at any time.'),
      h('ul', { class: 'rules' }, a.reco.reasons.map((r) => h('li', {}, r))),
      notes.map((n) => h('p', {}, n))));
    if (prev) {
      out.push(h('div', { class: 'card app-card' }, h('h3', {}, 'Comparison with the previous questionnaire'),
        h('ul', { class: 'rules' },
          h('li', {}, 'Average anxiety across the themes: ' + avg(prev).toFixed(1) + ' → ' + avg(a).toFixed(1)),
          h('li', {}, 'Self-acceptance: ' + prev.pillars.accept + ' → ' + a.pillars.accept),
          h('li', {}, 'Self-trust: ' + prev.pillars.trust + ' → ' + a.pillars.trust))));
    }
    out.push(h('div', { class: 'actions' },
      h('a', { class: 'btn', href: '/aplikace/zebricek' }, 'Show the ladder'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { d.draft = blankDraft(); save(); wizard(); } }, 'Repeat the questionnaire')));
    root.replaceChildren(...out);
    window.scrollTo(0, 0);
  }
}

if (gate(root)) run();
