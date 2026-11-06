// Lišta cookies a Meta Pixel: pixel se nesmí načíst bez souhlasu, nesmí být v HTML, na citlivých stránkách ani v aplikaci.
// Před spuštěním: npm run gen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
const PIXEL = '1121273126977507';

test('lišta cookies je na veřejných stránkách ve všech jazycích, s rovnocennými tlačítky a odkazem v patičce', () => {
  for (const p of ['index.html', 'metoda/index.html', 'ochrana-osobnich-udaju/index.html', 'en/index.html', 'sk/index.html', 'seminare/index.html']) {
    const h = nacti(p);
    assert.ok(h.includes('id="cookie-banner"') && h.includes('id="cookie-accept"') && h.includes('id="cookie-reject"'), `${p}: lišta`);
    assert.ok(h.includes('id="cookie-settings"'), `${p}: odkaz v patičce`);
    assert.ok(/<section class="cookie-banner" id="cookie-banner"[^>]* hidden>/.test(h), `${p}: lišta je ve výchozím stavu skrytá`);
    assert.ok(h.includes('/assets/js/cookie.js'), `${p}: skript`);
    assert.match(h, /id="cookie-accept" class="btn btn-ghost"/);
    assert.match(h, /id="cookie-reject" class="btn btn-ghost"/);
  }
});

test('lišta ani pixel nejsou na dotazníku, kvízu, v aplikaci ani na potvrzení rezervace a konceptech', () => {
  for (const p of ['dotaznik/index.html', 'kviz/index.html', 'aplikace/index.html', 'seminare/rezervace/potvrzeni/index.html', 'offline/index.html', 'en/questionnaire/index.html', 'sk/dotaznik/index.html']) {
    if (!existsSync(join(ROOT, p))) continue;
    const h = nacti(p);
    assert.ok(!h.includes('cookie-banner') && !h.includes('cookie.js'), `${p}: nesmí mít lištu ani skript cookies`);
  }
});

test('Meta Pixel není v žádném HTML souboru ani v noscript; ID je jen ve skriptu cookie.js', () => {
  for (const p of ['index.html', 'en/index.html', 'sk/index.html', 'ochrana-osobnich-udaju/index.html']) {
    const h = nacti(p);
    assert.ok(!h.includes(PIXEL) && !/fbevents|facebook\.com\/tr/.test(h), `${p}: pixel nesmí být v HTML`);
  }
  const js = nacti('assets/js/cookie.js');
  assert.ok(js.includes(PIXEL));
  assert.ok(js.includes("fbevents.js"));
});

test('cookie.js: pixel se načte jen po souhlasu a odvolání maže cookies a pixel vypíná', () => {
  const js = nacti('assets/js/cookie.js');
  // nactiPixel se volá jen z uložené kladné volby nebo kliknutí na „Souhlasím“
  const volani = [...js.matchAll(/nactiPixel\(\)/g)].length;
  assert.equal(volani, 3, 'definice + uložená volba + kliknutí');
  assert.match(js, /if \(volba && volba\.marketing\) nactiPixel\(\)/);
  assert.match(js, /ano\.addEventListener\('click', function \(\) \{ zapis\(true\); nactiPixel\(\)/);
  assert.match(js, /fbq\('consent', 'revoke'\)/);
  assert.match(js, /_fbp/);
  assert.match(js, /_fbc/);
  assert.match(js, /365 \* 24/);
});

test('CSP povoluje jen domény Mety potřebné pro pixel a nepovoluje unsafe-inline pro skripty', () => {
  const v = nacti('vercel.json');
  const csp = (v.match(/"key": "Content-Security-Policy", "value": "([^"]*)"/) || [])[1] || '';
  const script = (csp.match(/script-src [^;]*/) || [''])[0];
  assert.ok(script.includes('https://connect.facebook.net') && !script.includes("'unsafe-inline'"));
  assert.ok(/img-src [^;]*https:\/\/www\.facebook\.com/.test(csp));
  assert.ok(/connect-src [^;]*https:\/\/www\.facebook\.com/.test(csp));
});

test('zásady ochrany údajů popisují cookies a Meta Pixel (cs, en, sk) a patička už netvrdí, že cookies nepoužíváme', () => {
  for (const [p, re] of [['ochrana-osobnich-udaju/index.html', /id="cookies"[^>]*>Cookies a Meta Pixel/], ['en/privacy/index.html', /id="cookies"[^>]*>Cookies and Meta Pixel/], ['sk/ochrana-osobnych-udajov/index.html', /id="cookies"[^>]*>Cookies a Meta Pixel/]]) {
    const h = nacti(p);
    assert.match(h, re, `${p}: sekce Cookies a Meta Pixel`);
    assert.ok(/čl\. 6 odst\. 1 písm\. a GDPR|Art\. 6\(1\)\(a\) GDPR|čl\. 6 ods\. 1 písm\. a GDPR/.test(h), `${p}: právní základ souhlas`);
  }
  assert.ok(!/Vlastní cookies ani sledování návštěvnosti nepoužíváme/.test(nacti('index.html')));
  assert.ok(!/Sami vlastní cookies, analytiku/.test(nacti('ochrana-osobnich-udaju/index.html')));
});
