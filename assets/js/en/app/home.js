// Přehled aplikace: souhlas, rychlé akce, karta dne.
import { data, save, hasConsent } from './store.js';
import { h, boot, $ } from './ui.js';
import { cardOfDay } from './data.js';

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
      h('li', {}, 'The app is a complement to professional care and does not replace it. It is not therapy or a diagnosis.'),
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
  const out = [];
  const c = cardOfDay();
  out.push(h('div', { class: 'card app-card principle' }, h('p', { class: 'eyebrow' }, 'Card of the day'), h('h3', {}, c.t), h('p', {}, c.x), h('a', { href: '/aplikace/principy' }, 'All principle cards')));
  out.push(h('div', { class: 'tiles' },
    tile('/aplikace/obsese', 'Obsession tracker', 'Daily log of themes and strength'),
    tile('/aplikace/kompulze', 'Compulsion tracker', 'Quick logging with one tap'),
    tile('/aplikace/text', 'Exposure text', 'Write and check a text'),
    tile('/aplikace/denik', 'Exposure diary', 'Timer and progress chart'),
    tile('/aplikace/vice', 'More tools', 'OCD circle, vision, export')));
  return out;
}

function render() {
  root.replaceChildren(...(hasConsent() ? dashboard() : [consentCard()]));
}
render();
