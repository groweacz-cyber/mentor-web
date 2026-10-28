// Nastavení z proměnných prostředí (Vercel > Settings > Environment Variables, lokálně .env.local). Nic z toho není v repozitáři.
import { ibanJePlatny, rozlozUcet, vytvorIban } from './platba.js';

const POVINNE = ['BANK_ACCOUNT', 'BANK_ACCOUNT_HOLDER', 'SELLER_ICO', 'NOTIFY_EMAIL', 'MAIL_FROM'];
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[A-Za-z]{2,}$/;

// Vyhodí Error s kódem „konfigurace“ a názvem chybějící/neplatné proměnné (hodnoty se nikdy nevypisují).
export function nactiKonfiguraci(env = process.env) {
  const chyba = (promenna, zprava) => Object.assign(new Error(zprava), { kod: 'konfigurace', promenna });
  for (const klic of POVINNE) {
    if (!env[klic] || !String(env[klic]).trim()) throw chyba(klic, `Chybí proměnná prostředí ${klic}.`);
  }
  let ucet;
  try {
    ucet = rozlozUcet(env.BANK_ACCOUNT);
  } catch (e) {
    throw chyba('BANK_ACCOUNT', `BANK_ACCOUNT: ${e.message}`);
  }
  const iban = vytvorIban(ucet);
  if (!ibanJePlatny(iban)) throw chyba('BANK_ACCOUNT', 'Vypočtený IBAN neprošel kontrolou.');
  for (const klic of ['NOTIFY_EMAIL', 'MAIL_FROM']) {
    if (!EMAIL.test(env[klic].trim())) throw chyba(klic, `${klic} není platný e-mail.`);
  }
  // Odesílání: Resend (RESEND_API_KEY) nebo SMTP (SMTP_PASSWORD). Pro vývoj lze zapnout složku místo odesílání.
  const outboxDir = (env.MAIL_OUTBOX_DIR || '').trim();
  const resendKlic = (env.RESEND_API_KEY || '').trim();
  if (!outboxDir && !resendKlic && !(env.SMTP_PASSWORD && String(env.SMTP_PASSWORD).trim())) throw chyba('RESEND_API_KEY', 'Chybí proměnná prostředí RESEND_API_KEY (nebo SMTP_PASSWORD).');
  return {
    ucet: ucet.zobrazeni,
    iban,
    majitel: env.BANK_ACCOUNT_HOLDER.trim(),
    ico: env.SELLER_ICO.trim(),
    notifyEmail: env.NOTIFY_EMAIL.trim(),
    mailFrom: env.MAIL_FROM.trim(),
    smtp: {
      host: (env.SMTP_HOST || 'smtp.gmail.com').trim(),
      port: Number(env.SMTP_PORT) || 465,
      user: (env.SMTP_USER || env.MAIL_FROM).trim(),
      pass: (env.SMTP_PASSWORD || '').replace(/\s+/g, ''),
    },
    outboxDir,
    resendKlic,
    resendUrl: (env.RESEND_API_URL || 'https://api.resend.com/emails').trim(),
    // Bez ověřené domény smí Resend posílat jen majiteli účtu. Pak se e-mail účastníkovi vynechá (platební údaje vidí na stránce).
    posilatUcastnikovi: String(env.SEND_TO_PARTICIPANT || 'ano').trim().toLowerCase() !== 'ne',
    povoleneOrigin: (env.ALLOWED_ORIGINS || 'https://ocdmentor.cz,https://www.ocdmentor.cz')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    web: (env.SITE_URL || 'https://ocdmentor.cz').trim().replace(/\/$/, ''),
  };
}
