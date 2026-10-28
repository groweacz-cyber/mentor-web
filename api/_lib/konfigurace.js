// Nastavení z proměnných prostředí (Vercel > Settings > Environment Variables, lokálně .env.local). Nic z toho není v repozitáři.
import { ibanJePlatny, rozlozUcet, vytvorIban } from './platba.js';

const POVINNE = ['BANK_ACCOUNT', 'BANK_ACCOUNT_HOLDER', 'SELLER_ICO', 'NOTIFY_EMAIL', 'MAIL_FROM', 'BREVO_API_KEY'];
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[A-Za-z]{2,}$/;

// Vyhodí Error s kódem „konfigurace“ a názvem chybějící/neplatné proměnné (hodnoty se nikdy nevypisují).
export function nactiKonfiguraci(env = process.env) {
  for (const klic of POVINNE) {
    if (!env[klic] || !String(env[klic]).trim()) throw Object.assign(new Error(`Chybí proměnná prostředí ${klic}.`), { kod: 'konfigurace', promenna: klic });
  }
  let ucet;
  try {
    ucet = rozlozUcet(env.BANK_ACCOUNT);
  } catch (e) {
    throw Object.assign(new Error(`BANK_ACCOUNT: ${e.message}`), { kod: 'konfigurace', promenna: 'BANK_ACCOUNT' });
  }
  const iban = vytvorIban(ucet);
  if (!ibanJePlatny(iban)) throw Object.assign(new Error('Vypočtený IBAN neprošel kontrolou.'), { kod: 'konfigurace', promenna: 'BANK_ACCOUNT' });
  for (const klic of ['NOTIFY_EMAIL', 'MAIL_FROM']) {
    if (!EMAIL.test(env[klic].trim())) throw Object.assign(new Error(`${klic} není platný e-mail.`), { kod: 'konfigurace', promenna: klic });
  }
  return {
    ucet: ucet.zobrazeni,
    iban,
    majitel: env.BANK_ACCOUNT_HOLDER.trim(),
    ico: env.SELLER_ICO.trim(),
    notifyEmail: env.NOTIFY_EMAIL.trim(),
    mailFrom: env.MAIL_FROM.trim(),
    brevoKlic: env.BREVO_API_KEY.trim(),
    brevoUrl: (env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email').trim(),
    povoleneOrigin: (env.ALLOWED_ORIGINS || 'https://ocdmentor.cz,https://www.ocdmentor.cz')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    web: (env.SITE_URL || 'https://ocdmentor.cz').trim().replace(/\/$/, ''),
  };
}
