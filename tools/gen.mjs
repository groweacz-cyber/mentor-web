// Generátor statických stránek: `npm run gen` zapíše HTML, sitemap a robots.txt do kořene repozitáře.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import vm from 'node:vm';
import * as F2 from './content/faze2.mjs';
import { TYPY_DALSI } from './content/typy2.mjs';
import { nactiData as nactiDataSeminare, pripravBehy } from '../api/_lib/seminare.js';
import { POVAHA_SEMINARE, formatCastka } from '../api/_lib/texty.js';
import * as SEM from './content/seminare.mjs';

const OUT = process.argv[2] ? resolve(process.argv[2]) : resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BRAND = 'OCD mentor';
const EMAIL = 'ocdmentor@gmail.com';
const ICO = '87690772';
const AUTHOR = 'Bc. Václav Kodeš';
const ADDRESS = 'Strážkovice 128, 374 01 Trhové Sviny';
// Oficiální widget rezervačního systému Reservanto (id 25616). Barvy nastavené na odstín zeleně webu.
const bookDiv = `<div class="reservanto-widget" data-text="Domluvit si konzultaci" data-id="25616" data-color-text="#ffffff" data-color-text-shadow="transparent" data-color-bg="#1f6b46" data-color-bg-hover="#2a7f5b" data-color-boxshadow="#163a41"></div>`;
const bookScript = `<script defer id="reservanto-widget-script" type="text/javascript" src="https://booking.reservanto.cz/Script/reservanto-script.js?id=25616"></script>`;
const bookBtn = () => `${bookDiv}\n${bookScript}`;
const SITE = 'https://ocdmentor.cz';
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Obsah stránky „Jak to probíhá“ (kroky, ceník, FAQ) je v repozitáři: assets/data/jak-to-probiha.json
const JAK = JSON.parse(readFileSync(join(OUT, 'assets/data/jak-to-probiha.json'), 'utf8'));
const hasPlaceholder = (t) => /\[[^\]]+\]/.test(t);
const withPlaceholders = (t) => esc(t).replace(/\[[^\]]+\]/g, (m) => `<span class="placeholder">${m}</span>`);
const routeHtml = (mod) => `<ol class="route${mod ? ' ' + mod : ''}">
${JAK.kroky.map((k) => `  <li><h3>${esc(k.nazev)}</h3>${k.meta ? `<p class="route-meta">${esc(k.meta)}</p>` : ''}<p>${esc(k.text)}</p></li>`).join('\n')}
</ol>`;
const calcCard = () => `<article class="card kviz-teaser">
    <h3>Kolik času mi bere OCD?</h3>
    <p>Spočítejte si to za minutu. Nic se neukládá.</p>
    <p><a class="btn btn-ghost btn-sm" href="/kolik-casu-mi-bere-ocd">Otevřít kalkulačku</a></p>
  </article>`;
const quizCard = () => `<article class="card kviz-teaser">
    <h3>Metal, nebo Pop?</h3>
    <p>Zjistěte za minutu, která cesta vám sedí.</p>
    <p><a class="btn btn-ghost btn-sm" href="/kviz">Spustit kvíz</a></p>
  </article>`;

// Datové soubory (texty smyčky, kvízu a principů) zůstávají v assets/js; generátor z nich vyrábí statické HTML.
const loadData = (file, key) => {
  const ctx = { window: {} };
  vm.runInNewContext(readFileSync(join(OUT, file), 'utf8'), ctx);
  return ctx.window[key];
};
const SMYCKA = loadData('assets/js/smycka-faze.js', 'OCD_SMYCKA');
const KVIZ = loadData('assets/js/kviz-data.js', 'OCD_KVIZ');
const PRINCIPY = loadData('assets/js/principy.js', 'OCD_PRINCIPY');
const GLOS = JSON.parse(readFileSync(join(OUT, 'assets/data/slovnicek.json'), 'utf8')).pojmy;
const TYPY_DATA = JSON.parse(readFileSync(join(OUT, 'assets/data/typy-ocd.json'), 'utf8'));
const MYTY = JSON.parse(readFileSync(join(OUT, 'assets/data/myty.json'), 'utf8'));
const loopStatic = () => `<ol class="lp-static">
${SMYCKA.faze.map((f, i) => `  <li><h3>${i + 1}. ${esc(f.nazev)}</h3><p><strong>Co se děje:</strong> ${esc(f.co)}</p><p><strong>Co s tím dělá metoda:</strong> ${esc(f.metoda)}</p></li>`).join('\n')}
</ol>
<p class="lp-static-end">${esc(SMYCKA.stred)} ${esc(SMYCKA.znovu)}</p>`;
const kvizStatic = () => `<div class="kviz-static">
<h2>Pět otázek</h2>
<ol>
${KVIZ.otazky.map((q) => `  <li><h3>${esc(q.q)}</h3><ul>${q.a.map((a) => `<li>${esc(a.t)}</li>`).join('')}</ul></li>`).join('\n')}
</ol>
<h2>Možné výsledky</h2>
${Object.values(KVIZ.vysledky).map((r) => `<h3>${esc(r.nazev)}</h3><p>${esc(r.text)}</p>`).join('\n')}
<p>${esc(KVIZ.spolecne.cesta)}</p>
<p class="small disclaimer">${esc(KVIZ.spolecne.upozorneni)}</p>
</div>`;
const pragueDayOfYear = () => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number);
  return Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - Date.UTC(p[0], 0, 0)) / 86400000);
};
const PRINCIP_IDX = (pragueDayOfYear() - 1) % PRINCIPY.length;
const principyAll = () => `<details class="pd-all"><summary>Všech ${PRINCIPY.length} principů metody</summary><ol>${PRINCIPY.map((p) => `<li>${esc(p)}</li>`).join('')}</ol></details>`;

// Krizové kontakty: všude stejně
const CRISIS = 'volejte 112, 155 nebo Linku první psychické pomoci 116 123';
const CRISIS_STRONG = 'volejte <strong>112</strong>, <strong>155</strong> nebo Linku první psychické pomoci <strong>116 123</strong>';

const NOTICE = 'Peer podpora je doplněk k odborné péči. Nenahrazuje psychoterapii ani lékaře.';
const FOOT = 'Nejde o zdravotní službu ani psychoterapii. Spolupráce nenahrazuje odbornou péči.';

const nav = [
  ['/metoda', 'Metoda'],
  ['/pro-koho', 'Pro koho'],
  ['/jak-to-probiha', 'Jak to probíhá'],
  ['/dotaznik', 'Dotazník'],
  ['/aplikace', 'Aplikace'],
  ['/seminare', 'Online semináře'],
  ['/ebook', 'E-book'],
  [null, 'O OCD', [
    ['/vtirave-myslenky', 'Vtíravé myšlenky'],
    ['/typy-ocd', 'Typy OCD'],
    ['/myty-o-ocd', 'Mýty o OCD'],
    ['/slovnicek', 'Slovníček pojmů'],
    ['/pro-blizke', 'Pro blízké'],
    ['/pribehy', 'Příběhy'],
  ]],
  ['/clanky', 'Články'],
  ['/o-mne', 'O mně'],
  ['/kontakt', 'Kontakt'],
];

const RB = ['#ef5b5b', '#f5923e', '#fcc934', '#5bbf8a', '#4aa3df', '#5b6fd6', '#9a6fd0'];

// Půlkruhové oblouky duhy (vnější první). pathLength=1 kvůli animaci kreslení čáry.
function bow(cx, cy, r0, w, cls) {
  return RB.map((c, i) => {
    const r = r0 - i * w;
    return `<path class="${cls}" style="--i:${i}" pathLength="1" d="M${cx - r} ${cy}A${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="${c}" stroke-width="${w + 0.8}"/>`;
  }).join('');
}

function cloud(x, y, s, fill) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}"><circle r="26"/><circle cx="-32" cy="10" r="19"/><circle cx="30" cy="8" r="22"/><circle cx="58" cy="16" r="15"/><rect x="-50" y="14" width="124" height="22" rx="11"/></g>`;
}

// Hlavní scéna: bouřková mračna odplují, nakreslí se duha, vyjde slunce.
// Výchozí stav stylů = konečný stav (slunce + duha), animace jen „přehrávají“ cestu k němu.
function heroScene() {
  const drops = Array.from({ length: 24 }, (_, i) => {
    const x = 14 + i * 19 + (i % 3) * 5;
    const y = 58 + (i % 6) * 14;
    return `<line class="drop" style="animation-delay:${((i * 37) % 90) / 100}s" x1="${x}" y1="${y}" x2="${x - 5}" y2="${y + 16}"/>`;
  }).join('');
  const rays = Array.from({ length: 16 }, (_, i) => {
    const long = i % 2 === 0;
    return `<line y1="-${long ? 46 : 45}" y2="-${long ? 66 : 57}" transform="rotate(${(i * 360) / 16})"/>`;
  }).join('');
  return `<svg class="scene-svg" viewBox="0 0 480 360" aria-hidden="true" focusable="false">
<defs>
<linearGradient id="gStorm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232e44"/><stop offset="1" stop-color="#55678a"/></linearGradient>
<linearGradient id="gClear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4f2"/><stop offset=".6" stop-color="#d4ecfb"/><stop offset="1" stop-color="#fff0cf"/></linearGradient>
<radialGradient id="gGlow"><stop offset="0" stop-color="#ffe08a" stop-opacity=".75"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>
<radialGradient id="gSun" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff4c2"/><stop offset="1" stop-color="#ffc83d"/></radialGradient>
</defs>
<rect width="480" height="360" fill="url(#gStorm)"/>
<rect class="sky-clear" width="480" height="360" fill="url(#gClear)"/>
<g class="sun-rise"><g transform="translate(385 112)">
<circle class="sun-glow" r="96" fill="url(#gGlow)"/>
<g class="sun-rays" stroke="#ffcf4d" stroke-width="4" stroke-linecap="round">${rays}</g>
<circle r="34" fill="url(#gSun)"/>
</g></g>
<g>${bow(205, 306, 200, 10, 'bow')}</g>
<g class="cloud-lite l1">${cloud(66, 78, 0.85, '#fff')}</g>
<g class="cloud-lite l2">${cloud(262, 44, 0.7, '#fff')}</g>
<g class="cloud-lite l3">${cloud(352, 150, 0.55, '#fff')}</g>
<g class="rain" stroke="#b5d0f0" stroke-width="2" stroke-linecap="round">${drops}</g>
<g class="storm s1">${cloud(84, 66, 1.45, '#33415c')}</g>
<g class="storm s2">${cloud(232, 46, 1.7, '#222d44')}</g>
<g class="storm s3">${cloud(392, 74, 1.4, '#3c4b69')}</g>
<path class="hill hill-b" d="M0 292C70 266 140 272 210 282S380 264 480 276V360H0Z" fill="#8fd3a9"/>
<path class="hill hill-f" d="M0 306C80 280 150 296 230 302S400 284 480 298V360H0Z" fill="#5fb68a"/>
</svg>`;
}

// Malá ozdoba v hlavičce vnitřních stránek: duha, která se nakreslí, a slunce.
function miniScene() {
  const rays = Array.from({ length: 12 }, (_, i) => `<line y1="-21" y2="-29" transform="rotate(${i * 30})"/>`).join('');
  return `<svg class="head-art" viewBox="0 0 240 130" aria-hidden="true" focusable="false">
<g>${bow(112, 128, 100, 9, 'mbow')}</g>
<g class="mini-cloud">${cloud(40, 62, 0.5, '#d9e8f8')}</g>
<g transform="translate(192 44)"><g class="mini-sun"><g stroke="#ffcf4d" stroke-width="3" stroke-linecap="round">${rays}</g><circle r="16" fill="#ffc83d"/></g></g>
</svg>`;
}

const brandSun = `<svg class="brand-sun" viewBox="-16 -16 32 32" width="28" height="28" aria-hidden="true" focusable="false"><g stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round">${Array.from({ length: 8 }, (_, i) => `<line y1="-10" y2="-14" transform="rotate(${i * 45})"/>`).join('')}</g><circle r="6.5" fill="#ffc83d" stroke="#f59e0b" stroke-width="1.5"/></svg>`;

// Jediný inline skript: scroll animace (s pojistkou), tlačítko pro zastavení animací.
const siteScript = `<script>
(function(){var d=document.documentElement;d.classList.add('js');
try{if(localStorage.getItem('ocd-calm')==='1')d.classList.add('calm');}catch(e){}
document.addEventListener('DOMContentLoaded',function(){try{
var reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
var els=document.querySelectorAll('.reveal');
if(!('IntersectionObserver' in window)||reduced){for(var i=0;i<els.length;i++)els[i].classList.add('in');}
else{var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -6% 0px'});for(var j=0;j<els.length;j++)io.observe(els[j]);}
var b=document.getElementById('motion-toggle');
var v=document.getElementById('hero-video');
if(reduced){d.classList.add('motion-off');if(b)b.setAttribute('aria-pressed','true');if(v)v.pause();}
var sd=navigator.connection&&navigator.connection.saveData;
function startVideo(){if(v&&!reduced&&!sd&&!d.classList.contains('motion-off')&&!d.classList.contains('calm'))v.play().catch(function(){});}
if(v){var go=function(){(window.requestIdleCallback||function(f){setTimeout(f,300);})(startVideo);};if(document.readyState==='complete')go();else window.addEventListener('load',go);}
var cb=document.getElementById('calm-toggle');
if(cb){cb.setAttribute('aria-pressed',d.classList.contains('calm')?'true':'false');
cb.addEventListener('click',function(){var on=d.classList.toggle('calm');cb.setAttribute('aria-pressed',on?'true':'false');try{localStorage.setItem('ocd-calm',on?'1':'0');}catch(e){}if(v){if(on)v.pause();else startVideo();}});}
if('serviceWorker' in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){});});
if(b)b.addEventListener('click',function(){
  var off=d.classList.toggle('motion-off');
  b.setAttribute('aria-pressed',off?'true':'false');
  if(v){if(off)v.pause();else v.play().catch(function(){});}
});
var s=document.getElementById('sound-toggle');
if(s&&v){
  var mIcon=s.querySelector('.icon-muted'),uIcon=s.querySelector('.icon-unmuted');
  s.addEventListener('click',function(){
    v.muted=!v.muted;
    if(!v.muted&&!d.classList.contains('motion-off'))v.play().catch(function(){});
    s.setAttribute('aria-pressed',v.muted?'false':'true');
    s.setAttribute('aria-label',v.muted?'Zapnout zvuk':'Vypnout zvuk');
    if(mIcon)mIcon.hidden=!v.muted;
    if(uIcon)uIcon.hidden=v.muted;
  });
}
var subToggles=document.querySelectorAll('.nav-sub-toggle');
function closeAllSub(except){
  for(var k=0;k<subToggles.length;k++){
    if(subToggles[k]===except)continue;
    subToggles[k].setAttribute('aria-expanded','false');
    subToggles[k].parentNode.classList.remove('open');
  }
}
for(var m=0;m<subToggles.length;m++){
  subToggles[m].addEventListener('click',function(e){
    e.stopPropagation();
    var li=this.parentNode;
    var open=li.classList.toggle('open');
    this.setAttribute('aria-expanded',open?'true':'false');
    closeAllSub(this);
    if(open)placeSub(li.querySelector('.sub-nav'));
  });
}
function placeSub(ul){
  if(!ul)return;
  ul.style.left='';ul.style.right='';
  var r=ul.getBoundingClientRect();
  if(r.right>innerWidth-8){
    ul.style.left='auto';ul.style.right='0';
    r=ul.getBoundingClientRect();
    if(r.left<8){ul.style.left='0';ul.style.right='auto';}
  }
}
document.addEventListener('click',function(){closeAllSub(null);});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAllSub(null);});
}catch(e){d.classList.remove('js');}});
})();
</script>`;

const appItems = [
  ['/aplikace', 'Přehled'], ['/aplikace/denik', 'Deník'], ['/aplikace/kompulze', 'Kompulze'], ['/aplikace/text', 'Text'],
  ['/aplikace/zebricek', 'Žebříček'], ['/aplikace/kruh', 'Kruh'], ['/aplikace/vice', 'Více'],
];
const appNav = (path) => `<nav class="app-nav" aria-label="Aplikace"><ul>${appItems.map(([h, t]) => {
  const known = appItems.some((x) => x[0] === path);
  const cur = h === path ? ' aria-current="page"' : (h === '/aplikace/vice' && !known ? ' aria-current="true"' : '');
  return `<li><a href="${h}"${cur}>${t}</a></li>`;
}).join('')}</ul></nav>
<p class="app-note">Aplikace doprovází odbornou péči a nenahrazuje ji. Není to terapie ani diagnóza.</p>`;
const sosHtml = `<button type="button" class="sos-btn" id="sos-open" aria-haspopup="dialog">SOS</button>
<dialog id="sos" aria-labelledby="sos-h">
  <h2 id="sos-h">Potřebuji pomoc teď</h2>
  <p>Nemusíte na to být sami. Zavolejte:</p>
  <ul>
    <li><a href="tel:116123">Linka první psychické pomoci<br>116 123</a></li>
    <li><a href="tel:155">Záchranná služba<br>155</a></li>
    <li><a href="tel:112">Tísňová linka<br>112</a></li>
  </ul>
  <p>Můžete také kontaktovat svého terapeuta nebo lékaře.</p>
  <button type="button" class="btn btn-ghost" id="sos-close">Zavřít</button>
</dialog>`;

// ---------- SEO: konfigurace, strukturovaná data, šablona stránky ----------
const CFG = JSON.parse(readFileSync(join(OUT, 'tools/config.json'), 'utf8'));
const DOMAIN = 'ocdmentor.cz';
const PERSON_ID = `${SITE}/#autor`;
const WEB_ID = `${SITE}/#web`;
const slugOf = (path) => (path === '/' ? 'index' : path.slice(1).replace(/\//g, '-'));
const ogPath = (path) => `/assets/og/${slugOf(path)}.png`;
const attr = (t) => esc(String(t)).replace(/"/g, '&quot;');
const stripTags = (t) => t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

const assetHash = {};
const hashAsset = (p) => (assetHash[p] ??= existsSync(join(OUT, p)) ? createHash('sha1').update(readFileSync(join(OUT, p))).digest('hex').slice(0, 8) : '');
// Soubory CSS a JS dostanou ?v=<hash>, takže je lze cachovat navždy a po změně se načtou znovu.
const versionAssets = (html) =>
  html.replace(/(src|href)="(\/assets\/(?:css|js)\/[^"?#]+)"/g, (m, a, p) => {
    const h = hashAsset(p);
    return h ? `${a}="${p}?v=${h}"` : m;
  });

const personNode = () => ({
  '@type': 'Person',
  '@id': PERSON_ID,
  name: AUTHOR,
  jobTitle: 'Peer mentor s vlastní zkušeností s OCD',
  description: 'Peer mentor se zkušeností s OCD. Není terapeut ani psycholog.',
  image: `${SITE}/assets/img/o-mne-vaclav.webp`,
  url: `${SITE}/o-mne`,
  knowsAbout: ['OCD', 'peer mentoring'],
  ...(CFG.facebookUrl ? { sameAs: [CFG.facebookUrl] } : {}),
});
const websiteNode = () => ({
  '@type': 'WebSite',
  '@id': WEB_ID,
  url: `${SITE}/`,
  name: BRAND,
  alternateName: DOMAIN,
  inLanguage: 'cs',
  publisher: { '@id': PERSON_ID },
});
const priceNum = (c) => (/zdarma/i.test(c) ? 0 : Number(String(c).replace(/[^\d]/g, '')));
const serviceNode = () => ({
  '@type': 'Service',
  '@id': `${SITE}/jak-to-probiha#sluzba`,
  name: 'Peer mentoring při OCD (online)',
  serviceType: 'Peer mentoring',
  description: 'Online podpora lidí s OCD od peer mentora s vlastní zkušeností. Doplněk k odborné péči, ne zdravotní služba.',
  url: `${SITE}/jak-to-probiha`,
  provider: { '@id': PERSON_ID },
  areaServed: { '@type': 'Country', name: 'Česko' },
  availableChannel: { '@type': 'ServiceChannel', name: 'Online (videohovor)', serviceUrl: `${SITE}/jak-to-probiha` },
  offers: JAK.cenik.map((c) => ({
    '@type': 'Offer',
    name: `${c.nazev} (${c.delka})`,
    price: String(priceNum(c.cena)),
    priceCurrency: 'CZK',
    url: `${SITE}/jak-to-probiha`,
    availability: 'https://schema.org/InStock',
  })),
});
const breadcrumbNode = (trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([p, n], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: SITE + (p === '/' ? '/' : p) })),
});
// ---------- Slovníček: propojení pojmů s vysvětlivkami ----------
// Vysvětlivky jsou obecné definice; na veřejných stránkách se zapnou až po schválení (config.glossaryOnPublicPages).
const toUnicodeRe = (p) =>
  p
    .replace(/(^|\||\()\\b/g, '$1(?<![\\p{L}\\d])')
    .replace(/\\b/g, '(?![\\p{L}\\d])')
    .replace(/\\w/g, '[\\p{L}\\d]');
const GLOS_ITEMS = GLOS.filter((g) => g.auto).map((g) => ({
  id: g.id,
  term: g.pojem,
  def: g.def,
  re: new RegExp(toUnicodeRe(g.auto), /ERP|I-CBT|Pure O/.test(g.auto) ? 'u' : 'iu'),
}));
const VOID_TAGS = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source', 'area', 'col', 'embed', 'param', 'track', 'wbr']);
const SKIP_TAGS = new Set(['a', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'script', 'style', 'svg', 'summary', 'label', 'textarea', 'select', 'option', 'code', 'dialog', 'nav', 'figcaption', 'dt', 'title', 'noscript']);
function glossify(html) {
  const parts = html.split(/(<!--[\s\S]*?-->|<[^>]+>)/);
  const stack = [];
  const used = new Set();
  let n = 0;
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i];
    if (i % 2 === 1) {
      if (t.startsWith('<!--')) continue;
      const m = t.match(/^<\/?([a-zA-Z][\w-]*)/);
      if (!m) continue;
      const tag = m[1].toLowerCase();
      if (t.startsWith('</')) {
        for (let k = stack.length - 1; k >= 0; k--) {
          if (stack[k].tag === tag) {
            stack.length = k;
            break;
          }
        }
      } else if (!VOID_TAGS.has(tag) && !t.endsWith('/>')) {
        stack.push({ tag, skip: SKIP_TAGS.has(tag) || /data-no-gl|class="[^"]*\b(placeholder|no-gl|fact-src)\b/.test(t) });
      }
      continue;
    }
    if (!t.trim() || stack.some((s) => s.skip)) continue;
    const hits = [];
    for (const g of GLOS_ITEMS) {
      if (used.has(g.id)) continue;
      const m = g.re.exec(t);
      if (m) hits.push({ g, start: m.index, end: m.index + m[0].length, text: m[0] });
    }
    hits.sort((a, b) => a.start - b.start);
    let out = '';
    let pos = 0;
    for (const h of hits) {
      if (h.start < pos) continue;
      n++;
      used.add(h.g.id);
      const id = `gl-${h.g.id}-${n}`;
      out += t.slice(pos, h.start) + `<span class="gl-wrap"><button type="button" class="gl" aria-describedby="${id}">${h.text}</button><span class="gl-pop" id="${id}"><strong>${esc(h.g.term)}:</strong> ${esc(h.g.def)} <a href="/slovnicek#${h.g.id}">Více ve slovníčku</a></span></span>`;
      pos = h.end;
    }
    parts[i] = out + t.slice(pos);
  }
  return parts.join('');
}

// ---------- Související stránky ----------
const LABELS = {
  '/': 'Úvod',
  '/metoda': 'Metoda: čtyři pilíře a dvě cesty',
  '/pro-koho': 'Pro koho je peer mentoring',
  '/jak-to-probiha': 'Jak probíhá peer mentoring',
  '/kviz': 'Kvíz Metal, nebo Pop?',
  '/dotaznik': 'Vstupní dotazník',
  '/o-mne': 'O mně',
  '/kontakt': 'Kontakt',
  '/clanky': 'Články o OCD',
  '/pomoc': 'Pomoc hned',
  '/kolik-casu-mi-bere-ocd': 'Kolik času mi bere OCD?',
  '/skupiny': 'Online skupina podpory',
  '/vtirave-myslenky': 'Vtíravé myšlenky: průvodce',
  '/typy-ocd': 'Typy OCD',
  '/pro-blizke': 'Pro blízké: jak pomáhat a nekrmit OCD',
  '/myty-o-ocd': 'Mýty o OCD',
  '/slovnicek': 'Slovníček pojmů',
  '/pribehy': 'Příběhy',
  '/pro-terapeuty': 'Pro terapeuty a odborníky',
  '/clanky/druhy-ocd-9-typu': 'Druhy OCD: 9 typů a jejich příznaky',
  '/clanky/proc-ujisteni-krmi-ocd': 'Proč ujišťování krmí OCD',
  '/clanky/proc-nutkani-prichazi-ve-vlnach': 'Proč nutkání přichází ve vlnách',
  '/clanky/kompulze-a-prijeti': 'Kompulze a přijetí: cesta ven z OCD',
};
const labelFor = (p) => {
  if (LABELS[p]) return LABELS[p];
  const t = p.startsWith('/typy-ocd/') ? TYPY_DATA.typy.find((x) => `/typy-ocd/${x.slug}` === p) : null;
  return t ? t.nazev : p;
};
const relatedBlock = (paths) => `<section class="wrap block related">
  <h2>Související</h2>
  <ul class="related-list">${[...new Set(paths)].map((p) => `<li><a href="${p}">${esc(labelFor(p))}</a></li>`).join('')}</ul>
</section>`;

const videoNode = () => ({
  '@type': 'VideoObject',
  name: 'Úvodní video: Nejsi sám',
  description: 'Krátké úvodní video s titulky: Nejsi sám. Prošel jsem tím taky. A dá se z toho ven.',
  thumbnailUrl: `${SITE}/assets/img/uvod-poster.webp`,
  uploadDate: '2026-10-16',
  duration: 'PT8S',
  contentUrl: `${SITE}/assets/video/uvod.mp4`,
  inLanguage: 'cs',
  transcript: 'Nejsi sám. Prošel jsem tím taky. A dá se z toho ven.',
  creator: { '@id': PERSON_ID },
});
const normalizeLd = (j) => (!j ? [] : (j['@graph'] || [j]).map(({ '@context': _c, ...n }) => n));

