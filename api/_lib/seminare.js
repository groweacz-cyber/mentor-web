// Termíny seminářů: generování, kontrola a stav běhů.
// Společné pro generátor webu (tools/gen.mjs) a serverovou funkci (api/rezervace.js), aby web a server nikdy nesouhlasily.
import { readFileSync } from 'node:fs';

const DEN_MS = 86400000;
const DNY_V_TYDNU = { neděle: 0, pondělí: 1, úterý: 2, středa: 3, čtvrtek: 4, pátek: 5, sobota: 6 };
export const NAZVY_DNU = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const STAVY = ['otevreno', 'obsazeno', 'pripravujeme'];

export const nactiData = () => JSON.parse(readFileSync(new URL('../../data/seminare.json', import.meta.url), 'utf8'));

// ---------- práce s daty ve tvaru RRRR-MM-DD (bez časových pásem) ----------
export function parseDatum(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error(`Neplatné datum „${iso}“, očekává se RRRR-MM-DD.`);
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) throw new Error(`Neexistující datum „${iso}“.`);
  return t;
}
export const formatIso = (t) => new Date(t).toISOString().slice(0, 10);
export const pridejDny = (iso, n) => formatIso(parseDatum(iso) + n * DEN_MS);
export const denVTydnu = (iso) => new Date(parseDatum(iso)).getUTCDay();
export const nazevDne = (iso) => NAZVY_DNU[denVTydnu(iso)];
export const formatCz = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};
export const dlouhyCz = (iso, cas) => `${nazevDne(iso)} ${formatCz(iso)}${cas ? ` v ${cas}` : ''}`;

// Dnešní datum v Praze (ne v časovém pásmu serveru).
export const dnesPraha = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

// ---------- generování a kontrola ----------
// Pět termínů po 7 dnech od prvního data. Vynechané datum se přeskočí, další termín pak následuje o týden později.
export function terminyBehu(beh, vynechane = [], pocet = 5) {
  const preskocit = new Set(vynechane);
  const out = [];
  let d = beh.prvniDatum;
  while (out.length < pocet) {
    if (!preskocit.has(d)) out.push(d);
    d = pridejDny(d, 7);
  }
  return out;
}

// Selže s jasnou chybou, pokud jsou data špatně (chybný formát, překrytí běhů, termín na vynechaném datu).
export function zkontrolujData(data) {
  const chyby = [];
  const vynechane = data.vynechaneDatumy || [];
  for (const v of vynechane) {
    try { parseDatum(v); } catch (e) { chyby.push(`vynechaneDatumy: ${e.message}`); }
  }
  if (!Number.isInteger(data.cena) || data.cena <= 0) chyby.push('cena musí být kladné celé číslo.');
  if (!Number.isInteger(data.pocetSetkani) || data.pocetSetkani < 1) chyby.push('pocetSetkani musí být kladné celé číslo.');
  if (!Array.isArray(data.behy) || !data.behy.length) chyby.push('behy musí být neprázdné pole.');

  const ids = new Set();
  const rozsahy = [];
  for (const beh of data.behy || []) {
    const kdo = `Běh „${beh.id || beh.nazev || '?'}“`;
    if (!/^[a-z0-9-]+$/.test(beh.id || '')) chyby.push(`${kdo}: id smí obsahovat jen malá písmena, číslice a pomlčku.`);
    if (ids.has(beh.id)) chyby.push(`${kdo}: id se opakuje.`);
    ids.add(beh.id);
    if (!STAVY.includes(beh.stav)) chyby.push(`${kdo}: stav musí být ${STAVY.join(', ')} (je „${beh.stav}“).`);
    if (!/^\d{2}:\d{2}$/.test(beh.cas || '')) chyby.push(`${kdo}: cas musí mít tvar HH:MM.`);
    if (!(beh.den in DNY_V_TYDNU)) {
      chyby.push(`${kdo}: den „${beh.den}“ není název dne v týdnu.`);
      continue;
    }
    let prvni;
    try { prvni = parseDatum(beh.prvniDatum); } catch (e) { chyby.push(`${kdo}: ${e.message}`); continue; }
    if (denVTydnu(beh.prvniDatum) !== DNY_V_TYDNU[beh.den]) chyby.push(`${kdo}: první datum ${beh.prvniDatum} není ${beh.den}.`);
    if (vynechane.includes(beh.prvniDatum)) {
      chyby.push(`${kdo}: první termín ${formatCz(beh.prvniDatum)} spadá na vynechané datum. Zvolte jiné první datum.`);
      continue;
    }
    const terminy = terminyBehu(beh, vynechane, data.pocetSetkani);
    for (const t of terminy) if (vynechane.includes(t)) chyby.push(`${kdo}: termín ${formatCz(t)} spadá na vynechané datum.`);
    rozsahy.push({ beh, od: prvni, do: parseDatum(terminy[terminy.length - 1]), terminy });
  }

  // Běhy nesmí splývat ani se překrývat: v daném čase vedu jen jednoho klienta.
  rozsahy.sort((a, b) => a.od - b.od);
  for (let i = 1; i < rozsahy.length; i++) {
    const a = rozsahy[i - 1];
    const b = rozsahy[i];
    if (b.od <= a.do) {
      chyby.push(`Běhy „${a.beh.id}“ (${formatCz(a.beh.prvniDatum)} až ${formatCz(formatIso(a.do))}) a „${b.beh.id}“ (od ${formatCz(b.beh.prvniDatum)}) se překrývají.`);
    }
  }
  if (chyby.length) throw new Error(`Neplatná data termínů seminářů (data/seminare.json):\n- ${chyby.join('\n- ')}`);
  return true;
}

// Vrátí běhy s vypočítanými termíny a datem, od kterého je běh uzavřený pro rezervace.
export function pripravBehy(data) {
  zkontrolujData(data);
  return data.behy.map((beh) => ({
    ...beh,
    terminy: terminyBehu(beh, data.vynechaneDatumy, data.pocetSetkani),
    uzavreniOd: pridejDny(beh.prvniDatum, -data.uzavreniDniPredZacatkem),
  }));
}

// Stav běhu k danému okamžiku: otevreno | uzavreno | obsazeno | pripravujeme.
export function stavBehu(beh, data, now = new Date()) {
  if (beh.stav === 'obsazeno') return 'obsazeno';
  if (beh.stav === 'pripravujeme') return 'pripravujeme';
  return dnesPraha(now) >= pridejDny(beh.prvniDatum, -data.uzavreniDniPredZacatkem) ? 'uzavreno' : 'otevreno';
}

// Splatnost: stanovený počet dní od rezervace.
export const splatnost = (data, now = new Date()) => pridejDny(dnesPraha(now), data.splatnostDni);
