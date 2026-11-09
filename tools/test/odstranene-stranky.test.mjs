// Odstraněné stránky (/metoda, /dotaznik, /kviz): neexistují, mají 301 přesměrování a nikde na ně nevede odkaz ani záznam v sitemapě.
// Před spuštěním: npm run gen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');
const SMAZANE = ['/metoda', '/dotaznik', '/kviz', '/en/method', '/en/questionnaire', '/en/quiz', '/sk/metoda', '/sk/dotaznik', '/sk/kviz'];
const CIL = {
  '/metoda': '/jak-to-probiha', '/dotaznik': '/kontakt', '/kviz': '/pro-koho',
  '/en/method': '/en/how-it-works', '/en/questionnaire': '/en/contact', '/en/quiz': '/en/who-its-for',
  '/sk/metoda': '/sk/ako-to-prebieha', '/sk/dotaznik': '/sk/kontakt', '/sk/kviz': '/sk/pre-koho',
};

function htmlSoubory(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (['node_modules', '.git', 'tools', 'api', '.outbox'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) htmlSoubory(p, out);
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

test('smazané stránky a jejich skripty neexistují', () => {
  for (const u of SMAZANE) assert.ok(!existsSync(join(ROOT, u.slice(1), 'index.html')), `${u} nesmí existovat`);
  for (const f of ['kviz.js', 'kviz-data.js', 'dotaznik.js', 'smycka.js', 'smycka-faze.js', 'smycka-kruh.js', 'principy.js']) {
    for (const d of ['assets/js', 'assets/js/en', 'assets/js/sk']) assert.ok(!existsSync(join(ROOT, d, f)), `${d}/${f}`);
  }
});

test('vercel.json: trvalé (301/308) přesměrování smazaných stránek na určené cíle, i v EN a SK', () => {
  const v = JSON.parse(nacti('vercel.json'));
  for (const [z, c] of Object.entries(CIL)) {
    const r = v.redirects.find((x) => x.source === z);
    assert.ok(r, `chybí přesměrování ${z}`);
    assert.equal(r.destination, c);
    assert.equal(r.permanent, true);
  }
});

test('žádná stránka ani sitemap neodkazuje na smazané adresy', () => {
  const vzor = new RegExp(`href="(?:${SMAZANE.map((u) => u.replace(/\//g, '\\/')).join('|')})(?:[#?"])`);
  for (const f of htmlSoubory(ROOT)) {
    const h = readFileSync(f, 'utf8');
    assert.ok(!vzor.test(h), `${f.replace(ROOT, '')}: odkaz na smazanou stránku`);
  }
  const s = nacti('sitemap.xml');
  for (const u of SMAZANE) assert.ok(!s.includes(`<loc>https://ocdmentor.cz${u}</loc>`), `${u} v sitemapě`);
});

test('navigace neobsahuje Metodu, Dotazník ani Kvíz a úvodní stránka nemá bloky o metodě a principech', () => {
  for (const p of ['index.html', 'en/index.html', 'sk/index.html', 'jak-to-probiha/index.html']) {
    const h = nacti(p);
    const nav = (h.match(/<nav id="hlavni-nav"[\s\S]*?<\/nav>/) || [''])[0];
    assert.ok(nav.length > 100, `${p}: navigace`);
    assert.ok(!/>Metoda<|>Dotazník<|>Kvíz|>Method<|>Questionnaire<|>Quiz/.test(nav), `${p}: navigace`);
  }
  const uvod = nacti('index.html');
  assert.ok(uvod.includes('Peer podpora od člověka, který OCD zná z vlastní zkušenosti. Doplňuje odbornou péči a nenahrazuje ji.'));
  assert.ok(!/Princip dne|principů metody|Smyčka, kterou OCD používá|Metal|Pop cest/.test(uvod));
});

test('/jak-to-probiha obsahuje předepsaný popis sezení a zachovává cenu, upozornění a krizová čísla', () => {
  const h = nacti('jak-to-probiha/index.html');
  assert.ok(h.includes('Úvodní 20minutová konzultace je zdarma a k ničemu nezavazuje.'));
  assert.ok(h.includes('Neposkytuji psychoterapii, nestanovuji diagnózu, neradím s léky a nezadávám úkoly. Tempo i témata určujete vy.'));
  assert.ok(h.includes('890 Kč'));
  assert.ok(/112/.test(h) && /155/.test(h) && /116 123/.test(h));
  assert.ok(!/Zmapujeme|Z toho postavíme|žebřík|dotazník/i.test(h));
});

test('/o-mne: Absolvované kurzy, nové hranice, bez ERP/I-CBT a bez slibu „dá se z toho vyjít“; /pro-koho má kritéria a krizová čísla', () => {
  const h = nacti('o-mne/index.html');
  assert.ok(h.includes('<h2>Absolvované kurzy</h2>') && !h.includes('Absolvované vzdělání'));
  assert.ok(h.includes('Nejsem terapeut, nestanovuji diagnózu, nevedu psychoterapii a neposkytuji zdravotní služby.'));
  assert.ok(h.includes('Neposkytuji ujištění, že se vaše obava nesplní.') && !h.includes('Patří ke smyčce'));
  assert.ok(h.includes('id="hranice"'));
  assert.ok(h.includes('Rozhodl jsem se předávat dál, co mi pomohlo.'));
  assert.ok(!/ERP|I-CBT|dá se z toho vyjít|tuto metodu|Doprovázím/.test(h));
  const k = nacti('pro-koho/index.html');
  for (const x of ['aktivní psychóza', 'sebevražedné myšlenky', 'závažná deprese', 'akutní krize']) assert.ok(k.includes(x), x);
  assert.ok(/112/.test(k) && /155/.test(k) && /116 123/.test(k));
  assert.ok(!/Metal|Pop cesta|ERP|I-CBT/.test(k));
  assert.ok(!/naposledy zkontrolován/i.test(k), 'datum „naposledy zkontrolován“ je pryč');
});

test('/pro-terapeuty a semináře: předepsané znění, bez ERP, I-CBT a Metal/Pop', () => {
  const t = nacti('pro-terapeuty/index.html');
  assert.ok(t.includes('Peer podpora je doplněk k odborné péči. Pokud je klient v péči odborníka, jsem mu oporou v běžném životě.'));
  assert.ok(!/ERP|I-CBT|Doprovázím|držel se jejího plánu/.test(t));
  for (const p of ['seminare/index.html', 'seminare/cesta-s-ocd/index.html', 'seminare/pro-blizke/index.html']) {
    const h = nacti(p);
    assert.ok(!/ERP|I-CBT|Metal|expozic/.test(h), `${p}: zakázané pojmy`);
    assert.ok(/nediagnostikuji, neléčím a neradím s léky/i.test(h) || p === 'seminare/index.html', `${p}: upozornění`);
  }
  assert.ok(nacti('seminare/cesta-s-ocd/index.html').includes('Cesta s OCD: sebepřijetí a sebevíra. Pět setkání nad knihou'));
});

test('aplikace nemá dotazník ani žebříček: stránky neexistují, mají přesměrování a nikde na webu se nezmiňuje dotazník', () => {
  for (const u of ['aplikace/start', 'aplikace/zebricek', 'en/app/start', 'en/app/ladder', 'sk/aplikacia/start', 'sk/aplikacia/rebricek']) assert.ok(!existsSync(join(ROOT, u, 'index.html')), u);
  for (const f of ['start.js', 'ladder.js']) for (const d of ['assets/js/app', 'assets/js/en/app', 'assets/js/sk/app']) assert.ok(!existsSync(join(ROOT, d, f)), `${d}/${f}`);
  const v = JSON.parse(nacti('vercel.json'));
  for (const [z, c] of [['/aplikace/start', '/aplikace'], ['/aplikace/zebricek', '/aplikace'], ['/en/app/start', '/en/app'], ['/sk/aplikacia/rebricek', '/sk/aplikacia']]) {
    const r = v.redirects.find((x) => x.source === z);
    assert.ok(r && r.destination === c && r.permanent === true, z);
  }
  const vzor = /dotazník|dotaznik|žebříč|questionnaire/i;
  for (const f of htmlSoubory(ROOT)) {
    const h = readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    assert.ok(!vzor.test(h.replace(/<[^>]+>/g, ' ')), `${f.replace(ROOT, '')}: zmínka o dotazníku nebo žebříčku`);
  }
  for (const f of ['home.js', 'vice.js', 'settings.js', 'export.js', 'diary.js', 'icbt.js']) assert.ok(!vzor.test(nacti(`assets/js/app/${f}`)), `app/${f}`);
});
