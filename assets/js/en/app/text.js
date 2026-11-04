// Editor expozičního textu: přiznání nejistoty → přijetí nejhoršího → sebedůvěra. Kontrola ujištění.
import { data, save, uid, fmtDate } from './store.js';
import { h, boot, gate, $ } from './ui.js';
import { norm, REASSURE, ACCEPT } from './data.js';

const root = $('#app-root');
boot(root);

const SAMPLE = [
  'I may have that illness or may get it one day. I do not know, and I will never know for certain.',
  'If it came, I would accept it and myself. I will not give up my life because of this fear.',
  'I believe in myself and in the life I accept as it is. I believe that when a difficulty comes, I will look for a way to deal with it, and I can ask for help.',
];

function check(parts) {
  const all = parts.join(' ').trim();
  const warn = [];
  if (!all) return warn;
  const sentences = all.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const lastS = norm(sentences[sentences.length - 1] || '');
  if (REASSURE.some((r) => r.test(lastS))) warn.push('The text ends with reassurance. An exposure text should not end with "it will be fine", but with acceptance of uncertainty and self-trust.');
  else if (REASSURE.some((r) => r.test(norm(all)))) warn.push('The text contains a sentence that sounds like reassurance (e.g. "I am healthy", "certainly not"). Try rewriting it as acceptance of uncertainty.');
  if (!ACCEPT.some((r) => r.test(norm(parts[1] || '')))) warn.push('The second part lacks acceptance of the worst scenario (e.g. "if it came, I would accept it and myself").');
  if (!parts[0].trim()) warn.push('The first part should admit the uncertainty: "I do not know it and I will never know for certain".');
  if (!parts[2].trim()) warn.push('The third part should express self-trust: "when a difficulty comes, I will look for a way to deal with it".');
  return warn;
}

function render() {
  const d = data();
  const f = [
    ['p1', '1. Admitting the uncertainty', 'I do not know it and I will never know for certain.'],
    ['p2', '2. Accepting the worst scenario', 'If it happened, I would accept it and myself.'],
    ['p3', '3. Self-trust', 'I believe in myself, and when a difficulty comes, I will look for a way to deal with it.'],
  ].map(([id, label, hint]) => {
    const t = h('textarea', { id, rows: 3, maxlength: 300 });
    return { id, t, el: h('div', { class: 'field' }, h('label', { for: id }, label, ' ', h('span', { class: 'hint' }, hint)), t) };
  });
  const parts = () => f.map((x) => x.t.value);
  const out = h('div', { 'aria-live': 'polite' });
  const doCheck = () => {
    const w = check(parts());
    out.replaceChildren(w.length ? h('div', { class: 'banner banner-warn' }, h('h3', {}, 'Food for thought'), h('ul', { class: 'rules' }, w.map((x) => h('li', {}, x)))) : h('p', { class: 'banner banner-ok' }, 'This looks good: the text does not end with reassurance and it contains acceptance.'));
    return w;
  };
  const readIt = () => {
    const w = doCheck();
    const text = parts().filter((x) => x.trim()).join(' ');
    if (!text) return;
    const entry = { id: uid(), at: Date.now(), parts: parts(), relief: null, warnings: w.length };
    const ans = h('div', { 'aria-live': 'polite' });
    const answer = (relief) => {
      entry.relief = relief;
      d.texts.push(entry);
      if (d.texts.length > 20) d.texts.shift();
      save();
      ans.replaceChildren(h('p', { class: relief ? 'banner banner-warn' : 'banner banner-ok' }, relief ? 'Relief after the last sentence may mean the text is working as neutralisation. Try rewriting the sentence so that it leaves the uncertainty open. Nothing is wrong; it is only a signal.' : 'Good. The uncertainty stayed open and that is the aim.'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: render }, 'Back to the editor'));
    };
    root.replaceChildren(h('div', { class: 'card app-card reading' },
      h('p', { class: 'eyebrow' }, 'Read slowly, without reassurance'),
      h('p', { class: 'read-text' }, text),
      h('h3', {}, 'Did relief come after the last sentence?'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => answer(true) }, 'Ano'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => answer(false) }, 'Ne')),
      ans));
  };
  const saved = d.texts.slice(-5).reverse();
  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'Write your text'),
      h('p', { class: 'hint' }, 'Three short parts. The text must not end with reassurance.'),
      f.map((x) => x.el),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { f.forEach((x, i) => { x.t.value = SAMPLE[i]; }); out.replaceChildren(); } }, 'Insert a sample text'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: doCheck }, 'Check'),
        h('button', { class: 'btn', type: 'button', onclick: readIt }, 'Read and save')),
      out),
    saved.length ? h('div', {}, h('h2', {}, 'Saved texts'), h('ul', { class: 'log' }, saved.map((e) => h('li', {},
      h('strong', {}, fmtDate(e.at)), ' · ' + e.parts.join(' ').slice(0, 70) + '… ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { f.forEach((x, i) => { x.t.value = e.parts[i] || ''; }); window.scrollTo(0, 0); } }, 'Load'), ' ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { d.texts.splice(d.texts.indexOf(e), 1); save(); render(); } }, 'Delete'))))) : null].filter(Boolean));
}

if (gate(root)) render();
