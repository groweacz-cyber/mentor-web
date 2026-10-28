// Vypíše IBAN a ukázkový řetězec QR Platby pro účet z BANK_ACCOUNT (.env.local), ať si ho porovnáte s bankovnictvím.
// Spuštění: npm run iban
import { nactiEnvLocal } from './env.mjs';
import { ibanJePlatny, ibanPoSkupinach, rozlozUcet, spdRetezec, variabilniSymbol, vytvorIban } from '../api/_lib/platba.js';

nactiEnvLocal();
const zdroj = process.env.BANK_ACCOUNT;
if (!zdroj) {
  console.error('Chybí BANK_ACCOUNT (nastavte ho v .env.local).');
  process.exit(1);
}
const ucet = rozlozUcet(zdroj);
const iban = vytvorIban(ucet);
console.log(`Číslo účtu:  ${ucet.zobrazeni} (kontrolní součet modulo 11 v pořádku)`);
console.log(`IBAN:        ${iban}`);
console.log(`IBAN po 4:   ${ibanPoSkupinach(iban)}`);
console.log(`Kontrola IBAN (modulo 97): ${ibanJePlatny(iban) ? 'v pořádku' : 'CHYBA'}`);
console.log(`Příklad SPD: ${spdRetezec({ iban, castka: 3590, vs: variabilniSymbol(), prijemce: process.env.BANK_ACCOUNT_HOLDER || '', zprava: 'SEMINAR' })}`);
