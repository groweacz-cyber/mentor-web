import test from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { vytvorOdesilac, emailUcastnik } from '../../api/_lib/mail.js';

// Minimální SMTP server (bez TLS): zachytí zprávu a ověří, že odesílání nodemailerem opravdu funguje a že se zachová čeština.
function smtpAtrapa() {
  const zpravy = [];
  const server = net.createServer((s) => {
    let data = false;
    let buf = '';
    let telo = '';
    let prihlaseno = false;
    s.write('220 test ESMTP\r\n');
    s.on('data', (c) => {
      if (data) {
        telo += c.toString('utf8');
        if (telo.endsWith('\r\n.\r\n')) { data = false; zpravy.push(telo); telo = ''; s.write('250 OK\r\n'); }
        return;
      }
      buf += c.toString('utf8');
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const radek = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (/^EHLO/i.test(radek)) s.write('250-test\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n');
        else if (/^AUTH PLAIN/i.test(radek)) { prihlaseno = Buffer.from(radek.split(' ')[2] || '', 'base64').toString().includes('tajne'); s.write(prihlaseno ? '235 OK\r\n' : '535 chyba\r\n'); }
        else if (/^(MAIL|RCPT)/i.test(radek)) s.write('250 OK\r\n');
        else if (/^DATA/i.test(radek)) { data = true; s.write('354 go\r\n'); }
        else if (/^QUIT/i.test(radek)) { s.write('221 bye\r\n'); s.end(); }
        else s.write('250 OK\r\n');
      }
    });
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, zpravy, port: server.address().port })));
}

const konf = (port, pass = 'tajne-heslo') => ({ smtp: { host: '127.0.0.1', port, user: 'a@example.test', pass }, outboxDir: '', majitel: 'Bc. Václav Kodeš', ico: '12345678' });

test('odeslání přes SMTP: zpráva dorazí, čeština a předmět se zachovají', async () => {
  const { server, zpravy, port } = await smtpAtrapa();
  try {
    const odesli = await vytvorOdesilac(konf(port));
    const rez = { terminy: ['2026-12-03'], cas: '18:00', delkaMinut: 60, castka: 3590, ucet: '19-2000145399/0800', iban: 'CZ6508000000192000145399', vs: '2611054321', splatnost: '2026-11-08' };
    await odesli({ od: 'a@example.test', odJmeno: 'Bc. Václav Kodeš', komu: 'jana@example.test', komuJmeno: 'Jana Nováková', replyTo: 'b@example.test', zprava: emailUcastnik({ rez, konf: konf(port), odkazPodminky: 'https://ocdmentor.cz/obchodni-podminky' }) });
    assert.equal(zpravy.length, 1);
    assert.match(zpravy[0], /Subject: =\?UTF-8\?/);
    assert.match(zpravy[0], /Reply-To: b@example\.test/);
    assert.match(zpravy[0], /To: .*jana@example\.test/);
  } finally {
    server.close();
  }
});

test('špatné heslo: chyba má kód bez osobních údajů', async () => {
  const { server, port } = await smtpAtrapa();
  try {
    const odesli = await vytvorOdesilac(konf(port, 'spatne'));
    await assert.rejects(odesli({ od: 'a@example.test', odJmeno: 'X', komu: 'j@example.test', replyTo: 'b@example.test', zprava: { subject: 's', text: 't', html: '<p>t</p>' } }), (e) => /^smtp-/.test(e.kod) && !/j@example/.test(e.message));
  } finally {
    server.close();
  }
});
