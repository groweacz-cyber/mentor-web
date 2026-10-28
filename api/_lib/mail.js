// E-maily přes Brevo (transakční API, bez knihoven). Slovo „OCD“ se v e-mailu účastníka nesmí objevit.
import { dlouhyCz, formatCz } from './seminare.js';
import { POVAHA_SEMINARE_EMAIL, formatCastka } from './texty.js';
import { ibanPoSkupinach } from './platba.js';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Vrací { subject, text, html }. Obsah je neutrální: jen „Seminář“.
export function emailUcastnik({ rez, konf, odkazPodminky }) {
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
    `Termíny (online, videohovor přes Google Meet, ${rez.delkaMinut} minut):`,
    ...terminy,
    '',
    'Platební údaje:',
    ...radky.map(([k, v]) => `${k}: ${v}`),
    '',
    'Cena je konečná, nejsem plátce DPH. Platí se bankovním převodem. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.',
    'Po připsání platby vám pošlu odkaz na videohovor.',
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
<p><strong>Termíny</strong> (online, videohovor přes Google Meet, ${rez.delkaMinut} minut):</p>
<ol>${terminy.map((t) => `<li>${esc(t.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>
<p><strong>Platební údaje</strong></p>
<table style="border-collapse:collapse">${radky.map(([k, v]) => `<tr><td style="padding:2px 14px 2px 0">${esc(k)}</td><td style="padding:2px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
<p>Cena je konečná, nejsem plátce DPH. Platí se bankovním převodem. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.</p>
<p>Po připsání platby vám pošlu odkaz na videohovor.</p>
<p>Obchodní podmínky: <a href="${esc(odkazPodminky)}">${esc(odkazPodminky)}</a></p>
<p style="font-style:italic;border-left:4px solid #f5923e;padding-left:12px">${esc(POVAHA_SEMINARE_EMAIL)}</p>
<p>S pozdravem<br>${esc(konf.majitel)}<br>IČ ${esc(konf.ico)}</p>
</body></html>`;
  return { subject, text, html };
}

export function emailMajitel({ rez, osoba, konf, objednano }) {
  const subject = `Nová rezervace semináře (VS ${rez.vs})`;
  const radky = [
    ['Jméno', osoba.jmeno],
    ['Příjmení', osoba.prijmeni],
    ['E-mail', osoba.email],
    ['Běh', rez.behNazev],
    ['Termíny', rez.terminy.map((iso) => dlouhyCz(iso, rez.cas)).join('; ')],
    ['Variabilní symbol', rez.vs],
    ['Částka', formatCastka(rez.castka)],
    ['Splatnost', `do ${formatCz(rez.splatnost)}`],
    ['Čas objednávky', objednano],
  ];
  const text = ['Nová rezervace semináře.', '', ...radky.map(([k, v]) => `${k}: ${v}`)].join('\n');
  const html = `<!doctype html><html lang="cs"><body style="font-family:Arial,Helvetica,sans-serif;color:#1b2a41"><p><strong>Nová rezervace semináře</strong></p><table style="border-collapse:collapse">${radky.map(([k, v]) => `<tr><td style="padding:2px 14px 2px 0">${esc(k)}</td><td style="padding:2px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table></body></html>`;
  return { subject, text, html };
}

// Odeslání jedné zprávy přes Brevo. Při chybě vyhodí Error s kódem (bez osobních údajů a bez těla odpovědi).
export async function odesliEmail({ klic, url, od, odJmeno, komu, komuJmeno, replyTo, zprava, fetchImpl = fetch }) {
  const telo = {
    sender: { name: odJmeno, email: od },
    to: [komuJmeno ? { email: komu, name: komuJmeno } : { email: komu }],
    replyTo: { email: replyTo },
    subject: zprava.subject,
    htmlContent: zprava.html,
    textContent: zprava.text,
  };
  let res;
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'api-key': klic, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(telo),
      signal: AbortSignal.timeout(9000),
    });
  } catch (e) {
    throw Object.assign(new Error('brevo-sit'), { kod: e && e.name === 'TimeoutError' ? 'brevo-timeout' : 'brevo-sit' });
  }
  if (!res.ok) throw Object.assign(new Error(`brevo-http-${res.status}`), { kod: `brevo-http-${res.status}` });
}
