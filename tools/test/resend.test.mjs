import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { vytvorHandler } from '../../api/rezervace.js';
import { vytvorOdesilac } from '../../api/_lib/mail.js';
import { vynulujLimity } from '../../api/_lib/limit.js';

const ENV = {
  BANK_ACCOUNT: '19-2000145399/0800',
  BANK_ACCOUNT_HOLDER: 'Bc. Václav Kodeš',
  SELLER_ICO: '12345678',
  NOTIFY_EMAIL: 'majitel@example.test',
  MAIL_FROM: 'onboarding@resend.dev',
  RESEND_API_KEY: 're_testovaci',
  ALLOWED_ORIGINS: 'https://ocdmentor.cz',
};
const dobra = { jmeno: 'Jana', prijmeni: 'Nováková', email: 'jana@example.test', email2: 'jana@example.test', telefon: '+420 777 123 456', beh: 'beh-1', souhlasZpracovani: true, souhlasPovaha: true, souhlasPodminky: true, web: '', doba: 15000 };
beforeEach(() => vynulujLimity());

// Resend přes skutečný odesílač a falešné fetch
async function zavolej(env, fetchOdpoved) {
  const volani = [];
  const puvodni = globalThis.fetch;
  globalThis.fetch = async (url, init) => { volani.push({ url, init, telo: JSON.parse(init.body) }); return fetchOdpoved(volani.length); };
  try {
    const handler = vytvorHandler({ env: () => env, ted: () => new Date('2026-11-05T10:15:00Z') });
    let stav; let telo;
    const res = { statusCode: 200, setHeader() {}, end: (t) => { stav = res.statusCode; telo = JSON.parse(t); } };
    await handler({ method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://ocdmentor.cz', 'x-forwarded-for': '203.0.113.7' }, body: dobra, socket: {} }, res);
    return { stav, telo, volani };
  } finally {
    globalThis.fetch = puvodni;
  }
}

test('Resend: dva e-maily, správná autorizace a pole', async () => {
  const r = await zavolej(ENV, () => ({ ok: true, status: 200 }));
  assert.equal(r.stav, 200);
  assert.equal(r.telo.emailOdeslan, true);
  assert.equal(r.volani.length, 2);
  const [u, m] = r.volani;
  assert.equal(u.url, 'https://api.resend.com/emails');
  assert.equal(u.init.headers.Authorization, 'Bearer re_testovaci');
  assert.deepEqual(u.telo.to, ['jana@example.test']);
  assert.equal(u.telo.reply_to, 'majitel@example.test');
  assert.match(u.telo.from, /onboarding@resend\.dev>$/);
  assert.ok(!/\bOCD\b/i.test(u.telo.subject + u.telo.text + u.telo.html));
  assert.deepEqual(m.telo.to, ['majitel@example.test']);
});

test('SEND_TO_PARTICIPANT=ne: posílá se jen upozornění majiteli, rezervace projde', async () => {
  const r = await zavolej({ ...ENV, SEND_TO_PARTICIPANT: 'ne' }, () => ({ ok: true, status: 200 }));
  assert.equal(r.stav, 200);
  assert.equal(r.telo.emailOdeslan, false);
  assert.equal(r.volani.length, 1);
  assert.deepEqual(r.volani[0].telo.to, ['majitel@example.test']);
  assert.match(r.volani[0].telo.subject, /^Nová rezervace semináře \(VS \d{10}\)$/);
});

test('Resend vrací chybu: účastníkovi 502, majiteli se chyba jen zaloguje', async () => {
  assert.equal((await zavolej(ENV, () => ({ ok: false, status: 403 }))).stav, 502);
  vynulujLimity();
  const r = await zavolej(ENV, (n) => (n === 1 ? { ok: true, status: 200 } : { ok: false, status: 500 }));
  assert.equal(r.stav, 200);
});

test('chybí RESEND_API_KEY i SMTP_PASSWORD: chyba konfigurace', async () => {
  const { RESEND_API_KEY, ...bez } = ENV;
  const r = await zavolej(bez, () => ({ ok: true, status: 200 }));
  assert.equal(r.stav, 500);
  assert.equal(r.telo.kod, 'konfigurace');
});

test('chyba odesílače nenese osobní údaje', async () => {
  const puvodni = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 422 });
  try {
    const odesli = await vytvorOdesilac({ resendKlic: 'k', resendUrl: 'https://api.resend.com/emails', outboxDir: '' });
    await assert.rejects(odesli({ od: 'a@b.cz', odJmeno: 'X', komu: 'tajny@example.test', replyTo: 'c@d.cz', zprava: { subject: 's', text: 't', html: 'h' } }), (e) => e.kod === 'resend-422' && !/tajny/.test(e.message));
  } finally {
    globalThis.fetch = puvodni;
  }
});

test('e-mail účastníkovi nese QR Platbu jako vloženou přílohu GIF, majitel se dozví, zda účastník e-mail dostal', async () => {
  const r = await zavolej(ENV, () => ({ ok: true, status: 200 }));
  const [u, m] = r.volani;
  assert.equal(u.telo.attachments.length, 1);
  const p = u.telo.attachments[0];
  assert.equal(p.content_id, 'qr-platba');
  assert.equal(p.content_type, 'image/gif');
  assert.equal(Buffer.from(p.content, 'base64').subarray(0, 6).toString('latin1').slice(0, 3), 'GIF');
  assert.ok(u.telo.html.includes('src="cid:qr-platba"'));
  assert.match(m.telo.text, /E-mail s platebními údaji účastníkovi: odeslán/);
  assert.ok(!m.telo.attachments);
  vynulujLimity();
  const ne = await zavolej({ ...ENV, SEND_TO_PARTICIPANT: 'ne' }, () => ({ ok: true, status: 200 }));
  assert.match(ne.volani[0].telo.text, /E-mail s platebními údaji účastníkovi: neodeslán/);
});
