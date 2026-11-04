// Přehled aplikace: souhlas, doporučení cesty, rychlé akce, karta dne.
import { data, save, hasConsent, latestAssessment, fmtDateLong } from './store.js';
import { h, boot, $, crisisBlock } from './ui.js';
import { cardOfDay, pathLabel, riskLevel, buildLadder, recommendedStart } from './data.js';

const root = $('#app-root');
boot(root);
const d = data();

function consentCard() {
  const cb = h('input', { type: 'checkbox', id: 'souhlas' });
  const msg = h('p', { class: 'msg', role: 'status' });
  const go = () => {
    if (!cb.checked) { msg.textContent = 'To continue, confirm your consent.'; cb.focus(); return; }
    d.consent = { at: Date.now() };
    save();
    render();
  };
  return h('div', { class: 'card app-card' },
    h('h2', {}, 'Before you begin'),
    h('ul', { class: 'rules' },
      h('li', {}, 'The app accompanies professional care and does not replace it. It is not therapy or a diagnosis.'),
      h('li', {}, 'Health data is sensitive. It stays only on your device, in the browser storage. Nothing is sent anywhere.'),
      h('li', {}, 'You can export and fully delete your data at any time in the Data section.'),
      h('li', {}, 'If you clear your browser data or change device, you will lose it unless you export it.')),
    h('label', { class: 'check' }, cb, ' I understand and I consent to the processing of data about my state of health on my device for the purpose of using the app. I can withdraw my consent at any time by deleting the data.'),
    h('p', { class: 'small' }, 'You will find the details in the ', h('a', { href: '/ochrana-osobnich-udaju' }, 'privacy policy'), '.'),
    h('div', { class: 'actions' }, h('button', { class: 'btn', type: 'button', onclick: go }, 'Continue')),
    msg);
}

function tile(href, title, text) {
  return h('a', { class: 'tile', href }, h('strong', {}, title), h('span', {}, text));
}

function dashboard() {
  const a = latestAssessment();
  const out = [];
  const risk = a ? riskLevel(a.safety) : 'none';
  if (risk === 'high') {
    out.push(crisisBlock());
    out.push(h('p', {}, 'Based on your answers in the questionnaire, I recommend contacting a professional first. I do not recommend working with the app on your own right now.'));
  }
  if (!a) {
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Start with the intake questionnaire'),
      h('p', {}, 'Your ladder of themes and a recommended path will come from the answers. It takes about 10 minutes and you can interrupt it at any time.'),
      h('a', { class: 'btn', href: '/aplikace/start' }, d.draft ? 'Continue the questionnaire' : 'Fill in the questionnaire')));
  } else {
    const items = buildLadder(a);
    const rec = recommendedStart(items, d.progress.done);
    const active = items.find((i) => i.id === d.progress.active) || rec;
    out.push(h('div', { class: 'card app-card' },
      h('h2', {}, 'Recommended path: ' + pathLabel(a.reco.path)),
      h('p', { class: 'small' }, 'According to the questionnaire from ' + fmtDateLong(a.at) + '. It is a hint, not a decision. The paths can be combined.'),
      h('ul', { class: 'rules' }, a.reco.reasons.map((r) => h('li', {}, r))),
      h('p', {}, active ? 'Current theme: ' : 'The ladder is still empty. ', active ? h('strong', {}, active.name + ' (' + active.score + '/10)') : null),
      h('div', { class: 'actions' },
        h('a', { class: 'btn', href: '/aplikace/denik' }, 'Start an exposure'),
        h('a', { class: 'btn btn-ghost', href: '/aplikace/zebricek' }, 'Ladder'))));
    if (Date.now() - a.at > 30 * 86400000) {
      out.push(h('p', { class: 'callout-inline' }, 'A month has passed since the last questionnaire. Would you like to repeat it and compare? ', h('a', { href: '/aplikace/start' }, 'Repeat the questionnaire')));
    }
  }
  const c = cardOfDay();
  out.push(h('div', { class: 'card app-card principle' }, h('p', { class: 'eyebrow' }, 'Card of the day'), h('h3', {}, c.t), h('p', {}, c.x), h('a', { href: '/aplikace/principy' }, 'All 12 principles')));
  out.push(h('div', { class: 'tiles' },
    tile('/aplikace/kompulze', 'Compulsion tracker', 'Quick logging with one tap'),
    tile('/aplikace/text', 'Exposure text', 'Write and check a text'),
    tile('/aplikace/denik', 'Exposure diary', 'Timer and progress chart'),
    tile('/aplikace/vice', 'More tools', 'OCD circle, I-CBT, vision, export')));
  return out;
}

function render() {
  root.replaceChildren(...(hasConsent() ? dashboard() : [consentCard()]));
}
render();
