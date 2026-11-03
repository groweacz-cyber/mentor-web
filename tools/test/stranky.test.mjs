// Kontrola vygenerovaných stránek (před spuštěním: npm run gen).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAQ, OBSAH, formatProgramu, vsechnyFaq } from '../content/seminare.mjs';
import { POVAHA_SEMINARE, POVAHA_BLIZKE } from '../../api/_lib/texty.js';
import { nactiData, pripravProgramy } from '../../api/_lib/seminare.js';
import { seminareBody, rezervaceBody } from '../content/seminare.mjs';

const nactiPripraveneProgramy = () => pripravProgramy(nactiData());
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
// Blokové značky se mění na mezeru, vložené (a, strong, span, time) na nic, aby věta „…e-mailem. Zásady…“ zůstala věta.
const BLOKOVE = /<\/?(?:p|div|h[1-6]|li|ul|ol|section|article|aside|main|header|footer|details|summary|dl|dt|dd|br|nav|form|fieldset|legend|label|button|table|tr|td|th)\b[^>]*>/g;
const bezZnacek = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(BLOKOVE, ' ').replace(/<[^>]+>/g, '');
const dekoduj = (t) => t.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const text = (h) => dekoduj(bezZnacek(h)).replace(/\s+/g, ' ').trim();
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const ld = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1])['@graph'] || []);

const PODTITUL_BLIZKE = 'Individuální program tří setkání 1:1. Co lidem s OCD pomáhá, co jim naopak škodí a jak se v tom nezničit.';
const FORMAT_OCD = '5 setkání po 60 minutách, 1× týdně ve čtvrtek v 18:00, online 1:1. Cena 3 590 Kč za celý program. Cena je konečná, nejsem plátce DPH.';
const FORMAT_BLIZKE = '3 setkání po 60 minutách, 1× týdně v úterý v 18:00, online 1:1. Na setkání se může připojit i druhý blízký z vaší domácnosti bez příplatku. Cena 2 190 Kč za celý program. Cena je konečná, nejsem plátce DPH.';
const zalozka = (h, id) => h.match(new RegExp(`<details class="prog-tab" id="${id}"[\\s\\S]*?\\n  </details>`))[0];

test('/seminare: nadpis stránky a dvě rozbalovací záložky s anotacemi v řádku summary', () => {
  const h = nacti('seminare/index.html');
  const m = main(h);
  assert.match(m, /<h1>Online semináře<\/h1>/);
  const tabs = [...m.matchAll(/<details class="prog-tab"([^>]*)>/g)].map((x) => x[1]);
  assert.equal(tabs.length, 2);
  assert.ok(/id="pro-lidi-s-ocd"/.test(tabs[0]) && /id="pro-blizke"/.test(tabs[1]), 'kotvy záložek');
  for (const t of tabs) assert.ok(/name="program"/.test(t), 'jedna skupina (otevřená vždy jen jedna)');
  assert.ok(/\sopen\b/.test(tabs[0]) && !/\sopen\b/.test(tabs[1]), 'otevřená je první záložka');
  const t = text(m);
  assert.ok(t.includes('Cesta s OCD: sebepřijetí, sebevíra a svobodnější život Individuální program 5 setkání · 3 590 Kč'));
  assert.ok(t.includes('Když OCD žije vedle vás: průvodce pro blízké Individuální program 3 setkání · 2 190 Kč'));
  assert.equal(nactiData().programy[0].nazev, 'Cesta s OCD: sebepřijetí, sebevíra a svobodnější život');
  assert.equal(nactiData().programy[1].nazev, 'Když OCD žije vedle vás: průvodce pro blízké');
});

