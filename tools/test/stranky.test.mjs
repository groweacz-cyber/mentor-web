// Kontrola vygenerovaných stránek (před spuštěním: npm run gen).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OBSAH, formatProgramu, faqProgramu, vynechanaDnyText, programBody, rezervaceBody } from '../content/seminare.mjs';
import { POVAHA_SEMINARE, POVAHA_BLIZKE, POVAHA_PREHLED } from '../../api/_lib/texty.js';
import { nactiData, pripravProgramy } from '../../api/_lib/seminare.js';

const pripraveny = (id) => pripravProgramy(nactiData()).find((p) => p.id === id);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
// Blokové značky se mění na mezeru, vložené (a, strong, span, time) na nic, aby věta „…e-mailem. Zásady…“ zůstala věta.
const BLOKOVE = /<\/?(?:p|div|h[1-6]|li|ul|ol|section|article|aside|main|header|footer|details|summary|dl|dt|dd|br|nav|form|fieldset|legend|label|button|table|tr|td|th)\b[^>]*>/g;
const bezZnacek = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(BLOKOVE, ' ').replace(/<[^>]+>/g, '');
const dekoduj = (t) => t.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const text = (h) => dekoduj(bezZnacek(h)).replace(/\s+/g, ' ').trim();
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const ld = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1])['@graph'] || []);

const FORMAT_OCD = '5 setkání po 60 minutách, 1× týdně ve čtvrtek v 18:00, online 1:1. Cena 3 900 Kč za celý program. Cena je konečná, nejsem plátce DPH.';
const FORMAT_BLIZKE = '3 setkání po 60 minutách, 1× týdně v úterý v 18:00, online 1:1. Na setkání se může připojit i druhý blízký z vaší domácnosti bez příplatku. Cena 2 500 Kč za celý program. Cena je konečná, nejsem plátce DPH.';
const STRANKY = { 'pro-lidi-s-ocd': 'seminare/cesta-s-ocd/index.html', 'pro-blizke': 'seminare/pro-blizke/index.html' };
const meta = (h, nazev) => (h.match(new RegExp(`<meta (?:name|property)="${nazev}" content="([^"]*)"`)) || [])[1];
const html = (h) => h.replace(/&amp;/g, '&');
const ldVse = (h) => ld(h);

test('menu: Online semináře má odkaz na přehled, samostatné tlačítko podmenu (disclosure) a dva semináře s podtitulky', () => {
  const h = nacti('index.html');
  const li = h.match(/<li class="has-sub has-split[^"]*">[\s\S]*?<\/ul>\s*<\/li>/)[0];
  assert.match(li, /<a href="\/seminare">Online semináře<\/a>/);
  assert.match(li, /<button type="button" class="nav-sub-toggle nav-sub-arrow" aria-expanded="false" aria-controls="sub-online-seminare" aria-label="Podmenu: Online semináře"><\/button>/);
  assert.match(li, /<ul class="sub-nav" id="sub-online-seminare">/);
  assert.ok(li.includes('<a href="/seminare/cesta-s-ocd"><span class="sub-title">Cesta s OCD</span><span class="sub-meta">Pro lidi s OCD · 5 setkání</span></a>'));
  assert.ok(li.includes('<a href="/seminare/pro-blizke"><span class="sub-title">Když OCD žije vedle vás</span><span class="sub-meta">Pro blízké · 3 setkání</span></a>'));
  assert.ok(!/role="menu|role="menuitem/.test(h), 'vzor disclosure, ne ARIA role menu');
  // stejné menu je na všech stránkách programů i přehledu, aktivní položka je označená
  for (const [p, aktivniOdkaz] of [['seminare/index.html', '<a href="/seminare" aria-current="page">Online semináře</a>'], [STRANKY['pro-lidi-s-ocd'], 'href="/seminare/cesta-s-ocd" aria-current="page"'], [STRANKY['pro-blizke'], 'href="/seminare/pro-blizke" aria-current="page"']]) {
    const x = nacti(p);
    const nav = x.slice(x.indexOf('<nav id="hlavni-nav"'), x.indexOf('</nav>'));
    assert.ok(nav.includes(aktivniOdkaz), `${p}: aria-current v menu`);
    assert.match(nav, /<li class="has-sub has-split is-active">/, `${p}: položka je označená jako aktivní`);
  }
});

test('menu: skript otevírá podmenu myší i klávesnicí, Esc vrací fokus na tlačítko; bez JavaScriptu funguje CSS', () => {
  const h = nacti('index.html');
  const skript = h.match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const k of ['pointerenter', 'pointerleave', 'focusin', 'focusout', "e.key!=='Escape'", "setAttribute('aria-expanded'", 'b.focus()', ':focus-visible']) assert.ok(skript.includes(k), k);
  assert.doesNotThrow(() => new Function(skript), 'skript je syntakticky v pořádku');
  const css = nacti('assets/css/style.css');
  assert.match(css, /html:not\(\.js\) \.has-sub:hover > \.sub-nav, html:not\(\.js\) \.has-sub:focus-within > \.sub-nav \{ display: flex; \}/);
  assert.match(css, /\.has-split \.sub-nav::before \{[^}]*top: -\.5rem; height: \.5rem;/, 'podmenu nemizí při přejetí myši (bez mezery)');
  assert.match(css, /\.js \.has-split > \.nav-sub-arrow \{[^}]*min-height: 2\.9rem/, 'dostatečná klepací plocha na mobilu');
});

