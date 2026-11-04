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
    root.replaceChildren(h('div', { class: 'card app-card' }, h('h2', {}, 'No ladder yet'), h('p', {}, 'It will come from the intake questionnaire.'), h('a', { class: 'btn', href: '/aplikace/start' }, 'Fill in the questionnaire')));
    return;
  }
  const items = buildLadder(a);
  const done = d.progress.done;
  const rec = recommendedStart(items, done);
  const active = items.some((i) => i.id === d.progress.active) ? d.progress.active : rec && rec.id;
  const out = [h('p', {}, 'The ladder is ordered from the weakest theme to the strongest. It is recommended to start where the anxiety is around 4–6, that is, where you have a chance to win. It is a hint; you can choose yourself.')];

  const since = Date.now() - 14 * 86400000;
  const weak = d.exposures.filter((e) => e.at > since && (items.find((i) => i.id === e.topicId) || { score: 9 }).score <= 3).length;
  if (weak >= 6) out.push(h('p', { class: 'callout-inline' }, 'Over the last 14 days you have practised mainly on the weaker themes. If it is going well, try moving up a step. The decision is yours.'));

  out.push(h('ol', { class: 'ladder' }, items.map((i) => {
    const isDone = done.includes(i.id);
    const tags = [];
    if (isDone) tags.push(h('span', { class: 'tag tag-done' }, 'Completed'));
    else if (i.id === active) tags.push(h('span', { class: 'tag tag-active' }, 'Active'));
    if (rec && i.id === rec.id && !isDone) tags.push(h('span', { class: 'tag' }, 'Recommended start'));
    return h('li', { class: 'rung' + (isDone ? ' is-done' : '') + (i.id === active ? ' is-active' : '') },
      h('div', { class: 'rung-main' }, h('strong', {}, i.name), h('span', { class: 'score' }, i.score + '/10'), tags),
      h('div', { class: 'rung-actions' },
        !isDone ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { d.progress.active = i.id; save(); render(); } }, 'Choose') : null,
        !isDone ? h('a', { class: 'btn btn-sm', href: '/aplikace/denik?t=' + encodeURIComponent(i.id) }, 'Practise') : null,
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => {
          const k = d.progress.done.indexOf(i.id);
          if (k >= 0) d.progress.done.splice(k, 1); else d.progress.done.push(i.id);
          save(); render();
        } }, isDone ? 'Put back' : 'Mark as completed')));
  })));
  if (!items.length) out.push(h('p', {}, 'In the latest questionnaire you have no theme above 0. You can repeat the questionnaire.'));

  if (d.assessments.length > 1) {
    const as = d.assessments;
    out.push(h('h2', {}, 'Progress between questionnaires'));
    out.push(lineChart(
      [{ name: 'Average anxiety', cls: 's-peak', values: as.map(avg) }, { name: 'Self-acceptance', cls: 's-acc', values: as.map((x) => x.pillars.accept) }, { name: 'Self-trust', cls: 's-trust', values: as.map((x) => x.pillars.trust) }],
      as.map((x) => fmtDate(x.at)), 'Progress of average anxiety, self-acceptance and self-trust between questionnaires'));
  }
  root.replaceChildren(...out);
}

if (gate(root)) render();