function page({ path, title, desc, body, jsonld, noindex, robots, script, art, app, module, ogImage, ogTitle, ogSub, ogType, published, modified, crumb, parents, gloss, glossAlways, draft, crumbs, related, floatCta }) {
  const url = SITE + (path === '/' ? '/' : path);
  const isNoindex = !!noindex || /noindex/.test(robots || '');
  const robotsContent = robots || (noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
  const navHtml = nav
    .map(([h, t, sub]) => {
      if (sub) {
        const active = sub.some(([sh]) => sh === path || path.startsWith(sh + '/'));
        const subHtml = sub.map(([sh, st]) => `<li><a href="${sh}"${sh === path ? ' aria-current="page"' : ''}>${st}</a></li>`).join('');
        return `<li class="has-sub${active ? ' is-active' : ''}">
          <button type="button" class="nav-sub-toggle" aria-expanded="false">${t}</button>
          <ul class="sub-nav">${subHtml}</ul>
        </li>`;
      }
      return `<li><a href="${h}"${h === path || (h === '/aplikace' && path.startsWith('/aplikace')) ? ' aria-current="page"' : ''}>${t}</a></li>`;
    })
    .join('');
  let b = (related ? body + '\n' + relatedBlock(related) : body)
    .replace(/<section class="wrap block/g, '<section class="wrap block reveal')
    .replace(/<article class="card">(\s*<h3>Metal cesta)/g, '<article class="card card--metal">$1')
    .replace(/<article class="card">(\s*<h3>Pop cesta)/g, '<article class="card card--pop">$1');
  if (art) b = b.replace('<section class="wrap page-head">', '<section class="wrap page-head">' + miniScene());
  if (gloss && (draft || glossAlways || CFG.glossaryOnPublicPages)) b = glossify(b);

  // drobečková navigace (viditelná i ve strukturovaných datech)
  let trail = null;
  if ((crumbs ?? !isNoindex) && path !== '/') {
    const h1 = (body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    const label = crumb || (h1 ? stripTags(h1) : title);
    const par = parents || (path.startsWith('/clanky/') ? [['/clanky', 'Články']] : []);
    trail = [['/', 'Domů'], ...par, [path, label]];
  }
  const crumbsHtml = trail
    ? `<div class="wrap crumbs-wrap"><nav class="crumbs" aria-label="Drobečková navigace"><ol>${trail
        .map(([p, n], i) => (i < trail.length - 1 ? `<li><a href="${p}">${esc(n)}</a></li>` : `<li aria-current="page">${esc(n)}</li>`))
        .join('')}</ol></nav></div>\n`
    : '';

  // strukturovaná data: vše v jednom @graph
  const nodes = [];
  if (path === '/') nodes.push(websiteNode());
  if (['/', '/o-mne', '/jak-to-probiha'].includes(path)) nodes.push(personNode());
  if (path === '/o-mne') nodes.push({ '@type': 'ProfilePage', url, name: title, mainEntity: { '@id': PERSON_ID }, inLanguage: 'cs' });
  nodes.push(...normalizeLd(jsonld));
  if (trail && !isNoindex) nodes.push(breadcrumbNode(trail));
  const ld = nodes.length ? { '@context': 'https://schema.org', '@graph': nodes } : null;

  const verify = [
    CFG.verification?.google ? `<meta name="google-site-verification" content="${attr(CFG.verification.google)}">` : '',
    CFG.verification?.seznam ? `<meta name="seznam-wmt" content="${attr(CFG.verification.seznam)}">` : '',
    CFG.verification?.bing ? `<meta name="msvalidate.01" content="${attr(CFG.verification.bing)}">` : '',
  ].filter(Boolean).join('\n');

  const FLOAT_OFF = new Set(['/pomoc', '/kviz', '/kontakt', '/jak-to-probiha', '/dotaznik', '/obchodni-podminky', '/ochrana-osobnich-udaju', '/koncepty', '/offline', '/404', '/seminare', '/seminare/rezervace', '/seminare/rezervace/potvrzeni']);
  const showFloat = floatCta ?? (!isNoindex && !app && !draft && !FLOAT_OFF.has(path));
  const floatHtml = showFloat
    ? `<aside class="float-cta js-only" id="float-cta" aria-label="Konzultace zdarma" hidden>\n  <a class="btn btn-cta btn-sm float-book" href="/kontakt">Konzultace zdarma</a>\n  <button type="button" class="float-close" aria-label="Zavřít lištu">×</button>\n</aside>\n`
    : '';
  const ogUrl = `${SITE}${ogPath(noindex ? '/' : path)}`;
  const t = attr(title), d = attr(desc);
  const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${d}">
<meta name="robots" content="${robotsContent}">
${isNoindex ? '' : `<link rel="canonical" href="${url}">`}
${verify}
<meta property="og:type" content="${ogType || 'website'}">
<meta property="og:locale" content="cs_CZ">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ogUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${t}">
${published ? `<meta property="article:published_time" content="${published}">\n<meta property="article:modified_time" content="${modified || published}">\n<meta property="article:author" content="${SITE}/o-mne">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${ogUrl}">
<meta name="theme-color" content="#1b2a41">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/css/style.css">
${app ? '<link rel="stylesheet" href="/assets/css/app.css">' : ''}
${ld ? `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>` : ''}
${siteScript}
</head>
<body>
<a class="skip" href="#obsah">Přeskočit na obsah</a>
<p class="notice" role="note">${NOTICE} <a class="help-link" href="/pomoc">Potřebuji pomoc hned</a> <button type="button" class="calm-toggle js-only" id="calm-toggle" aria-pressed="false">Klidný režim</button></p>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/">${brandSun}<span>${BRAND}</span></a>
    <nav aria-label="Hlavní navigace"><ul>${navHtml}</ul></nav>
  </div>
</header>
${app ? appNav(path) : ''}
<main id="obsah">
${crumbsHtml}${b}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="foot-notice"><strong>${NOTICE}</strong></p>
    <p class="foot-disclaimer">${FOOT}</p>
    <p>Akutní krize nebo myšlenky na sebepoškození: ${CRISIS_STRONG}.</p>
    <ul class="foot-links">
      <li><a href="/obchodni-podminky">Obchodní podmínky</a></li>
      <li><a href="/ochrana-osobnich-udaju">Ochrana osobních údajů</a></li>
      <li><a href="/kontakt">Kontakt</a></li>
      <li><a href="/pro-terapeuty">Pro terapeuty</a></li>
      <li><a href="/pomoc">Pomoc hned</a></li>
    </ul>
    <p class="small">© 2026 OCDmentor.cz Všechna práva vyhrazena. Vlastní cookies ani sledování návštěvnosti nepoužíváme. Rezervační widget Reservanto může při otevření nastavit vlastní cookies – více v <a href="/ochrana-osobnich-udaju">zásadách ochrany osobních údajů</a>.</p>
    <p class="small">Web vytvořila <a href="https://growea.eu" target="_blank" rel="noopener">GROWEA.eu</a></p>
  </div>
</footer>
${app ? sosHtml : ''}
${floatHtml}<dialog id="rsv-modal" aria-labelledby="rsv-modal-h" aria-modal="true">
  <div class="rsv-inner">
    <h2 id="rsv-modal-h">Zahájení služby a právo na odstoupení od smlouvy</h2>
    <div class="rsv-text">
      <p>Jako spotřebitel máte za zákonem stanovených podmínek právo odstoupit od smlouvy uzavřené na dálku ve lhůtě 14 dnů od jejího uzavření.</p>
      <p>Pokud požadujete poskytnutí služby před uplynutím této lhůty, je nutné udělit výslovný požadavek na její zahájení. Pokud následně od smlouvy odstoupíte poté, co bylo poskytování služby na vaši žádost zahájeno, můžete být povinni uhradit poměrnou část ceny za plnění poskytnuté do okamžiku odstoupení, jsou-li splněny zákonné podmínky.</p>
      <p>Pokud bude služba v plném rozsahu poskytnuta před uplynutím lhůty pro odstoupení, můžete za zákonem stanovených podmínek ztratit právo na odstoupení od smlouvy. K tomu je zapotřebí váš předchozí výslovný souhlas s úplným poskytnutím služby a potvrzení, že berete na vědomí zánik práva na odstoupení.</p>
    </div>
    <label class="rsv-check">
      <input type="checkbox" id="rsv-consent">
      <span>Výslovně žádám, aby poskytovatel zahájil poskytování mnou rezervované služby před uplynutím 14denní lhůty pro odstoupení od smlouvy, pokud se rezervovaný termín uskuteční v této lhůtě. Souhlasím s tím, aby byla služba na mou žádost v takovém případě poskytnuta v plném rozsahu před uplynutím této lhůty, a beru na vědomí, že po jejím úplném poskytnutí mohu za zákonem stanovených podmínek ztratit právo na odstoupení od smlouvy. Dále beru na vědomí, že při odstoupení od smlouvy po zahájení poskytování služby mohu být povinen/povinna uhradit poměrnou část ceny za již poskytnuté plnění, pokud jsou splněny zákonné podmínky.</span>
    </label>
    <div class="rsv-actions">
      <button type="button" id="rsv-confirm" class="btn btn-cta" disabled>Souhlasím a pokračovat k rezervaci</button>
      <button type="button" id="rsv-cancel" class="btn btn-ghost">Zpět</button>
    </div>
  </div>
</dialog>
<script defer src="/assets/js/rezervace-souhlas.js"></script>
${b.includes('class="gl-wrap"') ? '<script src="/assets/js/slovnicek.js" defer></script>' : ''}
${showFloat ? '<script src="/assets/js/lista.js" defer></script>' : ''}
${[].concat(script || []).map((s) => `<script src="${s}" defer></script>`).join('\n')}
${module ? `<script type="module" src="${module}"></script>` : ''}
</body>
</html>
`;
  return versionAssets(html);
}

const files = {};
const pagesMeta = [];
const add = (path, opts) => {
  const f = path === '/' ? 'index.html' : `${path.slice(1)}/index.html`;
  files[f] = page({ path, art: path !== '/', ...opts });
  const noindex = !!opts.noindex || /noindex/.test(opts.robots || '');
  pagesMeta.push({ path, file: f, noindex, hardNoindex: !!opts.noindex, title: opts.title, ogTitle: opts.ogTitle, ogSub: opts.ogSub, ogArt: opts.ogImage || opts.ogArt, ogArtPortrait: !!opts.ogArtPortrait, modified: opts.modified });
};

const loopSvg = `<svg class="loop-line" viewBox="0 0 600 60" width="600" height="60" aria-hidden="true" focusable="false"><defs><linearGradient id="gLoop" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#5b6fd6"/><stop offset=".3" stop-color="#4aa3df"/><stop offset=".55" stop-color="#5bbf8a"/><stop offset=".78" stop-color="#fcc934"/><stop offset="1" stop-color="#f5923e"/></linearGradient></defs><path pathLength="1" d="M0 44 H150 C205 44 225 6 192 5 C155 4 163 44 205 44 H600" fill="none" stroke="url(#gLoop)" stroke-width="3" stroke-linecap="round"/></svg>`;

const loopChips = `<ol class="loop" aria-label="Smyčka OCD">
  <li>Napětí</li><li>Akce</li><li>Úleva</li><li>Posílení</li>
</ol>`;

// ---------- Úvod ----------
add('/', {
  title: "Peer mentoring při OCD online | ocdmentor.cz",
  desc: "Peer mentoring při OCD online: podpora od člověka s vlastní zkušeností, vedle odborné péče. Domluvte si úvodní konzultaci zdarma.",
  jsonld: { '@graph': [videoNode()] },
  ogTitle: 'Peer mentoring při OCD',
  ogSub: 'Jednat i ve chvíli, kdy se bojíte.',
  ogArt: '/assets/img/uvod-poster.webp',
  script: '/assets/js/uvod.js',
  body: `
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="eyebrow rise" style="--d:.1s">Peer mentoring · OCD</p>
      <h1 class="rise" style="--d:.2s">Jednat i ve chvíli, kdy se <span class="hl">bojíte</span>.</h1>
      <p class="lead rise" style="--d:.35s">Provázím lidi s OCD. Pracujeme podle mého přístupu: přijmout sebe i strach a přesto dělat to, na čem vám záleží. Nic neslibuji. Jdu vedle vás.</p>
      <div class="cta cta-split rise" style="--d:.5s">
        ${bookBtn()}
        <a class="btn btn-ghost" href="/dotaznik">Vyplnit vstupní dotazník</a>
      </div>
      <p class="small note rise" style="--d:.6s">Peer podpora, ne terapie ani krizová pomoc. V akutní krizi ${CRISIS}. <a href="/o-mne#hranice">Moje hranice</a></p>
    </div>
    <div class="scene-wrap rise" style="--d:.3s">
      <div class="scene"><video id="hero-video" class="scene-video" muted loop playsinline preload="none" poster="/assets/img/uvod-poster.webp" aria-label="Úvodní video" aria-describedby="video-prepis">
        <source src="/assets/video/uvod.webm" type="video/webm">
        <source src="/assets/video/uvod.mp4" type="video/mp4">
        <track kind="captions" srclang="cs" label="Česky" src="/assets/video/uvod.cs.vtt" default>
      </video>
      <p id="video-prepis" class="sr-only">Přepis videa: Nejsi sám. Prošel jsem tím taky. A dá se z toho ven.</p>
      <button type="button" class="sound-toggle" id="sound-toggle" aria-pressed="false" aria-label="Zapnout zvuk">
        <svg class="icon-muted" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/><line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <svg class="icon-unmuted" viewBox="0 0 24 24" aria-hidden="true" focusable="false" hidden><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18.5 5.5a9 9 0 0 1 0 13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
      </button></div>
      <button type="button" class="motion-toggle" id="motion-toggle" aria-pressed="false">Zastavit animaci</button>
    </div>
  </div>
  <div class="wrap">${loopSvg}</div>
</section>

<section class="wrap block loopsec" aria-labelledby="lp-h">
  <h2 id="lp-h">Poznáváte se v tom?</h2>
  <p class="lp-intro">OCD se točí pořád ve stejné smyčce. Klikněte na kteroukoli fázi a uvidíte, co se v ní děje a jak ji metoda přerušuje.</p>
  <div id="lp-root">${loopStatic()}</div>
  <p class="small disclaimer lp-note">Nejde o diagnózu. Pokud se v tom poznáváte, probírejte to s odborníkem. Já vám rád dám podporu vedle něj.</p>
  <p><a class="btn btn-cta" href="/kontakt" data-book>Rezervovat úvodní konzultaci zdarma</a></p>
  <script defer src="/assets/js/smycka-faze.js"></script>
  <script defer src="/assets/js/smycka-kruh.js"></script>
</section>

<section class="wrap block selfcheck js-only" aria-labelledby="sc-h">
  <div class="sc-card">
    <h2 id="sc-h">Jak moc vás dnes nutkání ovládá?</h2>
    <div class="field">
      <div class="range">
        <input type="range" id="sc-range" name="sc" min="0" max="10" step="1" value="5" aria-labelledby="sc-h" aria-describedby="sc-ends" aria-valuetext="5 z 10">
        <output for="sc-range" id="sc-out">5</output><span class="of">/ 10</span>
      </div>
      <p class="hint sc-ends" id="sc-ends"><span>0 = vůbec</span><span>10 = naprosto</span></p>
    </div>
    <p class="sc-msg" id="sc-msg" aria-live="polite"></p>
    <div class="cta sc-cta" id="sc-cta" hidden>
      <a class="btn btn-ghost" href="/dotaznik">Vyplnit vstupní dotazník</a>
      <a class="btn btn-cta" id="sc-book" href="/kontakt" data-book>Rezervovat úvodní konzultaci zdarma</a>
    </div>
    <p class="small sc-note">Nejde o test ani diagnózu. Pokud jste v akutní krizi, ${CRISIS}.</p>
  </div>
</section>

<section class="wrap block">
  <h2>Jak to probíhá</h2>
  ${routeHtml('route--row')}
  <p><a href="/jak-to-probiha">Ceník a časté dotazy</a></p>
</section>

<section class="wrap block">
  <div class="cards">
    ${quizCard()}
    ${calcCard()}
  </div>
</section>

<section class="wrap block principle" aria-labelledby="pd-h">
  <article class="card pd-card">
    <p class="eyebrow" id="pd-h">Princip dne</p>
    <div class="pd-body">
      <p class="pd-num" id="pd-num">Princip ${PRINCIP_IDX + 1} z ${PRINCIPY.length}</p>
      <p class="pd-text" id="pd-text">${esc(PRINCIPY[PRINCIP_IDX])}</p>
    </div>
    <div class="pd-actions">
      <button type="button" class="btn btn-ghost btn-sm js-only" id="pd-next">Další princip</button>
      <a href="/metoda">Více o metodě</a>
    </div>
  </article>
  ${principyAll()}
  <script defer src="/assets/js/principy.js"></script>
</section>

<section class="wrap block">
  <h2>S čím můžeme pracovat</h2>
  <p>S OCD: s obsesemi a kompulzemi, které berou čas a energii. Postupně se učíte nechat strach být a nereagovat na něj rituálem. <a href="/metoda">Jak metoda funguje</a> a <a href="/pro-koho">pro koho je</a>.</p>
</section>

<section class="wrap block">
  <h2>Dva nástroje, dva účely</h2>
  <p>Na webu najdete dvě různé věci. Ať nejsou matoucí, krátce k oběma:</p>
  <div class="cards">
    <article class="card">
      <h3>Vstupní dotazník</h3>
      <p>Vyplníte ho a sám/sama si ho pošlete e-mailem. Slouží k tomu, abychom se poznali a domluvili první kroky. Vidím ho, jen když mi ho doopravdy pošlete.</p>
      <p><a class="btn btn-ghost btn-sm" href="/dotaznik">Vyplnit dotazník</a></p>
    </article>
    <article class="card">
      <h3>Aplikace</h3>
      <p>Soukromý deník a nástroje pro vaši každodenní práci se strachem: žebříček témat, časovač na expozice, tracker kompulzí a karty principů. Data zůstávají jen ve vašem telefonu nebo počítači. Nikam se neodesílají a já je nevidím, pokud mi je sami neposlete.</p>
      <p><a class="btn btn-ghost btn-sm" href="/aplikace">Otevřít aplikaci</a></p>
    </article>
  </div>
</section>

<section class="wrap block story">
  <h2>Proč to dělám</h2>
  <p>Od dětství jsem procházel úzkostmi, sociální fobií i OCD v mnoha podobách. Vím, jaké to je, když vás vlastní mysl drží v šachu. Proto jsem vytvořil tuto metodu a aplikaci — jako průvodce, který vám rozumí zevnitř, ne z učebnice.</p>
  <ul class="exp-tags" aria-label="Oblasti vlastní zkušenosti">
    <li class="exp-tag exp-tag-main">OCD</li>
    <li class="exp-tag">Psychosomatika</li>
    <li class="exp-tag">Úzkosti</li>
    <li class="exp-tag">Sociální fobie</li>
  </ul>
  <div class="exp-stats">
    <div class="exp-stat"><strong>4</strong><span>oblasti vlastní zkušenosti</span></div>
    <div class="exp-stat"><strong>100&nbsp;%</strong><span>vlastní zkušenost, ne z učebnice</span></div>
  </div>
</section>

<section class="wrap block">
  <div class="approach">
    <h2>Můj přístup a pohled na věc</h2>
    <ul class="approach-list">
      <li>Sám jsem roky žil s OCD, úzkostmi a sociální fobií, ne z učebnice.</li>
      <li>Neslibuji rychlé řešení. Vím, jak dlouhá ta cesta je.</li>
      <li>Metodu jsem postavil na tom, co mi samotnému pomohlo zůstat u svého života.</li>
      <li>Nejsem terapeut. Jsem někdo, kdo tou smyčkou prošel a jde vedle vás.</li>
    </ul>
    <p class="approach-line">Nejsem odborník shora. Jsem někdo, kdo tudy prošel.</p>
  </div>
  <p><a href="/o-mne">Více o mně</a></p>
</section>

<section class="wrap block">
  <h2>Smyčka, kterou OCD používá</h2>
  <p>Napětí vede k akci, akce přinese úlevu a úleva smyčku posílí. Moje práce je pomoci vám v ní zůstat jinak: s napětím, bez akce.</p>
  ${loopChips}
  <p><a class="btn btn-ghost" href="/metoda">Přečíst si metodu</a></p>
</section>
`,
});

// ---------- Metoda ----------
add('/metoda', {
  title: "Metoda: sebepřijetí a expozice bez kompulze | ocdmentor.cz",
  desc: "Čtyři pilíře metody při OCD: sebepřijetí, sebevíra, expozice bez kompulze a život teď. Zjistěte, jak funguje, a zkuste kvíz Metal, nebo Pop.",
  gloss: true,
  related: ['/pro-koho', '/jak-to-probiha', '/kviz', '/pomoc'],
  ogTitle: 'Metoda: čtyři pilíře a dvě cesty',
  script: '/assets/js/smycka.js',
  body: `
<section class="wrap page-head">
  <h1>Metoda</h1>
  <p class="lead">Čtyři pilíře, dvě cesty a několik pravidel. Metoda není terapie. Je to způsob, jak se strachu postavit s oporou někoho, kdo to zná.</p>
</section>

<section class="wrap block">
  <h2>Čtyři pilíře</h2>
  <div class="pillars-layout">
    <div class="loop-rail" id="smycka" aria-hidden="true">
      <svg viewBox="0 0 140 640" preserveAspectRatio="xMidYMid meet" focusable="false">
        <path class="lp-seg" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="lp-seg" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="lp-seg" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="lp-seg" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle class="lp-dot" r="5" cx="0" cy="0" fill="#f5923e" opacity="0"/>
      </svg>
    </div>
  <ol class="pillars">
    <li><h3>Bezpodmínečné sebepřijetí</h3><p>Přijímám sebe celého: včetně OCD, myšlenek, úzkosti i nejistoty. Nemusím je mít rád. Přestávám s nimi bojovat jako s nepřítelem.</p></li>
    <li><h3>Sebevíra</h3><p>„Ať se stane cokoli, obstojím.“ Sebevíra se nebuduje afirmacemi. Buduje se zvládnutými situacemi: každá expozice, ve které zůstanete, je důkaz.</p></li>
    <li><h3>Expozice bez kompulze</h3><p>Strach může být přítomen a já přesto jednám. Kompulzi, tedy reakci, která má strach rychle zmírnit, neprovedu.</p></li>
    <li><h3>Život teď</h3><p>Cílová vize popisuje život, který chcete žít. Nepopisuje „život bez nemoci“. Žít začínáte už teď, ne až po úlevě.</p></li>
  </ol>
  </div>
</section>

<section class="wrap block">
  <h2>Smyčka a kompulze</h2>
  ${loopChips}
  <p>Kompulze je akt nepřijetí: říká, že tento pocit nebo tuto nejistotu snést nemohu. Kompulze funguje podobným mechanismem posilování úlevou: úleva ji pokaždé posílí. Odpovědí na kompulzi není trest ani sebekritika. Odpovědí je návrat k sebepřijetí a další pokus.</p>
</section>

<section class="wrap block">
  <h2>Dvě cesty, jeden cíl</h2>
  <div class="cards">
    <article class="card">
      <h3>Metal cesta</h3>
      <p>Rovnou <abbr title="expozice s prevencí reakce">ERP</abbr>. ERP znamená postavit se tomu, čeho se bojíte, a nevykonat kompulzi. Pro lidi, kteří chtějí jít do strachu hned.</p>
    </article>
    <article class="card">
      <h3>Pop cesta</h3>
      <p>Stabilizace, pak <abbr title="inferenční kognitivně-behaviorální přístup">I-CBT</abbr> (inferenční KBT, přístup zaměřený na úvahy, ze kterých se obava skládá) a nakonec postupná expozice. Pro lidi, kterým intenzivní start nesedí.</p>
    </article>
  </div>
  <p><strong>ERP i I-CBT jsou odborné metody.</strong> Jako peer mentor vás při nich doprovázím a podporuji. Nevedu je jako terapeut.</p>
  <p>Cestu nevybíráme podle toho, která je příjemnější. Rozhoduje <strong>víra v obavy</strong>, <strong>aktuální fungování</strong> a <strong>dřívější zkušenost s ERP</strong>. Cesty lze kombinovat. Orientaci najdete na stránce <a href="/pro-koho">Pro koho</a>.</p>
</section>

<section class="wrap block">
  ${quizCard()}
</section>

<section class="wrap block">
  <h2>Pravidla metody</h2>
  <ul class="rules">
    <li>Nic nesmí fungovat jako ochrana před strachem.</li>
    <li>Expozice se neukončuje ujištěním.</li>
    <li>Hudba a podobné nástroje regulují úzkost mezi expozicemi, ne během nich.</li>
    <li>Cílová vize se nepoužívá jako odpověď na strach.</li>
  </ul>
  <p>Principy najdete i jako karty v <a href="/aplikace/principy">aplikaci</a>.</p>
</section>

<section class="wrap block callout">
  <h2>Co metoda není</h2>
  <ul>
    <li>Není terapie.</li>
    <li>Není diagnóza.</li>
    <li>Není předepisování léků.</li>
    <li>Není slib vyléčení.</li>
  </ul>
  <p class="disclaimer">${NOTICE}</p>
  <p><a href="/o-mne#hranice">Moje hranice jako mentora</a></p>
</section>

<section class="wrap block">
  <p class="small">Obsah naposledy zkontrolován: 1. 12. 2026</p>
</section>
`,
});

// ---------- Pro koho ----------
add('/pro-koho', {
  title: "Pro koho je peer mentoring při OCD | ocdmentor.cz",
  desc: "Pro koho je peer mentoring při OCD vhodný, kdy sedí cesta Metal nebo Pop a kdy se obrátit na odborníka. Přečtěte si to a domluvte si konzultaci.",
  gloss: true,
  related: ['/metoda', '/kviz', '/jak-to-probiha', '/pomoc'],
  ogTitle: 'Pro koho je peer mentoring při OCD',
  body: `
<section class="wrap page-head">
  <h1>Pro koho</h1>
  <p class="lead">Pro lidi s OCD, kteří hledají oporu od někoho, kdo to zná z vlastní zkušenosti.</p>
</section>

<section class="wrap block">
  <h2>Která cesta může sedět</h2>
  <p>Jde o orientaci, ne o diagnózu. Cestu společně upřesníme po vstupním dotazníku.</p>
  <div class="cards">
    <article class="card">
      <h3>Metal cesta</h3>
      <ul>
        <li>Chcete jít do strachu hned.</li>
        <li>Dokážete být ve strachu a nechat ho být.</li>
        <li>Máte dobrou zkušenost s expozicí nebo ji chcete zkusit.</li>
        <li>Na obavy jako na příběh se už umíte dívat zpovzdálí.</li>
      </ul>
    </article>
    <article class="card">
      <h3>Pop cesta</h3>
      <ul>
        <li>Obavám věříte velmi silně a intenzivní start je příliš.</li>
        <li>Fungování je hodně omezené a potřebujete nejdřív stabilitu.</li>
        <li>Dřívější expozice se nepovedla nebo vás zahltila.</li>
        <li>Potřebujete nejdřív pochopit, jak se obava v hlavě skládá.</li>
      </ul>
    </article>
  </div>
  <p>Cesty lze kombinovat. Nerozhoduje, co je příjemnější, ale co vám v dané fázi opravdu sedí.</p>
</section>

<section class="wrap block callout">
  <h2>Kdy metodu nepoužívat</h2>
  <p>V těchto situacích je správným krokem odborník (psychiatr, klinický psycholog, psychoterapeut), ne peer mentoring:</p>
  <ul>
    <li>aktivní psychóza,</li>
    <li>sebevražedné myšlenky,</li>
    <li>závažná deprese,</li>
    <li>akutní krize.</li>
  </ul>
  <p>Pokud se vás něco z toho týká, nečekejte. ${CRISIS_STRONG[0].toUpperCase() + CRISIS_STRONG.slice(1)}, případně se obraťte na svého lékaře.</p>
</section>

<section class="wrap block">
  <h2 id="odborna-pece">Kam dál: odborná péče</h2>
  <p>Peer podpora funguje jako doplněk k odborné péči. Pokud ji zatím nemáte, začněte u lékaře nebo psychoterapeuta.</p>
  <ul>
    <li><a href="https://www.nudz.cz" target="_blank" rel="noopener">Národní ústav duševního zdraví (NUDZ)</a> – odborné informace a mapa psychosociální podpory.</li>
    <li><a href="https://www.reformapsychiatrie.cz" target="_blank" rel="noopener">Reforma péče o duševní zdraví</a> – síť Center duševního zdraví (CDZ) v jednotlivých krajích, komunitní péče blíž bydlišti.</li>
    <li><a href="https://www.czap.cz" target="_blank" rel="noopener">Česká asociace pro psychoterapii (ČAP)</a> – největší sdružení certifikovaných psychoterapeutů v ČR.</li>
    <li><a href="https://mzd.gov.cz/pacientske-organizace/" target="_blank" rel="noopener">Portál pacientských organizací</a> (Ministerstvo zdravotnictví ČR) – vyhledávání pacientských a svépomocných organizací podle diagnózy.</li>
  </ul>
  <p class="small">Odkazy vedou na externí weby mimo ${BRAND}; aktuálnost, dostupnost a vhodnost konkrétní služby si prosím ověřte přímo u poskytovatele. Výčet není vyčerpávající ani placenou reklamou.</p>
</section>

<section class="wrap block">
  <p><a class="btn" href="/dotaznik">Vyplnit vstupní dotazník</a></p>
  <p class="small">Obsah naposledy zkontrolován: 1. 12. 2026</p>
</section>
`,
});

// ---------- Dotazník ----------
const topics = [
  ['Kontaminace', 'strach z nečistoty, bakterií, chemikálií nebo nákazy'],
  ['Senzomotorické', 'neustálé vnímání dýchání, mrkání, polykání nebo jiných tělesných vjemů'],
  ['Existenciální', 'zasahující otázky o smyslu, realitě, existenci nebo smrti'],
  ['Zdravotní', 'strach z nemoci, kontrola těla, vyhledávání příznaků'],
  ['Pure O', 'nechtěné myšlenky nebo představy, rituály probíhají hlavně v hlavě'],
  ['Zpovědní', 'nutkání se přiznávat nebo ověřovat, zda jste něco neudělali špatně'],
  ['Emetofobní', 'strach ze zvracení'],
  ['Perfekcionistické', 'potřeba, aby něco bylo „akorát“, přesně nebo dokonale'],
  ['ROCD', 'pochybnosti o vztahu, partnerovi nebo vlastních citech'],
  ['Strach ze zešílení', 'obava ze ztráty kontroly nebo zdravého rozumu'],
];
const range = (name, label, hint) => `
<div class="field">
  <label for="${name}">${label}${hint ? ` <span class="hint">${hint}</span>` : ''}</label>
  <div class="range"><input type="range" id="${name}" name="${name}" min="0" max="10" step="1" value="0" data-label="${label}"><output for="${name}">0</output><span class="of">/ 10</span></div>
</div>`;
const checks = (group, items) =>
  `<div class="checks">${items
    .map((t, i) => `<label class="check"><input type="checkbox" name="${group}" value="${t}"> ${t}</label>`)
    .join('')}</div>`;

add('/dotaznik', {
  title: "Vstupní dotazník pro peer mentoring při OCD | ocdmentor.cz",
  desc: "Vstupní dotazník pro peer mentoring při OCD: mapa témat, kompulze a dopad na život. Vyplňte ho a pošlete e-mailem, nic se neukládá na server.",
  related: ['/jak-to-probiha', '/kviz', '/pro-koho', '/pomoc'],
  ogTitle: 'Vstupní dotazník',
  script: '/assets/js/dotaznik.js',
  body: `
<section class="wrap page-head">
  <h1>Vstupní dotazník</h1>
  <p class="lead">Slouží k tomu, abychom se dobře seznámili a mohli společně sestavit žebřík expozic. Není to diagnostický test. Vyplňte jen to, co chcete sdílet. Na nic nemusíte odpovídat.</p>
  <p class="callout-inline"><strong>Nic se neukládá.</strong> Web nemá databázi ani server. Po vyplnění si otevřete e-mail s předvyplněným textem, nebo si text zkopírujete a pošlete, jak chcete.</p>
</section>

<form id="dotaznik" class="wrap form" novalidate>

<fieldset data-section="O vás a cíli">
  <legend>0. O vás</legend>
  <div class="field"><label for="jmeno">Jak vás mám oslovovat <span class="hint">(nepovinné, stačí křestní jméno nebo přezdívka)</span></label><input type="text" id="jmeno" name="jmeno" data-label="Oslovení" autocomplete="off"></div>
  <div class="field"><label for="cil">Jak by vypadal váš život, který chcete žít? <span class="hint">(popište život, ne jen absenci obtíží)</span></label><textarea id="cil" name="cil" rows="4" data-label="Cílová vize"></textarea></div>
</fieldset>

<fieldset data-section="1. Mapa témat">
  <legend>1. Mapa témat</legend>
  <p class="hint">Ke každému tématu nastavte, jak silnou úzkost vám dnes způsobuje. 0 = žádnou, 10 = největší možnou. Co se vás netýká, nechte na 0. Z toho vznikne váš žebřík.</p>
  ${topics.map(([n, d], i) => range('tema' + i, n, `– ${d}`)).join('')}
  <div class="field"><label for="tema-jine">Jiné téma <span class="hint">(nepovinné)</span></label><input type="text" id="tema-jine" name="tema-jine" data-label="Jiné téma"></div>
</fieldset>

<fieldset data-section="2. Kompulze">
  <legend>2. Kompulze</legend>
  <p class="hint">Co děláte (navenek nebo v hlavě), aby strach nebo napětí rychle opadlo? Zaškrtněte, co platí.</p>
  <h3>Viditelné</h3>
  ${checks('kompulze-viditelne', ['Mytí, čištění, dezinfekce', 'Kontrolování (spotřebiče, dveře, tělo)', 'Opakování úkonů', 'Uspořádávání, symetrie', 'Dotýkání, odklepávání', 'Rituály kolem jídla'])}
  <h3>Mentální</h3>
  ${checks('kompulze-mentalni', ['Opakování slov nebo vět v hlavě', 'Analyzování a promýšlení dokola', '„Rušení“ myšlenky jinou myšlenkou', 'Procházení vzpomínek', 'Počítání', 'Modlitby nebo formule'])}
  <h3>Ujišťování</h3>
  ${checks('kompulze-ujistovani', ['Ptám se blízkých', 'Ptám se lékaře', 'Vyhledávám na internetu', 'Ptám se AI', 'Čtu fóra a zkušenosti jiných', 'Testuji se nebo měřím'])}
  <div class="field"><label for="kompulze-jine">Jiné kompulze nebo upřesnění</label><textarea id="kompulze-jine" name="kompulze-jine" rows="3" data-label="Jiné kompulze"></textarea></div>
</fieldset>

<fieldset data-section="3. Vyhýbání">
  <legend>3. Vyhýbání</legend>
  <div class="field"><label for="vyhybani">Čemu se vyhýbáte? <span class="hint">(místa, lidé, předměty, situace, myšlenky, témata)</span></label><textarea id="vyhybani" name="vyhybani" rows="4" data-label="Čemu se vyhýbám"></textarea></div>
</fieldset>

<fieldset data-section="4. Dopad">
  <legend>4. Dopad</legend>
  <div class="field"><label for="cas">Kolik času denně vám OCD zabírá?</label>
    <select id="cas" name="cas" data-label="Čas denně">
      <option value="">– vyberte –</option><option>Méně než 1 hodinu</option><option>1–3 hodiny</option><option>3–6 hodin</option><option>Více než 6 hodin</option>
    </select></div>
  <p class="hint">Co vám OCD omezuje?</p>
  ${checks('dopad', ['Práce nebo škola', 'Vztahy a rodina', 'Spánek', 'Jídlo', 'Volný čas a koníčky', 'Péče o domácnost', 'Cestování, pohyb mimo domov'])}
  <div class="field"><label for="dopad-jine">Upřesnění <span class="hint">(nepovinné)</span></label><textarea id="dopad-jine" name="dopad-jine" rows="3" data-label="Upřesnění dopadu"></textarea></div>
</fieldset>

<fieldset data-section="5. Pilíře a výběr cesty">
  <legend>5. Pilíře a výběr cesty</legend>
  <p class="hint">Odhad dnešního stavu. Slouží k tomu, abychom později viděli pokrok.</p>
  ${range('prijeti', 'Sebepřijetí', '– 0 = nepřijímám se vůbec, 10 = přijímám se celý/celá')}
  ${range('sebevira', 'Sebevíra', '– 0 = nevěřím, že bych to zvládl/a, 10 = „ať se stane cokoli, obstojím“')}
  ${range('vira', 'Víra v obavy', '– 0 = vím, že jde o OCD, 10 = jsem si jistý/á, že se obava splní')}
  <div class="field"><label for="erp">Dřívější zkušenost s ERP (expozice s prevencí reakce)</label>
    <select id="erp" name="erp" data-label="Zkušenost s ERP">
      <option value="">– vyberte –</option><option>Žádná</option><option>Zkoušel/a jsem sám/sama</option><option>Měl/a jsem vedení odborníka, pomohlo to</option><option>Měl/a jsem vedení odborníka, nepomohlo nebo zahltilo</option>
    </select></div>
</fieldset>

<fieldset data-section="6. Milníky">
  <legend>6. Milníky <span class="hint">(nepovinné)</span></legend>
  <div class="field"><label for="milniky">Kdy se strach poprvé objevil nebo zesílil? <span class="hint">(stačí rok nebo životní období, bez podrobností, které sdílet nechcete)</span></label><textarea id="milniky" name="milniky" rows="4" data-label="Milníky"></textarea></div>
</fieldset>

<fieldset class="consent" data-section="">
  <legend>Souhlas se zpracováním</legend>
  <label class="check"><input type="checkbox" id="souhlas" name="souhlas" required> Souhlasím se zpracováním údajů o svém zdravotním stavu, které v dotazníku uvedu, za účelem vedení peer mentoringu. Souhlas mohu kdykoli odvolat. Více v <a href="/ochrana-osobnich-udaju">zásadách ochrany osobních údajů</a>.</label>
  <p class="hint">Údaje o zdraví jsou zvláštní kategorie osobních údajů. Souhlas je dobrovolný. E-mail není šifrovaná zpráva, proto uvádějte jen to, co jste ochotni sdílet.</p>
</fieldset>

<div class="actions">
  <button type="button" class="btn" id="btn-mail">Otevřít e-mail s odpověďmi</button>
  <button type="button" class="btn btn-ghost" id="btn-text">Vytvořit text ke zkopírování</button>
</div>
<p id="msg" class="msg" role="status" aria-live="polite"></p>
<div id="vystup" class="vystup" hidden>
  <label for="vystup-text">Text k odeslání na ${EMAIL}</label>
  <textarea id="vystup-text" rows="14" readonly></textarea>
  <button type="button" class="btn btn-ghost" id="btn-copy">Zkopírovat text</button>
</div>

<p class="crisis"><strong>Pokud máte myšlenky na sebepoškození nebo jste v akutní krizi, ${CRISIS}.</strong></p>
</form>
`,
});

// ---------- E-book ----------
add('/ebook', {
  title: "E-book: Cesta k sebepřijetí a sebevíře s OCD | ocdmentor.cz",
  desc: "Krátký praktický e-book Cesta k sebepřijetí, sebevíře a svobodnějšímu životu s OCD (19 stran, PDF) ke stažení zdarma. Nenahrazuje odbornou péči.",
  ogTitle: 'E-book: Cesta k sebepřijetí',
  ogSub: 'Praktický e-book o sebepřijetí a sebevíře s OCD ke stažení zdarma',
  ogArt: '/assets/img/ebook-titulka.webp',
  ogArtPortrait: true,
  jsonld: {
    '@type': 'Book',
    name: 'Cesta k sebepřijetí, sebevíře a svobodnějšímu životu s OCD',
    author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/o-mne` },
    inLanguage: 'cs',
    numberOfPages: 19,
    bookFormat: 'https://schema.org/EBook',
    isAccessibleForFree: true,
    image: `${SITE}/assets/img/ebook-titulka.webp`,
    url: `${SITE}/ebook`,
    description: 'Krátký praktický e-book z osobní zkušenosti s OCD. Nenahrazuje odbornou péči.',
  },
  body: `
<section class="wrap page-head">
  <h1>E-book: Cesta k sebepřijetí, sebevíře a svobodnějšímu životu s OCD</h1>
  <p class="lead">Krátký praktický e-book (19 stran, formát A5) od Bc. Václava Kodeše, který vychází z mé osobní zkušenosti s OCD. Není to návod na vyléčení ani diagnostický materiál a nenahrazuje odbornou péči. Slouží k tomu, abyste si před případnou spoluprací udělali obrázek, jak o OCD přemýšlím a zda vám tento způsob práce sedí.</p>
</section>

<section class="wrap block ebook-grid">
  <a class="ebook-cover" href="/assets/ebook/Cesta_k_sebeprijeti.pdf" target="_blank" rel="noopener" aria-label="Otevřít e-book ve formátu PDF v nové záložce">
    <img src="/assets/img/ebook-titulka.webp" width="600" height="900" alt="Titulní strana e-booku Cesta k sebepřijetí, sebevíře a svobodnějšímu životu s OCD od Bc. Václava Kodeše: usměvavý turista s batohem na skále, v pozadí hory, řeka a slunce nad krajinou.">
  </a>
  <div class="ebook-dl">
    <h2>Stáhnout e-book</h2>
    <p>E-book je volně ke stažení, bez registrace a bez zadávání e-mailu.</p>
    <p class="cta"><a class="btn btn-cta" href="/assets/ebook/Cesta_k_sebeprijeti.pdf" download>Stáhnout e-book (PDF)</a></p>
    <p class="small">PDF, 19 stran, formát A5, 5,3 MB. Kliknutím na titulní stranu ho otevřete v nové záložce.</p>
  </div>
</section>

<section class="wrap block prose">
  <h2>Co v e-booku najdete</h2>
  <ul>
    <li><strong>Nejsi své OCD</strong> – rozdíl mezi vtíravou myšlenkou a tím, kdo jste; sebepřijetí jako opak rezignace.</li>
    <li><strong>Cyklus OCD</strong> – spouštěč, pochybnost, úzkost, kompulze a krátkodobá úleva.</li>
    <li><strong>Sebepřijetí a sebedůvěra</strong> – důvěra bez záruk a pohled do vlastního příběhu.</li>
    <li><strong>Kompulze a každodenní svoboda</strong> – jak rozpoznat, zda hledám jistotu; stručně o ERP a I-CBT, které patří odborníkovi.</li>
    <li><strong>Čtyři praktické pracovní listy</strong> a rady, když se obtíže vracejí a kdy vyhledat odbornou pomoc.</li>
  </ul>
  <p class="callout-inline disclaimer"><strong>Důležité:</strong> Nejsem psycholog, psychoterapeut ani psychiatr. Peer mentoring nenahrazuje odbornou diagnostiku ani léčbu.</p>
</section>
`,
});

// ---------- Online semináře ----------
// Termíny a stavy běhů jsou v data/seminare.json. Generátor selže s jasnou chybou, pokud se běhy překrývají nebo termín spadne na vynechané datum.
const SEMINARE_DATA = nactiDataSeminare();
const SEMINARE_BEHY = pripravBehy(SEMINARE_DATA);
add('/seminare', {
  title: 'Online semináře: pět setkání 1:1 podle knihy | ocdmentor.cz',
  desc: `Individuální program pěti online setkání 1:1 podle knihy o sebepřijetí a sebevíře s OCD. Rezervace termínu a platba QR kódem, cena ${formatCastka(SEMINARE_DATA.cena)}.`,
  ogTitle: 'Online semináře',
  ogSub: 'Pět setkání 1:1 podle knihy o sebepřijetí a sebevíře',
  ogArt: '/assets/img/ebook-titulka.webp',
  ogArtPortrait: true,
  crumb: 'Online semináře',
  jsonld: { '@graph': [SEM.faqJsonLd()] },
  script: '/assets/js/seminare.js',
  body: SEM.seminareBody({ data: SEMINARE_DATA, behy: SEMINARE_BEHY }),
});

add('/seminare/rezervace', {
  title: 'Rezervace semináře: výběr termínu a platba | ocdmentor.cz',
  desc: 'Rezervace místa v individuálním programu pěti online setkání: vyberte termín, vyplňte jméno a e-mail a zaplaťte QR kódem do 3 dnů.',
  ogTitle: 'Rezervace semináře',
  ogSub: 'Výběr termínu a platba QR kódem',
  art: false,
  crumb: 'Rezervace',
  parents: [['/seminare', 'Online semináře']],
  script: ['/assets/js/seminare.js', '/assets/js/rezervace.js'],
  body: SEM.rezervaceBody({ data: SEMINARE_DATA, behy: SEMINARE_BEHY }),
});

add('/seminare/rezervace/potvrzeni', {
  title: 'Rezervace přijata | ocdmentor.cz',
  desc: 'Potvrzení rezervace semináře: QR kód, platební údaje a termíny. Stránka se zobrazuje jen po odeslání rezervace.',
  noindex: true,
  art: false,
  crumbs: true,
  crumb: 'Potvrzení',
  parents: [['/seminare', 'Online semináře'], ['/seminare/rezervace', 'Rezervace']],
  script: ['/assets/js/vendor/qrcode.js', '/assets/js/potvrzeni.js'],
  body: SEM.potvrzeniBody(),
});

// ---------- Online kurz ----------
add('/kurz', {
  title: "Online kurz o OCD a peer mentoringu | ocdmentor.cz",
  desc: "Krátký psychoedukační online kurz: co OCD je a není, proč ujišťování nepomáhá a jak probíhá peer mentoring. Nenahrazuje odbornou péči.",
  robots: 'noindex, follow',
  ogTitle: 'Online kurz o OCD',
  body: `
<section class="wrap page-head">
  <h1>Online kurz</h1>
  <p class="callout-inline disclaimer"><strong>Tento kurz je psychoedukační</strong> a slouží k pochopení OCD a principů metody. Nejde o terapii, neobsahuje individuální léčebný plán a nenahrazuje práci s odborníkem. Je vhodný i jako doplněk pro lidi, kteří jsou v péči terapeuta nebo se do ní chystají.</p>
  <p class="lead">Krátký psychoedukační mini-kurz: 3–4 krátké lekce, které vysvětlují, co OCD je a není, proč ujišťování nepomáhá a jak probíhá peer mentoring.</p>
</section>

<section class="wrap block">
  <div class="cards">
    <article class="card">
      <h3>1. Co je OCD a co není</h3>
      <p>Základní orientace v tom, co je obsedantně-kompulzivní porucha a čím se liší od běžných obav, zvyků nebo preferencí.</p>
      <p class="placeholder">[video bude doplněno]</p>
    </article>
    <article class="card">
      <h3>2. Proč ujišťování nepomáhá</h3>
      <p>Jak ujišťování – od druhých, od sebe i z internetu – krátkodobě uleví, ale dlouhodobě OCD posiluje.</p>
      <p class="placeholder">[video bude doplněno]</p>
    </article>
    <article class="card">
      <h3>3. Co je peer mentoring a jak probíhá</h3>
      <p>Co od spolupráce můžete čekat, co ne, a čím se liší od terapie.</p>
      <p class="placeholder">[video bude doplněno]</p>
    </article>
  </div>
</section>

<section class="wrap block">
  <p>Chcete probrat svou situaci individuálně? <a href="/dotaznik">Vyplňte vstupní dotazník</a> nebo <a href="/kontakt">mě kontaktujte</a>.</p>
</section>
`,
});

// ---------- Kvíz Metal, nebo Pop? ----------
add('/kviz', {
  title: "Kvíz Metal, nebo Pop? Která cesta vám sedí | ocdmentor.cz",
  desc: "Pět krátkých otázek vám orientačně ukáže, jestli vám při OCD sedí cesta Metal, Pop, nebo něco mezi. Zkuste kvíz za minutu, nic se neukládá.",
  related: ['/metoda', '/pro-koho', '/jak-to-probiha', '/dotaznik'],
  ogTitle: 'Metal, nebo Pop?',
  ogSub: 'Která cesta vám sedí?',
  script: '/assets/js/kviz.js',
  body: `
<section class="wrap page-head">
  <h1>Metal, nebo Pop?</h1>
  <p class="lead">Lidé s OCD potřebují k cíli různé tempo. Pět krátkých otázek vám ukáže, která cesta vám nejspíš sedne. Výsledek je orientační, finální cestu vybereme spolu.</p>
</section>

<section class="wrap block">
  <div id="kviz-root" data-url="${SITE}/kviz">${kvizStatic()}</div>
  <noscript><p class="callout-inline">Kvíz potřebuje zapnutý JavaScript. Cestu spolu můžeme vybrat na <a href="/kontakt">úvodní konzultaci</a>.</p></noscript>
  <p class="small disclaimer kviz-crisis">Pokud jste v akutní krizi, ${CRISIS}.</p>
  <script defer src="/assets/js/kviz-data.js"></script>
</section>
`,
});

// ---------- Jak to probíhá ----------
const faqVisible = JAK.faq.filter((f) => !hasPlaceholder(f.a));
add('/jak-to-probiha', {
  title: "Jak probíhá peer mentoring: kroky a ceník | ocdmentor.cz",
  desc: "Jak probíhá peer mentoring při OCD: úvodní konzultace zdarma, vstupní dotazník a online sezení za 490 Kč. Ceník a časté dotazy. Rezervujte online.",
  gloss: true,
  related: ['/pro-koho', '/metoda', '/kviz', '/dotaznik'],
  ogTitle: 'Jak probíhá peer mentoring',
  ogSub: 'Kroky, ceník a časté dotazy',
  // Do FAQPage se zatím nedávají odpovědi s nedoplněným [placeholderem]; až budou texty hotové, přibudou samy.
  jsonld: {
    '@graph': [
      { '@type': 'FAQPage', mainEntity: faqVisible.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      serviceNode(),
    ],
  },
  body: `
<section class="wrap page-head">
  <h1>Jak to probíhá</h1>
</section>

<section class="wrap block">
  <h2>Tři kroky</h2>
  ${routeHtml('')}
  <p><a class="btn btn-ghost btn-sm" href="/dotaznik">Vyplnit vstupní dotazník</a></p>
</section>

<section class="wrap block">
  <h2>Ceník</h2>
  <div class="cards price-cards">
${JAK.cenik.map((c) => `    <article class="card">
      <h3>${esc(c.nazev)}</h3>
      <p class="price-meta">${esc(c.delka)}</p>
      <p class="price">${esc(c.cena)}</p>
      ${c.poznamka ? `<p class="price-note">${esc(c.poznamka)}</p>` : ''}
      <div class="price-book">${bookDiv}</div>
    </article>`).join('\n')}
  </div>
  ${bookScript}
</section>

<section class="wrap block faq">
  <h2>Časté dotazy</h2>
${JAK.faq.map((f) => `  <details>
    <summary>${esc(f.q)}</summary>
    <p>${withPlaceholders(f.a)}</p>
  </details>`).join('\n')}
</section>
`,
});

// ---------- O mně ----------
add('/o-mne', {
  art: false,
  title: "O mně: peer mentor s vlastní zkušeností s OCD | ocdmentor.cz",
  desc: "O mně: peer mentor s vlastní zkušeností s OCD. Co dělám a co ne, jaké mám kurzy a jaké hranice platí vždy. Domluvte si konzultaci zdarma.",
  gloss: true,
  related: ['/metoda', '/jak-to-probiha', '/kviz', '/pomoc'],
  ogTitle: 'O mně: peer mentor s vlastní zkušeností s OCD',
  ogArt: '/assets/img/o-mne-vaclav.webp',
  body: `
<section class="wrap page-head">
  <div class="about-grid">
    <div>
      <h1>O mně</h1>
      <p class="lead"><strong>Nejsem terapeut ani psycholog. Jsem peer mentor v přípravě.</strong></p>
    </div>
    <img class="about-photo" src="/assets/img/o-mne-vaclav.webp" width="700" height="933" alt="${AUTHOR}, autor webu OCD mentor" loading="eager">
  </div>
</section>
<section class="wrap block prose">
  <p>Mám vlastní zkušenost s OCD. Zkušenost není kvalifikace, ale umím rozumět tomu, jak se ve smyčce člověk cítí a co mu na cestě ven pomáhá.</p>
  <p>Od dětství jsem prošel úzkostmi, panickými atakami, sociální fobií, depersonalizací a derealizací i zažívacími potížemi, které úzkost vyvolávala. Hlavně jsem ale prošel OCD v mnoha podobách: magickým, zdravotním, kontaminačním, kontrolovacím i Pure O. Vím, jaké to je, když vás vlastní mysl drží v šachu. A vím, že se z toho dá vyjít. Proto jsem vytvořil tuto metodu a aplikaci, aby lidé jako já měli průvodce, který jim rozumí zevnitř.</p>
  <h2>Absolvované vzdělání</h2>
  <p class="disclaimer">Jde o absolvované kurzy, ne o oprávnění poskytovat zdravotní péči.</p>
  <a class="cert-thumb" href="/assets/img/certifikat-ocd-alison.webp" target="_blank" rel="noopener">
    <img src="/assets/img/certifikat-ocd-alison.webp" width="535" height="370" alt="Certifikát Alison.com – Understanding Obsessive-Compulsive Disorder (OCD), Bc. Václav Kodeš, 21. října 2026" loading="lazy">
  </a>
  <ul>
    <li><strong>Understanding Obsessive-Compulsive Disorder (OCD)</strong> (Porozumění obsedantně-kompulzivní poruše) – Alison.com, říjen 2026. <a href="https://alison.com/verify/beeebe5a83" target="_blank" rel="noopener">Ověřit certifikát</a>.</li>
    <li><strong>Overcoming OCD: Diagnosis, Treatment Options</strong> (Překonání OCD: diagnostika, možnosti léčby)</li>
  </ul>
  <!-- [DALŠÍ KURZY A CERTIFIKÁTY: název, organizace, rok, odkaz na ověření; doplní autor] -->
  <p class="small disclaimer">Nenahrazuje vzdělání psychiatra, psychologa ani psychoterapeuta.</p>
  <h2 id="hranice">Moje hranice</h2>
  <p>Co dělám a co ne. Tyto hranice platí vždy.</p>
  <ul class="rules">
    <li>Neslibuji vyléčení ani konkrétní výsledek.</li>
    <li>Nejsem terapeut, nestanovuji diagnózu a nevedu psychoterapii.</li>
    <li>Nepředepisuji ani neřeším léky. Nikdy vás nepovedu k jejich vysazení ani k ukončení péče u lékaře nebo terapeuta.</li>
    <li>ERP a I-CBT jsou odborné metody. Doprovázím vás při nich, nevedu je jako terapeut.</li>
    <li>Tempo určujete vy. Do žádné expozice vás nenutím.</li>
    <li>Neposkytuji ujištění, že se vaše obava nesplní. Patří ke smyčce, kterou chceme přerušit.</li>
    <li>Nic z naší spolupráce nezveřejňuji a nežádám recenze ani doporučení výměnou za schůzky.</li>
    <li>Cena a rozsah spolupráce jsou předem jasné.</li>
    <li>V akutní krizi nebo při zhoršení vás odkážu na odbornou pomoc.</li>
  </ul>
  <p><a class="btn" href="/kontakt">Napsat</a></p>
</section>
`,
});

// ---------- Články ----------
const ARTICLES = [
  {
    slug: 'druhy-ocd-9-typu',
    seoTitle: 'Druhy OCD: 9 typů a jejich příznaky',
    title: 'Druhy OCD: 9 typů, jejich příznaky a možnosti léčby',
    excerpt: 'OCD nemusí být jen mytí rukou. Přehled devíti tematických podob OCD, jejich typických příznaků a toho, jak se obsedantně-kompulzivní porucha léčí.',
    date: '2026-10-16',
    img: '/assets/img/clanky/druhy-ocd.webp',
    imgThumb: '/assets/img/clanky/druhy-ocd-thumb.webp',
  },
  {
    slug: 'proc-ujisteni-krmi-ocd',
    seoTitle: 'Proč ujišťování krmí OCD',
    title: 'Proč ujištění krmí OCD: Když hledání jistoty udržuje úzkost při životě',
    excerpt: 'Proč ujišťování přináší jen krátkodobou úlevu a dlouhodobě OCD udržuje, a co dělat místo opakovaného hledání jistoty u blízkých, na internetu i u umělé inteligence.',
    date: '2026-10-16',
    img: '/assets/img/clanky/proc-ujisteni.webp',
    imgThumb: '/assets/img/clanky/proc-ujisteni-thumb.webp',
  },
  {
    slug: 'proc-nutkani-prichazi-ve-vlnach',
    seoTitle: 'Proč nutkání přichází ve vlnách',
    title: 'Proč nutkání přichází ve vlnách: Nemusíš na každé nutkání reagovat',
    excerpt: 'Úzkost a nutkání při OCD nepřichází rovnoměrně, ale ve vlnách, které rostou, vrcholí a zase opadají. Jak takovou vlnu poznat a jak ji nechat projít bez kompulze.',
    date: '2026-10-16',
    img: '/assets/img/clanky/nutkani-ve-vlnach.webp',
    imgThumb: '/assets/img/clanky/nutkani-ve-vlnach-thumb.webp',
  },
  {
    slug: 'kompulze-a-prijeti',
    seoTitle: 'Kompulze a přijetí: cesta ven z OCD',
    title: 'Kompulze a přijetí: Proč cesta ven z OCD nevede přes boj s každou myšlenkou',
    excerpt: 'Přijetí neznamená souhlasit s vtíravou myšlenkou ani se s ní smířit. Znamená připustit, že je přítomná, a přesto nejednat kompulzí. Jak to v praxi vypadá a kdy se přijetí samo stane další kompulzí.',
    date: '2026-10-20',
    img: '/assets/img/clanky/kompulze-a-prijeti.webp',
    imgThumb: '/assets/img/clanky/kompulze-a-prijeti-thumb.webp',
  },
];

add('/clanky', {
  title: "Články o OCD: nutkání, ujišťování, přijetí | ocdmentor.cz",
  desc: "Články o OCD psané srozumitelně: druhy OCD, ujišťování, vlny nutkání a přijetí. Přečtěte si, co udržuje smyčku a jak z ní jít krok za krokem ven.",
  related: ['/metoda', '/kviz', '/pomoc'],
  ogTitle: 'Články o OCD',
  body: `
<section class="wrap page-head">
  <h1>Články</h1>
  <p class="lead">Krátké texty o OCD, bez slibů a bez čísel o úspěšnosti.</p>
</section>
<section class="wrap block">
  <div class="cards">
    ${[...ARTICLES].reverse().map((a) => `<article class="card article-card">${a.imgThumb ? `<a href="/clanky/${a.slug}" class="article-card-img"><img src="${a.imgThumb}" width="500" height="333" alt="" loading="lazy"></a>` : ''}<p class="small">${new Date(a.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p><h3><a href="/clanky/${a.slug}">${a.title}</a></h3><p>${a.excerpt}</p></article>`).join('\n    ')}
  </div>
  <!-- Nový článek: zkopírujte sablony/clanek.html do clanky/<slug>/index.html, upravte, přidejte do pole ARTICLES výše a do sitemap.xml. -->
</section>
`,
});

// ---------- Článek: Druhy OCD ----------
{
  const a = ARTICLES[0];
  const dateLabel = new Date(a.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  const ocdTypes = [
    ['kontaminacni-ocd', 'Kontaminační OCD: Strach z bakterií, nečistot a kontaminace',
      ['Kontaminační OCD se vyznačuje vtíravými obavami ze znečištění, bakterií, virů, chemikálií nebo jiných potenciálně škodlivých látek.',
        'Člověk může mít strach, že se dotkl kontaminovaného předmětu, přenesl nečistoty domů nebo ohrozil své zdraví či zdraví blízkých.'],
      ['nadměrné mytí rukou a sprchování', 'opakované čištění předmětů a domácnosti', 'vyhýbání se určitým místům nebo předmětům', 'opakované převlékání a praní', 'potřeba dodržovat přesně stanovené hygienické postupy'],
      'Problém nemusí spočívat pouze ve strachu z nečistot. Člověk může mít také pocit, že nikdy nemá dostatečnou jistotu, že je skutečně čistý nebo v bezpečí.'],
    ['kontrolovaci-ocd', 'Kontrolovací OCD: Neustálá potřeba všechno ověřovat',
      ['Kontrolovací OCD se projevuje opakovanými pochybnostmi o tom, zda člověk něco udělal správně, něco nezapomněl nebo nezpůsobil nebezpečnou situaci.',
        'Může opakovaně kontrolovat zámek, sporák, elektrické spotřebiče nebo odeslanou zprávu, přestože už danou věc ověřil.'],
      ['opakované kontrolování dveří a spotřebičů', 'vracení se na místo, aby si člověk ověřil předchozí činnost', 'opakované čtení e-mailů ze strachu z chyby', 'pochybnosti o vlastních vzpomínkách', 'potřebu získat potvrzení, že je všechno v pořádku'],
      'Kontrola přináší krátkodobou úlevu, ale pochybnosti se mohou vracet. Člověk pak získává pocit, že musí kontrolovat znovu.'],
    ['zdravotni-ocd', 'Zdravotní OCD: Vtíravý strach ze závažné nemoci',
      ['U OCD zaměřeného na zdraví se obsesivní pochybnosti týkají možného onemocnění nebo zdravotních příznaků.',
        'Člověk se může opakovaně obávat, že trpí vážnou nemocí, přehlédl důležitý příznak nebo že lékař něco nezjistil.'],
      ['neustálé vyhledávání příznaků na internetu', 'opakované sledování tělesných pocitů', 'porovnávání vlastních příznaků s popisy nemocí', 'opakované hledání ujištění', 'pochybování o výsledcích vyšetření', 'mentální analyzování toho, co by určitý příznak mohl znamenat'],
      'Člověk může získat úlevu poté, co si přečte uklidňující informace nebo dostane ujištění. Později se však může objevit další pochybnost a potřeba začít hledat odpovědi znovu.<br><br>Je přitom důležité rozlišovat mezi OCD zaměřeným na zdraví a zdravotní úzkostí, označovanou také jako úzkost z nemoci. Tyto obtíže se mohou překrývat, ale nejsou totožné. Samotné obavy o zdraví automaticky neznamenají OCD.'],
    ['pure-o', 'Pure O: OCD s převahou vtíravých myšlenek',
      ['Pure O je neformální označení pro podobu OCD, při které převažují obsese a kompulze nemusí být navenek patrné.',
        'Člověk může trávit dlouhou dobu přemýšlením o svých myšlenkách, hledáním jejich významu nebo kontrolováním vlastních pocitů.'],
      ['opakované analyzování vtíravých myšlenek', 'přehrávání minulých situací', 'snaha získat jistotu, co určitá myšlenka znamená', 'kontrolování vlastních emocí a reakcí', 'opakování uklidňujících vět v duchu', 'vyhledávání informací, které mají vyvrátit obavy'],
      'Například člověka napadne nepříjemná myšlenka a začne přemýšlet, proč se objevila, zda něco vypovídá o jeho osobnosti a jestli by mohla znamenat něco nebezpečného. Čím více se snaží dosáhnout definitivní jistoty, tím více pochybností může vznikat.<br><br>Označení Pure O je poněkud zavádějící, protože i v těchto případech se mohou vyskytovat kompulze. Často mají podobu mentálních rituálů, které okolí nemusí vůbec zaznamenat.'],
    ['vztahove-ocd-rocd', 'Vztahové OCD (ROCD): Pochybnosti o partnerovi a vztahu',
      ['Vztahové OCD, označované zkratkou ROCD, se týká obsesivních pochybností spojených s partnerským vztahem.',
        'Člověk může opakovaně zkoumat, zda svého partnera skutečně miluje, zda je jejich vztah správný nebo zda si vybral správného člověka.'],
      ['neustálé analyzování vlastních citů', 'pochybnosti o správnosti vztahu', 'porovnávání partnera s jinými lidmi', 'opakované hledání důkazů pro a proti vztahu', 'potřeba ujišťování', 'sledování vlastních emocí při kontaktu s partnerem'],
      'Běžné otázky o vztahu samy o sobě nejsou známkou OCD. Důležité je, zda se z pochybností stává opakující se proces, který člověku způsobuje výrazné trápení a omezuje jeho každodenní život.'],
    ['ocd-zamerene-na-ublizeni', 'OCD zaměřené na ublížení: Strach ze ztráty kontroly',
      ['Tato podoba OCD se může projevovat vtíravými představami o tom, že člověk někomu ublíží, způsobí nehodu nebo ztratí kontrolu nad svým jednáním.',
        'Takové myšlenky mohou být velmi znepokojivé, zejména pokud jsou v rozporu s hodnotami člověka.'],
      ['opakované přehrávání situací, ve kterých by mohlo dojít k nehodě', 'kontrolování vlastních úmyslů', 'snahu získat jistotu, že člověk není nebezpečný', 'vyhýbání se určitým situacím', 'opakované analyzování vlastních myšlenek'],
      'Samotný obsah vtíravé myšlenky nestačí k určení diagnózy. Rozhodující je celkový kontext a odborné posouzení obtíží.'],
    ['sexualni-ocd', 'Sexuální OCD: Nechtěné sexuální myšlenky a pochybnosti',
      ['Sexuální OCD se může projevovat vtíravými sexuálními představami, nechtěnými myšlenkami nebo pochybnostmi o vlastních touhách a identitě.',
        'Člověk může opakovaně zkoumat, co jeho myšlenky znamenají, kontrolovat své reakce nebo hledat ujištění o tom, co skutečně cítí.'],
      ['opakované analyzování sexuálních myšlenek', 'kontrolování tělesných reakcí', 'zkoumání vlastních pocitů', 'hledání informací a ujištění', 'snaha získat absolutní jistotu o vlastních preferencích'],
      'Samotná přítomnost myšlenky automaticky neznamená touhu ani záměr. Zároveň nelze diagnózu určit pouze podle toho, že jsou určité myšlenky nepříjemné nebo nechtěné.'],
    ['moralni-a-nabozenske-ocd', 'Morální a náboženské OCD: Strach z chyby a pocit viny',
      ['Morální a náboženská forma OCD se označuje také jako skrupulozita.',
        'Člověk se může nadměrně obávat, že udělal něco špatného, někomu ublížil nebo porušil důležité morální či náboženské zásady.'],
      ['opakované přemýšlení o minulých situacích', 'nadměrné pocity viny', 'opakované zpytování svědomí', 'potřeba ujišťovat se, že člověk neudělal nic špatného', 'nutkavé modlitby nebo opakování určitých úkonů', 'snaha získat definitivní odpověď na morální otázky'],
      'Člověk může mít pocit, že musí každé své rozhodnutí důkladně přezkoumat, aby si byl jistý, že jednal správně.'],
    ['ocd-zamerene-na-symetrii', 'OCD zaměřené na symetrii, pořádek a pocit úplnosti',
      ['Tato podoba OCD se pojí s potřebou symetrie, přesného uspořádání nebo pocitu, že je něco dokončeno správným způsobem.',
        'Člověk může opakovat určité pohyby, rovnat předměty nebo dodržovat konkrétní pravidla, dokud nemá pocit, že je vše v pořádku.'],
      ['opakované rovnání předmětů', 'potřeba symetrického uspořádání', 'opakování pohybů a úkonů', 'počítání nebo dodržování určitých pravidel', 'neschopnost přestat, dokud se nedostaví pocit úplnosti'],
      'Ne vždy je hlavním problémem strach z konkrétního nebezpečí. Někdy převažuje nepříjemný pocit, že něco není správně nebo není dokončeno.<br><br>Běžná pečlivost, smysl pro pořádek ani perfekcionismus samy o sobě neznamenají OCD.'],
  ];
  const faqs = [
    ['Jaké jsou nejčastější druhy OCD?', 'Mezi časté tematické podoby OCD patří kontaminační OCD, kontrolovací OCD, obsesivní pochybnosti zaměřené na zdraví, Pure O, vztahové OCD, OCD zaměřené na ublížení, sexuální OCD, morální OCD a OCD spojené se symetrií nebo pocitem úplnosti. Nejde však o samostatné oficiální diagnostické kategorie. Jednotlivé projevy se mohou překrývat.'],
    ['Co je Pure O?', 'Pure O je neformální označení pro OCD s převahou vtíravých myšlenek a převážně mentálních kompulzí. Člověk může opakovaně analyzovat své myšlenky, kontrolovat pocity nebo hledat ujištění, aniž by okolí zaznamenalo zjevné rituály.'],
    ['Může se OCD projevovat pouze v hlavě?', 'Ano. Kompulze nemusí být viditelné. Mohou mít podobu opakovaného přemýšlení, přehrávání vzpomínek, mentálního kontrolování nebo snahy získat jistotu. To však samo o sobě nestačí k určení diagnózy.'],
    ['Je zdravotní úzkost totéž co OCD?', 'Ne. Zdravotní úzkost a OCD zaměřené na zdraví se mohou překrývat, ale jde o odlišné klinické koncepty. K jejich rozlišení je důležité posoudit charakter obav, opakující se reakce a celkové fungování člověka.'],
    ['Lze mít více druhů OCD současně?', 'Ano. Jeden člověk může mít například současně obavy o zdraví, potřebu opakovaně kontrolovat určité situace a vtíravé myšlenky. Tematické zaměření OCD se navíc může v průběhu času měnit.'],
    ['Dá se OCD vyléčit?', 'OCD lze účinně léčit. Mezi hlavní možnosti patří kognitivně-behaviorální terapie, zejména ERP, a podle individuálních potřeb také léky. Výsledky léčby se liší a vhodný postup je nejlepší stanovit s odborníkem.'],
  ];
  const typeSection = ([id, h, paras, items, after], i) => `
  <h3 id="${id}">${i + 1}. ${h}</h3>
  ${paras.map((p) => `<p>${p}</p>`).join('\n  ')}
  <p>Mezi možné příznaky patří:</p>
  <ul class="rules">${items.map((x) => `<li>${x}</li>`).join('')}</ul>
  <p>${after}</p>`;

  add(`/clanky/${a.slug}`, {
    art: false,
    title: `${a.seoTitle} | ${DOMAIN}`,
    ogTitle: a.seoTitle,
    crumb: a.seoTitle,
    ogType: 'article',
    gloss: true,
    related: ARTICLES.filter((x) => x.slug !== a.slug).map((x) => '/clanky/' + x.slug).concat(['/metoda', '/kviz', '/vtirave-myslenky', '/typy-ocd']),
    published: a.date,
    modified: a.modified || a.date,
    desc: 'Jaké druhy OCD existují? Přehled 9 tematických podob OCD, jejich typické příznaky a možnosti odborné léčby včetně ERP a I-CBT.',
    ogImage: a.img,
    jsonld: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: a.title,
          description: 'Přehled 9 tematických podob OCD, jejich typických příznaků a možností odborné léčby.',
          image: `${SITE}/assets/img/clanky/druhy-ocd.webp`,
          datePublished: a.date,
          dateModified: a.date,
          inLanguage: 'cs',
          author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/o-mne` },
          publisher: { '@type': 'Organization', name: BRAND, url: SITE },
          mainEntityOfPage: `${SITE}/clanky/${a.slug}`,
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map(([q, aText]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: aText } })),
        },
      ],
    },
    body: `
<article class="wrap block prose">
  <p class="eyebrow"><a href="/clanky">Články</a></p>
  <h1>${a.title}</h1>
  <p class="small">Autor: <a href="/o-mne">${AUTHOR}</a> · <time datetime="${a.date}">${dateLabel}</time></p>
  <img src="/assets/img/clanky/druhy-ocd.webp" width="1200" height="800" alt="Devět tematických podob OCD znázorněných kolem postavy: kontaminační, kontrolovací, zdravotní, Pure O, vztahové, zaměřené na ublížení, sexuální, morální a náboženské a zaměřené na symetrii." style="border-radius: 20px; margin: .5rem 0 1.5rem;">

  <p>Obsedantně-kompulzivní porucha, známá pod zkratkou OCD, může mít mnoho různých podob. Ne vždy se projevuje opakovaným mytím rukou nebo kontrolováním dveří. U některých lidí převažují vtíravé myšlenky, u jiných neustálé pochybnosti, strach z nemoci nebo potřeba získávat ujištění.</p>
  <p>Jaké druhy OCD existují, jak poznat jejich typické projevy a jak se obsedantně-kompulzivní porucha léčí? V tomto článku se podíváme na devět častých tematických podob OCD, vysvětlíme rozdíly mezi obsesemi a kompulzemi a představíme možnosti odborné pomoci.</p>

  <h2>Co je OCD neboli obsedantně-kompulzivní porucha?</h2>
  <p>OCD je zkratka anglického názvu obsessive-compulsive disorder. V češtině se používá označení obsedantně-kompulzivní porucha.</p>
  <p>Jde o duševní poruchu charakterizovanou obsesemi, kompulzemi nebo jejich kombinací.</p>
  <p><strong>Obsese</strong> jsou opakující se vtíravé myšlenky, představy, impulzy či pochybnosti, které člověku způsobují úzkost nebo výrazné nepohodlí.</p>
  <p><strong>Kompulze</strong> jsou opakované činnosti nebo mentální úkony, kterými se člověk snaží snížit úzkost, zabránit obávané události nebo získat pocit jistoty.</p>
  <p>Mezi kompulze proto nemusí patřit pouze viditelné činnosti, jako je mytí rukou nebo kontrolování zámku. Mohou mít také podobu opakovaného přemýšlení, analyzování vlastních pocitů, přehrávání vzpomínek nebo vyhledávání ujištění.</p>
  <p>Typický může být následující cyklus:</p>
  <ol class="rules">
    <li>Objeví se vtíravá myšlenka nebo pochybnost.</li>
    <li>Člověk začne pociťovat úzkost a potřebu situaci vyřešit.</li>
    <li>Pokusí se získat jistotu prostřednictvím kontroly, analyzování nebo ujišťování.</li>
    <li>Dostaví se krátkodobá úleva.</li>
    <li>Pochybnost se vrátí a člověk má potřebu celý proces opakovat.</li>
  </ol>
  <p>Tento mechanismus může postupně zasahovat do práce, vztahů i běžného života.</p>
  <p>Ne každá vtíravá myšlenka nebo občasná kontrola znamená OCD. Pro stanovení diagnózy je důležité posoudit celkové příznaky, jejich intenzitu, časovou náročnost a dopad na fungování člověka.</p>

  <h2>Jaké druhy OCD existují?</h2>
  <p>OCD se může zaměřovat na různá témata. Mezi časté tematické podoby patří strach z kontaminace, kontrolování, obavy o zdraví, vztahové pochybnosti, vtíravé myšlenky o ublížení a potřeba symetrie.</p>
  <p>Je důležité vědět, že následující označení představují především tematické okruhy příznaků. Nejde o devět samostatných oficiálních diagnóz. Jeden člověk může mít několik těchto projevů současně a jejich zaměření se může v průběhu času měnit.</p>
  ${ocdTypes.map(typeSection).join('\n')}

  <h2>Jak poznat OCD? Rozhodující nejsou jen samotné myšlenky</h2>
  <p>Jedním z důležitých znaků OCD může být opakující se cyklus vtíravých myšlenek a nutkavých reakcí.</p>
  <p>Člověk například pocítí pochybnost, začne situaci analyzovat, hledá ujištění a na chvíli se uklidní. Jakmile se však objeví nová otázka, celý proces se opakuje.</p>
  <p>Problém může spočívat v tom, že člověk nedokáže nejistotu jednoduše nechat být. Má pocit, že musí pochybnost vyřešit, dokud nebude mít naprostou jistotu.</p>
  <p>Odborné posouzení je vhodné zejména tehdy, když:</p>
  <ul class="rules">
    <li>myšlenky nebo rituály zabírají značnou část dne,</li>
    <li>člověk se opakovaně snaží získat jistotu, ale úleva nevydrží,</li>
    <li>kvůli svým obavám omezuje běžné činnosti,</li>
    <li>vyhýbá se situacím, které mu dříve nevadily,</li>
    <li>obtíže narušují práci, vztahy nebo spánek.</li>
  </ul>
  <p>Žádný jednotlivý příznak sám o sobě diagnózu nepotvrzuje. Pokud má člověk podezření na OCD, může se obrátit na psychologa, psychoterapeuta nebo psychiatra se zkušenostmi s touto poruchou.</p>

  <h2>Jak se OCD léčí?</h2>
  <p>Mezi hlavní možnosti léčby OCD patří psychoterapie a v některých případech také farmakoterapie.</p>
  <h3>Kognitivně-behaviorální terapie a ERP</h3>
  <p>Kognitivně-behaviorální terapie (KBT) patří mezi zavedené psychoterapeutické přístupy při léčbě OCD.</p>
  <p>Její důležitou součástí může být expozice a prevence reakce (<abbr title="expozice a prevence reakce">ERP</abbr>). Při této metodě se člověk postupně učí čelit situacím vyvolávajícím úzkost a omezovat nutkavé reakce, které jeho obtíže udržují. Víc o tomto přístupu najdete na stránce <a href="/metoda">Metoda</a>.</p>
  <p>Cílem není získat stoprocentní jistotu, že se nic špatného nestane. Cílem je naučit se zvládat nejistotu bez nutnosti neustále kontrolovat, analyzovat nebo hledat ujištění.</p>
  <h3>I-CBT: Terapie zaměřená na obsesivní pochybnosti</h3>
  <p><abbr title="Inference-Based Cognitive Behavioral Therapy">I-CBT</abbr> (Inference-Based Cognitive Behavioral Therapy) je terapeutický přístup, který se zaměřuje na proces vzniku obsesivních pochybností.</p>
  <p>Pracuje mimo jiné s rozlišováním mezi tím, co člověk skutečně pozoruje nebo ví, a tím, co si pouze představuje jako možný scénář.</p>
  <p>Například člověk může začít pochybovat o svém zdraví, přestože pro jeho obavu nemá přesvědčivé aktuální důkazy. Následně vytváří další hypotetické scénáře a snaží se je všechny vyřešit.</p>
  <p>I-CBT pomáhá rozpoznávat tento způsob uvažování a pracovat s tím, jak se obsesivní pochybnosti vytvářejí.</p>
  <p>Jde o specifický terapeutický přístup, který se od ERP liší svým zaměřením. ERP má v současnosti rozsáhlejší základnu důkazů a patří mezi standardní doporučované postupy při léčbě OCD.</p>
  <h3>Léky při léčbě OCD</h3>
  <p>V některých případech mohou být součástí léčby také léky, zejména antidepresiva ze skupiny SSRI.</p>
  <p>O vhodnosti farmakoterapie rozhoduje lékař podle závažnosti obtíží, celkového zdravotního stavu a dalších individuálních okolností.</p>
  <p>Správně zvolená léčba může pomoci snížit intenzitu příznaků a zlepšit kvalitu života.</p>

  <h2>Často kladené otázky o druzích OCD</h2>
  ${faqs.map(([q, aText]) => `<h3>${q}</h3>\n  <p>${aText}</p>`).join('\n  ')}

  <h2>Závěr: OCD má různé podoby, ale podobné mechanismy</h2>
  <p>Obsedantně-kompulzivní porucha se nemusí projevovat pouze mytím rukou nebo kontrolováním předmětů. Může zahrnovat také vtíravé myšlenky, opakované pochybnosti, strach z nemoci nebo nutkavou potřebu získávat ujištění.</p>
  <p>Jednotlivé tematické podoby OCD se mohou překrývat a jejich zaměření se může v průběhu života měnit. Pro pochopení obtíží je proto důležité všímat si nejen obsahu myšlenek, ale také toho, jak na ně člověk reaguje.</p>
  <p>OCD není otázkou slabé vůle. Pokud člověka nutkavé myšlenky a rituály omezují v běžném životě, má smysl vyhledat odbornou pomoc.</p>
  <p>Užitečným prvním krokem je pochopit vlastní vzorce prožívání a zjistit, jaké možnosti odborné pomoci jsou k dispozici. Pokud chcete zmapovat svá vlastní témata, můžete začít <a href="/dotaznik">vstupním dotazníkem</a>.</p>
  <p class="callout-inline">Upozornění: Tento článek má informativní charakter a nenahrazuje odborné vyšetření ani individuální doporučení zdravotnického pracovníka.</p>
</article>
`,
  });
}

