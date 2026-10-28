// Žebříček témat: z posledního dotazníku, od nejslabšího po nejsilnější.
import { data, save, latestAssessment, fmtDate } from './store.js';
import { h, boot, gate, lineChart, $ } from './ui.js';
import { buildLadder, recommendedStart } from './data.js';

const root = $('#app-root');
boot(root);

function avg(a) {
  const t = a.topics.filter((x) => x.score > 0);
  return t.length ? t.reduce((s, x) => s + x.score, 0) / t.length : 0;
}

function render() {
  const d = data();
  const a = latestAssessment();
  if (!a) {
    root.replaceChildren(h('div', { class: 'card app-card' }, h('h2', {}, 'Žebříček zatím není'), h('p', {}, 'Vznikne z vstupního dotazníku.'), h('a', { class: 'btn', href: '/aplikace/start' }, 'Vyplnit dotazník')));
    return;
  }
  const items = buildLadder(a);
  const done = d.progress.done;
  const rec = recommendedStart(items, done);
  const active = items.some((i) => i.id === d.progress.active) ? d.progress.active : rec && rec.id;
  const out = [h('p', {}, 'Žebříček je seřazený od nejslabšího tématu po nejsilnější. Začínat se doporučuje tam, kde je úzkost kolem 4–6, tedy tam, kde máte šanci vyhrát. Je to nápověda, vybrat si můžete sami.')];

  const since = Date.now() - 14 * 86400000;
  const weak = d.exposures.filter((e) => e.at > since && (items.find((i) => i.id === e.topicId) || { score: 9 }).score <= 3).length;
  if (weak >= 6) out.push(h('p', { class: 'callout-inline' }, 'Posledních 14 dní cvičíte hlavně u slabších témat. Pokud se vám daří, zkuste se posunout o stupeň výš. Rozhodnutí je na vás.'));

  out.push(h('ol', { class: 'ladder' }, items.map((i) => {
    const isDone = done.includes(i.id);
    const tags = [];
    if (isDone) tags.push(h('span', { class: 'tag tag-done' }, 'Splněno'));
    else if (i.id === active) tags.push(h('span', { class: 'tag tag-active' }, 'Aktivní'));
    if (rec && i.id === rec.id && !isDone) tags.push(h('span', { class: 'tag' }, 'Doporučený start'));
    return h('li', { class: 'rung' + (isDone ? ' is-done' : '') + (i.id === active ? ' is-active' : '') },
      h('div', { class: 'rung-main' }, h('strong', {}, i.name), h('span', { class: 'score' }, i.score + '/10'), tags),
      h('div', { class: 'rung-actions' },
        !isDone ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { d.progress.active = i.id; save(); render(); } }, 'Vybrat') : null,
        !isDone ? h('a', { class: 'btn btn-sm', href: '/aplikace/denik?t=' + encodeURIComponent(i.id) }, 'Cvičit') : null,
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => {
          const k = d.progress.done.indexOf(i.id);
          if (k >= 0) d.progress.done.splice(k, 1); else d.progress.done.push(i.id);
          save(); render();
        } }, isDone ? 'Vrátit' : 'Označit jako splněné')));
  })));
  if (!items.length) out.push(h('p', {}, 'V posledním dotazníku nemáte žádné téma nad 0. Můžete dotazník zopakovat.'));

  if (d.assessments.length > 1) {
    const as = d.assessments;
    out.push(h('h2', {}, 'Vývoj mezi dotazníky'));
    out.push(lineChart(
      [{ name: 'Průměrná úzkost', cls: 's-peak', values: as.map(avg) }, { name: 'Sebepřijetí', cls: 's-acc', values: as.map((x) => x.pillars.accept) }, { name: 'Sebedůvěra', cls: 's-trust', values: as.map((x) => x.pillars.trust) }],
      as.map((x) => fmtDate(x.at)), 'Vývoj průměrné úzkosti, sebepřijetí a sebedůvěry mezi dotazníky'));
  }
  root.replaceChildren(...out);
}

if (gate(root)) render();
