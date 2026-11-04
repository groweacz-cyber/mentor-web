// E-maily přes SMTP (výchozí Gmail, knihovna nodemailer). Slovo „OCD“ se v e-mailu účastníka nesmí objevit.
import { dlouhyCz, formatCz, dlouhyEn, formatEn } from './seminare.js';
import { POVAHA_SEMINARE_EMAIL, POVAHA_SEMINARE_EMAIL_EN, formatCastka, formatCastkaEn } from './texty.js';
import { ibanPoSkupinach } from './platba.js';
import qrcode from './qrcode.cjs';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// QR Platba jako obrázek GIF, který se do e-mailu vkládá jako vložená příloha (cid), aby se zobrazil i bez stahování obrázků z webu.
function qrPriloha(spd) {
  const qr = qrcode(0, 'M');
  qr.addData(spd, /^[0-9A-Z $%*+\-.\/:]+$/.test(spd) ? 'Alphanumeric' : 'Byte');
  qr.make();
  const url = qr.createDataURL(6, 4);
  return { filename: 'qr-platba.gif', contentType: 'image/gif', cid: 'qr-platba', content: Buffer.from(url.slice(url.indexOf(',') + 1), 'base64') };
}

// Vrací { subject, text, html, prilohy }. Obsah je neutrální: jen „Seminář“.
function emailUcastnikCs({ rez, konf, odkazPodminky, spd }) {
  const terminy = rez.terminy.map((iso, i) => `${i + 1}. ${dlouhyCz(iso, rez.cas)}`);
  const radky = [
    ['Částka', formatCastka(rez.castka)],
    ['Číslo účtu', rez.ucet],
    ['IBAN', ibanPoSkupinach(rez.iban)],
    ['Majitel účtu', konf.majitel],
    ['Variabilní symbol', rez.vs],
    ['Splatnost', `do ${formatCz(rez.splatnost)}`],
  ];
  const subject = 'Rezervace semináře – platební údaje';
  const text = [
    'Dobrý den,',
    '',
    'děkuji za rezervaci semináře. Místo je pro vás rezervované do splatnosti.',
    '',
    `Program: ${rez.programTexty.emailPopis}`,
    '',
    `Termíny (online, videohovor přes Google Meet nebo WhatsApp, ${rez.delkaMinut} minut):`,
    ...terminy,
    '',
    'Platební údaje:',
    ...radky.map(([k, v]) => `${k}: ${v}`),
    ...(spd ? ['', 'QR kód pro platbu najdete v příloze tohoto e-mailu (qr-platba.gif). Naskenujte ho v bankovní aplikaci, platební údaje se předvyplní.'] : []),
    '',
    'Cena je konečná, nejsem plátce DPH. Platí se bankovním převodem. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.',
    'Po připsání platby se vám ozvu já e-mailem a domluvíme videohovor. Nemusíte se mi ozývat sami.',
    '',
    `Obchodní podmínky: ${odkazPodminky}`,
    '',
    POVAHA_SEMINARE_EMAIL,
    '',
    'S pozdravem',
    konf.majitel,
    `IČ ${konf.ico}`,
  ].join('\n');
  const html = `<!doctype html><html lang="cs"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#1b2a41;max-width:38rem">
<p>Dobrý den,</p>
<p>děkuji za rezervaci semináře. Místo je pro vás rezervované do splatnosti.</p>
<p><strong>Program:</strong> ${esc(rez.programTexty.emailPopis)}</p>
<p><strong>Termíny</strong> (online, videohovor přes Google Meet nebo WhatsApp, ${rez.delkaMinut} minut):</p>
<ol>${terminy.map((t) => `<li>${esc(t.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>
<p><strong>Platební údaje</strong></p>
<table style="border-collapse:collapse">${radky.map(([k, v]) => `<tr><td style="padding:2px 14px 2px 0">${esc(k)}</td><td style="padding:2px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
${spd ? '<p><img src="cid:qr-platba" width="220" height="220" alt="QR kód pro platbu semináře" style="display:block;border:1px solid #d9d4cc"><br>Naskenujte QR kód v bankovní aplikaci, platební údaje se předvyplní.</p>\n' : ''}<p>Cena je konečná, nejsem plátce DPH. Platí se bankovním převodem. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.</p>
<p>Po připsání platby se vám ozvu já e-mailem a domluvíme videohovor. Nemusíte se mi ozývat sami.</p>
<p>Obchodní podmínky: <a href="${esc(odkazPodminky)}">${esc(odkazPodminky)}</a></p>
<p style="font-style:italic;border-left:4px solid #f5923e;padding-left:12px">${esc(POVAHA_SEMINARE_EMAIL)}</p>
<p>S pozdravem<br>${esc(konf.majitel)}<br>IČ ${esc(konf.ico)}</p>
</body></html>`;
  return { subject, text, html, prilohy: spd ? [qrPriloha(spd)] : [] };
}

// Anglická verze e-mailu účastníkovi (rezervace z anglických stránek). Obsah je stejný, slovo „OCD“ se v něm opět neobjeví.
function emailUcastnikEn({ rez, konf, odkazPodminky, spd }) {
  const terminy = rez.terminy.map((iso, i) => `${i + 1}. ${dlouhyEn(iso, rez.cas)}`);
  const radky = [
    ['Amount', formatCastkaEn(rez.castka)],
    ['Account number', rez.ucet],
    ['IBAN', ibanPoSkupinach(rez.iban)],
    ['Account holder', konf.majitel],
    ['Variable symbol', rez.vs],
    ['Due date', `by ${formatEn(rez.splatnost)}`],
  ];
  const popis = rez.programTexty.en.emailPopis;
  const subject = 'Seminar booking – payment details';
  const text = [
    'Hello,',
    '',
    'Thank you for booking the seminar. Your place is reserved until the due date.',
    '',
    `Programme: ${popis}`,
    '',
    `Dates (online, video call via Google Meet or WhatsApp, ${rez.delkaMinut} minutes):`,
    ...terminy,
    '',
    'Payment details:',
    ...radky.map(([k, v]) => `${k}: ${v}`),
    ...(spd ? ['', 'The QR code for the payment is attached to this e-mail (qr-platba.gif). Scan it in your banking app and the payment details will be filled in.'] : []),
    '',
    'The price is final; I am not a VAT payer. Payment is by bank transfer. Please do not write anything in the message to the recipient; the variable symbol is enough. If you pay from a bank outside the Czech Republic, use the IBAN above and enter the variable symbol as the payment reference.',
    'Once your payment arrives I will get in touch by e-mail and we will arrange the video call. You do not need to contact me yourself.',
    '',
    `Terms and conditions: ${odkazPodminky}`,
    '',
    POVAHA_SEMINARE_EMAIL_EN,
    '',
    'Kind regards,',
    konf.majitel,
    `Company ID (IČ) ${konf.ico}`,
  ].join('\n');
  const html = `<!doctype html><html lang="en"><body style="font-family:Arial,Helvetica,sans-serif;line-height:1.55;color:#1b2a41;max-width:38rem">
<p>Hello,</p>
<p>Thank you for booking the seminar. Your place is reserved until the due date.</p>
<p><strong>Programme:</strong> ${esc(popis)}</p>
<p><strong>Dates</strong> (online, video call via Google Meet or WhatsApp, ${rez.delkaMinut} minutes):</p>
<ol>${terminy.map((t) => `<li>${esc(t.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>
<p><strong>Payment details</strong></p>
<table style="border-collapse:collapse">${radky.map(([k, v]) => `<tr><td style="padding:2px 14px 2px 0">${esc(k)}</td><td style="padding:2px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
${spd ? '<p><img src="cid:qr-platba" width="220" height="220" alt="QR code for the seminar payment" style="display:block;border:1px solid #d9d4cc"><br>Scan the QR code in your banking app and the payment details will be filled in.</p>\n' : ''}<p>The price is final; I am not a VAT payer. Payment is by bank transfer. Please do not write anything in the message to the recipient; the variable symbol is enough. If you pay from a bank outside the Czech Republic, use the IBAN above and enter the variable symbol as the payment reference.</p>
<p>Once your payment arrives I will get in touch by e-mail and we will arrange the video call. You do not need to contact me yourself.</p>
<p>Terms and conditions: <a href="${esc(odkazPodminky)}">${esc(odkazPodminky)}</a></p>
<p style="font-style:italic;border-left:4px solid #f5923e;padding-left:12px">${esc(POVAHA_SEMINARE_EMAIL_EN)}</p>
<p>Kind regards<br>${esc(konf.majitel)}<br>Company ID (IČ) ${esc(konf.ico)}</p>
</body></html>`;
  return { subject, text, html, prilohy: spd ? [qrPriloha(spd)] : [] };
}

// Podle jazyka stránky, ze které přišla rezervace ('cs' výchozí, 'en').
export function emailUcastnik(vstup) {
  return vstup.jazyk === 'en' ? emailUcastnikEn(vstup) : emailUcastnikCs(vstup);
}

export function emailMajitel({ rez, osoba, konf, objednano, ucastnikOdeslan, jazyk }) {
  const subject = `Nová rezervace semináře (VS ${rez.vs})`;
  const radky = [
    ['Jméno', osoba.jmeno],
    ['Příjmení', osoba.prijmeni],
    ['E-mail', osoba.email],
    ['Telefon (WhatsApp)', osoba.telefon],
    ['Program', rez.programTexty.majitelPopis],
    ['Běh', rez.behNazev],
    ['Termíny', rez.terminy.map((iso) => dlouhyCz(iso, rez.cas)).join('; ')],
    ['Variabilní symbol', rez.vs],
    ['Částka', formatCastka(rez.castka)],
    ['Splatnost', `do ${formatCz(rez.splatnost)}`],
    ['Čas objednávky', objednano],
    ['Jazyk stránky', jazyk === 'en' ? 'angličtina (rezervace z anglických stránek, odpovězte prosím anglicky)' : 'čeština'],
    ['E-mail s platebními údaji účastníkovi', ucastnikOdeslan ? 'odeslán' : 'neodeslán, platební údaje a QR kód viděl na stránce po odeslání rezervace'],
  ];
  const text = ['Nová rezervace semináře.', '', ...radky.map(([k, v]) => `${k}: ${v}`)].join('\n');
  const html = `<!doctype html><html lang="cs"><body style="font-family:Arial,Helvetica,sans-serif;color:#1b2a41"><p><strong>Nová rezervace semináře</strong></p><table style="border-collapse:collapse">${radky.map(([k, v]) => `<tr><td style="padding:2px 14px 2px 0">${esc(k)}</td><td style="padding:2px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table></body></html>`;
  return { subject, text, html };
}

// Vrací funkci pro odeslání jedné zprávy. Při chybě vyhodí Error s kódem (bez osobních údajů).
// Když je nastavena složka MAIL_OUTBOX_DIR (jen vývoj), zprávy se uloží jako soubory a nikam se neodesílají.
export async function vytvorOdesilac(konf) {
  if (konf.outboxDir) {
    const { mkdirSync, writeFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    let n = 0;
    return async (z) => {
      mkdirSync(konf.outboxDir, { recursive: true });
      const soubor = join(konf.outboxDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${++n}.json`);
      writeFileSync(soubor, JSON.stringify({ komu: z.komu, odJmeno: z.odJmeno, od: z.od, replyTo: z.replyTo, subject: z.zprava.subject, text: z.zprava.text, html: z.zprava.html, prilohy: (z.zprava.prilohy || []).map((p) => p.filename) }, null, 2));
      console.log(`[vývojová schránka] „${z.zprava.subject}“ pro ${z.komu} -> ${soubor}`);
    };
  }
  if (konf.resendKlic) {
    return async (z) => {
      let res;
      try {
        res = await fetch(konf.resendUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${konf.resendKlic}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: `${z.odJmeno} <${z.od}>`,
            to: [z.komu],
            reply_to: z.replyTo,
            subject: z.zprava.subject,
            text: z.zprava.text,
            html: z.zprava.html,
            ...(z.zprava.prilohy && z.zprava.prilohy.length ? { attachments: z.zprava.prilohy.map((p) => ({ filename: p.filename, content: p.content.toString('base64'), content_type: p.contentType, content_id: p.cid })) } : {}),
          }),
          signal: AbortSignal.timeout(9000),
        });
      } catch (e) {
        throw Object.assign(new Error('resend'), { kod: e && e.name === 'TimeoutError' ? 'resend-timeout' : 'resend-sit' });
      }
      if (!res.ok) throw Object.assign(new Error('resend'), { kod: `resend-${res.status}` });
    };
  }
  const { default: nodemailer } = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: konf.smtp.host,
    port: konf.smtp.port,
    secure: konf.smtp.port === 465,
    auth: { user: konf.smtp.user, pass: konf.smtp.pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return async (z) => {
    try {
      await transport.sendMail({
        from: { name: z.odJmeno, address: z.od },
        to: z.komuJmeno ? { name: z.komuJmeno, address: z.komu } : z.komu,
        replyTo: z.replyTo,
        subject: z.zprava.subject,
        text: z.zprava.text,
        html: z.zprava.html,
        attachments: (z.zprava.prilohy || []).map((p) => ({ filename: p.filename, content: p.content, contentType: p.contentType, cid: p.cid })),
      });
    } catch (e) {
      throw Object.assign(new Error('smtp'), { kod: `smtp-${e && (e.code || e.responseCode) || 'chyba'}` });
    }
  };
}
