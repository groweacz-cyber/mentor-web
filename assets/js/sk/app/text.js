// Editor expozičního textu: přiznání nejistoty → přijetí nejhoršího → sebedůvěra. Kontrola ujištění.
import { data, save, uid, fmtDate } from './store.js';
import { h, boot, gate, $ } from './ui.js';
import { norm, REASSURE, ACCEPT } from './data.js';

const root = $('#app-root');
boot(root);

const SAMPLE = [
  'Tú chorobu môžem mať alebo ju raz dostať. Neviem to a nikdy to isto vedieť nebudem.',
  'Keby prišla, prijmem ju aj seba. Kvôli tomuto strachu sa nevzdám života.',
  'Verím v seba aj v život, ktorý prijímam taký, aký je. Verím, že keď príde ťažkosť, budem hľadať spôsob, ako ju riešiť, a môžem požiadať o pomoc.',
];

function check(parts) {
  const all = parts.join(' ').trim();
  const warn = [];
  if (!all) return warn;
  const sentences = all.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const lastS = norm(sentences[sentences.length - 1] || '');
  if (REASSURE.some((r) => r.test(lastS))) warn.push('Text končí uistením. Expozičný text nemá končiť „bude to dobré“, ale prijatím neistoty a sebadôverou.');
  else if (REASSURE.some((r) => r.test(norm(all)))) warn.push('V texte je veta, ktorá znie ako uistenie (napr. „som zdravý“, „určite nie“). Skúste ju prepísať na prijatie neistoty.');
  if (!ACCEPT.some((r) => r.test(norm(parts[1] || '')))) warn.push('V druhej časti chýba prijatie najhoršieho scenára (napr. „keby prišla, prijmem ju aj seba“).');
  if (!parts[0].trim()) warn.push('Prvá časť má priznať neistotu: „neviem to a isto to vedieť nebudem“.');
  if (!parts[2].trim()) warn.push('Tretia časť má vyjadriť sebadôveru: „keď príde ťažkosť, budem hľadať spôsob, ako ju riešiť“.');
  return warn;
}

function render() {
  const d = data();
  const f = [
    ['p1', '1. Priznanie neistoty', 'Neviem to a nikdy to isto vedieť nebudem.'],
    ['p2', '2. Prijatie najhoršieho scenára', 'Keby sa to stalo, prijmem to aj seba.'],
    ['p3', '3. Sebadôvera', 'Verím v seba a keď príde ťažkosť, budem hľadať spôsob, ako ju riešiť.'],
  ].map(([id, label, hint]) => {
    const t = h('textarea', { id, rows: 3, maxlength: 300 });
    return { id, t, el: h('div', { class: 'field' }, h('label', { for: id }, label, ' ', h('span', { class: 'hint' }, hint)), t) };
  });
  const parts = () => f.map((x) => x.t.value);
  const out = h('div', { 'aria-live': 'polite' });
  const doCheck = () => {
    const w = check(parts());
    out.replaceChildren(w.length ? h('div', { class: 'banner banner-warn' }, h('h3', {}, 'Na zamyslenie'), h('ul', { class: 'rules' }, w.map((x) => h('li', {}, x)))) : h('p', { class: 'banner banner-ok' }, 'Vyzerá to dobre: text nekončí uistením a obsahuje prijatie.'));
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
      ans.replaceChildren(h('p', { class: relief ? 'banner banner-warn' : 'banner banner-ok' }, relief ? 'Úľava po poslednej vete môže znamenať, že text funguje ako neutralizácia. Skúste vetu prepísať tak, aby nechávala neistotu otvorenú. Nič sa nedeje, je to len signál.' : 'Dobre. Neistota zostala otvorená a to je cieľ.'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: render }, 'Späť do editora'));
    };
    root.replaceChildren(h('div', { class: 'card app-card reading' },
      h('p', { class: 'eyebrow' }, 'Čítajte pomaly, bez uisťovania'),
      h('p', { class: 'read-text' }, text),
      h('h3', {}, 'Prišla po poslednej vete úľava?'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => answer(true) }, 'Ano'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => answer(false) }, 'Ne')),
      ans));
  };
  const saved = d.texts.slice(-5).reverse();
  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'Napíšte svoj text'),
      h('p', { class: 'hint' }, 'Tri krátke časti. Text nesmie končiť uistením.'),
      f.map((x) => x.el),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { f.forEach((x, i) => { x.t.value = SAMPLE[i]; }); out.replaceChildren(); } }, 'Vložiť vzorový text'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: doCheck }, 'Skontrolovať'),
        h('button', { class: 'btn', type: 'button', onclick: readIt }, 'Prečítať a uložiť')),
      out),
    saved.length ? h('div', {}, h('h2', {}, 'Uložené texty'), h('ul', { class: 'log' }, saved.map((e) => h('li', {},
      h('strong', {}, fmtDate(e.at)), ' · ' + e.parts.join(' ').slice(0, 70) + '… ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { f.forEach((x, i) => { x.t.value = e.parts[i] || ''; }); window.scrollTo(0, 0); } }, 'Načítať'), ' ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { d.texts.splice(d.texts.indexOf(e), 1); save(); render(); } }, 'Vymazať'))))) : null].filter(Boolean));
}

if (gate(root)) render();