test('/seminare: každá záložka má podtitul, rámeček o povaze semináře a větu o formátu přesně podle zadání', () => {
  const h = nacti('seminare/index.html');
  const programy = nactiData().programy;
  assert.equal(formatProgramu(programy[0]), FORMAT_OCD);
  assert.equal(formatProgramu(programy[1]), FORMAT_BLIZKE);
  const kontrola = [['pro-lidi-s-ocd', 'Individuální program pěti setkání 1:1 podle knihy. Jak jsem na to šel já a co z toho můžeš využít ty.', POVAHA_SEMINARE, FORMAT_OCD], ['pro-blizke', PODTITUL_BLIZKE, POVAHA_BLIZKE, FORMAT_BLIZKE]];
  for (const [id, podtitul, povaha, format] of kontrola) {
    const z = zalozka(h, id);
    const t = text(z);
    assert.ok(t.includes(podtitul), `${id}: podtitul`);
    assert.ok(t.includes(povaha), `${id}: rámeček o povaze semináře`);
    assert.ok(t.includes(format), `${id}: formát`);
    // pořadí: podtitul, rámeček, formát
    assert.ok(z.indexOf('class="lead"') < z.indexOf('class="callout-inline disclaimer sem-box"') && z.indexOf('class="callout-inline disclaimer sem-box"') < z.indexOf('class="sem-format"'), `${id}: pořadí`);
  }
  assert.ok(text(zalozka(h, 'pro-blizke')).includes('Žijete s člověkem, který má OCD, nebo se o někoho takového staráte? Možná máte pocit, že všechno, co zkusíte, nepomáhá nebo situaci dokonce zhoršuje. Dobře míněná pomoc totiž OCD často nechtěně udržuje. Na tomto programu vám ukážu, jak to vypadá zevnitř, co pomáhá a jak si přitom zachovat vlastní život.'));
});

test('/seminare: karty, průběh, pro koho, termíny a tlačítka rezervace v obou záložkách', () => {
  const h = nacti('seminare/index.html');
  const ocd = text(zalozka(h, 'pro-lidi-s-ocd'));
  const blizke = text(zalozka(h, 'pro-blizke'));
  for (const [id, t] of [['pro-lidi-s-ocd', ocd], ['pro-blizke', blizke]]) {
    const o = OBSAH[id];
    assert.ok(t.includes(o.kartyNadpis), id);
    for (const [nazev, popis] of o.karty) { assert.ok(t.includes(nazev), nazev); assert.ok(t.includes(popis), popis); }
    for (const r of o.jak) assert.ok(t.includes(r), r);
    assert.ok(t.includes(o.proKoho));
    assert.ok(t.includes('Žádný termín mi nevyhovuje'));
  }
  assert.equal(OBSAH['pro-lidi-s-ocd'].karty.length, 5);
  assert.equal(OBSAH['pro-blizke'].karty.length, 3);
  assert.ok(h.includes('href="/ebook"'));
  assert.ok(!blizke.includes('Program vychází z knihy'));
  for (const d of ['čtvrtek 3. 12. 2026 v 18:00', 'čtvrtek 7. 1. 2027 v 18:00', 'čtvrtek 14. 1. 2027 v 18:00', 'čtvrtek 21. 1. 2027 v 18:00', 'čtvrtek 18. 2. 2027 v 18:00']) assert.ok(ocd.includes(d), d);
  for (const d of ['úterý 1. 12. 2026 v 18:00', 'úterý 8. 12. 2026 v 18:00', 'úterý 15. 12. 2026 v 18:00', 'úterý 12. 1. 2027 v 18:00', 'úterý 19. 1. 2027 v 18:00', 'úterý 26. 1. 2027 v 18:00']) assert.ok(blizke.includes(d), d);
  const t = text(main(h));
  assert.ok(!t.includes('24. 12. 2026') && !t.includes('31. 12. 2026'), 'vynechaná data se nezobrazují jako termíny');
  assert.equal([...h.matchAll(/mailto:ocdmentor@gmail\.com\?subject=Dotaz%20na%20dal%C5%A1%C3%AD%20term%C3%ADn/g)].length, 2, 'odkaz „Žádný termín mi nevyhovuje“ pod každým programem');
  assert.ok(zalozka(h, 'pro-lidi-s-ocd').includes('href="/seminare/rezervace?program=pro-lidi-s-ocd"'));
  assert.ok(zalozka(h, 'pro-blizke').includes('href="/seminare/rezervace?program=pro-blizke"'));
  assert.ok(zalozka(h, 'pro-blizke').includes('href="/seminare/rezervace?program=pro-blizke&amp;beh=blizke-beh-1"'));
  assert.ok(h.includes('href="/pro-blizke"'), 'odkaz na stránku Pro blízké');
});