test('/seminare: přehled má úvod, dvě karty, rámeček o povaze semináře, konzultaci zdarma a krizové kontakty, bez záložek a FAQ', () => {
  const h = nacti('seminare/index.html');
  const m = main(h);
  const t = text(m);
  assert.match(m, /<h1>Online semináře<\/h1>/);
  assert.ok(t.includes('Dva individuální programy podle mé osobní zkušenosti s OCD. Vyberte ten, který vám sedí.'));
  assert.ok(!/<details|data-program-tab|prog-tab|class="faq"|Časté dotazy|Časté otázky/.test(m), 'žádné záložky ani společné FAQ');
  const karty = [...m.matchAll(/<article class="card prog-card">[\s\S]*?<\/article>/g)].map((x) => x[0]);
  assert.equal(karty.length, 2);
  const data = nactiData();
  for (const [i, p] of data.programy.entries()) {
    const k = text(karty[i]);
    assert.ok(k.includes(p.nazev) && k.includes(p.anotace) && k.includes(p.komu), p.id);
    assert.ok(k.includes(`${p.pocetSetkani} setkání po ${p.delkaMinut} minutách`), `${p.id}: formát`);
    assert.ok(k.includes(p.cena === 3900 ? '3 900 Kč' : '2 500 Kč'), `${p.id}: cena`);
    assert.ok(karty[i].includes(`href="/seminare/${p.stranka}"`) && k.includes('Zobrazit program'), `${p.id}: tlačítko`);
  }
  assert.ok(m.indexOf('class="prog-cards"') < m.indexOf('class="callout-inline disclaimer sem-box"'), 'rámeček je pod kartami');
  assert.ok(t.includes(POVAHA_PREHLED));
  assert.ok(t.includes('Chcete si nejdřív promluvit? Rezervujte si úvodní konzultaci zdarma (15 minut).'));
  assert.ok(/reservanto-widget/.test(m), 'existující tlačítko Reservanto');
  assert.ok(/112/.test(t) && /116 123/.test(t), 'krizové kontakty');
});

test('SEO: každá ze tří stránek má vlastní title, popis, canonical a Open Graph; všechny jsou v sitemap.xml', () => {
  const sitemap = nacti('sitemap.xml');
  const ocekavane = {
    'seminare/index.html': ['/seminare', 'Online semináře | ocdmentor.cz'],
    [STRANKY['pro-lidi-s-ocd']]: ['/seminare/cesta-s-ocd', 'Cesta s OCD: individuální program 5 setkání | ocdmentor.cz'],
    [STRANKY['pro-blizke']]: ['/seminare/pro-blizke', 'Když OCD žije vedle vás: program pro blízké | ocdmentor.cz'],
  };
  const popisy = new Set();
  for (const [soubor, [cesta, title]] of Object.entries(ocekavane)) {
    const h = nacti(soubor);
    assert.match(h, new RegExp(`<title>${title.replace(/[|]/g, '\\|')}</title>`), `${soubor}: title`);
    const popis = meta(h, 'description');
    assert.ok(popis && popis.length > 60 && popis.length <= 175, `${soubor}: popis (${popis && popis.length})`);
    popisy.add(popis);
    assert.ok(h.includes(`<link rel="canonical" href="https://ocdmentor.cz${cesta}">`), `${soubor}: canonical`);
    assert.equal(meta(h, 'og:url'), `https://ocdmentor.cz${cesta}`);
    assert.ok(meta(h, 'og:image') && meta(h, 'og:description'));
    assert.ok(!/noindex/.test(h.slice(0, h.indexOf('</head>'))), `${soubor}: indexovatelná`);
    assert.ok(sitemap.includes(`https://ocdmentor.cz${cesta}<`), `${soubor}: sitemap`);
  }
  assert.equal(popisy.size, 3, 'popisy se neopakují');
  assert.ok(!sitemap.includes('/seminare/rezervace/potvrzeni'));
});

test('/seminare: JSON-LD přehledu (ItemList, BreadcrumbList) a stránek programů (Service + Offer, FAQPage, BreadcrumbList), bez lékařských typů', () => {
  const data = nactiData();
  const prehled = nacti('seminare/index.html');
  for (const m of prehled.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => JSON.parse(m[1]));
  const lp = ldVse(prehled);
  const seznam = lp.find((n) => n['@type'] === 'ItemList');
  assert.deepEqual(seznam.itemListElement.map((e) => e.url), ['https://ocdmentor.cz/seminare/cesta-s-ocd', 'https://ocdmentor.cz/seminare/pro-blizke']);
  assert.deepEqual(seznam.itemListElement.map((e) => e.name), data.programy.map((p) => p.nazev));
  const kr = lp.find((n) => n['@type'] === 'BreadcrumbList');
  assert.deepEqual(kr.itemListElement.map((e) => e.name), ['Domů', 'Online semináře']);
  for (const p of data.programy) {
    const h = nacti(STRANKY[p.id]);
    for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => JSON.parse(m[1]));
    const l = ldVse(h);
    const sluzba = l.find((n) => n['@type'] === 'Service');
    assert.equal(sluzba.name, p.nazev);
    assert.equal(sluzba.offers['@type'], 'Offer');
    assert.equal(sluzba.offers.price, String(p.cena), 'cena z data/seminare.json');
    assert.equal(sluzba.offers.priceCurrency, 'CZK');
    assert.ok(l.some((n) => n['@type'] === 'FAQPage'));
    const drobky = l.find((n) => n['@type'] === 'BreadcrumbList');
    assert.deepEqual(drobky.itemListElement.map((e) => e.name), ['Domů', 'Online semináře', p.kratkyNazev]);
    assert.ok(!/Medical|Review|Rating/.test(JSON.stringify(l)), 'žádné medicínské typy ani hodnocení');
  }
});

