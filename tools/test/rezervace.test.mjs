import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { vytvorHandler } from '../../api/rezervace.js';
import { vynulujLimity } from '../../api/_lib/limit.js';
import { ibanJePlatny } from '../../api/_lib/platba.js';
import { POVAHA_SEMINARE_EMAIL } from '../../api/_lib/texty.js';

// Testovací prostředí: příklad účtu z dokumentace, ne skutečný účet prodejce.
const ENV = {
  BANK_ACCOUNT: '19-2000145399/0800',
  BANK_ACCOUNT_HOLDER: 'Bc. Václav Kodeš',
  SELLER_ICO: '12345678',
  NOTIFY_EMAIL: 'majitel@example.test',
  MAIL_FROM: 'info@example.test',
  BREVO_API_KEY: 'testovaci-klic',
  ALLOWED_ORIGINS: 'https://ocdmentor.cz',
};
const TED = new Date('2026-11-05T10:15:00Z'); // běh 1 je otevřený, běh 2 také

const dobraZadost = (nahrada = {}) => ({
  jmeno: 'Jana',
  prijmeni: 'Nováková',
  email: 'jana@example.test',
  email2: 'jana@example.test',
  beh: 'beh-1',
  souhlasZpracovani: true,
  souhlasPovaha: true,
  souhlasPodminky: true,
  web: '',
  doba: 15000,
  ...nahrada,
});

function zavolej(zadost, { ted = TED, env = ENV, fetchImpl, hlavicky = {}, metoda = 'POST' } = {}) {
  const odeslane = [];
  const fetchFalesny = fetchImpl || (async (url, init) => { odeslane.push({ url, init, telo: JSON.parse(init.body) }); return { ok: true, status: 201 }; });
  const handler = vytvorHandler({ env: () => env, fetchImpl: fetchFalesny, ted: () => ted });
  const req = { method: metoda, headers: { 'content-type': 'application/json', origin: 'https://ocdmentor.cz', 'x-forwarded-for': '203.0.113.7', ...hlavicky }, body: zadost, socket: {} };
  let stav; let telo; const h = {};
  const res = { statusCode: 200, setHeader: (k, v) => { h[k.toLowerCase()] = v; }, end: (t) => { stav = res.statusCode; telo = JSON.parse(t); } };
  return handler(req, res).then(() => ({ stav, telo, h, odeslane }));
}

beforeEach(() => vynulujLimity());

test('správná rezervace: 200, platební údaje ze serveru, dva e-maily', async () => {
  const r = await zavolej(dobraZadost());
  assert.equal(r.stav, 200);
  assert.equal(r.telo.ok, true);
  assert.match(r.telo.vs, /^261105[1-9]\d{3}$/);
  assert.equal(r.telo.castka, 3590);
  assert.equal(r.telo.ucet, '19-2000145399/0800');
  assert.ok(ibanJePlatny(r.telo.iban));
  assert.equal(r.telo.splatnost, '2026-11-08');
  assert.deepEqual(r.telo.terminy.map((t) => t.datum), ['2026-12-03', '2026-12-10', '2026-12-17', '2027-01-07', '2027-01-14']);
  assert.match(r.telo.spd, /^SPD\*1\.0\*ACC:CZ\d{22}\*AM:3590\.00\*CC:CZK\*X-VS:\d{10}\*RN:[A-Z .]+\*MSG:SEMINAR$/);
  assert.ok(!('email' in r.telo) && !('jmeno' in r.telo), 'odpověď neobsahuje osobní údaje');
  assert.equal(r.odeslane.length, 2);
  assert.equal(r.h['cache-control'], 'no-store');
});