// ---------- Článek: Proč ujištění krmí OCD ----------
{
  const a = ARTICLES[1];
  const dateLabel = new Date(a.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  const steps = [
    ['Všimni si nutkání', 'Když přijde pochybnost, zkus si všimnout, co tě právě nutí něco udělat. Chceš zjistit novou informaci? Nebo potřebuješ slyšet odpověď, která ti zaručí, že se nemusíš bát? Nemusíš na tuto otázku okamžitě znát odpověď. Už samotné všimnutí si nutkání může být užitečné.'],
    ['Odlož reakci', 'Nemusíš si dávat za cíl, že už se nikdy nikoho nezeptáš nebo nic nevyhledáš. Zkus pouze chvíli počkat, než na nutkání zareaguješ. Můžeš pokračovat v tom, co jsi právě dělal, a dovolit si, aby nepříjemný pocit nějakou dobu existoval. Úzkost nemusí okamžitě zmizet, abys mohl pokračovat ve svém dni.'],
    ['Přestaň vyjednávat s každou pochybností', 'OCD může přicházet s dalšími a dalšími argumenty, proč bys měl situaci ještě jednou prověřit. Místo hledání protiargumentu můžeš zkusit odpovědět například: „Možná se mi podaří získat větší jistotu, možná ne. Teď se k tomu nemusím vracet.“ Nebo: „Vnímám, že mám potřebu se ujistit. Nemusím podle ní okamžitě jednat.“ Nejde o pozitivní afirmace ani o přesvědčování, že všechno dobře dopadne. Jde o změnu reakce na nutkání.'],
    ['Vrať pozornost k tomu, co chceš dělat', 'Nemusíš čekat, až budeš úplně klidný. Můžeš se vrátit k práci, rozhovoru s partnerem, procházce nebo jiné běžné činnosti, přestože pochybnost stále existuje. Tím se postupně učíš, že přítomnost nepříjemné myšlenky nemusí rozhodovat o tom, jak budeš trávit svůj čas.'],
    ['Buď k sobě trpělivý', 'Pokud se znovu přistihneš při vyhledávání nebo ujišťování, neznamená to, že jsi selhal. OCD může být vytrvalé a změna naučených reakcí vyžaduje čas. Důležité je postupně rozpoznávat své vzorce a zkoušet jiné reakce, nikoli požadovat od sebe dokonalost. U výraznějších obtíží může pomoci odborná léčba OCD, zejména kognitivně-behaviorální terapie s expozicí a prevencí rituálů (<abbr title="expozice a prevence reakce">ERP</abbr>).'],
  ];

  add(`/clanky/${a.slug}`, {
    art: false,
    title: `${a.seoTitle} | ${DOMAIN}`,
    ogTitle: a.seoTitle,
    crumb: a.seoTitle,
    ogType: 'article',
    gloss: true,
    related: ARTICLES.filter((x) => x.slug !== a.slug).map((x) => '/clanky/' + x.slug).concat(['/metoda', '/kviz', '/vtirave-myslenky', '/typy-ocd']),
    published: a.date,
    modified: a.modified || a.date,
    desc: 'Proč ujišťování přináší jen krátkodobou úlevu a dlouhodobě OCD udržuje. Jak kompulzivní ujišťování poznat u blízkých, na internetu i u AI a co dělat místo něj.',
    ogImage: a.img,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: 'Proč ujišťování vlastně udržuje OCD při životě a jak se postupně učit reagovat na pochybnosti jinak.',
      image: `${SITE}${a.img}`,
      datePublished: a.date,
      dateModified: a.date,
      inLanguage: 'cs',
      author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/o-mne` },
      publisher: { '@type': 'Organization', name: BRAND, url: SITE },
      mainEntityOfPage: `${SITE}/clanky/${a.slug}`,
    },
    body: `
<article class="wrap block prose">
  <p class="eyebrow"><a href="/clanky">Články</a></p>
  <h1>${a.title}</h1>
  <p class="small">Autor: <a href="/o-mne">${AUTHOR}</a> · <time datetime="${a.date}">${dateLabel}</time></p>
  <img src="${a.img}" width="1200" height="800" alt="Šestikrokový kruh znázorňující, jak ujišťování krmí OCD: vtíravá myšlenka, rostoucí úzkost, hledání ujištění, krátkodobá úleva, návrat pochybnosti a opakování cyklu." style="border-radius: 20px; margin: .5rem 0 1.5rem;">

  <p>„Myslíš, že jsem v pořádku?“ „A co když je to přece jen něco vážného?“ „Můžeš mi ještě jednou potvrdit, že se nemusím bát?“</p>
  <p>Pokud žiješ s obsedantně-kompulzivní poruchou (OCD), možná tyto otázky dobře znáš. Možná se opakovaně ptáš svých blízkých, vyhledáváš informace na internetu nebo se vracíš k umělé inteligenci, abys získal odpověď, která tě konečně uklidní.</p>
  <p>A když ji dostaneš, skutečně se ti na chvíli uleví.</p>
  <p>Jenže za chvíli se objeví další pochybnost. Nová otázka. Jiný úhel pohledu. A potřeba ujistit se znovu.</p>
  <p>Proč se to děje? A proč může právě to, co ti krátkodobě pomáhá, dlouhodobě OCD udržovat?</p>

  <h2>1. Ujištění přináší úlevu. A právě v tom je háček.</h2>
  <p>Když se objeví vtíravá myšlenka, pochybnost nebo nepříjemný pocit, mozek může situaci vyhodnotit jako nebezpečnou.</p>
  <p>Nemusí jít o skutečné nebezpečí. Stačí možnost, že by něco mohlo být špatně. Například:</p>
  <ul class="rules">
    <li>Co když mám nějakou vážnou nemoc?</li>
    <li>Co když jsem někomu ublížil, aniž bych si to uvědomil?</li>
    <li>Co když jsem udělal chybu, která bude mít závažné následky?</li>
    <li>Co když moje pochybnosti něco znamenají?</li>
  </ul>
  <p>Úzkost stoupá a člověk přirozeně hledá způsob, jak ji snížit. Začne hledat informace, kontrolovat, analyzovat nebo se někoho zeptá, zda je všechno v pořádku. Když dostane uklidňující odpověď, napětí obvykle klesne.</p>
  <p>Mozek si tak může vytvořit jednoduché spojení: pochybnost → úzkost → ujištění → úleva.</p>
  <p>A právě úleva může tento cyklus posilovat. Mozek se učí, že když přijde nepříjemná pochybnost, je potřeba něco udělat, aby zmizela. Příště proto může potřeba ujištění přijít ještě rychleji.</p>
  <p>Ne proto, že bys byl slabý nebo něco dělal špatně. Je to naučený mechanismus, který se snaží snížit nepříjemné pocity, ale ve výsledku může udržovat celý problém při životě.</p>

  <h2>2. Proč jedna odpověď nikdy nestačí?</h2>
  <p>Možná jsi to zažil. Položíš otázku. Dostaneš odpověď. Na chvíli se uklidníš. Pak tě napadne: „Ale co když to neplatí právě pro mě?“</p>
  <p>Začneš hledat další informace. Porovnáváš příznaky, zkoumáš detaily a hledáš výjimky. Nebo se zeptáš znovu, jen trochu jinak. Tentokrát chceš mít jistotu na sto procent.</p>
  <p>Jenže právě stoprocentní jistota bývá tím, co OCD požaduje a co v běžném životě často není možné získat.</p>
  <p>Každá odpověď totiž může otevřít prostor pro další pochybnost:</p>
  <ul class="rules">
    <li>Co když jsem otázku nepoložil správně?</li>
    <li>Co když mi druhý člověk něco důležitého neřekl?</li>
    <li>Co když existuje výjimka?</li>
    <li>Co když jsem přehlédl nějaký detail?</li>
  </ul>
  <p>OCD se tak nemusí spokojit ani s velmi přesvědčivou odpovědí. Místo aby pochybnost uzavřela, může ji začít zkoumat znovu.</p>
  <p>Problém často nespočívá v tom, že nemáš dost informací. Problém spočívá v tom, že se snažíš získat jistotu, kterou od tebe OCD neustále požaduje.</p>

  <h2>3. Ujišťování nemusí znamenat jen otázky</h2>
  <p>Když se řekne kompulze, mnoho lidí si představí opakované mytí rukou nebo kontrolování zamčených dveří. Ujišťování ale může mít i méně nápadnou podobu. Patří sem například:</p>
  <p><strong>Vyhledávání informací.</strong> Opakovaně zadáváš do vyhledávače své příznaky, čteš diskuse a porovnáváš vlastní zkušenost s příběhy ostatních.</p>
  <p><strong>Ptaní se blízkých.</strong> Opakovaně se ptáš partnera, rodičů nebo přátel, zda si myslí, že je všechno v pořádku.</p>
  <p><strong>Kontrolování vlastních pocitů.</strong> Sleduješ, zda už úzkost ustoupila, jestli se cítíš normálně nebo zda se určitá myšlenka stále vrací.</p>
  <p><strong>Mentální analyzování.</strong> V hlavě znovu přehráváš situaci, hledáš důkazy, rozebíráš své vzpomínky a snažíš se dospět k definitivnímu závěru.</p>
  <p><strong>Opakované dotazování umělé inteligence.</strong> Položíš otázku, dostaneš odpověď a chvíli se ti uleví. Potom se objeví nová pochybnost, a tak položíš další otázku.</p>
  <p>Samotné hledání informací ani rozhovor s AI samozřejmě automaticky neznamenají OCD. Důležitý je kontext, účel a způsob, jakým danou činnost používáš.</p>
  <p>Pokud ale něco opakuješ především proto, abys odstranil pochybnost a získal pocit jistoty, může se z toho stát součást obsedantně-kompulzivního cyklu.</p>

  <h2>4. Proč je tak těžké přestat hledat ujištění?</h2>
  <p>Protože ujištění opravdu funguje. Alespoň krátkodobě.</p>
  <p>Když máš úzkost, představa, že se přestaneš ptát, kontrolovat nebo hledat odpovědi, může působit téměř nesnesitelně. Možná si říkáš:</p>
  <ul class="rules">
    <li>„Když se neujistím, co když něco zanedbám?“</li>
    <li>„Co když se tentokrát opravdu děje něco špatného?“</li>
    <li>„Jak mám pokračovat v běžném životě, když nevím, jestli je všechno v pořádku?“</li>
  </ul>
  <p>To jsou pochopitelné obavy. OCD totiž často neútočí pouze prostřednictvím samotné myšlenky. Dokáže vyvolat i pochybnost o tom, zda je bezpečné přestat ji řešit.</p>
  <p>Člověk pak může mít pocit, že ujišťování není volba, ale nutnost.</p>
  <p>Jenže postupné omezování kompulzí může pomoci změnit způsob, jakým na pochybnosti reaguješ. Cílem není přesvědčit se, že se určitě nic špatného nestane. Cílem je postupně se učit, že nemusíš na každou pochybnost reagovat.</p>

  <h2>5. Co dělat místo ujišťování?</h2>
  <p>Nejde o to zakázat si všechny otázky, ignorovat skutečné problémy nebo se snažit násilně potlačit myšlenky.</p>
  <p>Jde o to rozpoznat okamžik, kdy nehledáš nové užitečné informace, ale další dávku jistoty. Můžeš začít několika malými kroky.</p>
  ${steps.map(([h, p], i) => `<h3>Krok ${i + 1}: ${h}</h3>\n  <p>${p}</p>`).join('\n  ')}

  <h2>6. Co když se ujišťuji u partnera nebo rodiny?</h2>
  <p>Ujišťování může ovlivňovat také vztahy.</p>
  <p>Blízcí lidé chtějí přirozeně pomoci. Když vidí, že se trápíš, snaží se tě uklidnit a ujistit tě, že je všechno v pořádku. Dělají to z dobrého úmyslu.</p>
  <p>Pokud se ale stejný cyklus opakuje, může se celá rodina postupně přizpůsobovat požadavkům OCD. Partner odpovídá na stále stejné otázky, kontroluje věci za druhého nebo se snaží předcházet všemu, co by mohlo vyvolat úzkost. Takové přizpůsobování se někdy označuje jako rodinná akomodace OCD.</p>
  <p>Řešením přitom není, aby blízcí náhle přestali projevovat podporu nebo tě nechali v těžké chvíli samotného. Mohou tě podpořit jiným způsobem.</p>
  <p>Například místo opakovaného potvrzování, že se určitě nic nestalo, mohou říct: „Vidím, že tě ta pochybnost trápí. Jsem tu s tebou, ale nechci tě znovu zatahovat do ujišťování, které ti pomáhá jen na chvíli.“</p>
  <p>Takový přístup může být užitečný zejména tehdy, když se na něm společně domluvíte, ideálně s podporou terapeuta, který má zkušenosti s OCD.</p>
  <p>Podpora totiž nemusí znamenat, že druhému člověku odstraníme každou pochybnost. Někdy znamená, že mu pomůžeme zvládnout ji, aniž bychom museli hledat další ujištění.</p>

  <h2>7. Co když se potřebuji ujistit, že je moje obava opravdu jen OCD?</h2>
  <p>Tady se dostáváme k důležitému paradoxu. Člověk, který se snaží přestat s ujišťováním, může začít hledat ujištění o tom, zda se skutečně jedná o ujišťování. Může se ptát:</p>
  <ul class="rules">
    <li>„Je tohle ještě normální otázka, nebo už kompulze?“</li>
    <li>„Mám tu myšlenku ignorovat?“</li>
    <li>„Jak poznám, že už se nemusím dál ujišťovat?“</li>
  </ul>
  <p>I takové otázky mohou být součástí cyklu, pokud se opakují především kvůli získání jistoty.</p>
  <p>To ale neznamená, že se nesmíš na nic ptát nebo že máš každou pochybnost automaticky přisoudit OCD.</p>
  <p>Skutečné zdravotní, bezpečnostní a praktické problémy je důležité řešit odpovídajícím způsobem. Cílem není ignorovat realitu, ale rozpoznávat opakované nutkání získat jistotu tam, kde další kontrolování už nepřináší nové užitečné informace.</p>
  <p>Pokud si nejsi jistý, jak rozlišit běžnou péči o sebe od kompulzivního ujišťování, může být užitečné probrat to s odborníkem, který OCD rozumí. Nemusíš tuto hranici dokonale určit při každé jednotlivé myšlence.</p>

  <h2>8. Svoboda nezačíná jistotou, ale jiným přístupem k nejistotě</h2>
  <p>Jedním z nejtěžších kroků při zvládání OCD je přijmout, že úplnou jistotu nelze získat ke všemu.</p>
  <p>Neznamená to rezignovat, být nezodpovědný nebo přestat se o sebe starat.</p>
  <p>Znamená to postupně opouštět představu, že musíš každou nepříjemnou myšlenku vyřešit, každou pochybnost vyvrátit a každý strach odstranit, než budeš moci pokračovat v životě.</p>
  <p>Ujištění může přinést okamžitou úlevu. Nemusí tě ale naučit, že pochybnost může existovat, aniž bys na ni musel reagovat. Právě tuto zkušenost můžeš postupně získávat, když začneš měnit své reakce na nutkání.</p>
  <p>Nemusíš se nejprve zbavit všech obav, abys mohl dělat věci, na kterých ti záleží.</p>
  <p>Cílem není mít jistotu, že se nikdy nic špatného nestane. Cílem je, aby potřeba jistoty přestala řídit tvůj život.</p>
  <p>A pokud se ti to zatím nedaří, neznamená to, že jsi selhal. Znamená to, že se učíš reagovat jinak na něco, co tě možná dlouho drželo v začarovaném kruhu.</p>
  <p>Každý okamžik, kdy si všimneš nutkání a zkusíš na něj nereagovat automaticky, může být příležitostí k nové zkušenosti.</p>
  <p>Nemusíš to zvládnout dokonale. Stačí začít. Pokud chcete se svým nutkáním pracovat podporovaně, můžete začít <a href="/dotaznik">vstupním dotazníkem</a> nebo se podívat na <a href="/metoda">metodu</a>.</p>

  <p class="callout-inline">Článek má informativní charakter a nenahrazuje odbornou péči. Pokud OCD výrazně zasahuje do tvého každodenního života, obrať se na odborníka se zkušenostmi s léčbou OCD.</p>
</article>
`,
  });
}

// ---------- Článek: Proč nutkání přichází ve vlnách ----------
{
  const a = ARTICLES[2];
  const dateLabel = new Date(a.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  const steps6 = [
    ['Pojmenuj, co se děje.', 'Místo okamžité reakce si všimni: „Objevilo se nutkání. Mám potřebu se ujistit.“ Nemusíš rozhodnout, jestli je tvoje myšlenka pravdivá, ani ji vyvracet.'],
    ['Zkus nutkání chvíli neuposlechnout.', 'Pokud máš potřebu něco zkontrolovat nebo se znovu zeptat, můžeš zkusit na tuto potřebu nereagovat. Nemusíš si slibovat, že už to nikdy neuděláš. Soustřeď se na svou současnou reakci.'],
    ['Dovol nepříjemnému pocitu existovat.', 'Nemusíš úzkost okamžitě odstranit. Můžeš být nervózní a současně pokračovat v běžné činnosti. Cílem není čekat a sledovat, kdy úzkost konečně zmizí. Jde o to dát jí prostor, aniž bys jí musel přizpůsobovat všechno své chování.'],
    ['Vrať se k tomu, na čem ti záleží.', 'Pokračuj v práci, připrav si jídlo, věnuj se rodině nebo se vrať ke své oblíbené činnosti. Ne proto, abys nutkání násilně zahnal, ale proto, že tvůj život nemusí stát na tom, zda se právě cítíš úplně klidně.'],
    ['Nehodnoť svůj úspěch podle toho, jak rychle úzkost odezněla.', 'Možná se ti uleví za několik minut. Možná se nutkání ještě několikrát vrátí. To samo o sobě neznamená, že jsi něco pokazil. Úspěchem může být i to, že jsi tentokrát nereagoval automaticky, přestože to bylo nepříjemné.'],
  ];

  add(`/clanky/${a.slug}`, {
    art: false,
    title: `${a.seoTitle} | ${DOMAIN}`,
    ogTitle: a.seoTitle,
    crumb: a.seoTitle,
    ogType: 'article',
    gloss: true,
    related: ARTICLES.filter((x) => x.slug !== a.slug).map((x) => '/clanky/' + x.slug).concat(['/metoda', '/kviz', '/vtirave-myslenky', '/typy-ocd']),
    published: a.date,
    modified: a.modified || a.date,
    desc: 'Úzkost a nutkání při OCD přichází ve vlnách, které rostou, vrcholí a opadají. Jak vlnu poznat, co ji zesiluje a jak ji nechat projít bez kompulze.',
    ogImage: a.img,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: 'Jak funguje vlna úzkosti a nutkání při OCD a jak se postupně učit nechat ji projít bez kompulze.',
      image: `${SITE}${a.img}`,
      datePublished: a.date,
      dateModified: a.date,
      inLanguage: 'cs',
      author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/o-mne` },
      publisher: { '@type': 'Organization', name: BRAND, url: SITE },
      mainEntityOfPage: `${SITE}/clanky/${a.slug}`,
    },
    body: `
<article class="wrap block prose">
  <p class="eyebrow"><a href="/clanky">Články</a></p>
  <h1>${a.title}</h1>
  <p class="small">Autor: <a href="/o-mne">${AUTHOR}</a> · <time datetime="${a.date}">${dateLabel}</time></p>
  <img src="${a.img}" width="1200" height="800" alt="Pětistupňová vlna nutkání: spouštěč, růst vlny, vrchol, přirozené uklidnění a klidnější fáze, znázorněná jako mořská vlna." style="border-radius: 20px; margin: .5rem 0 1.5rem;">

  <p>Možná to znáš. Ještě před chvílí ses cítil docela dobře, ale najednou se objeví vtíravá myšlenka, pochybnost nebo nepříjemný pocit. Úzkost začne narůstat a s ní i nutkání něco udělat.</p>
  <p>Potřebuješ se ujistit, něco zkontrolovat, vyhledat informace nebo si v hlavě znovu přehrát určitou situaci.</p>
  <p>Nutkání je silné. Máš pocit, že musíš jednat hned, jinak se úzkost ještě zhorší.</p>
  <p>A pak se stane něco zajímavého. Po určité době začne intenzita nutkání klesat. Někdy poměrně rychle, jindy postupně. Občas se ale znovu vrátí.</p>
  <p>Proč se to děje? A co můžeš dělat, když tě další vlna nutkání právě zaplavuje?</p>

  <h2>1. OCD nepřichází vždy se stejnou intenzitou</h2>
  <p>Obsedantně-kompulzivní porucha (OCD) může být velmi proměnlivá. Někdy jsou vtíravé myšlenky téměř neznatelné, jindy zabírají velkou část dne.</p>
  <p>Intenzita nutkání může kolísat v závislosti na mnoha faktorech, například na stresu, únavě, nedostatku spánku nebo na situacích, které v nás vyvolávají nejistotu.</p>
  <p>Někdy dokáže spustit úzkost i zdánlivá maličkost. Myšlenka, tělesný pocit, vzpomínka nebo určitá situace. Mozek vyhodnotí podnět jako potenciálně důležitý a objeví se potřeba něco udělat.</p>
  <p>Můžeš mít pocit, že tentokrát je nutkání silnější než kdy dřív. Že ho musíš vyřešit okamžitě. Že dokud nezískáš odpověď, nebudeš moct normálně fungovat.</p>
  <p>Jenže intenzita nutkání se v čase mění. To, co právě teď působí nesnesitelně, nemusí mít stejnou sílu za deset minut.</p>
  <p>Silné nutkání není příkaz, který musíš splnit. Je to nepříjemný prožitek, se kterým se můžeš postupně učit zacházet jinak.</p>

  <h2>2. Proč nutkání připomíná vlnu?</h2>
  <p>Představ si moře. Vlna se nejprve začne zvedat. Postupně nabírá na síle, dosáhne vrcholu a nakonec se rozplyne.</p>
  <p>Podobně může probíhat i vlna úzkosti a nutkání.</p>
  <p>Nejdříve přijde spouštěč. Například pochybnost, zda jsi něco udělal správně.</p>
  <p>Potom se objeví úzkost. Začneš situaci analyzovat a hledat způsob, jak nepříjemný pocit odstranit.</p>
  <p>Nutkání sílí. Máš potřebu zkontrolovat, zeptat se nebo získat jistotu.</p>
  <p>Pokud nutkání neuposlechneš, může úzkost ještě nějakou dobu přetrvávat. Nemusí klesnout okamžitě. Postupně se ale může začít měnit a slábnout.</p>
  <p>Někdy se objeví další vlna. Jindy se situace uklidní a ty se můžeš vrátit k tomu, co jsi dělal.</p>
  <p>Důležité je vědět, že průběh není vždy stejný. Některé vlny odezní rychle, jiné trvají déle a někdy se nutkání opakovaně vrací.</p>
  <p>Nemusíš ale čekat, až vlna úplně zmizí, abys mohl pokračovat ve svém životě.</p>

  <h2>3. Proč máme pocit, že nutkání musíme okamžitě poslechnout?</h2>
  <p>Když OCD vyvolá silnou úzkost, mozek se snaží najít cestu k úlevě. Může ti našeptávat:</p>
  <ul class="rules">
    <li>„Raději to ještě jednou zkontroluj.“</li>
    <li>„Co když tentokrát něco přehlédneš?“</li>
    <li>„Musíš si být jistý.“</li>
    <li>„Dokud to nevyřešíš, nemůžeš jít dál.“</li>
    <li>„Co když se něco stane, když to teď neuděláš?“</li>
  </ul>
  <p>Tyto myšlenky mohou působit naléhavě a přesvědčivě.</p>
  <p>Pokud na ně zareaguješ kompulzí, například kontrolováním nebo ujišťováním, můžeš pocítit úlevu. Mozek se tak učí, že provedení rituálu pomáhá snížit nepříjemné pocity.</p>
  <p>Tím se ale může posilovat spojení mezi pochybností a potřebou na ni reagovat. Když se příště objeví podobná situace, nutkání může přijít znovu.</p>
  <p>Proto je při zvládání OCD důležité nejen pracovat s obsahem myšlenek, ale také měnit způsob, jakým na ně reagujeme.</p>
  <p>Cílem není dosáhnout toho, aby se nutkání nikdy neobjevilo. Cílem je postupně se učit, že na něj nemusíš pokaždé odpovědět kontrolou, rituálem nebo hledáním ujištění.</p>

  <h2>4. Co se stane, když nutkání neposlechneš?</h2>
  <p>Tohle může být jedna z nejtěžších částí celého procesu.</p>
  <p>Když se rozhodneš neprovést kompulzi, můžeš mít pocit, že úzkost nevydržíš. Můžeš být nervózní, neklidný a mít silnou potřebu změnit situaci.</p>
  <p>Možná čekáš, že když nutkání neposlechneš, okamžitě se ti uleví. To se ale stát nemusí.</p>
  <p>Úzkost může zpočátku zůstat stejná, zesílit nebo kolísat. Můžeš mít pocit, že se nic nemění a že tvé úsilí nemá smysl.</p>
  <p>Přesto můžeš získávat novou zkušenost: nepříjemný pocit nemusíš automaticky řešit rituálem.</p>
  <p>Postupně můžeš zjistit, že dokážeš pokračovat v běžných činnostech, i když nemáš úplnou jistotu a úzkost ještě neodezněla.</p>
  <p>Právě na tomto principu stojí mimo jiné expozice s prevencí rituálů (<abbr title="expozice a prevence reakce">ERP</abbr>), která se používá v léčbě OCD. Víc o tomto přístupu najdete na stránce <a href="/metoda">Metoda</a>.</p>
  <p>Nejde o to přemáhat se za každou cenu nebo se vystavovat skutečnému nebezpečí. Jde o promyšlené a postupné učení se jiným reakcím na situace, které vyvolávají obsedantní úzkost.</p>
  <p>Pokud tě OCD výrazně omezuje, může být vhodné pracovat na tom s terapeutem, který má zkušenosti s touto metodou.</p>

  <h2>5. Co může vlny nutkání zesilovat?</h2>
  <p>Některé okolnosti mohou způsobit, že se nutkání objevuje častěji nebo je obtížnější ho zvládnout.</p>
  <p><strong>Stres a přetížení.</strong> Když toho máš hodně, může být obtížnější snášet nejistotu a odolávat nutkání.</p>
  <p><strong>Nedostatek spánku a únava.</strong> Únava může zhoršovat schopnost regulovat pozornost a reagovat na nepříjemné myšlenky s odstupem.</p>
  <p><strong>Snaha získat stoprocentní jistotu.</strong> Čím více se snažíš každou pochybnost definitivně vyřešit, tím více prostoru můžeš věnovat dalšímu analyzování a kontrolování.</p>
  <p><strong>Opakované ujišťování.</strong> Když se opakovaně ptáš druhých, vyhledáváš informace nebo kontroluješ vlastní pocity, může se posilovat potřeba dělat to znovu.</p>
  <p><strong>Neustálé sledování vlastního stavu.</strong> Pokud průběžně kontroluješ, zda už úzkost ustoupila, může se pozornost znovu a znovu vracet k tomu, co tě trápí.</p>
  <p>To samozřejmě neznamená, že musíš odstranit všechny stresory nebo přestat sledovat své zdraví. Smyslem je rozpoznat, kdy se běžná snaha postarat se o sebe mění v opakované chování motivované potřebou získat jistotu.</p>

  <h2>6. Jak zvládnout vlnu nutkání v praxi?</h2>
  <p>Až příště přijde nutkání, nemusíš mít připravený složitý plán. Můžeš začít několika jednoduchými kroky.</p>
  ${steps6.map(([h, p], i) => `<h3>${i + 1}. ${h}</h3>\n  <p>${p}</p>`).join('\n  ')}

  <h2>7. Co když se nutkání vrátí znovu?</h2>
  <p>Můžeš mít pocit, že když se stejná pochybnost objeví znovu, musíš začít celý proces od začátku. To ale není nutné.</p>
  <p>Návrat nutkání neznamená, že předchozí úsilí nemělo smysl. OCD může přicházet v opakovaných vlnách a některé situace mohou být náročnější než jiné.</p>
  <p>Nemusíš každou novou vlnu analyzovat, porovnávat s předchozí nebo zjišťovat, proč se objevila právě teď.</p>
  <p>Můžeš si jednoduše všimnout, že se nutkání vrátilo, a znovu se rozhodnout, jak na něj chceš reagovat.</p>
  <p>Někdy to půjde snadno. Jindy budeš potřebovat více podpory.</p>
  <p>Důležité je nesnažit se z každé vlny vytvořit další problém, který musíš dokonale vyřešit.</p>

  <h2>8. Nemusíš čekat na klid, abys mohl žít</h2>
  <p>Jednou z nejdůležitějších věcí, které se můžeš při zvládání OCD učit, je rozlišovat mezi tím, co cítíš, a tím, co musíš udělat.</p>
  <p>Můžeš cítit úzkost, aniž bys musel kontrolovat. Můžeš mít pochybnost, aniž bys musel hledat odpověď. Můžeš cítit nutkání, aniž bys ho musel poslechnout.</p>
  <p>To neznamená, že se ti to vždy podaří. A neznamená to ani, že nutkání okamžitě zeslábne.</p>
  <p>Znamená to, že si postupně vytváříš prostor pro jinou reakci. A právě v tomto prostoru se může začít měnit tvůj vztah k OCD.</p>
  <p>Nemusíš čekat, až budeš úplně klidný, abys mohl jít ven, věnovat se rodině nebo udělat něco, co je pro tebe důležité.</p>
  <p>Můžeš žít i v přítomnosti nejistoty.</p>
  <p>Nutkání může přijít jako vlna. Nemusíš ji zastavit, vyřešit ani okamžitě odstranit. Můžeš se postupně učit nechat ji projít, aniž by za tebe rozhodovala o tom, co uděláš dál.</p>
  <p>A pokud se ti to dnes nepodaří, neznamená to, že jsi selhal. Každý krok k jinému způsobu reagování se počítá. Pokud chceš začít, můžeš si zmapovat svá témata ve <a href="/dotaznik">vstupním dotazníku</a>.</p>

  <p class="callout-inline">Článek má informativní charakter a nenahrazuje odbornou péči. Pokud OCD výrazně zasahuje do tvého každodenního života, může pomoci psychoterapeut se zkušenostmi s OCD a metodou ERP.</p>
</article>
`,
  });
}

