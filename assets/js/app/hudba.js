// Hudba: odkazy na playlisty „před expozicí“ a „po expozici“. Nepouští se během expozice.
import { data, save } from './store.js';
import { h, boot, gate, $ } from './ui.js';

const root = $('#app-root');
boot(root);

// Povolené jsou jen odkazy http(s).
function safeUrl(s) {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch (e) {
    return null;
  }
}

function render(note, bad) {
  const d = data();
  const mk = (key, label) => {
    const cur = d.music[key];
    const name = h('input', { type: 'text', id: key + '-n', maxlength: 60, value: cur ? cur.name : '' });
    const url = h('input', { type: 'text', id: key + '-u', maxlength: 300, placeholder: 'https://…', value: cur ? cur.url : '' });
    return h('div', { class: 'card app-card' }, h('h2', {}, label),
      h('div', { class: 'field' }, h('label', { for: key + '-n' }, 'Název'), name),
      h('div', { class: 'field' }, h('label', { for: key + '-u' }, 'Odkaz na playlist'), url),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => {
          if (!url.value.trim()) { d.music[key] = null; save(); render('Odstraněno.'); return; }
          const u = safeUrl(url.value);
          if (!u) { render('Odkaz musí začínat na https://', true); return; }
          d.music[key] = { name: name.value.trim() || label, url: u };
          save();
          render('Uloženo.');
        } }, 'Uložit'),
        cur ? h('a', { class: 'btn btn-ghost', href: cur.url, target: '_blank', rel: 'noopener noreferrer' }, 'Otevřít playlist') : null));
  };
  root.replaceChildren(...[
    note ? h('p', { class: 'banner ' + (bad ? 'banner-warn' : 'banner-ok'), role: 'status' }, note) : null,
    h('p', { class: 'banner banner-soft' }, 'Hudba mě nabíjí, ale před strachem mě neschovává. Pouštějte ji před expozicí a po ní, nikdy ne během ní k přehlušení úzkosti.'),
    mk('before', 'Před expozicí'),
    mk('after', 'Po expozici'),
  ].filter(Boolean));
}

if (gate(root)) render();
