// Editor expozičního textu: přiznání nejistoty → přijetí nejhoršího → sebevíra. Kontrola ujištění.
import { data, save, uid, fmtDate } from './store.js';
import { h, boot, gate, $ } from './ui.js';
import { norm, REASSURE, ACCEPT } from './data.js';

const root = $('#app-root');
boot(root);

const SAMPLE = [
  'Tu nemoc můžu mít nebo ji jednou dostat. Nevím to a nikdy to jistě vědět nebudu.',
  'Kdyby přišla, přijmu ji i sebe. Kvůli tomuto strachu se nevzdám života.',
  'Věřím v sebe i v život, který přijímám takový, jaký je. Věřím, že zvládnu cokoli, co přijde.',
];

function check(parts) {
  const all = parts.join(' ').trim();
  const warn = [];
  if (!all) return warn;
  const sentences = all.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const lastS = norm(sentences[sentences.length - 1] || '');
  if (REASSURE.some((r) => r.test(lastS))) warn.push('Text končí ujištěním. Expoziční text nemá končit „bude to dobré“, ale přijetím nejistoty a sebevírou.');
  else if (REASSURE.some((r) => r.test(norm(all)))) warn.push('V textu je věta, která zní jako ujištění (např. „jsem zdravý“, „určitě ne“). Zkuste ji přepsat na přijetí nejistoty.');
  if (!ACCEPT.some((r) => r.test(norm(parts[1] || '')))) warn.push('V druhé části chybí přijetí nejhoršího scénáře (např. „kdyby přišla, přijmu ji i sebe“).');
  if (!parts[0].trim()) warn.push('První část má přiznat nejistotu: „nevím to a jistě to vědět nebudu“.');
  if (!parts[2].trim()) warn.push('Třetí část má vyjádřit sebevíru: „zvládnu cokoli, co přijde“.');
  return warn;
}

function render() {
  const d = data();
  const f = [
    ['p1', '1. Přiznání nejistoty', 'Nevím to a nikdy to jistě vědět nebudu.'],
    ['p2', '2. Přijetí nejhoršího scénáře', 'Kdyby se to stalo, přijmu to i sebe.'],
    ['p3', '3. Sebevíra', 'Věřím v sebe a zvládnu cokoli, co přijde.'],
  ].map(([id, label, hint]) => {
    const t = h('textarea', { id, rows: 3, maxlength: 300 });
    return { id, t, el: h('div', { class: 'field' }, h('label', { for: id }, label, ' ', h('span', { class: 'hint' }, hint)), t) };
  });
  const parts = () => f.map((x) => x.t.value);
  const out = h('div', { 'aria-live': 'polite' });
  const doCheck = () => {
    const w = check(parts());
    out.replaceChildren(w.length ? h('div', { class: 'banner banner-warn' }, h('h3', {}, 'K zamyšlení'), h('ul', { class: 'rules' }, w.map((x) => h('li', {}, x)))) : h('p', { class: 'banner banner-ok' }, 'Vypadá to dobře: text nekončí ujištěním a obsahuje přijetí.'));
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
      ans.replaceChildren(h('p', { class: relief ? 'banner banner-warn' : 'banner banner-ok' }, relief ? 'Úleva po poslední větě může znamenat, že text funguje jako neutralizace. Zkuste větu přepsat tak, aby nechávala nejistotu otevřenou. Nic se neděje, je to jen signál.' : 'Dobře. Nejistota zůstala otevřená a to je cíl.'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: render }, 'Zpět k editoru'));
    };
    root.replaceChildren(h('div', { class: 'card app-card reading' },
      h('p', { class: 'eyebrow' }, 'Čtěte pomalu, bez ujišťování'),
      h('p', { class: 'read-text' }, text),
      h('h3', {}, 'Přišla po poslední větě úleva?'),
      h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: () => answer(true) }, 'Ano'), h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => answer(false) }, 'Ne')),
      ans));
  };
  const saved = d.texts.slice(-5).reverse();
  root.replaceChildren(...[
    h('div', { class: 'card app-card' },
      h('h2', {}, 'Napište svůj text'),
      h('p', { class: 'hint' }, 'Tři krátké části. Text nesmí končit ujištěním.'),
      f.map((x) => x.el),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { f.forEach((x, i) => { x.t.value = SAMPLE[i]; }); out.replaceChildren(); } }, 'Vložit vzorový text'),
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: doCheck }, 'Zkontrolovat'),
        h('button', { class: 'btn', type: 'button', onclick: readIt }, 'Přečíst a uložit')),
      out),
    saved.length ? h('div', {}, h('h2', {}, 'Uložené texty'), h('ul', { class: 'log' }, saved.map((e) => h('li', {},
      h('strong', {}, fmtDate(e.at)), ' · ' + e.parts.join(' ').slice(0, 70) + '… ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { f.forEach((x, i) => { x.t.value = e.parts[i] || ''; }); window.scrollTo(0, 0); } }, 'Načíst'), ' ',
      h('button', { class: 'linklike', type: 'button', onclick: () => { d.texts.splice(d.texts.indexOf(e), 1); save(); render(); } }, 'Smazat'))))) : null].filter(Boolean));
}

if (gate(root)) render();