// ---------- Článek: Kompulze a přijetí ----------
{
  const a = ARTICLES[3];
  const dateLabel = new Date(a.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

  add(`/clanky/${a.slug}`, {
    art: false,
    title: `${a.seoTitle} | ${DOMAIN}`,
    ogTitle: a.seoTitle,
    crumb: a.seoTitle,
    ogType: 'article',
    gloss: true,
    related: ARTICLES.filter((x) => x.slug !== a.slug).map((x) => '/clanky/' + x.slug).concat(['/metoda', '/kviz', '/vtirave-myslenky', '/typy-ocd']),
    published: a.date,
    modified: a.modified || a.date,
    desc: 'Přijetí neznamená souhlas s myšlenkou. Znamená připustit ji, aniž bys musel jednat kompulzí. Jak to funguje a kdy se přijetí stane dalším rituálem.',
    ogImage: a.img,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: a.title,
      description: 'Proč přijetí nepříjemných myšlenek a pocitů bez kompulze funguje lépe než boj s každou myšlenkou a kdy se přijetí samo stane další kompulzí.',
      image: `${SITE}${a.img}`,
      datePublished: a.date,
      dateModified: a.date,
      inLanguage: 'cs',
      author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/o-mne` },
      publisher: { '@type': 'Organization', name: BRAND, url: SITE },
      mainEntityOfPage: `${SITE}/clanky/${a.slug}`,
    },
    body: `
<article class="wrap block prose">
  <p class="eyebrow"><a href="/clanky">Články</a></p>
  <h1>${a.title}</h1>
  <p class="small">Autor: <a href="/o-mne">${AUTHOR}</a> · <time datetime="${a.date}">${dateLabel}</time></p>
  <img src="${a.img}" width="1200" height="800" alt="Dvě cesty: cesta kompulze (vtíravá myšlenka, úzkost, kompulze, krátkodobá úleva, návrat pochybnosti) a cesta přijetí (všimnu si myšlenky, přijmu nepříjemný pocit, neprovedu kompulzi, pokračuji v tom, na čem mi záleží)." style="border-radius: 20px; margin: .5rem 0 1.5rem;">

  <p>Možná to znáš. Objeví se vtíravá myšlenka a ty okamžitě cítíš, že s ní musíš něco udělat. Potřebuješ ji vyvrátit, získat jistotu, zkontrolovat situaci nebo si v hlavě všechno znovu přehrát.</p>
  <p>Říkáš si, že až budeš mít jistotu, konečně se uklidníš. A tak začneš hledat odpovědi.</p>
  <p>Jenže místo trvalé úlevy přicházejí další pochybnosti. A s nimi další nutkání.</p>
  <p>Co kdyby existovala jiná cesta? Cesta, na které nemusíš každou myšlenku vyřešit, každý pocit odstranit a každou pochybnost vyvrátit?</p>
  <p>Právě tady se dostáváme k jednomu z důležitých principů zvládání obsedantně-kompulzivní poruchy (OCD): přijetí nepříjemných myšlenek a pocitů bez nutnosti reagovat na ně kompulzí.</p>
  <p>Nejde o rezignaci. Nejde o to, že se máš se vším smířit. A už vůbec to neznamená, že musíš věřit všemu, co ti proběhne hlavou.</p>
  <p>Jde o to naučit se rozlišovat mezi tím, co se v tobě odehrává, a tím, co skutečně potřebuješ udělat.</p>

  <h2>1. Co je kompulze a proč ji OCD tak naléhavě vyžaduje?</h2>
  <p>Kompulze je opakované chování nebo mentální úkon, ke kterému člověk cítí nutkání, často v reakci na vtíravou myšlenku, úzkost nebo pocit nejistoty.</p>
  <p>Jejím cílem bývá snížit nepříjemné pocity nebo zabránit obávané události.</p>
  <p>Kompulze nemusí být na první pohled viditelná. Může mít mnoho podob. Například:</p>
  <ul class="rules">
    <li>Opakovaně kontroluješ, zda jsi zamkl dveře.</li>
    <li>Ptáš se partnera, jestli si myslí, že je všechno v pořádku.</li>
    <li>Vyhledáváš na internetu informace, které mají vyvrátit tvou obavu.</li>
    <li>V hlavě si znovu přehráváš rozhovor, abys zjistil, zda jsi neřekl něco nevhodného.</li>
    <li>Snažíš se najít správný pocit, který by ti potvrdil, že je všechno tak, jak má být.</li>
    <li>Opakuješ určitou myšlenku nebo mentální postup, dokud nemáš pocit, že je to správně.</li>
  </ul>
  <p>Na první pohled mohou tyto činnosti působit jako snaha vyřešit problém. A někdy je kontrola nebo hledání informací skutečně užitečné.</p>
  <p>Rozdíl spočívá v jejich funkci. Pokud něco opakuješ především proto, abys získal jistotu, neutralizoval úzkost nebo dosáhl pocitu, že je všechno v pořádku, může se z toho stávat součást kompulzivního cyklu.</p>
  <p>Kompulze často přináší krátkodobou úlevu. Právě ta ale může posilovat přesvědčení, že příště musíš udělat totéž. Vzniká tak začarovaný kruh: vtíravá myšlenka → úzkost → kompulze → krátkodobá úleva → další pochybnost.</p>
  <p>Přijetí nabízí možnost začít tento cyklus postupně narušovat.</p>

  <h2>2. Přijetí neznamená souhlas s myšlenkou</h2>
  <p>Slovo přijetí může být matoucí. Možná si pod ním představíš, že se musíš smířit s tím, že se tvoje nejhorší obavy skutečně naplní.</p>
  <p>Tak to ale není.</p>
  <p>Přijetí v kontextu OCD neznamená souhlasit s obsahem vtíravé myšlenky. Neznamená ani rozhodnout, že je pravdivá.</p>
  <p>Znamená připustit, že se tato myšlenka právě objevila, aniž bys musel okamžitě zahájit boj proti ní.</p>
  <p>Představ si, že tě napadne: „Co když jsem někomu ublížil, aniž bych si to uvědomil?“</p>
  <p>OCD tě může tlačit k tomu, abys začal analyzovat své vzpomínky, hledat důkazy a opakovaně se ujišťovat, že se nic nestalo.</p>
  <p>Přijetí by mohlo vypadat jinak. Všimneš si myšlenky. Uvědomíš si, že v tobě vyvolává úzkost. A místo okamžitého rozebírání se pokusíš připustit, že právě teď máš nepříjemnou pochybnost.</p>
  <p>Nemusíš ji vyvracet. Nemusíš jí věřit. Nemusíš ani dospět k definitivnímu závěru. Můžeš pokračovat v tom, co jsi dělal.</p>
  <p>Přijetí neznamená říct si, že všechno určitě dobře dopadne. Znamená přestat požadovat, aby ses o tom musel právě teď přesvědčit.</p>

  <h2>3. Proč boj s myšlenkami často nefunguje?</h2>
  <p>Když se objeví nepříjemná myšlenka, přirozenou reakcí může být snaha ji odstranit.</p>
  <p>Řekneš si, že na ni nebudeš myslet. Začneš se soustředit na něco jiného nebo se pokusíš dokázat sám sobě, že nemá žádný význam.</p>
  <p>Jenže čím více sleduješ, zda se myšlenka znovu objevila, tím více pozornosti jí můžeš věnovat.</p>
  <p>Může vzniknout další problém: začneš se bát nejen původní myšlenky, ale i toho, že se znovu objeví. A když se vrátí, můžeš mít pocit, že jsi něco nezvládl.</p>
  <p>U OCD se tak někdy rozvíjí další vrstva obtíží. Člověk se snaží odstranit nejen samotnou pochybnost, ale také úzkost, nejistotu a nepříjemné pocity, které ji doprovázejí.</p>
  <p>Výsledkem může být nekonečné vnitřní vyjednávání:</p>
  <ul class="rules">
    <li>„Proč mě to napadlo?“</li>
    <li>„Co když to něco znamená?“</li>
    <li>„Jak se mám zbavit téhle myšlenky?“</li>
    <li>„Proč na ni pořád myslím?“</li>
  </ul>
  <p>Přijetí nabízí jiný přístup: nemusíš myšlenku odstranit, abys mohl pokračovat ve svém životě.</p>
  <p>Může se objevit a zase odejít. Může se vrátit. A ty se můžeš postupně učit, že její přítomnost nevyžaduje automatickou reakci.</p>

  <h2>4. Jak přijmout úzkost, když je opravdu silná?</h2>
  <p>Tohle je jedna z nejtěžších částí.</p>
  <p>Když je úzkost mírná, může být poměrně snadné říct si, že ji nemusíš řešit. Když ale dosáhne vysoké intenzity, situace vypadá úplně jinak.</p>
  <p>Tělo je napjaté, myšlenky se vracejí a potřeba provést kompulzi může být velmi silná. Možná máš pocit, že dokud něco neuděláš, nebudeš schopen pokračovat v běžném dni.</p>
  <p>Přijetí přitom neznamená, že se musíš cítit klidně. Neznamená ani, že máš úzkost potlačit nebo se přesvědčovat, že ti nic není.</p>
  <p>Můžeš si jednoduše všimnout:</p>
  <ul class="rules">
    <li>„Teď cítím úzkost.“</li>
    <li>„Mám silné nutkání se ujistit.“</li>
    <li>„Je pro mě těžké tuto pochybnost nechat být.“</li>
  </ul>
  <p>Nemusíš k těmto větám přidávat vysvětlení ani hledat způsob, jak se okamžitě uklidnit.</p>
  <p>Můžeš dovolit nepříjemnému pocitu existovat a současně se rozhodnout, že nebudeš automaticky následovat každé nutkání.</p>
  <p>Někdy úzkost postupně zeslábne. Jindy bude nějakou dobu přetrvávat nebo se znovu zvýší. Ani jedno samo o sobě neznamená, že jsi selhal.</p>
  <p>Přijetí není technika, která musí okamžitě odstranit úzkost. Je to způsob, jak se k ní vztahovat, aniž bys musel každému nepříjemnému pocitu přizpůsobit své chování.</p>

  <h2>5. Praktický příklad: Když máš potřebu se znovu ujistit</h2>
  <p>Představ si, že jsi poslal pracovní e-mail. Krátce nato se objeví pochybnost: „Co když jsem napsal něco nevhodného?“</p>
  <p>Otevřeš odeslanou zprávu a přečteš si ji. Potom znovu. Zkoumáš jednotlivé věty a přemýšlíš, jak si je druhý člověk mohl vyložit. Nakonec se zeptáš kolegy, zda e-mail působí normálně.</p>
  <p>Na chvíli se ti uleví. Za několik minut se ale objeví další pochybnost: „A co když si kolega nevšiml toho problematického místa?“ Celý proces začíná znovu.</p>
  <p>Jak by mohla vypadat reakce založená na přijetí?</p>
  <p>Nejdříve si všimneš nutkání zkontrolovat e-mail znovu. Potom se rozhodneš, že nebudeš pokračovat v opakované kontrole pouze kvůli úzkosti.</p>
  <p>Možná stále cítíš nejistotu. Možná máš chuť otevřít zprávu ještě jednou. Přesto se vrátíš k práci.</p>
  <p>Neříkáš si, že e-mail byl určitě dokonalý. Ani se nesnažíš dokázat, že jsi nic nepokazil. Pouze připouštíš, že nemůžeš mít absolutní jistotu o tom, jak každý člověk každou větu pochopí.</p>
  <p>A pokud existuje konkrétní, prakticky řešitelná chyba, můžeš ji napravit běžným způsobem. Přijetí není zákaz rozumného jednání. Jde o to rozpoznat rozdíl mezi užitečnou kontrolou a opakováním, které slouží především k neutralizaci úzkosti.</p>

  <h2>6. Co když se přijetí samo stane další kompulzí?</h2>
  <p>Tohle je důležitý bod, na který se někdy zapomíná.</p>
  <p>Člověk s OCD může začít přijetí používat jako další způsob, jak získat jistotu nebo odstranit nepříjemné pocity.</p>
  <p>Může se snažit přijímat myšlenku dokonale. Opakuje si určité věty a kontroluje, zda už ji skutečně přijal. Například:</p>
  <ul class="rules">
    <li>„Musím tuto myšlenku přijmout.“</li>
    <li>„Přijímám ji správně?“</li>
    <li>„Proč stále cítím úzkost, když už bych měl přijímat?“</li>
    <li>„Co když jsem přijetí nepochopil správně?“</li>
  </ul>
  <p>A z původně užitečného přístupu se může stát další mentální rituál.</p>
  <p>Přijetí totiž není úkol, který musíš splnit bez chyby. Nemusíš dosáhnout dokonalého vnitřního klidu. Nemusíš si opakovat správné věty. Nemusíš kontrolovat, zda už jsi se svou myšlenkou smířený.</p>
  <p>Můžeš si pouze všimnout, že se snažíš něco dělat dokonale, a postupně se učit tuto snahu opouštět.</p>
  <p>Někdy budeš schopen nechat myšlenku být. Jindy se do analyzování znovu zapleteš. To je součást procesu učení, nikoli důkaz, že přijetí nefunguje.</p>

  <h2>7. Přijetí a prevence rituálů: Jak spolu souvisejí?</h2>
  <p>Přijetí není jedinou metodou práce s OCD, ale dobře souvisí s principy kognitivně-behaviorální terapie a zejména expozice s prevencí rituálů (<abbr title="expozice a prevence reakce">ERP</abbr>). Víc o tomto přístupu najdete na stránce <a href="/metoda">Metoda</a>.</p>
  <p>Při ERP se člověk postupně a plánovaně setkává se situacemi, které vyvolávají obsedantní úzkost, a učí se neprovádět obvyklé kompulze.</p>
  <p>Například někdo, kdo opakovaně kontroluje zamčené dveře, se může v rámci vhodně nastavené léčby učit odejít po běžné kontrole, aniž by se vracel kvůli dalším pochybnostem.</p>
  <p>Smyslem není dokazovat si, že se nic špatného nestane. Je jím změna vztahu k nejistotě a nutkání kontrolovat.</p>
  <p>Přijetí může být v tomto procesu užitečné, protože pomáhá člověku připustit nepříjemné pocity, aniž by je musel okamžitě neutralizovat.</p>
  <p>Důležité je postupovat přiměřeně a rozlišovat mezi kompulzivním chováním a běžnými bezpečnostními opatřeními. Pokud OCD výrazně zasahuje do každodenního života, je vhodné plánovat léčbu s odborníkem, který má zkušenosti s OCD a ERP.</p>

  <h2>8. Nemusíš vyřešit každou pochybnost, abys mohl pokračovat</h2>
  <p>Možná jsi dlouho věřil, že klid přijde teprve tehdy, až budeš mít všechny odpovědi.</p>
  <p>A tak jsi hledal jistotu. Kontroloval. Analyzoval. Ptával ses druhých.</p>
  <p>Možná ti tyto činnosti opakovaně přinesly úlevu, ale pochybnosti se stejně vracely.</p>
  <p>Přijetí nabízí jinou možnost.</p>
  <p>Nemusíš mít vyřešenou každou myšlenku, abys mohl jít na procházku, věnovat se rodině, pracovat nebo dělat něco, co má pro tebe smysl.</p>
  <p>Nemusíš se nejdříve zbavit úzkosti, abys mohl pokračovat ve svém dni. A nemusíš ani čekat, až budeš mít pocit, že jsi všechno přijal správně.</p>
  <p>Můžeš si všimnout, že se objevila pochybnost. Můžeš cítit nepohodlí. A přesto se můžeš rozhodnout věnovat pozornost tomu, co je pro tebe důležité.</p>
  <p>To neznamená, že se OCD přestane ozývat ze dne na den. Změna může vyžadovat čas, trpělivost a někdy také odbornou podporu.</p>
  <p>Každý okamžik, kdy začneš rozpoznávat nutkání a hledat jinou reakci, však může být příležitostí k učení.</p>

  <h2>Na závěr: Přijetí není vzdávání se</h2>
  <p>Přijetí neznamená, že se vzdáváš snahy cítit lépe.</p>
  <p>Znamená, že se postupně vzdáváš nekonečného boje o absolutní jistotu.</p>
  <p>Nemusíš souhlasit s každou myšlenkou. Nemusíš jí věřit. A nemusíš ji ani za každou cenu vyvracet.</p>
  <p>Můžeš ji nechat být myšlenkou.</p>
  <p>Můžeš připustit, že úzkost je právě teď přítomná, aniž bys musel okamžitě něco kontrolovat nebo napravovat.</p>
  <p>A můžeš pokračovat v životě, i když v něm zůstává určitá míra nejistoty.</p>
  <p>Svoboda od OCD nemusí začínat okamžikem, kdy přestanou přicházet nepříjemné myšlenky. Může začít okamžikem, kdy se učíš, že na každou z nich nemusíš reagovat.</p>
  <p>A to je něco, co se můžeš postupně učit. Bez dokonalosti, bez spěchu a bez požadavku, abys všechno zvládl hned. Pokud chceš začít, můžeš si zmapovat svá témata ve <a href="/dotaznik">vstupním dotazníku</a>.</p>

  <p class="callout-inline">Článek má informativní charakter a nenahrazuje odbornou péči. Pokud OCD významně ovlivňuje tvůj každodenní život, může pomoci psychoterapeut se zkušenostmi s léčbou OCD, zejména s kognitivně-behaviorální terapií a metodou ERP.</p>
</article>
`,
  });
}

// ---------- Kontakt ----------
add('/kontakt', {
  art: false,
  title: "Kontakt a rezervace konzultace zdarma | ocdmentor.cz",
  desc: "Kontakt na peer mentora při OCD: napište e-mail nebo si rezervujte úvodní konzultaci zdarma (20 min online). Peer podpora doplňuje odbornou péči.",
  ogTitle: 'Kontakt a rezervace konzultace',
  body: `
<section class="wrap page-head">
  <div class="contact-grid">
    <div>
      <h1>Kontakt</h1>
      <p class="lead">Nejjednodušší je vyplnit <a href="/dotaznik">vstupní dotazník</a>, domluvit si konzultaci, nebo mi napsat.</p>
      <div class="cta">
        ${bookBtn()}
      </div>
    </div>
    <img class="contact-art" src="/assets/img/kontakt-ilustrace.webp" width="640" height="585" alt="" loading="eager">
  </div>
</section>
<section class="wrap block">
  <dl class="contact">
    <dt>E-mail</dt><dd><a href="mailto:${EMAIL}">${EMAIL}</a></dd>
  </dl>
  <p class="callout-inline"><strong>V akutní krizi nepište, volejte:</strong> 112, 155 nebo Linka první psychické pomoci 116 123.</p>
  <p>E-mail není šifrovaná zpráva. Zdravotní podrobnosti si nechte na dotazník a domluvený rozhovor.</p>
  <p class="small">Obchodní podmínky si přečtěte <a href="/obchodni-podminky">zde</a>.</p>
</section>
`,
});

// ---------- Ochrana osobních údajů ----------
add('/ochrana-osobnich-udaju', {
  title: "Ochrana osobních údajů | ocdmentor.cz",
  desc: "Zásady ochrany osobních údajů podle GDPR: správce, účel a právní základ zpracování, doba uchování a vaše práva. Kontakt na správce najdete uvnitř.",
  ogTitle: 'Ochrana osobních údajů',
  body: `
<section class="wrap page-head"><h1>Ochrana osobních údajů</h1>
<p class="lead">Jak nakládáme s vašimi údaji podle nařízení (EU) 2016/679 (GDPR).</p></section>
<section class="wrap block prose">
  <h2>Správce údajů</h2>
  <p>${AUTHOR}, IČ ${ICO}, se sídlem ${ADDRESS}, e-mail <a href="mailto:${EMAIL}">${EMAIL}</a>. Pověřenec pro ochranu osobních údajů nebyl jmenován.</p>

  <h2>Co a jak zpracováváme</h2>
  <p>Pokud mi v e-mailu, telefonicky nebo přes WhatsApp sami sdělíte podrobnosti o svém zdravotním stavu, zpracovávám je jen v rozsahu nutném k domluvení spolupráce. Právním základem je v tomto případě váš souhlas, který dáváte najevo tím, že mi tyto údaje dobrovolně sdělíte (čl. 9 odst. 2 písm. a GDPR). Písemné poznámky o jednotlivých obtížích, nutkáních nebo kompulzích si nevedu.</p>
  <ol class="rules">
    <li><strong>Vstupní dotazník (/dotaznik):</strong> nic se neukládá na server. Text se sestaví přímo ve vašem prohlížeči a vy si ho sami odešlete e-mailem nebo zkopírujete. Právní základ: váš výslovný souhlas se zpracováním zvláštní kategorie údajů o zdravotním stavu (čl. 9 odst. 2 písm. a GDPR).</li>
    <li><strong>Aplikace (/aplikace):</strong> vaše odpovědi se ukládají jen ve vašem zařízení, v úložišti prohlížeče (localStorage). Nikdy se neodesílají na žádný server ani nám. Smazat je můžete kdykoli v sekci <a href="/aplikace/nastaveni">Data a připomínky</a>. Právní základ: váš souhlas udělený při prvním spuštění aplikace.</li>
    <li><strong>E-mailová komunikace:</strong> pokud nám napíšete, zpracováváme váš e-mail a obsah zprávy jen za účelem odpovědi a vyřízení dotazu. Právní základ: jednání před uzavřením spolupráce nebo oprávněný zájem odpovědět na dotaz (čl. 6 odst. 1 písm. b, f GDPR). E-mail není šifrovaná zpráva.</li>
    <li><strong>Rezervace konzultace:</strong> tlačítko „Domluvit si konzultaci“ na úvodní stránce načítá widget společnosti Reservanto s.r.o. (IČ 24298395, Liberec). Už samotným načtením stránky se vaše IP adresa dostane k Reservantu. Pokud si rezervaci dokončíte, zadáváte do Reservanta jméno, telefon a e-mail, které slouží k vyřízení rezervace a ke komunikaci s vámi. Zda Reservanto tyto údaje zpracovává jako samostatný správce, nebo jako náš zpracovatel, se řídí jeho aktuálními podmínkami — podrobnosti najdete ve <a href="https://reservanto.cz/ochrana-osobnich-udaju" target="_blank" rel="noopener noreferrer">vlastních zásadách ochrany osobních údajů Reservanta</a>. Právní základ: jednání před uzavřením spolupráce (čl. 6 odst. 1 písm. b GDPR).</li>
    <li><strong>Telefon a WhatsApp:</strong> po rezervaci vás zpravidla kontaktuji telefonicky nebo přes WhatsApp, abychom domluvili podrobnosti sezení. Vaše telefonní číslo k tomu použiji jen za tímto účelem. Komunikace přes WhatsApp probíhá přes službu provozovanou společností WhatsApp Ireland Limited (Meta), která zprávy přenáší přes svou infrastrukturu; neslibuji, že tyto zprávy zůstávají jen na vašem nebo mém zařízení. Právní základ: jednání před uzavřením spolupráce (čl. 6 odst. 1 písm. b GDPR).</li>
    <li><strong>Rezervace online semináře (/seminare):</strong> zpracovávám jméno, příjmení, e-mail a informace o rezervaci a platbě (zvolený běh a termíny, variabilní symbol, částka; číslo účtu odesílatele vidím v bance po připsání platby). Samotná účast na semináři o OCD může vypovídat o zdravotním stavu, což je zvláštní kategorie údajů. Formulář odesílá údaje na serverovou funkci webu hostovanou ve Vercelu (region EU), která z nich jen sestaví a odešle e-maily (účastníkovi s platebními údaji a mně s upozorněním na novou rezervaci) a nic neukládá. Účel a právní základ: rezervace a plnění smlouvy (čl. 6 odst. 1 písm. b GDPR), plnění účetních a daňových povinností (čl. 6 odst. 1 písm. c) a výslovný souhlas se zpracováním informace o zdravotním stavu plynoucí z účasti (čl. 9 odst. 2 písm. a).</li>
    <li><strong>Technické údaje o připojení</strong> (např. IP adresa) zpracovává automaticky náš hostingový poskytovatel Vercel Inc. jen za účelem doručení stránky a zabezpečení provozu, po krátkou technicky nutnou dobu. Sami vlastní cookies, analytiku ani žádné vlastní sledování nepoužíváme. Widget Reservanto (viz výše) je ale skript třetí strany a může při načtení nebo otevření rezervace nastavit vlastní cookies podle svých podmínek.</li>
  </ol>

  <h2>Kategorie zpracovávaných údajů</h2>
  <ul class="rules">
    <li>Jméno, e-mailová adresa a telefonní číslo (komunikace, rezervace).</li>
    <li>Obsah zprávy, telefonátu nebo odpovědí v dotazníku, včetně údajů o zdravotním stavu, pokud se rozhodnete je sdílet.</li>
    <li>Zvolený termín a typ služby při rezervaci konzultace.</li>
    <li>Při rezervaci semináře: zvolený běh a termíny, variabilní symbol a částka; samotná účast na semináři může vypovídat o zdravotním stavu.</li>
    <li>Technické údaje o připojení, např. IP adresa (hosting).</li>
  </ul>

  <h2>Zdroj osobních údajů</h2>
  <p>Veškeré osobní údaje získáváme přímo od vás: z vaší e-mailové zprávy, z textu dotazníku, který si sami odešlete, z údajů, které zadáte při rezervaci konzultace přes Reservanto, nebo z údajů, které zadáte do rezervačního formuláře semináře.</p>

  <h2>Doba uchování</h2>
  <p>U dotazníku ani u aplikace žádná: tato data u nás vůbec nejsou uložena. U e-mailové, telefonické a WhatsApp komunikace jen po dobu nutnou k vyřízení dotazu nebo k domluvené spolupráci. Dobu uchování vašich údajů v systému Reservanto určuje Reservanto podle svých podmínek. U rezervace semináře uchovávám údaje o platbě po dobu stanovenou účetními a daňovými předpisy a e-mailovou komunikaci 1 rok po skončení programu. Zápisy ani nahrávky ze setkání nepořizuji, případné krátké poznámky mažu nejpozději 30 dnů po skončení programu.</p>

  <h2>Příjemci údajů a předávání do zahraničí</h2>
  <p>Hostingový poskytovatel Vercel Inc. jako technický zpracovatel provozu webu a serverové funkce rezervace. Brevo (Francie) jako poskytovatel odesílání e-mailů při rezervaci semináře. Google (e-mail a videohovory Google Meet). Rezervační systém Reservanto s.r.o. (viz výše). Pokud s vámi komunikuji přes WhatsApp, zprávy zpracovává WhatsApp Ireland Limited (Meta). Vercel, Google a Meta mohou údaje zpracovávat i mimo Evropský hospodářský prostor, a to na základě standardních smluvních doložek nebo rozhodnutí o odpovídající ochraně. Jinak údaje nepředáváme žádným dalším třetím stranám.</p>

  <h2>Vaše práva</h2>
  <ul class="rules">
    <li>Potvrzení, zda vaše údaje zpracováváme, a přístup k nim (čl. 15 GDPR).</li>
    <li>Oprava nepřesných údajů (čl. 16).</li>
    <li>Výmaz údajů (čl. 17).</li>
    <li>Omezení zpracování (čl. 18).</li>
    <li>Přenositelnost údajů (čl. 20).</li>
    <li>Námitka proti zpracování (čl. 21).</li>
    <li>Podat stížnost u <a href="https://www.uoou.cz/" target="_blank" rel="noopener noreferrer">Úřadu pro ochranu osobních údajů</a>.</li>
  </ul>
  <p>Souhlas se zpracováním u dotazníku nebo aplikace můžete kdykoli odvolat tak, že údaje jednoduše nepoužijete nebo je v aplikaci smažete. Protože se u nás vůbec neukládají, k jejich „výmazu na vyžádání“ u nás není co dělat; o jejich smazání ve vašem vlastním zařízení nebo e-mailu se staráte vy sami. Souhlas se zpracováním při rezervaci semináře můžete kdykoli odvolat e-mailem na <a href="mailto:${EMAIL}">${EMAIL}</a>; odvolání nemá vliv na zákonnost zpracování před jeho odvoláním.</p>

  <h2>Automatizované rozhodování</h2>
  <p>Neprovádíme žádné automatizované individuální rozhodování ani profilování ve smyslu čl. 22 GDPR. Nápovědy v aplikaci (doporučená cesta, návrh posunu v žebříčku) jsou jen orientační a vždy je potvrzujete vy sami.</p>

  <h2>Povinnost poskytnout údaje</h2>
  <p>Vyplnění dotazníku ani používání aplikace není povinné a není podmínkou ničeho. Údaje poskytujete dobrovolně a v rozsahu, který sami zvolíte. U rezervace semináře je poskytnutí jména a e-mailu nezbytné, bez nich ji nelze dokončit.</p>
</section>
`,
});

// ---------- Obchodní podmínky ----------
add('/obchodni-podminky', {
  title: "Obchodní podmínky | ocdmentor.cz",
  desc: 'Obchodní podmínky peer mentoringu OCD mentor: nabídka služeb, rezervace přes Reservanto, storno podmínky a odstoupení od smlouvy.',
  ogTitle: 'Obchodní podmínky',
  body: `
<section class="wrap page-head"><h1>Obchodní podmínky</h1>
<p class="lead">Podmínky služeb, které poskytuje ${AUTHOR} pod značkou ${BRAND}. <a href="#cast-a">Část A</a> (individuální mentoring, rezervace přes Reservanto) je účinná od 1. 12. 2026, <a href="#cast-b">Část B</a> (Online semináře) od 1. 11. 2026.</p></section>
<section class="wrap block prose">
  <h2 id="cast-a">Část A: Individuální mentoring a konzultace (rezervace přes Reservanto)</h2>
  <p class="small">Část A se týká úvodní konzultace, individuálního mentoringu a balíčku sezení. Pro Online semináře platí Část B níže.</p>

  <h3>1. Úvodní ustanovení a poskytovatel</h3>
  <p>Tyto obchodní podmínky upravují vzájemná práva a povinnosti mezi poskytovatelem a klientem vzniklé v souvislosti se službami peer mentoringu nabízenými na webu ${SITE}, nebo na jeho základě uzavřené.</p>
  <p><strong>Poskytovatel:</strong> ${AUTHOR}, IČ ${ICO}, se sídlem ${ADDRESS}, e-mail <a href="mailto:${EMAIL}">${EMAIL}</a>, web ${SITE} (dále jen „poskytovatel“).</p>
  <p><strong>Klient:</strong> fyzická osoba, která si u poskytovatele objedná některou ze služeb popsaných níže (dále jen „klient“).</p>
  <p>Právní vztahy mezi poskytovatelem a klientem, které tyto podmínky výslovně neupravují, se řídí zejména zákonem č. 89/2012 Sb., občanský zákoník, a je-li klient spotřebitelem, také zákonem č. 634/1992 Sb., o ochraně spotřebitele.</p>

  <h3>2. Charakter služby</h3>
  <ul class="rules">
    <li>${BRAND} nabízí peer mentoring založený na osobní zkušenosti poskytovatele s OCD.</li>
    <li>Peer mentoring není psychoterapie ani zdravotní služba.</li>
    <li>Nenahrazuje odbornou diagnostiku, léčbu ani krizovou intervenci.</li>
    <li>Poskytovatel neslibuje a nezaručuje vyléčení OCD ani konkrétní výsledek spolupráce.</li>
    <li>Pokud klient prožívá akutní krizi nebo má myšlenky na sebepoškození, má se obrátit na tísňovou linku 112, zdravotnickou záchrannou službu 155 nebo Linku první psychické pomoci 116 123, ne na poskytovatele.</li>
  </ul>

  <h3>3. Nabízené služby a ceny</h3>
  <ul class="rules">
    <li><strong>Úvodní online konzultace</strong> — 20 minut, zdarma. Konzultace klienta k ničemu nezavazuje a sama o sobě není podmínkou objednání dalších služeb.</li>
    <li><strong>Individuální online mentoring</strong> — 50 minut, 490 Kč.</li>
    <li><strong>Balíček dvou mentoringových sezení</strong> — 2× 50 minut, 880 Kč.</li>
  </ul>
  <p>Aktuální nabídka a ceny jsou vždy k dispozici i přímo v rezervačním systému Reservanto při objednávání. V případě rozporu mezi touto stránkou a rezervačním systémem se použije znění platné v okamžiku objednávky v Reservantu.</p>
  <p>Poskytovatel není plátcem DPH. Uvedené ceny jsou tedy konečné a nejsou navyšovány o DPH.</p>

  <h3>4. Rezervace a platba</h3>
  <ul class="rules">
    <li>Rezervace probíhá online přes rezervační systém Reservanto, dostupný přes tlačítko „Domluvit si konzultaci“ na webu poskytovatele.</li>
    <li>Klient si může rezervovat i termín na tentýž den, pokud je v Reservantu volný.</li>
    <li>Placená sezení klient hradí při rezervaci, způsobem nabízeným v Reservantu.</li>
    <li>Smlouva mezi poskytovatelem a klientem je uzavřena okamžikem potvrzení rezervace v Reservantu.</li>
    <li>Služby se poskytují online (např. formou videohovoru), způsob spojení poskytovatel klientovi upřesní před sezením.</li>
  </ul>

  <h3>5. Storno podmínky</h3>
  <ul class="rules">
    <li>Zrušení termínu alespoň 24 hodin před jeho začátkem je bezplatné.</li>
    <li>Změna termínu závisí na dostupnosti poskytovatele a vzájemné dohodě.</li>
    <li>Pokud klient zruší placené sezení méně než 24 hodin před jeho začátkem, nebo se k němu bez omluvy nedostaví, může si poskytovatel ponechat uhrazenou cenu jako kompenzaci za rezervovaný čas. Tím není dotčeno právo klienta na odstoupení od smlouvy podle bodu 6, pokud se na danou situaci vztahuje.</li>
    <li>Zrušení i změnu termínu klient řeší přímo v Reservantu nebo e-mailem na <a href="mailto:${EMAIL}">${EMAIL}</a>.</li>
  </ul>

  <h3 id="odstoupeni">6. Odstoupení od smlouvy (spotřebitelé)</h3>
  <p>Je-li klient spotřebitelem a smlouva byla uzavřena distančním způsobem (online přes Reservanto), má právo podle § 1829 občanského zákoníku odstoupit od smlouvy do 14 dnů od jejího uzavření, a to bez udání důvodu.</p>
  <p>Toto právo se netýká úvodní konzultace zdarma, protože za ni klient nic neplatí.</p>
  <p>U placené služby, kterou si klient rezervuje na termín spadající ještě do této 14denní lhůty, platí následující zvláštní pravidla:</p>
  <ul class="rules">
    <li>Poskytovatel smí se sezením začít ještě v průběhu lhůty pro odstoupení pouze tehdy, pokud o to klient výslovně požádá (§ 1834 občanského zákoníku). Samotná rezervace blízkého termínu sama o sobě takovou žádostí není.</li>
    <li>Právo klienta na odstoupení od smlouvy u takové služby zaniká až okamžikem, kdy je sezení poskytnuto v plném rozsahu, a to jen tehdy, pokud jsou splněny obě tyto podmínky zároveň (§ 1837 písm. a) občanského zákoníku): klient ještě před uzavřením smlouvy (tj. před potvrzením rezervace) udělil předchozí výslovný souhlas s tím, že sezení proběhne už v průběhu lhůty pro odstoupení, a poskytovatel ho před uzavřením smlouvy výslovně poučil, že poskytnutím sezení v plném rozsahu toto právo zanikne. Nejsou-li obě podmínky splněny, právo klienta na odstoupení trvá i po poskytnutí sezení.</li>
    <li>Samotná rezervace blízkého termínu nebo souhlas s těmito obchodními podmínkami při objednávce sama o sobě nepředstavuje výslovný souhlas ani poučení podle předchozí odrážky. Text těchto obchodních podmínek sám o sobě tuto podmínku nesplňuje a nenahrazuje výslovný souhlas, který musí klient projevit zvlášť a prokazatelně v rámci konkrétní rezervace.</li>
    <li>Pokud klient odstoupí od smlouvy poté, co sezení na jeho výslovnou žádost již částečně proběhlo, uhradí poskytovateli poměrnou část sjednané ceny odpovídající plnění poskytnutému do okamžiku, kdy poskytovateli sdělí, že od smlouvy odstupuje (§ 1834 občanského zákoníku).</li>
    <li>Pokud klient od smlouvy odstoupí předtím, než sezení začalo, vrátí mu poskytovatel celou uhrazenou částku bez zbytečného odkladu, nejpozději do 14 dnů od odstoupení.</li>
  </ul>
  <p>Samotné zrušení nebo přeložení termínu podle storno podmínek v bodě 5 je něco jiného než zákonné odstoupení od smlouvy popsané v tomto bodě. Klient může využít kterékoli z těchto práv, na které má podle okolností nárok.</p>
  <p>Odstoupení od smlouvy může klient poskytovateli oznámit e-mailem na <a href="mailto:${EMAIL}">${EMAIL}</a>, případně jiným jednoznačným prohlášením. Stačí, aby klient oznámení o odstoupení odeslal před uplynutím 14denní lhůty; k jeho doručení poskytovateli může dojít i později.</p>
  <p>Pro odstoupení není povinné použít žádný konkrétní formulář. Pro usnadnění níže nabízíme vzorový formulář podle vzoru stanoveného právními předpisy — jeho vyplnění a odeslání je dobrovolné.</p>
  <div class="callout-inline">
    <p><strong>Vzorový formulář pro odstoupení od smlouvy</strong><br>(vyplňte tento formulář a odešlete jej poskytovateli pouze v případě, že chcete odstoupit od smlouvy)</p>
    <p>Adresát: ${AUTHOR}, ${ADDRESS}, e-mail ${EMAIL}</p>
    <p>Oznamuji, že tímto odstupuji od smlouvy o poskytnutí této služby: …</p>
    <p>Datum rezervace / objednání: …</p>
    <p>Jméno a příjmení klienta: …</p>
    <p>E-mail nebo adresa klienta: …</p>
    <p>Číslo bankovního účtu pro vrácení platby (byla-li již uhrazena): …</p>
    <p>Datum: …</p>
    <p>Podpis klienta (pouze je-li formulář zasílán v listinné podobě): …</p>
  </div>
  <!-- Interní poznámka (nezobrazuje se na webu): výslovná žádost o zahájení služby před
       uplynutím lhůty pro odstoupení (§1834 obč. zák.) a poučení o zániku práva na odstoupení po
       plném poskytnutí služby (§1837 písm. a) obč. zák.) řeší modál souhlasu (#rsv-modal), který
       se musí odkliknout před každým otevřením rezervace v Reservantu. Nespoléhá se tedy na to,
       zda totéž zajišťuje i samotný Reservanto. -->

  <h3>7. Práva a povinnosti stran</h3>
  <ul class="rules">
    <li>Poskytovatel se zavazuje poskytnout objednanou službu s odbornou péčí odpovídající roli peer mentora, v mezích popsaných na stránce <a href="/o-mne#hranice">Moje hranice</a>.</li>
    <li>Klient se zavazuje uvádět při rezervaci pravdivé a aktuální kontaktní údaje a dostavit se na sjednané sezení.</li>
    <li>Pokud klientovy obtíže přesahují rámec peer mentoringu (viz <a href="/pro-koho">Pro koho</a>), poskytovatel ho odkáže na odbornou pomoc.</li>
  </ul>

  <h3>8. Reklamace a stížnosti</h3>
  <p>Pokud nejste se službou spokojeni, napište na <a href="mailto:${EMAIL}">${EMAIL}</a>. Stížnost vyřídíme bez zbytečného odkladu.</p>
  <p>Je-li klient spotřebitelem, může se v případě sporu obrátit také na Českou obchodní inspekci (coi.cz) jako subjekt mimosoudního řešení spotřebitelských sporů.</p>

  <h3>9. Ochrana osobních údajů</h3>
  <p>Zpracování osobních údajů v souvislosti s těmito službami popisují samostatné <a href="/ochrana-osobnich-udaju">zásady ochrany osobních údajů</a>.</p>

  <h3>10. Závěrečná ustanovení</h3>
  <ul class="rules">
    <li>Část A těchto obchodních podmínek nabývá účinnosti 1. 12. 2026.</li>
    <li>Poskytovatel může tyto podmínky v přiměřeném rozsahu měnit; aktuální znění je vždy dostupné na této stránce.</li>
    <li>Pokud by se některé ustanovení těchto podmínek ukázalo neplatným nebo neúčinným, nemá to vliv na platnost ostatních ustanovení.</li>
  </ul>

  <h2 id="cast-b">Část B: Online semináře (individuální program pěti setkání)</h2>
  <p class="small">Část B je platná od 1. 11. 2026 a týká se jen programu popsaného na stránce <a href="/seminare">Online semináře</a>.</p>

  <h3>B1. Prodejce</h3>
  <p>${AUTHOR}, IČ ${ICO}, se sídlem ${ADDRESS}, e-mail <a href="mailto:${EMAIL}">${EMAIL}</a>. Prodejce není plátcem DPH.</p>

  <h3>B2. Předmět</h3>
  <p>Individuální program pěti online setkání po 60 minutách, 1× týdně, vždy jen jeden klient. Cena programu je 3 590 Kč.</p>

  <h3>B3. Povaha služby</h3>
  <p>${POVAHA_SEMINARE}</p>

  <h3>B4. Objednávka a platba</h3>
  <p>Smlouva vzniká odesláním rezervace. Cena se hradí bankovním převodem s uvedeným variabilním symbolem do 3 dnů od rezervace. Po marném uplynutí lhůty rezervace zaniká. Po připsání platby zašle prodejce odkaz na videohovor, nejpozději 24 hodin před prvním setkáním.</p>

  <h3>B5. Průběh</h3>
  <p>Videohovor přes Google Meet, setkání se nenahrávají. Účastník zajistí klidné prostředí a funkční připojení. Setkání se nekonají 24. a 31. prosince, program se o tyto týdny posune.</p>

  <h3>B6. Přesun</h3>
  <p>Setkání lze přesunout zdarma nejpozději 24 hodin předem po domluvě e-mailem, nejvýše dvakrát během programu. Neomluvená neúčast nebo přesun později než 24 hodin předem se počítá jako uskutečněné setkání.</p>

  <h3>B7. Zrušení prodejcem</h3>
  <p>Pokud prodejce setkání nemůže uskutečnit (např. nemoc), nabídne náhradní termín. Pokud ho účastník nepřijme nebo program nelze dokončit, vrátí poměrnou část ceny za neuskutečněná setkání do 14 dnů.</p>

  <h3 id="odstoupeni-seminar">B8. Odstoupení spotřebitele</h3>
  <p>Spotřebitel může od smlouvy odstoupit do 14 dnů od jejího uzavření bez udání důvodu e-mailem na <a href="mailto:${EMAIL}">${EMAIL}</a>. Pokud výslovně požádal o zahájení poskytování služby před uplynutím této lhůty a odstoupí po zahájení, uhradí poměrnou část ceny za již poskytnutá setkání. Zbývající část se vrací do 14 dnů stejným způsobem, jakým byla platba přijata.</p>

  <h3>B9. Reklamace</h3>
  <p>Výhrady k poskytnuté službě lze uplatnit e-mailem, prodejce odpoví do 30 dnů.</p>

  <h3>B10. Osobní údaje</h3>
  <p>Viz <a href="/ochrana-osobnich-udaju">Zásady ochrany osobních údajů</a>.</p>

  <h3>B11. Mimosoudní řešení sporů</h3>
  <p>Spotřebitel se může obrátit na Českou obchodní inspekci (<a href="https://www.coi.cz" target="_blank" rel="noopener noreferrer">www.coi.cz</a>).</p>

  <h3>B12. Závěrečná ustanovení</h3>
  <p>Vztahy se řídí právem České republiky.</p>

  <p class="callout-inline disclaimer">${NOTICE}</p>
</section>
`,
});

// ---------- Fáze 2: obsahové stránky (koncepty) a stránka Pomoc ----------
// Koncept = noindex, viditelný štítek „Koncept“, mimo navigaci a sitemapu. Zveřejní se odstraněním `draft: true`.
const czDate = (d) => new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
const DRAFTS = [];

const draftBadge = (label = 'Koncept') => `<p class="draft-badge"><strong>${label}</strong> Tento text čeká na schválení. Není v navigaci ani ve vyhledávačích.</p>`;
const authorBox = (updated) => `<div class="author-box" data-no-gl>
    <img class="author-photo" src="/assets/img/o-mne-vaclav-thumb.webp" width="120" height="160" alt="${attr(AUTHOR)}" loading="lazy">
    <div>
      <p class="author-name"><a href="/o-mne">${AUTHOR}</a></p>
      <p class="author-role">Peer mentor s vlastní zkušeností s OCD</p>
      <p class="author-date">Naposledy aktualizováno: <time datetime="${updated}">${czDate(updated)}</time></p>${CFG.reviewer ? `\n      <p class="author-review">Odborně zkontroloval: ${esc(CFG.reviewer)}</p>` : ''}
    </div>
  </div>`;
const sourcesBlock = (sources) => `<section class="wrap block sources">
  <h2>Zdroje</h2>
  <ul class="rules">${sources.map((s) => `<li>${s}</li>`).join('')}</ul>
  <p class="small">Odkazy vedou na externí weby mimo OCD mentor. Zdroje podporují obecné informace na této stránce, nejsou návodem k léčbě.</p>
</section>`;
const whenProBlock = () => `<section class="wrap block callout">
  <h2>Kdy vyhledat odborníka</h2>
  <p>Obraťte se na lékaře nebo jiného odborníka, pokud vás obavy a rituály zabírají hodně času, omezují práci, vztahy nebo spánek, nebo pokud se stav zhoršuje. Nečekejte, až to bude horší.</p>
  <p>V akutní krizi nebo při myšlenkách na sebevraždu či sebepoškození ${CRISIS}. Více na stránce <a href="/pomoc">Pomoc hned</a>.</p>
</section>`;
const proseSections = (sections) => sections.map((s) => `<section class="wrap block prose">\n  <h2>${s.h}</h2>\n  ${s.html}\n</section>`).join('\n\n');

const CONTENT_PUBLISHED = '2026-10-23';
function contentPage({ path, title, ogTitle, ogSub, desc, h1, lead, sections, sectionsHtml, updated = F2.UPDATED, related, sources, draft = false, parents, crumb, gloss = true, script, statusLabel }) {
  const body = `
<section class="wrap page-head">
  ${draft ? draftBadge(statusLabel) : ''}
  <h1>${h1}</h1>
  <p class="lead">${lead}</p>
  ${authorBox(updated)}
</section>

${sectionsHtml || proseSections(sections)}

${sources && sources.length ? sourcesBlock(sources) : ''}

${whenProBlock()}
`;
  if (draft) DRAFTS.push({ path, h1: stripTags(h1), status: statusLabel || 'Koncept' });
  const articleLd = draft
    ? undefined
    : {
        '@type': 'Article',
        headline: stripTags(h1),
        description: desc,
        image: `${SITE}${ogPath(path)}`,
        datePublished: CONTENT_PUBLISHED,
        dateModified: updated,
        inLanguage: 'cs',
        author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/o-mne` },
        publisher: { '@type': 'Organization', name: BRAND, url: SITE },
        mainEntityOfPage: `${SITE}${path}`,
      };
  add(path, { title, ogTitle, ogSub, desc, noindex: draft, draft, crumbs: true, crumb, parents, body, gloss, glossAlways: true, related, script, art: false, jsonld: articleLd, ogType: draft ? undefined : 'article', published: draft ? undefined : CONTENT_PUBLISHED, modified: draft ? undefined : updated });
}

