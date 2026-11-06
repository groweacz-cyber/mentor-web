// Slovenská verze webu (/sk/…): úplnost překladu, přepínač jazyka, hreflang, sitemap, slovenské skripty a slovenská rezervace.
// Před spuštěním: npm run gen.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SK_STRANKY, EN_STRANKY } from '../i18n/slugs.mjs';
import { vytvorHandler } from '../../api/rezervace.js';
import { vynulujLimity } from '../../api/_lib/limit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
const soubor = (url) => (url === '/' ? 'index.html' : `${url.slice(1)}/index.html`);
const SITE = 'https://ocdmentor.cz';
// čeština bez slovenštiny: znaky ě ř ů se ve slovenštině nepoužívají, ď ť ň ľ ĺ ŕ ô ä jsou slovenské
const CESKE_ZNAKY = /[ěřůĚŘŮ]/;
const JMENA = /Václav|Kodeš|Strážkovice|Trhové Sviny|Praško|Úřad|Česká|České|Českú|Českej|Reforma péče|Národní ústav|Léčba obsedantně|Portál pacientských/g;

test('slovenský překlad je úplný: žádná nepřeložená jednotka stránek ani skriptů', () => {
  const stranky = JSON.parse(nacti('tools/i18n/chybejici-sk.json'));
  assert.equal(stranky.jednotek, 0, `chybí překlad stránek: ${stranky.polozky.slice(0, 3).join(' | ')}`);
  const skripty = JSON.parse(nacti('tools/i18n/chybejici-js-sk.json'));
  assert.equal(skripty.jednotek, 0, `chybí překlad skriptů: ${skripty.polozky.slice(0, 3).join(' | ')}`);
});

test('slovenské adresy: stejná sada stránek jako angličtina, bez konceptu /skupiny', () => {
  assert.deepEqual(Object.keys(SK_STRANKY).sort(), Object.keys(EN_STRANKY).sort());
  assert.ok(!('/skupiny' in SK_STRANKY));
  assert.ok(!existsSync(join(ROOT, 'sk/skupiny/index.html')));
});

test('každá slovenská stránka existuje, má lang, canonical, hreflang (cs, en, sk) a přepínač jazyka', () => {
  for (const [cs, sk] of Object.entries(SK_STRANKY)) {
    assert.ok(existsSync(join(ROOT, soubor(sk))), `chybí slovenská stránka ${sk}`);
    const h = nacti(soubor(sk));
    const c = nacti(soubor(cs));
    assert.match(h, /<html lang="sk">/, `${sk}: lang`);
    const bezIndexace = /<meta name="robots" content="noindex/.test(h);
    if (!bezIndexace) {
      assert.ok(h.includes(`<link rel="canonical" href="${SITE}${sk}">`), `${sk}: canonical`);
      for (const x of [h, c]) {
        assert.ok(x.includes(`hreflang="sk" href="${SITE}${sk}"`), `${sk}: hreflang sk`);
        assert.ok(x.includes(`hreflang="en" href="${SITE}${EN_STRANKY[cs]}"`), `${sk}: hreflang en`);
        assert.ok(x.includes(`hreflang="x-default" href="${SITE}${cs}"`) || cs === '/', `${sk}: x-default`);
      }
    }
    assert.ok(c.includes(`href="${sk}" hreflang="sk"`), `${cs}: přepínač na slovenštinu`);
    assert.ok(h.includes('aria-current="true">SK</span>') && h.includes('hreflang="cs"') && h.includes('hreflang="en"'), `${sk}: přepínač jazyka`);
  }
});

test('slovenské stránky: titulek, popis a h1 bez českých znaků (kromě jmen)', () => {
  for (const sk of Object.values(SK_STRANKY)) {
    const h = nacti(soubor(sk));
    const titulek = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const popis = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    const h1 = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '');
    for (const [k, t] of [['title', titulek], ['description', popis], ['h1', h1]]) {
      assert.ok(!CESKE_ZNAKY.test(t.replace(JMENA, '')), `${sk}: ${k} obsahuje češtinu: ${t.slice(0, 80)}`);
    }
    assert.ok(titulek.length > 10, `${sk}: titulek`);
  }
});

test('slovenské stránky: krizová linka je slovenská, česká linka 116 123 se na slovenských stránkách neobjevuje', () => {
  for (const sk of Object.values(SK_STRANKY)) {
    const h = nacti(soubor(sk));
    assert.ok(!/116 123/.test(h.replace(/<script[\s\S]*?<\/script>/g, '')), `${sk}: česká linka 116 123`);
  }
  assert.ok(nacti('sk/pomoc/index.html').includes('0800 800 566'));
  assert.ok(nacti('sk/index.html').includes('0800 800 566'));
});

test('sitemap: slovenské adresy mají alternativy cs/en/sk', () => {
  const s = nacti('sitemap.xml');
  assert.ok(s.includes(`<loc>${SITE}/sk/metoda</loc>`));
  assert.ok(s.includes(`<xhtml:link rel="alternate" hreflang="sk" href="${SITE}/sk/metoda"/>`));
  assert.ok(s.includes(`<xhtml:link rel="alternate" hreflang="en" href="${SITE}/en/method"/>`));
  assert.ok(!s.includes('/sk/aplikacia'));
  assert.ok(!s.includes('/sk/seminare/rezervacia/potvrdenie'));
});

