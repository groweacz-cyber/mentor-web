// Anglická verze webu (/en/…): úplnost překladu, přepínač jazyka, hreflang, sitemap, anglické skripty a anglická rezervace.
// Před spuštěním: npm run gen.
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EN_STRANKY, maAnglickouVerzi } from '../i18n/slugs.mjs';
import { vytvorHandler } from '../../api/rezervace.js';
import { vynulujLimity } from '../../api/_lib/limit.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
const soubor = (url) => (url === '/' ? 'index.html' : `${url.slice(1)}/index.html`);
const SITE = 'https://ocdmentor.cz';
const DIAKRITIKA = /[ěščřžýáíéúůďťňĚŠČŘŽÝÁÍÉÚŮĎŤŇ]/;
const JMENA = /Václav|Kodeš|Strážkovice|Trhové Sviny|Praško|ČAP|Úřad|Office for/g;

test('překlad je úplný: žádná nepřeložená jednotka stránek ani skriptů', () => {
  const stranky = JSON.parse(nacti('tools/i18n/chybejici.json'));
  assert.equal(stranky.jednotek, 0, `chybí překlad stránek: ${stranky.polozky.slice(0, 3).join(' | ')}`);
  const skripty = JSON.parse(nacti('tools/i18n/chybejici-js.json'));
  assert.equal(skripty.jednotek, 0, `chybí překlad skriptů: ${skripty.polozky.slice(0, 3).join(' | ')}`);
});

test('každá stránka s anglickou verzí existuje česky i anglicky, má lang, canonical, hreflang a přepínač jazyka', () => {
  let pocet = 0;
  for (const [cs, en] of Object.entries(EN_STRANKY)) {
    assert.ok(existsSync(join(ROOT, soubor(cs))), `chybí česká stránka ${cs}`);
    assert.ok(existsSync(join(ROOT, soubor(en))), `chybí anglická stránka ${en}`);
    const h = nacti(soubor(en));
    const c = nacti(soubor(cs));
    assert.match(h, /<html lang="en">/, `${en}: lang`);
    const bezIndexace = /<meta name="robots" content="noindex/.test(h); // aplikace, děkovací a offline stránky nemají canonical ani hreflang
    if (!bezIndexace) assert.ok(h.includes(`<link rel="canonical" href="${SITE}${en}">`), `${en}: canonical`);
    for (const x of bezIndexace ? [] : [h, c]) {
      assert.ok(x.includes(`<link rel="alternate" hreflang="cs" href="${SITE}${cs === '/' ? '/' : cs}">`), `${en}: hreflang cs`);
      assert.ok(x.includes(`<link rel="alternate" hreflang="en" href="${SITE}${en}">`), `${en}: hreflang en`);
      assert.ok(x.includes(`<link rel="alternate" hreflang="x-default" href="${SITE}${cs === '/' ? '/' : cs}">`), `${en}: x-default`);
    }
    // přepínač: česká stránka odkazuje na anglickou a naopak, aktuální jazyk není odkaz
    assert.ok(c.includes(`class="lang-switch"`) && c.includes(`href="${en}" hreflang="en"`), `${cs}: přepínač na angličtinu`);
    assert.ok(h.includes(`class="lang-switch"`) && h.includes(`hreflang="cs"`) && h.includes(`aria-current="true">EN</span>`), `${en}: přepínač na češtinu`);
    pocet++;
  }
  assert.ok(pocet >= 60, 'anglických stránek je dost');
});

test('koncept /skupiny anglickou verzi nemá a přepínač z něj vede na anglický úvod', () => {
  assert.ok(!maAnglickouVerzi('/skupiny'));
  assert.ok(!existsSync(join(ROOT, 'en/support-group/index.html')));
  assert.ok(nacti('skupiny/index.html').includes('href="/en" hreflang="en"'));
});

test('anglické stránky: titulek, popis a nadpis h1 bez české diakritiky (kromě jmen)', () => {
  for (const en of Object.values(EN_STRANKY)) {
    const h = nacti(soubor(en));
    const titulek = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const popis = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
    const h1 = ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').replace(/<[^>]+>/g, '');
    for (const [k, t] of [['title', titulek], ['description', popis], ['h1', h1]]) {
      assert.ok(!DIAKRITIKA.test(t.replace(JMENA, '')), `${en}: ${k} obsahuje češtinu: ${t.slice(0, 80)}`);
    }
    assert.ok(titulek.length > 10, `${en}: titulek`);
  }
});

test('sitemap: anglické adresy mají alternativy cs/en, koncept /skupiny je mimo, aplikace a děkovací stránky nejsou v sitemapě', () => {
  const s = nacti('sitemap.xml');
  assert.ok(s.includes(`<loc>${SITE}/en/how-it-works</loc>`));
  assert.ok(s.includes(`<xhtml:link rel="alternate" hreflang="en" href="${SITE}/en/how-it-works"/>`));
  assert.ok(!s.includes('/en/support-group'));
  assert.ok(!s.includes('/en/app'));
  assert.ok(!s.includes('/en/seminars/booking/confirmation'));
});