// --- Pilířový průvodce ---
contentPage({
  path: '/vtirave-myslenky',
  title: 'Vtíravé myšlenky: co to je a proč se lepí | ocdmentor.cz',
  desc: 'Co jsou vtíravé myšlenky, proč se u OCD lepí a jak funguje smyčka OCD. Srozumitelný průvodce s rozcestníkem na typy OCD a další stránky.',
  h1: 'Vtíravé myšlenky: co to je a proč se u OCD „lepí“',
  lead: F2.PILIR_VTIRAVE.lead,
  sections: F2.PILIR_VTIRAVE.sections,
  related: F2.PILIR_VTIRAVE.related,
  sources: [F2.SRC.radomsky, F2.SRC.prasko, F2.SRC.nhs],
  ogTitle: 'Vtíravé myšlenky',
  ogSub: 'Co to je a proč se u OCD „lepí“',
});

// --- Typy OCD: index s filtrem a vyhledáváním ---
const TYP_BY_SLUG = Object.fromEntries(TYPY_DATA.typy.map((t) => [t.slug, t]));
const KAT_BY_ID = Object.fromEntries(TYPY_DATA.kategorie.map((k) => [k.id, k.nazev]));
const typStav = (t) => (t.schvaleno ? '' : t.stav === 'plny' ? 'Koncept' : 'Osnova');
const shownTypes = TYPY_DATA.typy.filter((t) => t.schvaleno || CFG.showDraftTypes);
contentPage({
  path: '/typy-ocd',
  title: 'Typy OCD: přehled podob a jak se projevují | ocdmentor.cz',
  desc: 'Knihovna typů OCD: zdravotní OCD, kontrolování, vztahové OCD, Pure O a další. Vyhledejte téma, které vám připadá povědomé, a přečtěte si víc.',
  h1: 'Typy OCD',
  lead: 'OCD nemá jen jednu tvář. Najděte téma, které vám připadá povědomé, a přečtěte si, jak se obvykle projevuje. Nejde o diagnostiku, tu stanoví odborník.',
  gloss: false,
  script: '/assets/js/typy-filtr.js',
  related: ['/vtirave-myslenky', '/pro-blizke', '/myty-o-ocd', '/kviz'],
  ogTitle: 'Typy OCD',
  ogSub: 'Přehled podob OCD a jak se projevují',
  sectionsHtml: `<section class="wrap block">
  <h2 class="sr-only">Přehled typů OCD</h2>
  <div id="typy-filtr" class="typy-filtr js-only">
    <label class="typy-search"><span>Hledat typ</span><input type="search" placeholder="např. kontrola, vztah, zdraví" autocomplete="off"></label>
    <div class="typy-chips" role="group" aria-label="Filtr podle okruhu">
      <button type="button" class="chip" data-kat="" aria-pressed="true">Vše</button>
${TYPY_DATA.kategorie.map((k) => `      <button type="button" class="chip" data-kat="${k.id}" aria-pressed="false">${esc(k.nazev)}</button>`).join('\n')}
    </div>
    <p id="typy-pocet" class="typy-pocet" role="status" aria-live="polite"></p>
  </div>
  <div class="cards typy-grid">
${shownTypes
  .map(
    (t) => `    <article class="card type-card" data-kat="${t.kategorie}" data-text="${attr(`${t.nazev} ${t.kratce} ${KAT_BY_ID[t.kategorie]}`)}">
      <p class="type-kat">${esc(KAT_BY_ID[t.kategorie])}${typStav(t) ? ` · <span class="type-stav">${typStav(t)}</span>` : ''}</p>
      <h3><a href="/typy-ocd/${t.slug}">${esc(t.nazev)}</a></h3>
      <p>${esc(t.kratce)}</p>
    </article>`
  )
  .join('\n')}
  </div>
</section>`,
});

