// Kontrola vygenerovaných stránek (před spuštěním: npm run gen).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAQ, KARTY, JAK_PROBIHAJI, PRO_KOHO, formatProgramu, NADPIS, PODTITUL } from '../content/seminare.mjs';
import { POVAHA_SEMINARE } from '../../api/_lib/texty.js';
import { nactiData, pripravBehy } from '../../api/_lib/seminare.js';
import { seminareBody, rezervaceBody } from '../content/seminare.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
// Blokové značky se mění na mezeru, vložené (a, strong, span, time) na nic, aby věta „…e-mailem. Zásady…“ zůstala věta.
const BLOKOVE = /<\/?(?:p|div|h[1-6]|li|ul|ol|section|article|aside|main|header|footer|details|summary|dl|dt|dd|br|nav|form|fieldset|legend|label|button|table|tr|td|th)\b[^>]*>/g;
const bezZnacek = (h) => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(BLOKOVE, ' ').replace(/<[^>]+>/g, '');
const dekoduj = (t) => t.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const text = (h) => dekoduj(bezZnacek(h)).replace(/\s+/g, ' ').trim();
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const ld = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1])['@graph'] || []);

test('/seminare: nadpis, podtitul, rámeček a formát přesně podle zadání', () => {
  const h = nacti('seminare/index.html');
  const t = text(main(h));
  assert.ok(t.includes('Cesta s OCD: sebepřijetí, sebevíra a svobodnější život'));
  assert.equal(NADPIS, 'Cesta s OCD: sebepřijetí, sebevíra a svobodnější život');
  assert.ok(t.includes('Individuální program pěti setkání 1:1 podle knihy. Jak jsem na to šel já a co z toho můžeš využít ty.'));
  assert.ok(t.includes(POVAHA_SEMINARE), 'rámeček s textem o povaze semináře');
  assert.ok(t.includes('5 setkání po 60 minutách, 1× týdně ve čtvrtek v 18:00, online 1:1. Cena 3 590 Kč za celý program. Cena je konečná, nejsem plátce DPH.'));
  assert.equal(formatProgramu(nactiData()), '5 setkání po 60 minutách, 1× týdně ve čtvrtek v 18:00, online 1:1. Cena 3 590 Kč za celý program. Cena je konečná, nejsem plátce DPH.');
  assert.ok(PODTITUL.length > 0);
  // rámeček je hned pod nadpisem
  assert.ok(h.indexOf('class="callout-inline disclaimer sem-box"') > h.indexOf('<h1>') && h.indexOf('class="callout-inline disclaimer sem-box"') < h.indexOf('class="sem-format"'));
});

test('/seminare: pět karet, popis průběhu, pro koho, odkaz na knihu, termíny v HTML', () => {
  const t = text(main(nacti('seminare/index.html')));
  assert.equal(KARTY.length, 5);
  for (const [nazev, popis] of KARTY) { assert.ok(t.includes(nazev), nazev); assert.ok(t.includes(popis), popis); }
  for (const r of JAK_PROBIHAJI) assert.ok(t.includes(r), r);
  assert.ok(t.includes(PRO_KOHO));
  assert.ok(nacti('seminare/index.html').includes('href="/ebook"'));
  for (const d of ['čtvrtek 3. 12. 2026 v 18:00', 'čtvrtek 10. 12. 2026 v 18:00', 'čtvrtek 17. 12. 2026 v 18:00', 'čtvrtek 7. 1. 2027 v 18:00', 'čtvrtek 14. 1. 2027 v 18:00', 'čtvrtek 21. 1. 2027 v 18:00', 'čtvrtek 18. 2. 2027 v 18:00']) assert.ok(t.includes(d), d);
  assert.ok(!t.includes('24. 12. 2026') && !t.includes('31. 12. 2026'), 'vynechaná data se nezobrazují jako termíny');
  assert.ok(nacti('seminare/index.html').includes('mailto:ocdmentor@gmail.com?subject=Dotaz%20na%20dal%C5%A1%C3%AD%20term%C3%ADn'));
});

test('/seminare: FAQ ve viditelném HTML a ve strukturovaných datech mají shodné texty', () => {
  const h = nacti('seminare/index.html');
  const visible = [...h.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g)].map((m) => ({ q: text(m[1]), a: text(m[2]) }));
  const faq = ld(h).find((n) => n['@type'] === 'FAQPage');
  assert.ok(faq, 'FAQPage v JSON-LD');
  const strukturovana = faq.mainEntity.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }));
  assert.equal(visible.length, 8);
  assert.deepEqual(strukturovana, visible);
  assert.deepEqual(visible, FAQ.map((f) => ({ q: f.q, a: f.a })));
});

test('stránky seminářů nemají placeholdery, štítky koncept ani TODO', () => {
  for (const p of ['seminare/index.html', 'seminare/rezervace/index.html', 'seminare/rezervace/potvrzeni/index.html', 'obchodni-podminky/index.html', 'ochrana-osobnich-udaju/index.html', 'ebook/index.html']) {
    const h = nacti(p);
    assert.ok(!/class="placeholder"|draft-badge|TODO|\[[A-ZĚŠČŘŽÝÁÍÉ][^\]]{3,}\]/.test(h), `${p}: placeholder, koncept nebo TODO`);
  }
});