test('anglické stránky načítají anglické kopie skriptů, ty existují a nezůstal žádný přeložený skript česky', () => {
  for (const en of Object.values(EN_STRANKY)) {
    const h = nacti(soubor(en));
    for (const m of h.matchAll(/<script[^>]*\ssrc="(\/assets\/js\/[^"?#]+)/g)) {
      const src = m[1];
      if (src.startsWith('/assets/js/vendor/')) continue;
      if (src.startsWith('/assets/js/en/')) {
        assert.ok(existsSync(join(ROOT, src.slice(1))), `${en}: chybí ${src}`);
      } else {
        const kopie = src.replace('/assets/js/', 'assets/js/en/');
        assert.ok(!existsSync(join(ROOT, kopie)), `${en}: načítá český ${src}, ačkoli existuje anglická kopie`);
      }
    }
  }
  const rez = nacti('en/seminars/booking/index.html');
  assert.ok(/\/assets\/js\/en\/rezervace\.js/.test(rez) && /\/assets\/js\/en\/seminare\.js/.test(rez));
  assert.match(nacti('assets/js/en/seminare.js'), /'Closed'/);
  assert.match(nacti('assets/js/en/potvrzeni.js'), /'Saturday'/);
  assert.match(nacti('assets/js/en/app/data.js'), /accept/);
});

test('anglické skripty se vyrábějí překladem: v kopiích nezbyly české texty a logika zůstala (stejný počet řádků)', () => {
  for (const f of ['rezervace.js', 'potvrzeni.js', 'app/diary.js', 'app/data.js']) {
    const en = nacti(`assets/js/en/${f}`);
    const cs = nacti(`assets/js/${f}`);
    const radky = (t) => t.split('\n').length;
    assert.ok(Math.abs(radky(en) - radky(cs)) <= 2, `${f}: počet řádků`);
    const bezKomentaru = en.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!DIAKRITIKA.test(bezKomentaru.replace(/Václav|Kodeš/g, '')), `${f}: v anglické kopii zbyla čeština`);
  }
});

test('service worker má anglickou offline stránku a podle adresy vybírá jazyk', () => {
  const sw = nacti('sw.js');
  assert.ok(sw.includes("var OFFLINE_EN = '/en/offline'"));
  assert.ok(sw.includes('cache.addAll([OFFLINE, OFFLINE_EN,'));
  assert.ok(sw.includes('offlineFor(url.pathname)'));
  assert.ok(existsSync(join(ROOT, 'en/offline/index.html')));
});

test('anglické OG obrázky existují pro všechny indexovatelné anglické stránky', () => {
  for (const en of ['/en', '/en/how-it-works', '/en/seminars']) {
    const h = nacti(soubor(en));
    const m = h.match(/<meta property="og:image" content="https:\/\/ocdmentor\.cz(\/assets\/og\/[^"]+)"/);
    assert.ok(m, `${en}: og:image`);
    assert.ok(existsSync(join(ROOT, m[1].slice(1))), `${en}: chybí ${m[1]}`);
  }
});

// ---------- anglická rezervace ----------
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
  program: 'pro-lidi-s-ocd', jmeno: 'Jane', prijmeni: 'Tester', email: 'jane@example.test', email2: 'jane@example.test', telefon: '+44 7700 900123',
  beh: 'beh-1', souhlasZpracovani: true, souhlasPovaha: true, souhlasPodminky: true, souhlasZahajeni: true, web: '', doba: 15000, ...nahrada,
});
function zavolej(telo) {
  const odeslane = [];
  const handler = vytvorHandler({ env: () => ENV, odesilac: () => async (z) => { odeslane.push(z); }, ted: () => TED });
  const req = { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://ocdmentor.cz', 'x-forwarded-for': '203.0.113.9' }, body: telo, socket: {} };
  let stav; let odpoved;
  const res = { statusCode: 200, setHeader: () => {}, end: (t) => { stav = res.statusCode; odpoved = JSON.parse(t); } };
  return handler(req, res).then(() => ({ stav, odpoved, odeslane }));
}
beforeEach(() => vynulujLimity());

test('rezervace s jazyk=en: odpověď a e-mail účastníkovi anglicky, bez slova OCD; e-mail majiteli česky s poznámkou o jazyce', async () => {
  const r = await zavolej(zadost({ jazyk: 'en' }));
  assert.equal(r.stav, 200);
  assert.equal(r.odpoved.program.popis, 'Individual programme of five meetings');
  assert.equal(r.odpoved.beh.nazev, 'Run 1');
  const [ucastnik, majitel] = r.odeslane;
  assert.equal(ucastnik.zprava.subject, 'Seminar booking – payment details');
  for (const co of ['3,590 CZK', 'Thursday 3 December 2026 at 18:00', 'by 8 November 2026', 'https://ocdmentor.cz/en/terms', 'Kind regards', 'Variable symbol: ' + r.odpoved.vs]) {
    assert.ok(ucastnik.zprava.text.includes(co), `e-mail obsahuje „${co}“`);
  }
  for (const celek of [ucastnik.zprava.subject, ucastnik.zprava.text, ucastnik.zprava.html]) {
    assert.ok(!/\bOCD\b/i.test(celek), 'v anglickém e-mailu účastníka není slovo OCD');
  }
  assert.ok(ucastnik.zprava.html.includes('<html lang="en">'));
  assert.ok(majitel.zprava.subject.startsWith('Nová rezervace semináře'));
  assert.ok(majitel.zprava.text.includes('Jazyk stránky: angličtina'));
});

test('rezervace bez jazyka nebo s neznámým jazykem zůstává česky', async () => {
  for (const jazyk of [undefined, 'cs', 'de', 5]) {
    const r = await zavolej(zadost(jazyk === undefined ? {} : { jazyk }));
    assert.equal(r.stav, 200);
    assert.equal(r.odpoved.program.popis, 'Individuální program pěti setkání');
    assert.equal(r.odeslane[0].zprava.subject, 'Rezervace semináře – platební údaje');
    assert.ok(r.odeslane[1].zprava.text.includes('Jazyk stránky: čeština'));
  }
});