// --- Typy OCD: podstránky ---
const li = (arr) => `<ul>${arr.map((x) => `<li>${x}</li>`).join('')}</ul>`;
const relatedTypes = (slugs) => `<ul class="rules">${slugs
  .filter((s) => TYP_BY_SLUG[s])
  .map((s) => `<li><a href="/typy-ocd/${s}">${esc(TYP_BY_SLUG[s].nazev)}</a>: ${esc(TYP_BY_SLUG[s].kratce)}</li>`)
  .join('')}</ul>`;
const ctaQuiz = `<p class="cta"><a class="btn btn-ghost" href="/kviz">Kvíz Metal, nebo Pop?</a><a class="btn btn-ghost" href="/kolik-casu-mi-bere-ocd">Kolik času mi bere OCD?</a><a class="btn btn-cta" href="/kontakt" data-book>Rezervovat úvodní konzultaci zdarma</a></p>`;
for (const t of TYPY_DATA.typy) {
  const full = F2.TYPY_PLNY[t.slug] || TYPY_DALSI[t.slug];
  if (!full) throw new Error(`Chybí text typu ${t.slug}`);
  const mates = TYPY_DATA.typy.filter((x) => x.kategorie === t.kategorie && x.slug !== t.slug).map((x) => x.slug);
  const sectionsHtml = proseSections([
    { h: 'Co to je', html: full.co },
    {
      h: 'Jak vypadají obsese a kompulze',
      html: `<div class="cards"><article class="card"><h3>Obsese (příklady)</h3>${li(full.obsese)}</article><article class="card"><h3>Kompulze (příklady)</h3>${li(full.kompulze)}</article></div>`,
    },
    { h: 'Časté mýty', html: `<dl class="myth-list">${full.myty.map(([m, r]) => `<dt>Mýtus: ${m}</dt><dd>Realita: ${r}</dd>`).join('')}</dl>` },
    { h: 'Jak se obecně řeší u odborníka', html: full.odbornik },
    { h: 'Jak může pomoct peer podpora', html: full.peer },
    { h: 'Související typy', html: relatedTypes([...new Set([...full.souvisejici, ...mates])]) },
    { h: 'Kvíz a konzultace', html: `<p>Nevíte, jaké tempo vám sedí? Zkuste krátký kvíz, nebo se ozvěte na úvodní konzultaci zdarma.</p>${ctaQuiz}` },
  ]);
  const longTitle = `${t.nazev}: obsese a kompulze | ${DOMAIN}`;
  const desc = `${t.nazev} u OCD: ${t.kratce} Příklady obsesí a kompulzí, časté mýty a kdy vyhledat odborníka.`;
  contentPage({
    path: `/typy-ocd/${t.slug}`,
    title: longTitle.length <= 60 ? longTitle : `${t.nazev} u OCD | ${DOMAIN}`,
    desc: [desc, `${t.nazev} u OCD: ${t.kratce} Příklady obsesí a kompulzí a kdy vyhledat odborníka.`, `${t.nazev} u OCD: ${t.kratce} Příklady a kdy vyhledat odborníka.`].find((d) => d.length <= 160),
    ogTitle: t.nazev,
    ogSub: t.kratce,
    h1: `${esc(t.nazev)}`,
    lead: full.lead,
    sectionsHtml,
    sources: [F2.SRC.prasko, F2.SRC.nice, F2.SRC.nhs, ...(['agresivni-vtirave-myslenky', 'sexualni-vtirave-myslenky', 'pure-o'].includes(t.slug) ? [F2.SRC.radomsky] : [])],
    related: ['/typy-ocd', '/vtirave-myslenky', '/pro-blizke', ...(full.souvisejici || []).slice(0, 1).map((s) => `/typy-ocd/${s}`)],
    parents: [['/typy-ocd', 'Typy OCD']],
    crumb: t.nazev,
    gloss: true,
  });
}

