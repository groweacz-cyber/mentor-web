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

const STORNO = 'Zrušení nebo přesun nejpozději 24 hodin předem je bezplatný. Při pozdějším zrušení nebo nedostavení se bez omluvy má poskytovatel nárok na přiměřenou kompenzaci za rezervovaný čas ve výši 50 % ceny sezení. Zbytek ceny se vrátí do 14 dnů. Při nemoci nebo z vážných důvodů (včetně akutního zhoršení zdravotního stavu) lze setkání přesunout bez poplatku i po lhůtě. Tím není dotčeno právo spotřebitele na odstoupení od smlouvy.';

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

test('obchodní podmínky: mlčenlivost, krize, 18+, IČO, telefon, účinnost 23. 11. 2026, historie; bez zástupných textů', () => {
  const t = plain('obchodni-podminky/index.html');
  for (const x of ['Poskytovatel zachovává mlčenlivost o všem, co se klient během spolupráce svěří.', 'Pokud klient během sezení uvede akutní krizi nebo myšlenky na sebepoškození', 'Služba je určena osobám starším 18 let.', 'IČ 87690772', 'telefon +420 720 385 282', 'Smlouva vzniká okamžikem potvrzení rezervace v Reservantu.', 'Historie verzí', 'v mezích uvedených v bodě 2 těchto podmínek']) assert.ok(t.includes(x), x);
  assert.ok(!t.includes('v mezích popsaných na stránce'));
  assert.ok(nacti('obchodni-podminky/index.html').includes('/assets/vop/obchodni-podminky-2026-11-09.html'));
  assert.ok(existsSync(join(ROOT, 'assets/vop/obchodni-podminky-2026-11-09.html')));
  assert.ok(t.includes('jsou účinné od 23. 11. 2026') && t.includes('nabývá účinnosti dne 23. 11. 2026') && t.includes('Část B je účinná od 23. 11. 2026'));
  assert.ok(!/DOPLNIT/.test(nacti('obchodni-podminky/index.html') + nacti('ochrana-osobnich-udaju/index.html') + nacti('jak-to-probiha/index.html')), 'žádné zástupné texty');
  assert.ok(plain('obchodni-podminky/index.html').split('Magistrát města České Budějovice').length - 1 === 2, 'živnostenský úřad v části A i B');
  assert.ok(!/účinná od 1\. 12\. 2026|naposledy upraveno 3\. 11\. 2026/.test(t), 'dvě různá data účinnosti');
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

test('zásady ochrany údajů: výslovný souhlas, cookies, doba uchování, Google Meet', () => {
  const p = plain('ochrana-osobnich-udaju/index.html');
  assert.ok(p.includes('zpracovávám na základě vašeho výslovného souhlasu (čl. 9 odst. 2 písm. a) GDPR), který uděluji odesláním zprávy po přečtení tohoto upozornění. Souhlas můžete kdykoli odvolat.'));
  assert.ok(!p.includes('který dáváte najevo tím'));
  assert.ok(p.includes('Web používá cookies jen v nezbytném rozsahu. Cookies pro měření reklamy (Meta Pixel) zapínám jen s vaším souhlasem. Rezervační systém Reservanto může při otevření nastavit vlastní cookies podle svých podmínek.'));
  assert.ok(!p.includes('Web funguje bez cookies a bez jakéhokoli sledování'));
  assert.ok(p.includes('a poté 1 rok po skončení spolupráce'));
  assert.ok(p.includes('Videohovory probíhají přes Google Meet; nahrávání neprovádím.'));
});

test('věková hranice 18+ na všech uvedených stránkách (CS, EN, SK)', () => {
  const cs = 'Služba je určena osobám starším 18 let.';
  for (const p of ['pro-koho/index.html', 'jak-to-probiha/index.html', 'kontakt/index.html', 'seminare/index.html', 'seminare/cesta-s-ocd/index.html', 'seminare/pro-blizke/index.html', 'obchodni-podminky/index.html']) assert.ok(plain(p).includes(cs), p);
  for (const p of ['en/who-its-for/index.html', 'en/how-it-works/index.html', 'en/contact/index.html', 'en/seminars/index.html', 'en/terms/index.html']) assert.ok(plain(p).includes('The service is intended for persons over 18 years of age.'), p);
  for (const p of ['sk/pre-koho/index.html', 'sk/ako-to-prebieha/index.html', 'sk/kontakt/index.html', 'sk/obchodne-podmienky/index.html']) assert.ok(plain(p).includes('Služba je určená osobám staršie ako 18 rokov.') || plain(p).includes('Služba je určená osobám starším ako 18 rokov.'), p);
});

test('seminář pro blízké: osobní zkušenost a upozornění místo hotových vět; změkčená formulace', () => {
  const p = plain('seminare/pro-blizke/index.html');
  assert.ok(p.includes('Mně osobně pomáhalo, když mi blízký místo ujištění dal najevo'));
  assert.ok(p.includes('Nejde o návod ani o doporučení pro každého. Pokud je blízký v akutní krizi, volejte 112, 155 nebo 116 123.'));
  assert.ok(!p.includes('Odpověď ti teď dávat nebudu'));
  assert.ok(p.includes('Dobře míněná pomoc může někdy OCD nechtěně udržovat.') && !p.includes('často nechtěně udržuje'));
});

test('upozornění u aplikace je viditelné v aplikaci, rozcestníku „Více“ i na úvodní stránce (CS, EN, SK)', () => {
  const t = 'Aplikace není zdravotnický prostředek, není terapie ani diagnóza a nenahrazuje odbornou péči.';
  for (const p of ['aplikace/index.html', 'aplikace/vice/index.html', 'aplikace/denik/index.html', 'index.html']) assert.ok(plain(p).includes(t), p);
  for (const p of ['en/app/index.html', 'en/index.html']) assert.ok(plain(p).includes('The app is not a medical device, is not therapy or a diagnosis, and does not replace professional care.'), p);
  for (const p of ['sk/aplikacia/index.html', 'sk/index.html']) assert.ok(plain(p).includes('Aplikácia nie je zdravotnícka pomôcka, nie je terapia ani diagnóza a nenahrádza odbornú starostlivosť.'), p);
  assert.match(nacti('assets/js/app/vice.js'), /Aplikace není zdravotnický prostředek/);
  assert.match(nacti('assets/js/en/app/vice.js'), /not a medical device/);
});