test('slovenské stránky načítají slovenské kopie skriptů, ty existují a nezůstal žádný přeložený skript česky', () => {
  for (const sk of Object.values(SK_STRANKY)) {
    const h = nacti(soubor(sk));
    for (const m of h.matchAll(/<script[^>]*\ssrc="(\/assets\/js\/[^"?#]+)/g)) {
      const src = m[1];
      if (src.startsWith('/assets/js/vendor/')) continue;
      if (src.startsWith('/assets/js/sk/')) {
        assert.ok(existsSync(join(ROOT, src.slice(1))), `${sk}: chybí ${src}`);
      } else {
        assert.ok(!existsSync(join(ROOT, src.replace('/assets/js/', 'assets/js/sk/').slice(0))), `${sk}: načítá český ${src}, ačkoli existuje slovenská kopie`);
      }
    }
  }
  const rez = nacti('sk/seminare/rezervacia/index.html');
  assert.ok(/\/assets\/js\/sk\/rezervace\.js/.test(rez) && /\/assets\/js\/sk\/seminare\.js/.test(rez));
  assert.match(nacti('assets/js/sk/seminare.js'), /'Uzavreté'/);
  assert.match(nacti('assets/js/sk/potvrzeni.js'), /'štvrtok'/);
  assert.match(nacti('assets/js/sk/app/data.js'), /prijm/);
  for (const f of ['kviz.js', 'rezervace.js', 'potvrzeni.js', 'app/start.js', 'app/diary.js', 'dotaznik.js']) {
    const kod = nacti(`assets/js/sk/${f}`).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!CESKE_ZNAKY.test(kod.replace(/Václav|Kodeš/g, '')), `${f}: ve slovenské kopii zbyla čeština`);
  }
});

test('service worker má slovenskou offline stránku', () => {
  const sw = nacti('sw.js');
  assert.ok(sw.includes("var OFFLINE_SK = '/sk/offline'"));
  assert.ok(sw.includes("indexOf('/sk/') === 0"));
  assert.ok(existsSync(join(ROOT, 'sk/offline/index.html')));
});

test('slovenské OG obrázky existují', () => {
  for (const sk of ['/sk', '/sk/metoda', '/sk/seminare']) {
    const h = nacti(soubor(sk));
    const m = h.match(/<meta property="og:image" content="https:\/\/ocdmentor\.cz(\/assets\/og\/[^"]+)"/);
    assert.ok(m, `${sk}: og:image`);
    assert.ok(existsSync(join(ROOT, m[1].slice(1))), `${sk}: chybí ${m[1]}`);
  }
});

// ---------- slovenská rezervace ----------
const ENV = {
  BANK_ACCOUNT: '19-2000145399/0800',
  BANK_ACCOUNT_HOLDER: 'Bc. Václav Kodeš',
  SELLER_ICO: '12345678',
  NOTIFY_EMAIL: 'majitel@example.test',
  MAIL_FROM: 'info@example.test',
  SMTP_PASSWORD: 'testovaci-heslo',
  ALLOWED_ORIGINS: 'https://ocdmentor.cz',
};
const TED = new Date('2026-11-05T10:15:00Z');
const zadost = (nahrada = {}) => ({
  program: 'pro-lidi-s-ocd', jmeno: 'Jana', prijmeni: 'Testová', email: 'jana@example.test', email2: 'jana@example.test', telefon: '+421 900 123 456',
  beh: 'beh-1', souhlasZpracovani: true, souhlasPovaha: true, souhlasPodminky: true, web: '', doba: 15000, ...nahrada,
});
function zavolej(telo) {
  const odeslane = [];
  const handler = vytvorHandler({ env: () => ENV, odesilac: () => async (z) => { odeslane.push(z); }, ted: () => TED });
  const req = { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://ocdmentor.cz', 'x-forwarded-for': '203.0.113.11' }, body: telo, socket: {} };
  let stav; let odpoved;
  const res = { statusCode: 200, setHeader: () => {}, end: (t) => { stav = res.statusCode; odpoved = JSON.parse(t); } };
  return handler(req, res).then(() => ({ stav, odpoved, odeslane }));
}
beforeEach(() => vynulujLimity());

test('rezervace s jazyk=sk: odpověď a e-mail účastníkovi slovensky, bez slova OCD; e-mail majiteli česky s poznámkou o jazyce', async () => {
  const r = await zavolej(zadost({ jazyk: 'sk' }));
  assert.equal(r.stav, 200);
  assert.equal(r.odpoved.program.popis, 'Individuálny program piatich stretnutí');
  assert.equal(r.odpoved.beh.nazev, 'Beh 1');
  const [ucastnik, majitel] = r.odeslane;
  assert.equal(ucastnik.zprava.subject, 'Rezervácia seminára – platobné údaje');
  for (const co of ['3 590 Kč', 'štvrtok 3. 12. 2026 o 18:00', 'do 8. 11. 2026', 'https://ocdmentor.cz/sk/obchodne-podmienky', 'S pozdravom', 'Variabilný symbol: ' + r.odpoved.vs]) {
    assert.ok(ucastnik.zprava.text.includes(co), `e-mail obsahuje „${co}“`);
  }
  for (const celek of [ucastnik.zprava.subject, ucastnik.zprava.text, ucastnik.zprava.html]) {
    assert.ok(!/\bOCD\b/i.test(celek), 'v slovenském e-mailu účastníka není slovo OCD');
  }
  assert.ok(ucastnik.zprava.html.includes('<html lang="sk">'));
  assert.ok(majitel.zprava.subject.startsWith('Nová rezervace semináře'));
  assert.ok(majitel.zprava.text.includes('Jazyk stránky: slovenština'));
});
