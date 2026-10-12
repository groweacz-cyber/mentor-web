// Tělo ve strachu: psychoedukace bez kontroly příznaků.
import { h, boot, $ } from './ui.js';
import { BODY, BODY_MEDICAL } from './data.js';

const root = $('#app-root');
boot(root);
root.replaceChildren(
  ...BODY.map((b) => h('div', { class: 'card app-card' }, h('h2', {}, b.t), h('p', {}, b.x))),
  h('p', { class: 'banner banner-soft' }, BODY_MEDICAL));