test('stránky programů: nadpis, podtitul, rámeček o povaze, formát přesně podle zadání, drobečky a odkazy zpět a na druhý program', () => {
  const data = nactiData();
  const kontrola = {
    'pro-lidi-s-ocd': { podtitul: 'Individuální program pěti setkání 1:1 podle knihy. Jak jsem na to šel já a co z toho můžeš využít ty.', povaha: POVAHA_SEMINARE, format: FORMAT_OCD, druha: ['Hledáte seminář pro blízké?', '/seminare/pro-blizke'], kniha: true },
    'pro-blizke': { podtitul: 'Individuální program tří setkání 1:1. Co lidem s OCD pomáhá, co jim naopak škodí a jak se v tom nezničit.', povaha: POVAHA_BLIZKE, format: FORMAT_BLIZKE, druha: ['Hledáte seminář pro lidi s OCD?', '/seminare/cesta-s-ocd'], kniha: false },
  };
  for (const p of data.programy) {
    const k = kontrola[p.id];
    const h = nacti(STRANKY[p.id]);
    const m = main(h);
    const t = text(m);
    assert.match(m, new RegExp(`<h1>${p.nazev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>`));
    assert.ok(t.includes(k.podtitul) && t.includes(k.povaha) && t.includes(k.format));
    assert.equal(formatProgramu(p), k.format);
    assert.ok(m.indexOf('class="lead"') < m.indexOf('class="callout-inline disclaimer sem-box"') && m.indexOf('class="callout-inline disclaimer sem-box"') < m.indexOf('class="sem-format"'), 'pořadí: podtitul, rámeček, formát');
    assert.match(h, new RegExp(`<nav class="crumbs" aria-label="Drobečková navigace"><ol><li><a href="/">Domů</a></li><li><a href="/seminare">Online semináře</a></li><li aria-current="page">${p.kratkyNazev}</li></ol></nav>`));
    assert.ok(m.includes('<a class="btn btn-ghost" href="/seminare">Zpět na přehled seminářů</a>'));
    assert.ok(m.includes(`<strong>${k.druha[0]}</strong> <a href="${k.druha[1]}">`), 'odkaz na druhý program');
    assert.equal(m.includes('href="/ebook"'), k.kniha, 'odkaz na knihu jen u prvního programu');
    assert.ok(m.includes(`href="/seminare/rezervace?program=${p.id}"`) && m.includes(`href="/seminare/rezervace?program=${p.id}&amp;beh=${p.behy[0].id}"`), 'tlačítka Rezervovat místo');
    assert.ok(t.includes('Žádný termín mi nevyhovuje') && m.includes('mailto:ocdmentor@gmail.com?subject=Dotaz%20na%20dal%C5%A1%C3%AD%20term%C3%ADn'));
    assert.ok(m.includes('id="spojeni"') && m.includes('id="terminy"') && m.includes('id="faq"'));
    assert.ok(!/<details class="prog-tab"|data-program-tab/.test(m));
    // obsah programu
    const o = OBSAH[p.id];
    assert.ok(t.includes(o.kartyNadpis));
    for (const [nazev, popis] of o.karty) { assert.ok(t.includes(nazev), nazev); assert.ok(t.includes(popis), popis); }
    for (const r of o.jak) assert.ok(t.includes(r), r);
    assert.ok(t.includes(o.proKoho));
    assert.ok(!t.includes('24. 12. 2026') && !t.includes('31. 12. 2026'), 'vynechaná data se nezobrazují jako termíny');
  }
  assert.equal(OBSAH['pro-lidi-s-ocd'].karty.length, 5);
  assert.equal(OBSAH['pro-blizke'].karty.length, 3);
  const ocd = text(main(nacti(STRANKY['pro-lidi-s-ocd'])));
  for (const d of ['čtvrtek 3. 12. 2026 v 18:00', 'čtvrtek 7. 1. 2027 v 18:00', 'čtvrtek 14. 1. 2027 v 18:00', 'čtvrtek 21. 1. 2027 v 18:00', 'čtvrtek 18. 2. 2027 v 18:00']) assert.ok(ocd.includes(d), d);
  const blizke = text(main(nacti(STRANKY['pro-blizke'])));
  for (const d of ['úterý 1. 12. 2026 v 18:00', 'úterý 8. 12. 2026 v 18:00', 'úterý 15. 12. 2026 v 18:00', 'úterý 12. 1. 2027 v 18:00', 'úterý 19. 1. 2027 v 18:00', 'úterý 26. 1. 2027 v 18:00']) assert.ok(blizke.includes(d), d);
  assert.ok(blizke.includes('Žijete s člověkem, který má OCD, nebo se o někoho takového staráte? Možná máte pocit, že všechno, co zkusíte, nepomáhá nebo situaci dokonce zhoršuje. Dobře míněná pomoc může někdy OCD nechtěně udržovat. Na tomto programu vám ukážu, jak to vypadá zevnitř, co pomáhá a jak si přitom zachovat vlastní život.'));
});

