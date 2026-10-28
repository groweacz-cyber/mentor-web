// Platební údaje: číslo účtu, IBAN, variabilní symbol a řetězec QR Platby (SPD).
// Formát podle standardu QR Platba České bankovní asociace, verze 1.2 (qr-platba.cz):
// hlavička SPD*1.0*, atributy KLÍČ:hodnota oddělené hvězdičkou, hodnota nesmí obsahovat „*“,
// ACC = IBAN, AM = částka s tečkou a max. 2 desetinnými místy (max. 10 znaků), CC = CZK,
// X-VS = variabilní symbol (max. 10 číslic), RN = jméno příjemce (max. 35 znaků), MSG = zpráva (max. 60 znaků).
// Pro nejkratší (alfanumerický) QR kód se doporučují jen znaky 0-9 A-Z mezera $ % * + - . / :
import { randomInt } from 'node:crypto';
import { dnesPraha } from './seminare.js';

// Číslo účtu ve tvaru [předčíslí-]číslo/kód banky. Kontrolní součet modulo 11 podle vyhlášky ČNB (váhy 10,5,8,4,2,1 / 6,3,7,9,10,5,8,4,2,1).
const VAHY_PREDCISLI = [10, 5, 8, 4, 2, 1];
const VAHY_CISLO = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
const kontrolniSoucet = (cifry, vahy) => cifry.split('').reduce((s, c, i) => s + Number(c) * vahy[i], 0) % 11 === 0;

export function rozlozUcet(retezec) {
  const m = /^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/.exec(String(retezec || '').trim());
  if (!m) throw new Error('Číslo účtu musí mít tvar [předčíslí-]číslo/kód banky.');
  const predcisli = (m[1] || '').padStart(6, '0');
  const cislo = m[2].padStart(10, '0');
  const banka = m[3];
  if (!kontrolniSoucet(predcisli, VAHY_PREDCISLI) || !kontrolniSoucet(cislo, VAHY_CISLO)) {
    throw new Error('Číslo účtu neprochází kontrolním součtem (modulo 11). Zkontrolujte ho.');
  }
  return { predcisli, cislo, banka, zobrazeni: `${m[1] ? m[1] + '-' : ''}${m[2]}/${banka}` };
}

// ---------- IBAN ----------
const mod97 = (cislice) => {
  let r = 0;
  for (const c of cislice) r = (r * 10 + Number(c)) % 97;
  return r;
};
const naCislice = (s) => s.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));

export function vytvorIban({ banka, predcisli, cislo }) {
  const bban = banka + predcisli + cislo;
  const kontrola = 98 - mod97(naCislice(`${bban}CZ00`));
  return `CZ${String(kontrola).padStart(2, '0')}${bban}`;
}
export function ibanJePlatny(iban) {
  const s = String(iban || '').replace(/\s/g, '').toUpperCase();
  return /^CZ\d{22}$/.test(s) && mod97(naCislice(s.slice(4) + s.slice(0, 4))) === 1;
}
export const ibanPoSkupinach = (iban) => iban.replace(/(.{4})/g, '$1 ').trim();

// ---------- variabilní symbol ----------
// 10 číslic: RRMMDD (datum rezervace v Praze) + 4 náhodné číslice, první z nich nenulová. Databáze není, shodu poznám při párování plateb.
export function variabilniSymbol(now = new Date(), nahodne = () => randomInt(1000, 10000)) {
  const d = dnesPraha(now);
  const vs = `${d.slice(2, 4)}${d.slice(5, 7)}${d.slice(8, 10)}${String(nahodne()).padStart(4, '1')}`;
  if (!/^[1-9]\d{9}$/.test(vs)) throw new Error('Variabilní symbol má neplatný tvar.');
  return vs;
}

// ---------- QR Platba (SPD) ----------
// Text do SPD: bez diakritiky, velká písmena, jen povolené znaky (hvězdička by rozbila řetězec), zkrácený na max. délku.
export function textProSpd(text, max) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^0-9A-Z $%+\-./:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function spdRetezec({ iban, castka, vs, prijemce, zprava }) {
  if (!ibanJePlatny(iban)) throw new Error('IBAN je neplatný.');
  if (!/^\d{1,10}$/.test(vs)) throw new Error('Variabilní symbol musí mít 1 až 10 číslic.');
  if (!(castka > 0)) throw new Error('Částka musí být kladná.');
  const am = Number(castka).toFixed(2);
  if (am.length > 10) throw new Error('Částka je příliš vysoká pro QR Platbu.');
  const rn = textProSpd(prijemce, 35);
  const msg = textProSpd(zprava, 60);
  const casti = ['SPD', '1.0', `ACC:${iban}`, `AM:${am}`, 'CC:CZK', `X-VS:${vs}`];
  if (rn) casti.push(`RN:${rn}`);
  if (msg) casti.push(`MSG:${msg}`);
  return casti.join('*');
}
