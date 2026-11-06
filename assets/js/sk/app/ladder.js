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
    root.replaceChildren(h('div', { class: 'card app-card' }, h('h2', {}, 'Rebríček zatiaľ nie je'), h('p', {}, 'Vznikne zo vstupného dotazníka.'), h('a', { class: 'btn', href: '/aplikace/start' }, 'Vyplniť dotazník')));
    return;
  }
  const items = buildLadder(a);
  const done = d.progress.done;
  const rec = recommendedStart(items, done);
  const active = items.some((i) => i.id === d.progress.active) ? d.progress.active : rec && rec.id;
  const out = [h('p', {}, 'Rebríček je zoradený od najslabšej témy po najsilnejšiu. Začínať sa odporúča tam, kde je úzkosť okolo 4–6, teda tam, kde máte šancu vyhrať. Je to nápoveda, vybrať si môžete sami.')];

  const since = Date.now() - 14 * 86400000;
  const weak = d.exposures.filter((e) => e.at > since && (items.find((i) => i.id === e.topicId) || { score: 9 }).score <= 3).length;
  if (weak >= 6) out.push(h('p', { class: 'callout-inline' }, 'Posledných 14 dní cvičíte hlavne pri slabších témach. Ak sa vám darí, skúste sa posunúť o stupeň vyššie. Rozhodnutie je na vás.'));

  out.push(h('ol', { class: 'ladder' }, items.map((i) => {
    const isDone = done.includes(i.id);
    const tags = [];
    if (isDone) tags.push(h('span', { class: 'tag tag-done' }, 'Splnené'));
    else if (i.id === active) tags.push(h('span', { class: 'tag tag-active' }, 'Aktívne'));
    if (rec && i.id === rec.id && !isDone) tags.push(h('span', { class: 'tag' }, 'Odporúčaný štart'));
    return h('li', { class: 'rung' + (isDone ? ' is-done' : '') + (i.id === active ? ' is-active' : '') },
      h('div', { class: 'rung-main' }, h('strong', {}, i.name), h('span', { class: 'score' }, i.score + '/10'), tags),
      h('div', { class: 'rung-actions' },
        !isDone ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { d.progress.active = i.id; save(); render(); } }, 'Vybrať') : null,
        !isDone ? h('a', { class: 'btn btn-sm', href: '/aplikace/denik?t=' + encodeURIComponent(i.id) }, 'Cvičiť') : null,
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => {
          const k = d.progress.done.indexOf(i.id);
          if (k >= 0) d.progress.done.splice(k, 1); else d.progress.done.push(i.id);
          save(); render();
        } }, isDone ? 'Vrátiť' : 'Označiť ako splnené')));
  })));
  if (!items.length) out.push(h('p', {}, 'V poslednom dotazníku nemáte žiadnu tému nad 0. Môžete dotazník zopakovať.'));

  if (d.assessments.length > 1) {
    const as = d.assessments;
    out.push(h('h2', {}, 'Vývoj medzi dotazníkmi'));
    out.push(lineChart(
      [{ name: 'Priemerná úzkosť', cls: 's-peak', values: as.map(avg) }, { name: 'Sebaprijatie', cls: 's-acc', values: as.map((x) => x.pillars.accept) }, { name: 'Sebadôvera', cls: 's-trust', values: as.map((x) => x.pillars.trust) }],
      as.map((x) => fmtDate(x.at)), 'Vývoj priemernej úzkosti, sebaprijatia a sebadôvery medzi dotazníkmi'));
  }
  root.replaceChildren(...out);
}

if (gate(root)) render();
