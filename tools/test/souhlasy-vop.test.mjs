// Souhlasy před rezervací, jednotné storno, obchodní podmínky (mlčenlivost, krize, 18+, účinnost, historie), placeholdery a kotva #hranice.
// Před spuštěním: npm run gen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
const plain = (p) => nacti(p).replace(/<script[\s\S]*?<\/script>/g, '').replace(/<\/?span[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

const STORNO = 'Zrušení nebo přesun nejpozději 24 hodin předem je bezplatný. Při pozdějším zrušení nebo nedostavení se bez omluvy má poskytovatel nárok na přiměřenou kompenzaci za rezervovaný čas ve výši [DOPLNIT: např. 50 % ceny sezení]. Zbytek ceny se vrátí do 14 dnů. Při nemoci nebo z vážných důvodů (včetně akutního zhoršení zdravotního stavu) lze setkání přesunout bez poplatku i po lhůtě. Tím není dotčeno právo spotřebitele na odstoupení od smlouvy.';

test('souhlasy před rezervací: dvě samostatná nepředzaškrtnutá políčka, tlačítko neaktivní, skript vyžaduje obě a nic neukládá', () => {
  for (const p of ['index.html', 'jak-to-probiha/index.html', 'en/index.html', 'sk/index.html']) {
    const h = nacti(p);
    const a = h.match(/<input type="checkbox" id="rsv-consent-vop"[^>]*>/);
    const b = h.match(/<input type="checkbox" id="rsv-consent-start"[^>]*>/);
    assert.ok(a && b, `${p}: obě políčka`);
    for (const x of [a[0], b[0]]) assert.ok(!/\schecked\b/.test(x), `${p}: nesmí být předzaškrtnuté`);
    assert.ok(/id="rsv-confirm"[^>]*disabled/.test(h), `${p}: tlačítko je neaktivní`);
    assert.ok(!h.includes('id="rsv-consent"'), `${p}: původní jediné políčko je pryč`);
  }
  const h = nacti('index.html');
  assert.ok(h.includes('Seznámil/a jsem se s'));
  assert.ok(h.includes('Výslovně žádám, aby poskytovatel zahájil poskytování mnou rezervované služby před uplynutím 14denní lhůty pro odstoupení od smlouvy. Beru na vědomí, že pokud od smlouvy odstoupím, uhradím poměrnou část ceny za již poskytnuté plnění, a že po úplném poskytnutí služby právo na odstoupení zaniká.'));
  assert.ok(h.includes('>Pokračovat k rezervaci<') && !h.includes('Souhlasím a pokračovat'));
  const js = nacti('assets/js/rezervace-souhlas.js');
  assert.match(js, /confirm\.disabled = !\(consentVop\.checked && consentStart\.checked\)/);
  assert.ok(!/localStorage|sessionStorage|document\.cookie/.test(js), 'souhlas se neukládá');
});

test('storno: jednotné znění v FAQ, semináři a v obchodních podmínkách A i B; staré formulace jsou pryč', () => {
  for (const p of ['jak-to-probiha/index.html', 'seminare/cesta-s-ocd/index.html', 'seminare/pro-blizke/index.html']) assert.ok(plain(p).includes(STORNO), p);
  assert.equal(plain('obchodni-podminky/index.html').split(STORNO).length - 1, 2, 'VOP: část A i část B');
  for (const p of ['jak-to-probiha/index.html', 'seminare/cesta-s-ocd/index.html', 'seminare/pro-blizke/index.html', 'obchodni-podminky/index.html', 'seminare/rezervace/index.html']) {
    assert.ok(!/ponechat uhrazenou cenu|počítá jako uskutečněné setkání/.test(plain(p)), `${p}: stará formulace`);
  }
});

test('obchodní podmínky: mlčenlivost, krize, 18+, živnost, účinnost, historie; placeholdery [DOPLNIT: …]', () => {
  const t = plain('obchodni-podminky/index.html');
  for (const x of ['Poskytovatel zachovává mlčenlivost o všem, co se klient během spolupráce svěří.', 'Pokud klient během sezení uvede akutní krizi nebo myšlenky na sebepoškození', 'Služba je určena osobám starším 18 let.', 'Živnostenské oprávnění:', 'Smlouva vzniká okamžikem potvrzení rezervace v Reservantu.', 'Historie verzí', 'v mezích uvedených v bodě 2 těchto podmínek']) assert.ok(t.includes(x), x);
  assert.ok(!t.includes('v mezích popsaných na stránce'));
  assert.ok(nacti('obchodni-podminky/index.html').includes('/assets/vop/obchodni-podminky-2026-11-09.html'));
  assert.ok(existsSync(join(ROOT, 'assets/vop/obchodni-podminky-2026-11-09.html')));
  assert.ok(t.includes('[DOPLNIT: datum účinnosti]') && t.includes('[DOPLNIT: telefon]') && t.includes('[DOPLNIT: předmět podnikání]'));
  assert.ok(!/účinná od 1\. 12\. 2026|naposledy upraveno 3\. 11\. 2026/.test(t), 'dvě různá data účinnosti');
  assert.ok(plain('ochrana-osobnich-udaju/index.html').includes('výslovného souhlasu (čl. 9 odst. 2 písm. a) GDPR)'));
  assert.ok(plain('ochrana-osobnich-udaju/index.html').includes('WhatsApp ani e-mail nejsou vhodné pro přenos citlivých údajů o zdraví'));
});

test('rezervační formulář semináře: čtyři souhlasy včetně výslovné žádosti o zahájení služby; server je vyžaduje', () => {
  const h = nacti('seminare/rezervace/index.html');
  assert.equal((h.match(/name="souhlasZahajeni"/g) || []).length, 2, 'u každého programu');
  assert.ok(h.includes('Výslovně žádám, aby poskytovatel zahájil poskytování'));
  assert.match(nacti('api/_lib/validace.js'), /'souhlasZahajeni'/);
  assert.match(nacti('assets/js/rezervace.js'), /souhlasZahajeni/);
});

test('o mně: kotva #hranice v CS, EN i SK; datum „naposledy zkontrolován“ je pryč z celého webu', () => {
  for (const p of ['o-mne/index.html', 'en/about/index.html', 'sk/o-mne/index.html']) assert.ok(/<h2 id="hranice"/.test(nacti(p)), `${p}: id=hranice`);
  for (const p of ['pro-koho/index.html', 'en/who-its-for/index.html', 'sk/pre-koho/index.html', 'index.html']) assert.ok(!/naposledy zkontrolov|last checked|naposledy skontrol/i.test(nacti(p)), p);
});
