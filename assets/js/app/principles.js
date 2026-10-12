// Karty principů: dvanáct pravidel metody a karta dne.
import { h, boot, $ } from './ui.js';
import { PRINCIPLES, cardOfDay } from './data.js';

const root = $('#app-root');
boot(root);
const today = cardOfDay();
root.replaceChildren(
  h('div', { class: 'card app-card principle' }, h('p', { class: 'eyebrow' }, 'Karta dne'), h('h2', {}, today.t), h('p', { class: 'lead' }, today.x)),
  h('h2', {}, 'Všech 12 principů'),
  h('ol', { class: 'principles' }, PRINCIPLES.map((p, i) => h('li', { class: 'card app-card' }, h('span', { class: 'num' }, String(i + 1)), h('div', {}, h('h3', {}, p.t), h('p', {}, p.x))))));