test('/seminare/rezervace: pole, nepředvyplněné souhlasy, honeypot, přesné texty souhlasů', () => {
  const h = nacti('seminare/rezervace/index.html');
  const m = main(h);
  for (const id of ['rez-jmeno', 'rez-prijmeni', 'rez-email', 'rez-email2']) assert.ok(m.includes(`id="${id}"`), id);
  assert.ok(!/id="rez-(telefon|duvod)/.test(m), 'žádný telefon ani důvod účasti');
  const checkboxy = [...m.matchAll(/<input type="checkbox"[^>]*>/g)].map((x) => x[0]);
  assert.equal(checkboxy.length, 3);
  for (const c of checkboxy) assert.ok(!/\schecked\b/.test(c), 'souhlas není předvyplněný');
  assert.ok(m.includes('name="web"') && m.includes('class="hp"'), 'honeypot');
  assert.ok(!/<form[^>]*\saction=/.test(m), 'formulář neodesílá bez JavaScriptu na jinou adresu');
  assert.ok(!/<form[^>]*method="get"/i.test(m));
  const t = text(m);
  assert.ok(t.includes('Souhlasím se zpracováním jména a e-mailu za účelem rezervace a organizace programu. Chápu, že už samotná účast na semináři o OCD může vypovídat o mém zdravotním stavu, a souhlasím se zpracováním i této informace. Souhlas mohu kdykoli odvolat e-mailem. Zásady ochrany osobních údajů.'));
  assert.ok(t.includes('Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii ani zdravotní službu.'));
  assert.ok(t.includes('Souhlasím s obchodními podmínkami.'));
  assert.ok(m.includes('href="/ochrana-osobnich-udaju"') && m.includes('href="/obchodni-podminky"'));
  assert.ok(t.includes(POVAHA_SEMINARE));
});

test('potvrzovací stránka je noindex a bez osobních údajů v URL', () => {
  const h = nacti('seminare/rezervace/potvrzeni/index.html');
  assert.match(h, /<meta name="robots" content="noindex, nofollow">/);
  assert.ok(!/canonical/.test(h));
  const t = text(main(h));
  assert.ok(t.includes('Místo je pro vás rezervované do splatnosti. Po připsání platby vám pošlu odkaz na videohovor. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.'));
  assert.ok(t.includes('Přidat do kalendáře (.ics)') && t.includes('Kopírovat'));
});

test('menu: jen „Online semináře“, „Online kurz“ v menu není; /kurz je noindex a mimo sitemapu', () => {
  const h = nacti('index.html');
  const nav = h.slice(h.indexOf('<nav aria-label="Hlavní navigace">'), h.indexOf('</nav>'));
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

test('obchodní podmínky obsahují část B přesně podle zadání, zásady ochrany údajů uvádějí Vercel a Google', () => {
  const t = text(main(nacti('obchodni-podminky/index.html')));
  assert.ok(t.includes('platná od 1. 11. 2026'));
  assert.ok(t.includes(POVAHA_SEMINARE));
  for (const veta of [
    'Smlouva vzniká odesláním rezervace. Cena se hradí bankovním převodem s uvedeným variabilním symbolem do 3 dnů od rezervace.',
    'Neomluvená neúčast nebo přesun později než 24 hodin předem se počítá jako uskutečněné setkání.',
    'Zbývající část se vrací do 14 dnů stejným způsobem, jakým byla platba přijata.',
    'Výhrady k poskytnuté službě lze uplatnit e-mailem, prodejce odpoví do 30 dnů.',
    'Vztahy se řídí právem České republiky.',
  ]) assert.ok(t.includes(veta), veta);
  const p = text(main(nacti('ochrana-osobnich-udaju/index.html')));
  for (const k of ['Vercel', 'Google', 'čl. 9 odst. 2 písm. a', 'čl. 6 odst. 1 písm. c', '1 rok po skončení programu', '30 dnů po skončení programu', 'Úřadu pro ochranu osobních údajů']) assert.ok(p.includes(k), k);
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
  for (const k of ['BANK_ACCOUNT', 'BANK_ACCOUNT_HOLDER', 'SELLER_ICO', 'NOTIFY_EMAIL', 'MAIL_FROM', 'SMTP_PASSWORD']) assert.match(ex, new RegExp(`^${k}=$`, 'm'), `${k} bez hodnoty`);
});

test('stavy běhů se vykreslí správně: Obsazeno, Uzavřeno, Připravujeme, bez tlačítka a s neaktivním výběrem', () => {
  const data = nactiData();
  data.behy[0].stav = 'obsazeno';
  const behy = pripravBehy(data);
  const ted = new Date('2027-01-17T12:00:00Z'); // běh 2 je od 17. 1. 2027 uzavřený (4 dny před 21. 1.)
  const sem = seminareBody({ data, behy, now: ted });
  const run = (html, id) => html.match(new RegExp(`<article class="run" data-beh="${id}"[\\s\\S]*?</article>`))[0];
  assert.match(run(sem, 'beh-1'), /data-stav="obsazeno"[\s\S]*Obsazeno/);
  assert.match(run(sem, 'beh-2'), /data-stav="uzavreno"[\s\S]*Uzavřeno/);
  assert.ok(!/Rezervovat místo/.test(run(sem, 'beh-1')) && !/Rezervovat místo/.test(run(sem, 'beh-2')));
  const rez = rezervaceBody({ data, behy, now: ted });
  assert.equal([...rez.matchAll(/<input type="radio"[^>]*disabled/g)].length, 2, 'oba běhy jsou v rezervaci neaktivní');
  data.behy[0].stav = 'pripravujeme';
  assert.match(seminareBody({ data, behy: pripravBehy(data), now: new Date('2026-10-01T10:00:00Z') }), /Připravujeme/);
  // otevřený běh má tlačítko a odkaz s předvybraným během
  const otevreny = seminareBody({ data: nactiData(), behy: pripravBehy(nactiData()), now: new Date('2026-10-01T10:00:00Z') });
  assert.ok(otevreny.includes('href="/seminare/rezervace?beh=beh-1"') && otevreny.includes('Rezervovat místo'));
});