test('stránky programů: FAQ je ve viditelném HTML a ve strukturovaných datech shodné, bez duplicit, s hodnotami daného programu', () => {
  const data = nactiData();
  const ocekavaneVse = { 'pro-lidi-s-ocd': 11, 'pro-blizke': 16 };
  for (const p of data.programy) {
    const h = nacti(STRANKY[p.id]);
    const visible = [...h.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)].map((m) => ({ q: text(m[1]), a: text(m[2]) }));
    const faq = ldVse(h).find((n) => n['@type'] === 'FAQPage');
    const strukturovana = faq.mainEntity.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }));
    assert.equal(visible.length, ocekavaneVse[p.id], p.id);
    assert.equal(new Set(visible.map((v) => v.q)).size, visible.length, 'žádné duplicitní otázky');
    assert.deepEqual(strukturovana, visible);
    assert.deepEqual(visible, faqProgramu(pripraveny(p.id), data).map((f) => ({ q: f.q, a: f.a })));
  }
  const odp = (id, q) => text(nacti(STRANKY[id])).includes(q);
  const najdi = (id, q) => [...nacti(STRANKY[id]).matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [text(m[1]), text(m[2])]).find(([k]) => k === q)[1];
  assert.equal(najdi('pro-lidi-s-ocd', 'Co je v ceně?'), 'Všech pět setkání po 60 minutách. Jiné poplatky nejsou.');
  assert.equal(najdi('pro-blizke', 'Co je v ceně?'), 'Všechna tři setkání po 60 minutách. Jiné poplatky nejsou.');
  assert.equal(najdi('pro-lidi-s-ocd', 'Mohu setkání přesunout nebo zrušit?'), 'Zrušení nebo přesun nejpozději 24 hodin předem je bezplatný. Při pozdějším zrušení nebo nedostavení se bez omluvy má poskytovatel nárok na přiměřenou kompenzaci za rezervovaný čas ve výši 50 % ceny sezení. Zbytek ceny se vrátí do 14 dnů. Při nemoci nebo z vážných důvodů (včetně akutního zhoršení zdravotního stavu) lze setkání přesunout bez poplatku i po lhůtě. Tím není dotčeno právo spotřebitele na odstoupení od smlouvy. Přesun je možný po domluvě e-mailem, nejvýše dvakrát během programu.');
  assert.equal(najdi('pro-blizke', 'Mohu setkání přesunout nebo zrušit?'), 'Zrušení nebo přesun nejpozději 24 hodin předem je bezplatný. Při pozdějším zrušení nebo nedostavení se bez omluvy má poskytovatel nárok na přiměřenou kompenzaci za rezervovaný čas ve výši 50 % ceny sezení. Zbytek ceny se vrátí do 14 dnů. Při nemoci nebo z vážných důvodů (včetně akutního zhoršení zdravotního stavu) lze setkání přesunout bez poplatku i po lhůtě. Tím není dotčeno právo spotřebitele na odstoupení od smlouvy. Přesun je možný po domluvě e-mailem, nejvýše jednou během programu.');
  assert.equal(najdi('pro-lidi-s-ocd', 'Čím se liší program od jednotlivých sezení?'), 'Jednotlivá sezení jsou volná podpora podle aktuálního tématu. Program je strukturovaný podle knihy a tvoří ho pět propojených setkání.');
  assert.equal(najdi('pro-blizke', 'Čím se liší program od jednotlivých sezení?'), 'Jednotlivá sezení jsou volná podpora podle aktuálního tématu. Program je strukturovaný a tvoří ho tři propojená setkání.');
  for (const id of ['pro-lidi-s-ocd', 'pro-blizke']) {
    assert.equal(najdi(id, 'Konají se setkání i o svátcích?'), 'Ne, 24. a 31. prosince se nekonají, program se o tyto týdny posune.');
    assert.equal(najdi(id, 'Jak se platí?'), 'Po rezervaci dostanete QR kód a platební údaje. Platí se bankovním převodem do 3 dnů, termín je do té doby držený pro vás.');
    assert.ok(najdi(id, 'Jak probíhá setkání?').startsWith('Videohovor přes Google Meet nebo WhatsApp, 60 minut, jen vy a já.'));
    assert.ok(odp(id, 'Co když se zhorším?'));
  }
  for (const q of ['Musí můj blízký o semináři vědět?', 'Můžete mi říct, jestli má můj blízký OCD?', 'Naučím se, jak blízkého léčit?', 'Mohu přijít s partnerem nebo jiným blízkým?', 'Co když je můj blízký v akutní krizi?']) {
    assert.ok(odp('pro-blizke', q), q);
    assert.ok(!odp('pro-lidi-s-ocd', q), `${q} patří jen k programu pro blízké`);
  }
  assert.equal(vynechanaDnyText(data), '24. a 31. prosince');
});

test('staré kotvy a odkazy: přehled přesměruje #pro-blizke a #pro-lidi-s-ocd na stránky programů, na webu nezůstal odkaz na zrušené záložky', () => {
  const h = nacti('seminare/index.html');
  const mapa = JSON.parse(h.match(/data-stare-kotvy='([^']*)'/)[1]);
  assert.deepEqual(mapa, { 'pro-lidi-s-ocd': '/seminare/cesta-s-ocd', 'pro-blizke': '/seminare/pro-blizke' });
  const skript = nacti('assets/js/seminare.js');
  assert.ok(skript.includes('data-stare-kotvy') && skript.includes('window.location.replace(mapa[id])'));
  // simulace skriptu: přesměrování podle hash
  const presmeruj = (hash) => {
    let cil = null;
    const okno = { location: { hash, replace: (u) => { cil = u; } } };
    const dokument = { querySelector: (s) => (s === '[data-stare-kotvy]' ? { getAttribute: () => JSON.stringify(mapa) } : null), querySelectorAll: () => [] };
    new Function('window', 'document', 'Intl', skript)(okno, dokument, Intl);
    return cil;
  };
  assert.equal(presmeruj('#pro-blizke'), '/seminare/pro-blizke');
  assert.equal(presmeruj('#pro-lidi-s-ocd'), '/seminare/cesta-s-ocd');
  assert.equal(presmeruj('#neco-jineho'), null);
  assert.equal(presmeruj(''), null);
  // žádný odkaz na staré kotvy ani na prvky zrušených záložek v celém vygenerovaném webu
  const soubory = [];
  const projdi = (dir) => {
    for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.git', '.vercel', 'tools', 'seo', 'api', 'data'].includes(e.name)) continue;
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) projdi(rel);
      else if (/\.(html|js)$/.test(e.name) && e.name !== 'sw.js') soubory.push(rel);
    }
  };
  projdi('');
  assert.ok(soubory.length > 60);
  for (const s of soubory) {
    const t = nacti(s);
    assert.ok(!/\/seminare#(pro-|spojeni|terminy|faq)/.test(t), `${s}: odkaz na starou kotvu`);
    if (s.endsWith('.html')) assert.ok(!/data-program-tab|class="prog-tab"|<details[^>]*\sname="program"/.test(t), `${s}: zbytek záložek`);
  }
});