test('/seminare: společné FAQ pod záložkami, konzultace zdarma a komunikace', () => {
  const h = nacti('seminare/index.html');
  const m = main(h);
  assert.ok(m.indexOf('</details>\n</section>\n\n<section class="wrap block" id="spojeni">') > 0 || m.indexOf('id="spojeni"') > m.lastIndexOf('data-program-tab'));
  assert.ok(m.indexOf('id="faq"') > m.indexOf('id="spojeni"') && m.indexOf('id="konzultace"') > m.indexOf('id="faq"'));
  assert.ok(text(m).includes('Časté otázky k oběma programům'));
  assert.ok(text(m).includes('Chcete si nejdřív promluvit? Rezervujte si úvodní konzultaci zdarma (20 minut).'));
  assert.ok(/reservanto-widget/.test(m.slice(m.indexOf('id="konzultace"'))), 'existující tlačítko Reservanto');
  assert.ok(m.includes('id="spojeni"') && m.includes('Google Meet') && m.includes('WhatsApp'));
});

test('/seminare: FAQ ve viditelném HTML (záložky i společná část) a ve strukturovaných datech mají shodné texty bez duplicit', () => {
  const h = nacti('seminare/index.html');
  const visible = [...h.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)].map((m) => ({ q: text(m[1]), a: text(m[2]) }));
  const faq = ld(h).find((n) => n['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage v JSON-LD');
  const strukturovana = faq.mainEntity.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }));
  assert.equal(visible.length, 5 + FAQ.length);
  assert.equal(new Set(visible.map((v) => v.q)).size, visible.length, 'žádné duplicitní otázky');
  assert.deepEqual(strukturovana, visible);
  const spolecne = [...vsechnyFaq(nactiPripraveneProgramy())].map((f) => ({ q: f.q, a: f.a }));
  assert.deepEqual(visible, spolecne);
  for (const q of ['Jak probíhá setkání?', 'Mohu setkání přesunout?', 'Jak se platí?', 'Co je v ceně?', 'Čím se liší program od jednotlivých sezení?', 'Konají se setkání i o svátcích?', 'Co když se zhorším?']) assert.ok(visible.some((v) => v.q === q), q);
  const presun = visible.find((v) => v.q === 'Mohu setkání přesunout?').a;
  assert.equal(presun, 'Ano, nejpozději 24 hodin předem po domluvě e-mailem. U programu pěti setkání nejvýše dvakrát, u programu tří setkání nejvýše jednou. Neomluvená neúčast se počítá jako uskutečněné setkání.');
  assert.equal(visible.find((v) => v.q === 'Konají se setkání i o svátcích?').a, 'Ne, 24. a 31. prosince se nekonají, program se o tyto týdny posune.');
  assert.equal(visible.find((v) => v.q === 'Co je v ceně?').a, 'Všechna setkání daného programu. Jiné poplatky nejsou.');
  for (const q of ['Musí můj blízký o semináři vědět?', 'Můžete mi říct, jestli má můj blízký OCD?', 'Naučím se, jak blízkého léčit?', 'Mohu přijít s partnerem nebo jiným blízkým?', 'Co když je můj blízký v akutní krizi?']) assert.ok(visible.some((v) => v.q === q), q);
  // JSON-LD: platný JSON, jen FAQPage, žádné lékařské typy ani hodnocení
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) assert.doesNotThrow(() => JSON.parse(m[1]));
  const typy = ld(h).map((n) => n['@type']);
  assert.ok(typy.includes('FAQPage'));
  assert.ok(!/Medical|Review|Rating/.test(JSON.stringify(ld(h))), 'žádné medicínské typy ani hodnocení');
});