// --- Pro blízké ---
contentPage({
  path: '/pro-blizke',
  title: 'Pro blízké: jak pomáhat a nekrmit OCD | ocdmentor.cz',
  desc: 'Jak pomáhat blízkému s OCD a nekrmit smyčku: co je přizpůsobování, proč ujišťování nepomáhá a jak odpovídat. Podpora i pro vás.',
  h1: 'Pro blízké: jak pomáhat a nekrmit OCD',
  lead: F2.PRO_BLIZKE.lead,
  sections: F2.PRO_BLIZKE.sections,
  related: F2.PRO_BLIZKE.related,
  sources: [F2.SRC.lebowitz, F2.SRC.prasko],
  ogTitle: 'Pro blízké',
  ogSub: 'Jak pomáhat a nekrmit OCD',
});

// --- Mýty o OCD ---
const mythCards = MYTY.karty
  .map(
    (k, i) => `    <div class="myth-card" data-i="${i}">
      <div class="myth-faces">
        <div class="myth-face myth-front"><p class="myth-tag">Mýtus</p><p class="myth-text">${esc(k.mytus)}</p></div>
        <div class="myth-face myth-back"><p class="myth-tag">Realita</p><p class="myth-text">${esc(k.realita)}</p></div>
      </div>
      <button type="button" class="myth-flip js-only" aria-pressed="false">Otočit kartu</button>
    </div>`
  )
  .join('\n');