test('e-mail účastníkovi: obsah podle zadání a bez slova OCD', async () => {
  const r = await zavolej(dobraZadost());
  const m = r.odeslane[0];
  assert.equal(m.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(m.init.headers['api-key'], 'testovaci-klic');
  assert.equal(m.telo.sender.email, 'info@example.test');
  assert.equal(m.telo.replyTo.email, 'majitel@example.test');
  assert.deepEqual(m.telo.to, [{ email: 'jana@example.test', name: 'Jana Nováková' }]);
  assert.equal(m.telo.subject, 'Rezervace semináře – platební údaje');
  const text = m.telo.textContent;
  for (const co of ['3 590 Kč', '19-2000145399/0800', 'čtvrtek 3. 12. 2026 v 18:00', 'čtvrtek 14. 1. 2027 v 18:00', 'do 8. 11. 2026', 'https://ocdmentor.cz/obchodni-podminky', POVAHA_SEMINARE_EMAIL]) {
    assert.ok(text.includes(co), `e-mail obsahuje „${co}“`);
  }
  assert.ok(text.includes(r.telo.vs));
  for (const celek of [m.telo.subject, m.telo.textContent, m.telo.htmlContent]) {
    assert.ok(!/\bOCD\b/i.test(celek), 'v e-mailu účastníka není slovo OCD');
  }
  assert.ok(POVAHA_SEMINARE_EMAIL.startsWith('Seminář vychází z mé osobní životní zkušenosti a cesty. Nejde o odbornou ani lékařskou radu'));
});

test('e-mail majiteli: jméno, e-mail, běh, termíny, VS, částka, čas objednávky', async () => {
  const r = await zavolej(dobraZadost());
  const m = r.odeslane[1];
  assert.deepEqual(m.telo.to, [{ email: 'majitel@example.test' }]);
  assert.equal(m.telo.subject, `Nová rezervace semináře (VS ${r.telo.vs})`);
  assert.equal(m.telo.replyTo.email, 'jana@example.test');
  for (const co of ['Jana', 'Nováková', 'jana@example.test', 'Běh 1', r.telo.vs, '3 590 Kč', '5. 11. 2026']) assert.ok(m.telo.textContent.includes(co), co);
});

test('neplatný vstup: 400 s kódy polí', async () => {
  const r = await zavolej(dobraZadost({ jmeno: '', email: 'neplatny', email2: 'jiny@example.test', beh: 'beh-99', souhlasPodminky: false }));
  assert.equal(r.stav, 400);
  assert.equal(r.telo.kod, 'neplatny-vstup');
  assert.equal(r.telo.chyby.jmeno, 'povinne');
  assert.equal(r.telo.chyby.email, 'neplatne');
  assert.equal(r.telo.chyby.beh, 'neznamy-beh');
  assert.equal(r.telo.chyby.souhlasPodminky, 'povinne');
  assert.equal(r.odeslane.length, 0);
});

test('e-maily se musí shodovat (bez ohledu na velikost písmen)', async () => {
  assert.equal((await zavolej(dobraZadost({ email2: 'JANA@example.test' }))).stav, 200);
  vynulujLimity();
  const r = await zavolej(dobraZadost({ email2: 'jana@example.org' }));
  assert.equal(r.telo.chyby.email2, 'neshoduji-se');
});

test('vstup s novými řádky (injekce do hlaviček) je odmítnut', async () => {
  for (const pole of ['jmeno', 'prijmeni', 'email', 'email2']) {
    vynulujLimity();
    const r = await zavolej(dobraZadost({ [pole]: 'Jana\r\nBcc: spam@example.test' }));
    assert.equal(r.stav, 400, pole);
    assert.equal(r.odeslane.length, 0);
  }
});

test('souhlasy musí být přesně true (ne řetězec)', async () => {
  const r = await zavolej(dobraZadost({ souhlasZpracovani: 'true', souhlasPovaha: 1 }));
  assert.equal(r.stav, 400);
  assert.equal(r.telo.chyby.souhlasZpracovani, 'povinne');
  assert.equal(r.telo.chyby.souhlasPovaha, 'povinne');
});

test('honeypot a příliš rychlé odeslání', async () => {
  const a = await zavolej(dobraZadost({ web: 'http://spam.example' }));
  assert.equal(a.stav, 400);
  assert.equal(a.telo.kod, 'neplatny-pozadavek');
  const b = await zavolej(dobraZadost({ doba: 800 }));
  assert.equal(b.stav, 400);
  assert.equal(b.telo.kod, 'prilis-rychle');
  const c = await zavolej(dobraZadost({ doba: undefined }));
  assert.equal(c.telo.kod, 'prilis-rychle');
  assert.equal(a.odeslane.length + b.odeslane.length + c.odeslane.length, 0);
});

test('rate limit: šestý pokus z jedné IP je odmítnut', async () => {
  for (let i = 0; i < 5; i++) assert.notEqual((await zavolej(dobraZadost({ doba: 1 }))).stav, 429);
  const r = await zavolej(dobraZadost());
  assert.equal(r.stav, 429);
  assert.equal(r.h['retry-after'], '900');
  // jiná IP projde
  const jina = await zavolej(dobraZadost(), { hlavicky: { 'x-forwarded-for': '198.51.100.9' } });
  assert.equal(jina.stav, 200);
});

test('uzavřený běh (4 dny před začátkem) nejde rezervovat, stav se čte jen ze serveru', async () => {
  const r = await zavolej(dobraZadost(), { ted: new Date('2026-11-28T23:30:00Z') });
  assert.equal(r.stav, 409);
  assert.equal(r.telo.kod, 'beh-neni-otevreny');
  // klient nemůže vnutit cenu ani termíny
  vynulujLimity();
  const ok = await zavolej(dobraZadost({ castka: 1, cena: 1, terminy: ['2020-01-01'], stav: 'otevreno' }));
  assert.equal(ok.telo.castka, 3590);
  assert.deepEqual(ok.telo.terminy.map((t) => t.datum)[0], '2026-12-03');
});

test('špatná metoda, původ, typ obsahu a chybějící konfigurace', async () => {
  assert.equal((await zavolej(dobraZadost(), { metoda: 'GET' })).stav, 405);
  assert.equal((await zavolej(dobraZadost(), { hlavicky: { origin: 'https://zlo.example' } })).stav, 403);
  assert.equal((await zavolej(dobraZadost(), { hlavicky: { 'content-type': 'text/plain' } })).stav, 415);
  const bezKlice = { ...ENV, BREVO_API_KEY: '' };
  const r = await zavolej(dobraZadost(), { env: bezKlice });
  assert.equal(r.stav, 500);
  assert.equal(r.telo.kod, 'konfigurace');
  const spatnyUcet = { ...ENV, BANK_ACCOUNT: '2970298/0100' };
  assert.equal((await zavolej(dobraZadost(), { env: spatnyUcet })).stav, 500);
});

test('selhání Brevo: účastníkovi chyba 502, selhání upozornění majiteli rezervaci nezruší', async () => {
  const spatny = async () => ({ ok: false, status: 401 });
  const a = await zavolej(dobraZadost(), { fetchImpl: spatny });
  assert.equal(a.stav, 502);
  assert.equal(a.telo.kod, 'email-selhal');
  vynulujLimity();
  let n = 0;
  const druhySelze = async () => (++n === 1 ? { ok: true, status: 201 } : { ok: false, status: 500 });
  const b = await zavolej(dobraZadost(), { fetchImpl: druhySelze });
  assert.equal(b.stav, 200);
});

test('do logů nejdou osobní údaje', async () => {
  const puvodniLog = console.log;
  const puvodniErr = console.error;
  const radky = [];
  console.log = (...a) => radky.push(JSON.stringify(a));
  console.error = (...a) => radky.push(JSON.stringify(a));
  try {
    await zavolej(dobraZadost());
    vynulujLimity();
    await zavolej(dobraZadost(), { fetchImpl: async () => ({ ok: false, status: 500 }) });
  } finally {
    console.log = puvodniLog;
    console.error = puvodniErr;
  }
  const vse = radky.join('\n');
  assert.ok(vse.includes('rezervace'), 'něco se loguje');
  for (const nesmi of ['Jana', 'Nováková', 'jana@example.test', '19-2000145399']) assert.ok(!vse.includes(nesmi), `v logu není ${nesmi}`);
});