test('stránky seminářů nemají placeholdery, štítky koncept ani TODO', () => {
  for (const p of ['seminare/index.html', 'seminare/rezervace/index.html', 'seminare/rezervace/potvrzeni/index.html', 'obchodni-podminky/index.html', 'ochrana-osobnich-udaju/index.html', 'ebook/index.html', 'pro-blizke/index.html']) {
    const h = nacti(p);
    assert.ok(!/class="placeholder"|draft-badge|TODO|\[[A-ZĚŠČŘŽÝÁÍÉ][^\]]{3,}\]/.test(h), `${p}: placeholder, koncept nebo TODO`);
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
  assert.ok(t.includes('Cesta s OCD: sebepřijetí, sebevíra a svobodnější život Individuální program 5 setkání · 3 590 Kč'));
  assert.ok(t.includes('Když OCD žije vedle vás: průvodce pro blízké Individuální program 3 setkání · 2 190 Kč'));
  const checkboxy = [...m.matchAll(/<input type="checkbox"[^>]*>/g)].map((x) => x[0]);
  assert.equal(checkboxy.length, 6, 'tři souhlasy pro každý program');
  for (const c of checkboxy) assert.ok(!/\schecked\b/.test(c), 'souhlas není předvyplněný');
  assert.ok(m.includes('name="web"') && m.includes('class="hp"'), 'honeypot');
  assert.ok(!/<form[^>]*\saction=/.test(m), 'formulář neodesílá bez JavaScriptu na jinou adresu');
  assert.ok(!/<form[^>]*method="get"/i.test(m));
  assert.ok(t.includes('Souhlasím se zpracováním jména, e-mailu a telefonního čísla za účelem rezervace, organizace programu a spojení se mnou. Chápu, že už samotná účast na semináři o OCD může vypovídat o mém zdravotním stavu, a souhlasím se zpracováním i této informace. Souhlas mohu kdykoli odvolat e-mailem. Zásady ochrany osobních údajů.'));
  assert.ok(t.includes('Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii ani zdravotní službu.'));
  assert.ok(t.includes('Souhlasím se zpracováním jména, e-mailu a telefonního čísla za účelem rezervace, organizace programu a spojení se mnou. Chápu, že už samotná účast na semináři o OCD může vypovídat o zdravotním stavu účastníka nebo jeho blízkého, a souhlasím se zpracováním i této informace o sobě. Souhlas mohu kdykoli odvolat e-mailem. Zásady ochrany osobních údajů.'));
  assert.ok(t.includes('Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii, rodinnou terapii ani zdravotní službu, a že na semináři nebudu sdílet identifikující údaje o svém blízkém (jména, diagnózy, podrobnosti).'));
  assert.equal(t.split('Souhlasím s obchodními podmínkami.').length - 1, 2);
  assert.ok(m.includes('href="/ochrana-osobnich-udaju"') && m.includes('href="/obchodni-podminky"'));
  // každý program má v rezervaci svůj rámeček o povaze, formát a výběr běhu
  const blok = (id) => m.match(new RegExp(`<div class="program-blok" id="blok-${id}"[\\s\\S]*?</fieldset>\\s*</div>`))[0];
  assert.ok(text(blok('pro-lidi-s-ocd')).includes(POVAHA_SEMINARE) && text(blok('pro-lidi-s-ocd')).includes(FORMAT_OCD));
  assert.ok(text(blok('pro-blizke')).includes(POVAHA_BLIZKE) && text(blok('pro-blizke')).includes(FORMAT_BLIZKE));
  assert.equal([...blok('pro-lidi-s-ocd').matchAll(/<input type="radio"[^>]*name="beh"/g)].length, 2);
  assert.equal([...blok('pro-blizke').matchAll(/<input type="radio"[^>]*name="beh"/g)].length, 2);
  assert.ok(/class="program-blok"[^>]*\shidden/.test(m), 'bloky programů se zobrazí až po volbě programu');
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
  assert.ok(t.includes('platná od 1. 11. 2026, naposledy upraveno 3. 11. 2026'));
  assert.ok(t.includes('Část B: Online semináře (individuální programy)'));
  assert.ok(t.includes(POVAHA_SEMINARE));
  assert.ok(t.includes(POVAHA_BLIZKE));
  assert.ok(t.includes('Program (a), pro lidi s OCD:') && t.includes('Program (b), pro blízké:'));
  assert.ok(t.includes('(a) individuální program pěti online setkání po 60 minutách, 1× týdně ve čtvrtek v 18:00, cena 3 590 Kč;'));
  assert.ok(t.includes('(b) individuální program tří online setkání po 60 minutách, 1× týdně v úterý v 18:00, cena 2 190 Kč, určený blízkým lidí s OCD.'));
  assert.ok(t.includes('Obě ceny jsou konečné, prodejce není plátcem DPH.'));
  assert.ok(t.includes('U programu tří setkání se na setkání může připojit jeden další člověk z domácnosti účastníka bez příplatku. Jeho osobní údaje prodejce nezpracovává. Účastník zajistí, že se připojí s jeho vědomím. Účastníci nesdílejí identifikující údaje o třetích osobách (jména, diagnózy, podrobnosti).'));
  assert.ok(t.includes('Setkání se nekonají 24. a 31. prosince, program se o tyto týdny posune.'));
  assert.ok(t.includes('Setkání lze přesunout zdarma nejpozději 24 hodin předem po domluvě e-mailem, u programu pěti setkání nejvýše dvakrát, u programu tří setkání nejvýše jednou.'));
  for (const veta of [
    'Smlouva vzniká odesláním rezervace. Cena se hradí bankovním převodem s uvedeným variabilním symbolem do 3 dnů od rezervace.',
    'Neomluvená neúčast nebo přesun později než 24 hodin předem se počítá jako uskutečněné setkání.',
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
  const sem = seminareBody({ data, programy, now: ted });
  const run = (html, id) => html.match(new RegExp(`<article class="run" data-beh="${id}"[\\s\\S]*?</article>`))[0];
  assert.match(run(sem, 'beh-1'), /data-stav="obsazeno"[\s\S]*Obsazeno/);
  assert.match(run(sem, 'beh-2'), /data-stav="uzavreno"[\s\S]*Uzavřeno/);
  assert.ok(!/Rezervovat místo/.test(run(sem, 'beh-1')) && !/Rezervovat místo/.test(run(sem, 'beh-2')));
  // druhý program: běh 1 (od 1. 12. 2026) je 17. 1. 2027 už po začátku, tedy uzavřený; běh 2 (od 12. 1.) také
  assert.match(run(sem, 'blizke-beh-1'), /data-stav="uzavreno"/);
  assert.match(run(sem, 'blizke-beh-2'), /data-stav="uzavreno"/);
  const rez = rezervaceBody({ data, programy, now: ted });
  assert.equal([...rez.matchAll(/<input type="radio"[^>]*name="beh"[^>]*disabled/g)].length, 4, 'všechny čtyři běhy jsou v rezervaci neaktivní');
  data.programy[1].behy[0].stav = 'pripravujeme';
  assert.match(seminareBody({ data, programy: pripravProgramy(data), now: new Date('2026-10-01T10:00:00Z') }), /Připravujeme/);
  // otevřený běh má tlačítko a odkaz s předvybraným programem a během
  const dnes = nactiData();
  const otevreny = seminareBody({ data: dnes, programy: pripravProgramy(dnes), now: new Date('2026-10-01T10:00:00Z') });
  assert.ok(otevreny.includes('href="/seminare/rezervace?program=pro-lidi-s-ocd&amp;beh=beh-1"') && otevreny.includes('Rezervovat místo'));
  // když není otevřený žádný běh programu, obecné tlačítko ani odkaz na rezervaci v jeho záložce nejsou
  const zadny = nactiData();
  zadny.programy[1].behy.forEach((b) => { b.stav = 'obsazeno'; });
  const bez = seminareBody({ data: zadny, programy: pripravProgramy(zadny), now: new Date('2026-10-01T10:00:00Z') });
  const zalozkaBlizke = bez.match(/<details class="prog-tab" id="pro-blizke"[\s\S]*?\n  <\/details>/)[0];
  assert.ok(!/Rezervovat místo/.test(zalozkaBlizke));
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
  assert.ok(m.includes('href="/seminare#pro-blizke"'));
  assert.ok(/reservanto-widget[^>]*data-text="Úvodní konzultace zdarma"/.test(m), 'tlačítko úvodní konzultace zdarma (existující Reservanto)');
  assert.ok(/112/.test(t) && /116 123/.test(t), 'krizové kontakty');
  assert.ok(t.indexOf('Zobrazit seminář pro blízké') < t.indexOf(POVAHA_BLIZKE), 'rámeček je pod tlačítky');
  const sitemap = nacti('sitemap.xml');
  assert.ok(sitemap.includes('https://ocdmentor.cz/pro-blizke<'));
  assert.ok(nacti('seminare/index.html').includes('href="/pro-blizke"'));
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