contentPage({
  path: '/myty-o-ocd',
  title: 'Mýty o OCD: co je mýtus a co realita | ocdmentor.cz',
  desc: 'Mýty o OCD a jak to opravdu je: pořádkumilovnost, mytí rukou, vtíravé myšlenky i ujišťování. Otočte kartu a přečtěte si realitu.',
  h1: 'Mýty o OCD',
  lead: 'OCD kolem sebe nese spoustu nedorozumění. Klepněte na kartu, otočí se z mýtu na realitu.',
  script: '/assets/js/myty-karty.js',
  related: ['/vtirave-myslenky', '/slovnicek', '/pro-blizke', '/typy-ocd'],
  sources: [F2.SRC.radomsky, F2.SRC.ruscio],
  ogTitle: 'Mýty o OCD',
  ogSub: 'Co je mýtus a co realita',
  sectionsHtml: `<section class="wrap block">
  <div class="myth-grid" data-no-gl>
${mythCards}
  </div>
</section>

<section class="wrap block prose">
  <h2>Věděli jste?</h2>
${MYTY.vedeli.map((v) => `  <aside class="fact"><p>${esc(v.text)} <span class="fact-src">Zdroj: ${esc(v.zdroj)}</span></p></aside>`).join('\n')}
</section>`,
});

// --- Slovníček ---
const glosSorted = [...GLOS].sort((a, b) => a.pojem.localeCompare(b.pojem, 'cs'));
contentPage({
  path: '/slovnicek',
  title: 'Slovníček pojmů kolem OCD | ocdmentor.cz',
  desc: 'Slovníček pojmů kolem OCD: obsese, kompulze, ujišťování, ERP, I-CBT, expozice, neutralizace, peer mentor a další, jednoduše vysvětlené.',
  h1: 'Slovníček pojmů',
  lead: 'Krátké vysvětlení pojmů, které se na webu opakují. Jsou to obecná vysvětlení, ne diagnostika ani návod k léčbě.',
  gloss: false,
  related: ['/vtirave-myslenky', '/myty-o-ocd', '/typy-ocd', '/metoda'],
  ogTitle: 'Slovníček pojmů',
  ogSub: 'Obsese, kompulze, ERP, I-CBT a další',
  sectionsHtml: `<section class="wrap block">
  <dl class="glossary" data-no-gl>
${glosSorted.map((g) => `    <dt id="${g.id}">${esc(g.pojem)}</dt>\n    <dd>${esc(g.def)}</dd>`).join('\n')}
  </dl>
</section>`,
});

// --- Příběhy, pro terapeuty ---
contentPage({
  path: '/pribehy',
  title: 'Příběhy s OCD: zásady sdílení zkušeností | ocdmentor.cz',
  desc: 'Jak na webu zacházím s příběhy lidí s OCD: jen s písemným souhlasem, anonymizovaně a bez slibů vyléčení. Svůj příběh můžete sdílet e-mailem.',
  ogTitle: 'Příběhy',
  ogSub: 'Zásady sdílení zkušeností s OCD',
  h1: 'Příběhy',
  lead: F2.PRIBEHY.lead,
  sections: F2.PRIBEHY.sections,
  related: F2.PRIBEHY.related,
});
contentPage({
  path: '/pro-terapeuty',
  title: 'Pro terapeuty a odborníky: spolupráce | ocdmentor.cz',
  desc: 'Peer mentoring jako doplněk odborné péče při OCD: co dělám a co ne, s kým pracuji a jak může vypadat spolupráce s terapeutem nebo psychiatrem.',
  h1: 'Pro terapeuty a odborníky',
  lead: F2.PRO_TERAPEUTY.lead,
  sections: F2.PRO_TERAPEUTY.sections,
  related: F2.PRO_TERAPEUTY.related,
  ogTitle: 'Pro terapeuty a odborníky',
  ogSub: 'Peer mentoring jako doplněk odborné péče',
});

// --- Pomoc hned (zveřejněno) ---
add('/pomoc', {
  title: 'Pomoc hned: krizové linky a odborná pomoc | ocdmentor.cz',
  desc: 'Potřebujete pomoc hned? Krizové kontakty 112, 155 a Linka první psychické pomoci 116 123 a přehled, kde hledat odbornou pomoc při OCD.',
  ogTitle: 'Pomoc hned',
  ogSub: 'Krizové kontakty a odborná pomoc',
  art: false,
  related: ['/pro-koho', '/jak-to-probiha', '/metoda', '/o-mne'],
  body: `
<section class="wrap page-head">
  <h1>Pomoc hned</h1>
  <p class="lead">${F2.POMOC.lead}</p>
</section>

${proseSections(F2.POMOC.sections)}
`,
});

// --- Přehled konceptů (jen pro kontrolu autorem) ---
add('/koncepty', {
  title: `Koncepty ke schválení | ${DOMAIN}`,
  desc: 'Interní přehled konceptů stránek čekajících na schválení. Stránka není v navigaci, ve vyhledávačích ani v sitemapě.',
  noindex: true,
  crumbs: true,
  art: false,
  body: `
<section class="wrap page-head">
  <p class="draft-badge"><strong>Interní přehled</strong> Jen pro kontrolu autorem.</p>
  <h1>Koncepty ke schválení</h1>
  <p class="lead">Tyto stránky jsou zveřejněné s hlavičkou noindex a štítkem „Koncept“, ale nejsou v navigaci ani v sitemapě. Po schválení se z nich koncept odstraní.</p>
</section>
<section class="wrap block">
  <ul class="rules">
${DRAFTS.map((d) => `    <li><a href="${d.path}">${esc(d.h1)}</a> <span class="type-stav">${d.status}</span> <span class="small">${d.path}</span></li>`).join('\n')}
  </ul>
</section>
`,
});

// ---------- Fáze 3: kalkulačka, skupiny, offline stránka ----------
const calcSlider = (id, label, hint) => `    <div class="field calc-field js-only">
      <label for="${id}">${label} <span class="hint">(${hint})</span></label>
      <div class="range"><input type="range" id="${id}" min="0" max="480" step="5" value="0" aria-describedby="calc-result"><output for="${id}">0 min</output><span class="of">denně</span></div>
    </div>`;
add('/kolik-casu-mi-bere-ocd', {
  title: 'Kolik času mi bere OCD: kalkulačka | ocdmentor.cz',
  desc: 'Spočítejte, kolik času vám denně berou rituály, ujišťování a rozebírání v hlavě. Výsledek v hodinách týdně a dnech ročně. Nic se neukládá.',
  ogTitle: 'Kolik času mi bere OCD?',
  ogSub: 'Kalkulačka: hodiny týdně a dny ročně',
  script: '/assets/js/kalkulacka.js',
  related: ['/metoda', '/dotaznik', '/kviz', '/pomoc'],
  art: false,
  body: `
<section class="wrap page-head">
  <h1>Kolik času mi bere OCD?</h1>
  <p class="lead">Rituály, kontroly, ujišťování i přemýšlení v hlavě se v běžném dni snadno ztratí. Kalkulačka jen sečte čas, který jí sami zadáte. Není to test ani diagnóza a nic se neukládá ani neodesílá.</p>
</section>

<section class="wrap block">
  <div class="calc" id="calc">
    <p class="hint">Odhadněte, kolik minut denně v průměru věnujete každé z oblastí. Stačí hrubý odhad.</p>
${calcSlider('c-ritualy', 'Rituály a kontroly', 'mytí, kontrolování, uspořádávání, opakování')}
${calcSlider('c-ujistovani', 'Ujišťování a hledání na internetu', 'ptaní se druhých nebo umělé inteligence, googlení, čtení zkušeností')}
${calcSlider('c-hlava', 'Rozebírání v hlavě', 'přemítání, analyzování, přehrávání vzpomínek, mentální rituály')}
    <div id="calc-result" class="calc-result js-only" role="status" aria-live="polite"></div>
    <noscript><p>Kalkulačka potřebuje zapnutý JavaScript. Postup výpočtu najdete níže.</p></noscript>
  </div>
  <p class="calc-msg">Ať vyjde jakékoli číslo, nic to neříká o vaší hodnotě. Je to čas, který si můžete postupně brát zpátky.</p>
  <p class="cta"><a class="btn btn-cta" href="/kontakt" data-book>Rezervovat úvodní konzultaci zdarma</a><a class="btn btn-ghost" href="/dotaznik">Vyplnit vstupní dotazník</a></p>
  <p class="small disclaimer">Jde o vaše vlastní odhady, ne o měření ani diagnózu. Pokud jste v akutní krizi, ${CRISIS}.</p>
</section>

<section class="wrap block calc-how prose">
  <h2>Jak se to počítá</h2>
  <p>Hodiny týdně se spočítají jako minuty denně × 7 ÷ 60. Dny ročně jsou minuty denně × 365 ÷ 1 440, tedy celé 24hodinové dny. Víkend se počítá jako dva dny. Například 180 minut denně (3 hodiny) je 21 hodin týdně, asi 45,6 dne ročně a zhruba 23 víkendů.</p>
</section>
`,
});

// --- Online skupina podpory (koncept) ---
const waitlistMail = `mailto:${EMAIL}?subject=${encodeURIComponent('Čekací listina – online skupina podpory')}&body=${encodeURIComponent('Dobrý den,\n\nmám zájem o online skupinu podpory při OCD. Prosím o zařazení na čekací listinu.\n\nDěkuji')}`;
contentPage({
  path: '/skupiny',
  title: 'Online skupina podpory při OCD | ocdmentor.cz',
  desc: 'Koncept online skupinových setkání peer podpory při OCD v malé skupině. Zapište se na čekací listinu e-mailem, na webu se nic neukládá.',
  h1: 'Online skupina podpory',
  lead: 'Koncept online skupinových setkání: peer podpora v malé skupině lidí s OCD, vedle odborné péče.',
  draft: true,
  related: ['/jak-to-probiha', '/pro-blizke', '/pribehy', '/kviz'],
  sections: [
    {
      h: 'Jak by skupina fungovala',
      html: `<ul class="rules">
  <li>Malá online skupina lidí s OCD, kteří chtějí sdílet zkušenost a navzájem se podpořit.</li>
  <li>Skupinu vede peer mentor s vlastní zkušeností, ne terapeut. Nejde o zdravotní službu ani psychoterapii a skupina nenahrazuje odbornou péči.</li>
  <li>Cena: <span class="placeholder">[CENA]</span></li>
  <li class="placeholder">[DOPLNIT: počet účastníků, délka a četnost setkání, pravidla skupiny, platforma]</li>
</ul>`,
    },
    {
      h: 'Čekací listina',
      html: `<p>První termín zatím není. Pokud chcete dát vědět, že máte zájem, napište mi. Tlačítko otevře váš e-mail s předvyplněným předmětem. Nic se neukládá na webu a zprávu vidím, jen když ji sami odešlete.</p>
<p class="cta"><a class="btn btn-cta" href="${attr(waitlistMail)}">Chci na čekací listinu</a></p>`,
    },
  ],
});

// --- Offline stránka (pro service worker) ---
add('/offline', {
  script: '/assets/js/offline.js',
  title: `Jste offline | ${DOMAIN}`,
  desc: 'Jste offline. Tuto stránku nelze načíst bez připojení, rezervace a formuláře bez internetu nefungují.',
  noindex: true,
  art: false,
  body: `
<section class="wrap page-head">
  <h1>Jste offline</h1>
  <p class="lead">Tuhle stránku se nepodařilo načíst, protože nejste připojeni k internetu. Rezervace konzultací a odesílání formulářů bez připojení nefungují.</p>
</section>
<section class="wrap block">
  <p>Zkuste to znovu, až se připojíte: <button type="button" class="btn btn-ghost btn-sm" id="nacist-znovu">Načíst znovu</button></p>
  <p>Potřebujete pomoc hned? ${CRISIS_STRONG}.</p>
  <ul class="crisis-list">
    <li><a href="tel:112"><strong>112</strong><span>tísňová linka</span></a></li>
    <li><a href="tel:155"><strong>155</strong><span>zdravotnická záchranná služba</span></a></li>
    <li><a href="tel:116123"><strong>116 123</strong><span>Linka první psychické pomoci</span></a></li>
  </ul>
</section>
`,
});

// ---------- 404 ----------
files['404.html'] = page({
  path: '/404',
  title: `Stránka nenalezena | ${DOMAIN}`,
  desc: 'Stránka nenalezena. Vraťte se na úvodní stránku nebo si prohlédněte menu webu.',
  noindex: true,
  art: false,
  body: `
<section class="wrap page-head nf">
  <div class="nf-grid">
    <div>
      <h1>Tady nic není.</h1>
      <p class="lead">A to je v pořádku.</p>
      <p>Stránku, kterou hledáte, se nepodařilo najít. Pokračovat můžete tady:</p>
      <ul class="related-list">
        <li><a href="/">Úvod</a></li><li><a href="/metoda">Metoda</a></li><li><a href="/jak-to-probiha">Jak to probíhá</a></li><li><a href="/kviz">Kvíz Metal, nebo Pop?</a></li><li><a href="/clanky">Články</a></li><li><a href="/kontakt">Kontakt</a></li><li><a href="/pomoc">Pomoc hned</a></li>
      </ul>
    </div>
    <img class="nf-art" src="${CFG.notFoundImage || '/assets/img/kontakt-ilustrace.webp'}" width="640" height="585" alt="" loading="eager">
  </div>
</section>
`,
});

// ---------- Šablona článku ----------
files['sablony/clanek.html'] = page({
  path: '/clanky/nazev-clanku',
  title: `Název článku | ${DOMAIN}`,
  desc: 'Krátký popis článku (140–160 znaků).',
  noindex: true,
  body: `
<article class="wrap block prose">
  <p class="eyebrow"><a href="/clanky">Články</a></p>
  <h1>Název článku</h1>
  <p class="small"><time datetime="RRRR-MM-DD">Datum</time></p>
  <p>Úvod: 2–3 věty.</p>
  <h2>Mezititulek</h2>
  <p>Text. Odborné pojmy při prvním výskytu vysvětlete jednou větou. Bez slibů vyléčení a bez čísel o úspěšnosti.</p>
  <p class="callout-inline disclaimer">${NOTICE}</p>
</article>
`,
});

// ---------- Aplikace (statické stránky, obsah doplňují moduly v assets/js/app) ----------
const appPage = (slug, title, lead, desc, mod) =>
  add(slug ? `/aplikace/${slug}` : '/aplikace', {
    title: `${title} – aplikace | ${DOMAIN}`,
    desc,
    noindex: true,
    app: true,
    art: false,
    module: `/assets/js/app/${mod}.js`,
    body: `
<section class="wrap page-head app-head">
  <h1>${title}</h1>
  ${lead ? `<p class="lead">${lead}</p>` : ''}
</section>
<section class="wrap app-main">
  <noscript><p class="placeholder">Aplikace potřebuje zapnutý JavaScript. Data zůstávají jen ve vašem zařízení.</p></noscript>
  <div id="app-root"></div>
</section>
`,
  });
appPage('', 'Aplikace', 'Tichý pomocník na cestě: dotazník, žebříček, deník expozic, tracker a karty principů. Vše zůstává jen ve vašem zařízení — nikam se neodesílá a nikdo jiný, včetně mě, to nevidí, pokud si to sami neexportujete a nepošlete.', 'Webová aplikace jako doprovod: dotazník, žebříček témat, expoziční deník, tracker kompulzí.', 'home');
appPage('start', 'Vstupní dotazník', 'Zabere asi 10 minut. Nic se neodesílá a můžete kdykoli přestat. Odpovídejte jen to, co chcete.', 'Vstupní dotazník aplikace.', 'start');
appPage('zebricek', 'Žebříček témat', '', 'Žebříček témat z dotazníku.', 'ladder');
appPage('denik', 'Expoziční deník', '', 'Expoziční deník s časovačem a grafem.', 'diary');
appPage('text', 'Expoziční text', '', 'Editor expozičního textu s kontrolou.', 'text');
appPage('kompulze', 'Tracker kompulzí', '', 'Rychlý záznam kompulzí.', 'compulsions');
appPage('principy', 'Karty principů', '', 'Dvanáct principů metody a karta dne.', 'principles');
appPage('nastaveni', 'Data a připomínky', '', 'Export, import, smazání dat a připomínky v kalendáři.', 'settings');
appPage('vice', 'Další nástroje', '', 'Rozcestník nástrojů aplikace.', 'vice');
appPage('kruh', 'Kruh OCD', '', 'Interaktivní kruh OCD a rozbor epizody.', 'kruh');
appPage('icbt', 'Porozumění pochybnosti', 'Krátké lekce a cvičení pro pop cestu. Orientačně 4–8 týdnů, pak přechod k expozicím.', 'Modul I-CBT.', 'icbt');
appPage('telo', 'Tělo ve strachu', '', 'Psychoedukace o těle a úzkosti.', 'telo');
appPage('pilire', 'Pilíře', 'Týdenní hodnocení sebepřijetí a sebevíry.', 'Týdenní hodnocení pilířů.', 'pilire');
appPage('vize', 'Vize', '', 'Editor cílové vize.', 'vize');
appPage('koreny', 'Kořeny', '', 'Osa životních milníků.', 'koreny');
appPage('hudba', 'Hudba', '', 'Odkazy na playlisty před a po expozici.', 'hudba');
appPage('export', 'Export pro terapeuta', '', 'Přehled pro tisk nebo PDF.', 'export');

for (const [f, c] of Object.entries(files)) {
  const p = join(OUT, f);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, c, 'utf8');
}

// ---------- sitemap, robots.txt, seznam stránek pro OG obrázky, lastmod, klíč IndexNow ----------
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const lmFile = join(OUT, 'seo/lastmod.json');
const lastmod = existsSync(lmFile) ? JSON.parse(readFileSync(lmFile, 'utf8')) : {};
// lastmod se mění jen tehdy, když se změní skutečný obsah stránky (title, description, hlavní obsah), ne menu ani patička.
const contentHash = (html) => {
  const m = html.match(/<main id="obsah">([\s\S]*?)<\/main>/);
  let c = m ? m[1] : html;
  c = c.replace(/<p class="pd-num" id="pd-num">[\s\S]*?<\/p>\s*<p class="pd-text" id="pd-text">[\s\S]*?<\/p>/, '');
  const t = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0] + (html.match(/<meta name="description" content="[^"]*"/) || [''])[0];
  return createHash('sha1').update(t + c).digest('hex').slice(0, 12);
};
const gitDate = (file) => {
  try {
    return execSync(`git log -1 --format=%cs -- "${file}"`, { cwd: OUT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};
const indexable = pagesMeta.filter((p) => !p.noindex && !/noindex/.test(files[p.file].match(/<meta name="robots" content="([^"]*)"/)?.[1] || ''));
for (const p of indexable) {
  const h = contentHash(files[p.file]);
  const prev = lastmod[p.path];
  if (!prev) lastmod[p.path] = { hash: h, date: p.modified || gitDate(p.file) || TODAY };
  else if (prev.hash !== h) lastmod[p.path] = { hash: h, date: TODAY };
}
for (const k of Object.keys(lastmod)) if (!indexable.some((p) => p.path === k)) delete lastmod[k];
mkdirSync(dirname(lmFile), { recursive: true });
writeFileSync(lmFile, JSON.stringify(lastmod, null, 2) + '\n');

writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable
    .map((p) => `  <url><loc>${SITE}${p.path === '/' ? '/' : p.path}</loc><lastmod>${lastmod[p.path].date}</lastmod></url>`)
    .join('\n')}\n</urlset>\n`
);
writeFileSync(
  join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /api/\n\nUser-agent: SeznamBot\nAllow: /\nDisallow: /api/\n\nUser-agent: Googlebot\nAllow: /\nDisallow: /api/\n\nUser-agent: bingbot\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`
);

// seznam stránek pro tools/og.mjs (obrázky 1200×630)
writeFileSync(
  join(OUT, 'seo/og-pages.json'),
  JSON.stringify(
    pagesMeta
      .filter((p) => !p.hardNoindex)
      .map((p) => ({ slug: slugOf(p.path), text: p.ogTitle || p.title.replace(/ \| ocdmentor\.cz$/, ''), sub: p.ogSub || '', art: p.ogArt || '', portrait: !!p.ogArtPortrait })),
    null,
    2
  ) + '\n'
);

// klíč IndexNow (soubor v kořeni webu)
if (CFG.indexnowKey) writeFileSync(join(OUT, `${CFG.indexnowKey}.txt`), CFG.indexnowKey);

// ---------- PWA: manifest a service worker ----------
writeFileSync(
  join(OUT, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'OCD mentor – peer mentoring při OCD',
      short_name: 'OCD mentor',
      description: 'Peer podpora při OCD. Doplněk k odborné péči, ne zdravotní služba.',
      lang: 'cs',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#fbf7ef',
      theme_color: '#1b2a41',
      icons: [
        { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/assets/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2
  ) + '\n'
);
const SW_VERSION = createHash('sha1').update(JSON.stringify(lastmod) + hashAsset('/assets/css/style.css') + hashAsset('/assets/js/rezervace-souhlas.js')).digest('hex').slice(0, 8);
writeFileSync(join(OUT, 'sw.js'), readFileSync(join(OUT, 'tools/sw.template.js'), 'utf8').replace('__VERSION__', SW_VERSION));

// ---------- Content-Security-Policy ----------
// Politika se skládá tady a zapisuje do hlavičky v vercel.json. Jediný inline skript webu se povolí hashem,
// jinak jsou skripty jen z vlastní domény a z Reservanta (rezervační widget). Inline obslužné funkce (onclick) na webu nejsou.
const inlineHashe = new Set();
for (const html of Object.values(files)) {
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
    inlineHashe.add(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`);
  }
  if (/\son(?:click|load|error|submit|change|input|focus|blur|mouse\w+|key\w+)\s*=/i.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) {
    throw new Error('Na webu je inline obslužná funkce (onclick apod.), kterou by Content-Security-Policy zablokovala. Použijte addEventListener v externím skriptu.');
  }
}
const RSV = 'https://*.reservanto.cz';
const CSP = [
  "default-src 'self'",
  `script-src 'self' ${[...inlineHashe].sort().join(' ')} ${RSV}`,
  `style-src 'self' 'unsafe-inline' ${RSV}`,
  `img-src 'self' data: ${RSV}`,
  `font-src 'self' ${RSV}`,
  `connect-src 'self' ${RSV}`,
  `frame-src ${RSV}`,
  "media-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
{
  const vercelPath = join(OUT, 'vercel.json');
  const vercelText = readFileSync(vercelPath, 'utf8');
  if (!/"key": "Content-Security-Policy", "value": "[^"]*"/.test(vercelText)) throw new Error('V vercel.json chybí hlavička Content-Security-Policy.');
  const novy = vercelText.replace(/("key": "Content-Security-Policy", "value": ")[^"]*(")/, (_m, a, z) => `${a}${CSP}${z}`);
  if (novy !== vercelText) writeFileSync(vercelPath, novy);
}

console.log(Object.keys(files).join('\n'));