test('/seminare/rezervace: volba programu, pole, nepředvyplněné souhlasy obou programů, honeypot, přesné texty', () => {
  const h = nacti('seminare/rezervace/index.html');
  const m = main(h);
  for (const id of ['rez-jmeno', 'rez-prijmeni', 'rez-email', 'rez-email2', 'rez-telefon']) assert.ok(m.includes(`id="${id}"`), id);
  assert.ok(!/id="rez-duvod/.test(m), 'žádný důvod účasti');
  assert.ok(/<input type="tel" id="rez-telefon"/.test(m), 'telefon je povinný údaj pro WhatsApp');
  assert.ok(text(m).includes('Zkontrolujte i spam.'), 'upozornění na spam před odesláním');
  const programy = [...m.matchAll(/<input type="radio" id="program-[^"]*" name="program" value="([^"]+)"/g)].map((x) => x[1]);
  assert.deepEqual(programy, ['pro-lidi-s-ocd', 'pro-blizke'], 'volba mezi oběma programy');
  const t = text(m);
  assert.ok(t.includes('Cesta s OCD: sebepřijetí a sebevíra. Pět setkání nad knihou Individuální program 5 setkání · 3 900 Kč'));
  assert.ok(t.includes('Když OCD žije vedle vás: průvodce pro blízké Individuální program 3 setkání · 2 500 Kč'));
  const checkboxy = [...m.matchAll(/<input type="checkbox"[^>]*>/g)].map((x) => x[0]);
  assert.equal(checkboxy.length, 8, 'čtyři souhlasy pro každý program');
  for (const c of checkboxy) assert.ok(!/\schecked\b/.test(c), 'souhlas není předvyplněný');
  assert.ok(m.includes('name="web"') && m.includes('class="hp"'), 'honeypot');
  assert.ok(!/<form[^>]*\saction=/.test(m), 'formulář neodesílá bez JavaScriptu na jinou adresu');
  assert.ok(!/<form[^>]*method="get"/i.test(m));
  assert.ok(t.includes('Souhlasím se zpracováním jména, e-mailu a telefonního čísla za účelem rezervace, organizace programu a spojení se mnou. Chápu, že už samotná účast na semináři o OCD může vypovídat o mém zdravotním stavu, a souhlasím se zpracováním i této informace. Souhlas mohu kdykoli odvolat e-mailem. Zásady ochrany osobních údajů.'));
  assert.ok(t.includes('Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii ani zdravotní službu.'));
  assert.ok(t.includes('Souhlasím se zpracováním jména, e-mailu a telefonního čísla za účelem rezervace, organizace programu a spojení se mnou. Chápu, že už samotná účast na semináři o OCD může vypovídat o zdravotním stavu účastníka nebo jeho blízkého, a souhlasím se zpracováním i této informace o sobě. Souhlas mohu kdykoli odvolat e-mailem. Zásady ochrany osobních údajů.'));
  assert.ok(t.includes('Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii, rodinnou terapii ani zdravotní službu, a že na semináři nebudu sdílet identifikující údaje o svém blízkém (jména, diagnózy, podrobnosti).'));
  assert.equal(t.split('Seznámil/a jsem se s obchodními podmínkami a zásadami ochrany osobních údajů.').length - 1, 2);
  assert.ok(m.includes('href="/ochrana-osobnich-udaju"') && m.includes('href="/obchodni-podminky"'));
  assert.ok(m.includes('href="/seminare/cesta-s-ocd#spojeni"') && m.includes('href="/seminare/pro-blizke#spojeni"'), 'podrobnosti o spojení vedou na stránky programů');
  const blok = (id) => m.match(new RegExp(`<div class="program-blok" id="blok-${id}"[\\s\\S]*?</fieldset>\\s*</div>`))[0];
  assert.ok(text(blok('pro-lidi-s-ocd')).includes(POVAHA_SEMINARE) && text(blok('pro-lidi-s-ocd')).includes(FORMAT_OCD));
  assert.ok(text(blok('pro-blizke')).includes(POVAHA_BLIZKE) && text(blok('pro-blizke')).includes(FORMAT_BLIZKE));
  assert.equal([...blok('pro-lidi-s-ocd').matchAll(/<input type="radio"[^>]*name="beh"/g)].length, 2);
  assert.equal([...blok('pro-blizke').matchAll(/<input type="radio"[^>]*name="beh"/g)].length, 2);
  assert.ok(/class="program-blok"[^>]*\shidden/.test(m), 'bloky programů se zobrazí až po volbě programu');
});

test('stránky seminářů nemají placeholdery, štítky koncept ani TODO', () => {
  for (const p of ['seminare/index.html', ...Object.values(STRANKY), 'seminare/rezervace/index.html', 'seminare/rezervace/potvrzeni/index.html', 'obchodni-podminky/index.html', 'ochrana-osobnich-udaju/index.html', 'ebook/index.html', 'pro-blizke/index.html']) {
    const h = nacti(p);
    assert.ok(!/class="placeholder">(?!\[DOPLNIT:)|draft-badge|TODO|\[(?!DOPLNIT:)[A-ZĚŠČŘŽÝÁÍÉ][^\]]{3,}\]/.test(h), `${p}: placeholder, koncept nebo TODO`);
  }
});

test('potvrzovací stránka je noindex a bez osobních údajů v URL', () => {
  const h = nacti('seminare/rezervace/potvrzeni/index.html');
  assert.match(h, /<meta name="robots" content="noindex, nofollow">/);
  assert.ok(!/canonical/.test(h));
  const t = text(main(h));
  assert.ok(t.includes('Místo je pro vás rezervované do splatnosti. Po připsání platby se vám ozvu já e-mailem a domluvíme videohovor (Google Meet nebo WhatsApp). Nemusíte se mi ozývat sami. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.'));
  assert.ok(t.includes('Přidat do kalendáře (.ics)') && t.includes('Kopírovat'));
});

test('menu: jen „Online semináře“, „Online kurz“ v menu není; /kurz je noindex a mimo sitemapu', () => {
  const h = nacti('index.html');
  const nav = h.slice(h.indexOf('<nav id="hlavni-nav" aria-label="Hlavní navigace">'), h.indexOf('</nav>'));
  assert.ok(nav.includes('<a href="/seminare">Online semináře</a>'));
  assert.ok(!/Online kurz|href="\/kurz"|Online semináře a kurzy/.test(nav));
  const kurz = nacti('kurz/index.html');
  assert.match(kurz, /<meta name="robots" content="noindex/);
  const sitemap = nacti('sitemap.xml');
  assert.ok(!sitemap.includes('/kurz<') && !sitemap.includes('/seminare/rezervace/potvrzeni'));
  assert.ok(sitemap.includes('https://ocdmentor.cz/seminare<'));
});

test('patička každé stránky má upozornění, odkazy na právní stránky a krizové kontakty', () => {
  for (const p of ['index.html', 'seminare/index.html', 'seminare/rezervace/index.html', 'seminare/rezervace/potvrzeni/index.html', 'obchodni-podminky/index.html', 'ochrana-osobnich-udaju/index.html']) {
    const h = nacti(p);
    const f = h.slice(h.indexOf('<footer'));
    assert.ok(f.includes('Nejde o zdravotní službu ani psychoterapii. Spolupráce nenahrazuje odbornou péči.'), p);
    assert.ok(f.includes('href="/obchodni-podminky"') && f.includes('href="/ochrana-osobnich-udaju"'), p);
    assert.ok(f.includes('112') && f.includes('116 123'), p);
  }
});

test('obchodní podmínky: část B pro dva programy, oba texty o povaze, připojení druhého člověka, přesuny; zásady ochrany údajů', () => {
  const t = text(main(nacti('obchodni-podminky/index.html')));
  assert.ok(t.includes('Část B je účinná od 23. 11. 2026 a týká se jen programů'));
  assert.ok(t.includes('Část B: Online semináře (individuální programy)'));
  assert.ok(t.includes(POVAHA_SEMINARE));
  assert.ok(t.includes(POVAHA_BLIZKE));
  assert.ok(t.includes('Program (a), pro lidi s OCD:') && t.includes('Program (b), pro blízké:'));
  assert.ok(t.includes('(a) individuální program pěti online setkání po 60 minutách, 1× týdně ve čtvrtek v 18:00, cena 3 900 Kč;'));
  assert.ok(t.includes('(b) individuální program tří online setkání po 60 minutách, 1× týdně v úterý v 18:00, cena 2 500 Kč, určený blízkým lidí s OCD.'));
  assert.ok(t.includes('Obě ceny jsou konečné, prodejce není plátcem DPH.'));
  assert.ok(t.includes('U programu tří setkání se na setkání může připojit jeden další člověk z domácnosti účastníka bez příplatku. Jeho osobní údaje prodejce nezpracovává. Účastník zajistí, že se připojí s jeho vědomím. Účastníci nesdílejí identifikující údaje o třetích osobách (jména, diagnózy, podrobnosti).'));
  assert.ok(t.includes('Setkání se nekonají 24. a 31. prosince, program se o tyto týdny posune.'));
  assert.ok(t.includes('Zrušení nebo přesun nejpozději 24 hodin předem je bezplatný. Při pozdějším zrušení nebo nedostavení se bez omluvy má poskytovatel nárok na přiměřenou kompenzaci za rezervovaný čas ve výši 50 % ceny sezení. Zbytek ceny se vrátí do 14 dnů. Při nemoci nebo z vážných důvodů (včetně akutního zhoršení zdravotního stavu) lze setkání přesunout bez poplatku i po lhůtě. Tím není dotčeno právo spotřebitele na odstoupení od smlouvy. Setkání lze přesunout po domluvě e-mailem, u programu pěti setkání nejvýše dvakrát, u programu tří setkání nejvýše jednou.'));
  for (const veta of [
    'Smlouva vzniká okamžikem potvrzení rezervace poskytovatelem. Cena se hradí bankovním převodem s uvedeným variabilním symbolem do 3 dnů od rezervace.',
    'Zbývající část se vrací do 14 dnů stejným způsobem, jakým byla platba přijata.',
    'Výhrady k poskytnuté službě lze uplatnit e-mailem, prodejce odpoví do 30 dnů.',
    'Vztahy se řídí právem České republiky.',
  ]) assert.ok(t.includes(veta), veta);
  const p = text(main(nacti('ochrana-osobnich-udaju/index.html')));
  for (const k of ['Vercel', 'Google', 'čl. 9 odst. 2 písm. a', 'čl. 6 odst. 1 písm. c', '1 rok po skončení programu', '30 dnů po skončení programu', 'Úřadu pro ochranu osobních údajů']) assert.ok(p.includes(k), k);
  assert.ok(p.includes('může vypovídat o zdravotním stavu účastníka nebo jeho blízkého'));
  assert.ok(p.includes('U programu pro blízké prodejce údaje o člověku s OCD neshromažďuje. Pokud je účastník přesto na setkání sdělí, použije je prodejce jen pro účel daného hovoru a nezaznamenává je.'));
});

test('CSP ve vercel.json povoluje hash inline skriptu každé stránky a nic jiného inline', () => {
  const v = JSON.parse(nacti('vercel.json'));
  const csp = v.headers[0].headers.find((x) => x.key === 'Content-Security-Policy').value;
  for (const p of ['index.html', 'seminare/index.html', 'seminare/rezervace/potvrzeni/index.html', '404.html', 'offline/index.html']) {
    const h = nacti(p);
    const inline = [...h.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)];
    assert.ok(inline.length >= 1, `${p}: inline skript webu`);
    for (const m of inline) assert.ok(csp.includes(`'sha256-${createHash('sha256').update(m[1]).digest('base64')}'`), `${p}: hash inline skriptu v CSP`);
    assert.ok(!/\son(?:click|load|error|submit)\s*=/i.test(bezZnacek(h).length ? h.replace(/<script[\s\S]*?<\/script>/g, '') : h), `${p}: bez inline obslužných funkcí`);
  }
  assert.ok(!/unsafe-eval/.test(csp) && !/script-src[^;]*unsafe-inline/.test(csp));
  assert.ok(/frame-ancestors 'none'/.test(csp) && /object-src 'none'/.test(csp));
  assert.ok(v.headers[0].headers.some((x) => x.key === 'X-Content-Type-Options') && v.headers[0].headers.some((x) => x.key === 'Referrer-Policy'));
  assert.deepEqual(v.regions, ['fra1']);
});

test('v repozitáři nejsou tajné ani osobní hodnoty (číslo účtu, klíče)', () => {
  const soubory = ['tools/gen.mjs', 'api/rezervace.js', 'api/_lib/konfigurace.js', 'api/_lib/mail.js', 'api/_lib/platba.js', 'api/_lib/texty.js', 'tools/content/seminare.mjs', 'vercel.json', 'README.md', 'data/seminare.json', 'obchodni-podminky/index.html', 'ochrana-osobnich-udaju/index.html', 'kontakt/index.html', 'seminare/index.html', 'seminare/rezervace/index.html'];
  // jakékoli číslo účtu ve tvaru číslo/kód banky (příklady z dokumentace jsou jen v testech a v .env.example)
  const vzorUctu = /\b\d{6,10}\/\d{4}\b/;
  // a hodnota z lokálního .env.local, pokud existuje
  let lokalni = '';
  let heslo = '';
  try { heslo = (readFileSync(join(ROOT, '.env.local'), 'utf8').match(/^SMTP_PASSWORD=(.+)$/m) || [])[1] || ''; } catch { heslo = ''; }
  try { lokalni = (readFileSync(join(ROOT, '.env.local'), 'utf8').match(/^BANK_ACCOUNT=(.+)$/m) || [])[1] || ''; } catch { lokalni = ''; }
  for (const s of soubory) {
    const t = nacti(s);
    assert.ok(!vzorUctu.test(t), `${s}: číslo účtu`);
    if (lokalni.trim()) assert.ok(!t.includes(lokalni.trim()), `${s}: hodnota z .env.local`);
    if (heslo.trim().length > 7) assert.ok(!t.includes(heslo.trim()), `${s}: heslo z .env.local`);
  }
  const ex = nacti('.env.example');
  for (const k of ['BANK_ACCOUNT', 'BANK_ACCOUNT_HOLDER', 'SELLER_ICO', 'NOTIFY_EMAIL', 'MAIL_FROM', 'RESEND_API_KEY']) assert.match(ex, new RegExp(`^${k}=$`, 'm'), `${k} bez hodnoty`);
});

test('stavy běhů se vykreslí správně: Obsazeno, Uzavřeno, Připravujeme, bez tlačítka a s neaktivním výběrem', () => {
  const data = nactiData();
  data.programy[0].behy[0].stav = 'obsazeno';
  const programy = pripravProgramy(data);
  const ted = new Date('2027-01-17T12:00:00Z'); // běh 2 programu pro lidi s OCD je od 17. 1. 2027 uzavřený (4 dny před 21. 1.)
  const ocd = programBody({ program: programy[0], programy, data, now: ted });
  const blizke = programBody({ program: programy[1], programy, data, now: ted });
  const run = (h, id) => h.match(new RegExp(`<article class="run" data-beh="${id}"[\\s\\S]*?</article>`))[0];
  assert.match(run(ocd, 'beh-1'), /data-stav="obsazeno"[\s\S]*Obsazeno/);
  assert.match(run(ocd, 'beh-2'), /data-stav="uzavreno"[\s\S]*Uzavřeno/);
  assert.ok(!/Rezervovat místo/.test(ocd), 'bez otevřeného běhu není tlačítko rezervace');
  // druhý program: oba běhy už začaly, tedy jsou uzavřené
  assert.match(run(blizke, 'blizke-beh-1'), /data-stav="uzavreno"/);
  assert.match(run(blizke, 'blizke-beh-2'), /data-stav="uzavreno"/);
  assert.ok(!/Rezervovat místo/.test(blizke));
  const rez = rezervaceBody({ data, programy, now: ted });
  assert.equal([...rez.matchAll(/<input type="radio"[^>]*name="beh"[^>]*disabled/g)].length, 4, 'všechny čtyři běhy jsou v rezervaci neaktivní');
  data.programy[1].behy[0].stav = 'pripravujeme';
  assert.match(programBody({ program: pripravProgramy(data)[1], programy: pripravProgramy(data), data, now: new Date('2026-10-01T10:00:00Z') }), /Připravujeme/);
  // otevřený běh má tlačítko a odkaz s předvybraným programem a během
  const dnes = nactiData();
  const pr = pripravProgramy(dnes);
  const otevreny = programBody({ program: pr[0], programy: pr, data: dnes, now: new Date('2026-10-01T10:00:00Z') });
  assert.ok(otevreny.includes('href="/seminare/rezervace?program=pro-lidi-s-ocd&amp;beh=beh-1"') && otevreny.includes('Rezervovat místo'));
  // když není otevřený žádný běh programu, obecné tlačítko rezervace chybí
  const zadny = nactiData();
  zadny.programy[1].behy.forEach((b) => { b.stav = 'obsazeno'; });
  const pz = pripravProgramy(zadny);
  assert.ok(!/Rezervovat místo/.test(programBody({ program: pz[1], programy: pz, data: zadny, now: new Date('2026-10-01T10:00:00Z') })));
});

test('/pro-blizke: nový úvod, title a popis, tlačítka, rámeček o povaze a krizové kontakty; je indexovatelná a propojená', () => {
  const h = nacti('pro-blizke/index.html');
  assert.match(h, /<title>Jak pomáhat blízkému s OCD \| ocdmentor\.cz<\/title>/);
  assert.ok(h.includes('<meta name="description" content="Žijete s člověkem s OCD? Zjistěte, jak ho nekrmit dobře míněnou pomocí a jak si zachovat vlastní život. Individuální program pro blízké.">'));
  assert.ok(!/<meta name="robots" content="noindex/.test(h), 'stránka je indexovatelná');
  const m = main(h);
  assert.match(m, /<h1>Když OCD žije vedle vás<\/h1>/);
  const t = text(m);
  for (const veta of [
    'Žijete s člověkem, který má OCD, nebo se o někoho takového staráte? Možná se ptáte, jak mu pomoci, a přitom máte pocit, že všechno, co zkusíte, nepomáhá nebo to dokonce zhoršuje. Nejste v tom sami.',
    'OCD se často udržuje i dobře míněnou pomocí: když za člověka kontrolujeme, odpovídáme na stále stejné otázky nebo se vyhýbáme věcem, které spouštějí strach. Zvenku to vypadá jako laskavost, ale strach to z dlouhodobého hlediska krmí. Dá se to dělat jinak, bez vyčítání sobě i blízkému.',
    'Na semináři „Když OCD žije vedle vás“ vám z pohledu člověka, který OCD zná z vlastního života, ukážu, co pomáhá a co škodí a jak si přitom zachovat vlastní život. Nejsem psycholog ani terapeut, neposkytuji rodinnou terapii ani radu k vašemu konkrétnímu případu.',
    'Zobrazit seminář pro blízké',
    POVAHA_BLIZKE,
  ]) assert.ok(t.includes(veta), veta.slice(0, 50));
  assert.ok(m.includes('href="/seminare/pro-blizke">Zobrazit seminář pro blízké</a>'), 'tlačítko vede na stránku semináře pro blízké');
  assert.ok(!m.includes('/seminare#'), 'žádný odkaz na zrušené záložky');
  assert.ok(/reservanto-widget[^>]*data-text="Úvodní konzultace zdarma"/.test(m), 'tlačítko úvodní konzultace zdarma (existující Reservanto)');
  assert.ok(/112/.test(t) && /116 123/.test(t), 'krizové kontakty');
  assert.ok(t.indexOf('Zobrazit seminář pro blízké') < t.indexOf(POVAHA_BLIZKE), 'rámeček je pod tlačítky');
  const sitemap = nacti('sitemap.xml');
  assert.ok(sitemap.includes('https://ocdmentor.cz/pro-blizke<'));
  assert.ok(nacti(STRANKY['pro-blizke']).includes('href="/pro-blizke"'), 'stránka semináře odkazuje na obsahovou stránku');
  const f = nacti('index.html');
  assert.ok(f.slice(f.indexOf('<footer')).includes('href="/pro-blizke"'), 'odkaz z patičky');
});

test('rezervace a potvrzení: data stránek nemají slovo OCD v e-mailových ani kalendářových textech', () => {
  const ics = nacti('assets/js/potvrzeni.js');
  const radky = ics.split('\n').filter((r) => /SUMMARY|DESCRIPTION|LOCATION|PRODID/.test(r)).join('\n');
  assert.ok(radky.length > 0);
  assert.ok(!/\bOCD\b/i.test(radky), 'v kalendářovém souboru není slovo OCD');
  assert.ok(ics.includes("'SUMMARY:Seminář'"));
});
