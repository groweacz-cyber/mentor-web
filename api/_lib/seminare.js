// Programy a termíny seminářů: generování, kontrola a stav běhů.
// Společné pro generátor webu (tools/gen.mjs) a serverovou funkci (api/rezervace.js), aby web a server nikdy nesouhlasily.
import { readFileSync } from 'node:fs';

const DEN_MS = 86400000;
const DNY_V_TYDNU = { neděle: 0, pondělí: 1, úterý: 2, středa: 3, čtvrtek: 4, pátek: 5, sobota: 6 };
export const NAZVY_DNU = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
// Tvar „ve čtvrtek“, „v úterý“ apod. pro věty typu „1× týdně ve čtvrtek v 18:00“.
const DEN_S_PREDLOZKOU = { neděle: 'v neděli', pondělí: 'v pondělí', úterý: 'v úterý', středa: 've středu', čtvrtek: 've čtvrtek', pátek: 'v pátek', sobota: 'v sobotu' };
const STAVY = ['otevreno', 'obsazeno', 'pripravujeme'];

// V daném čase vedu jen jednoho klienta: mezi koncem jednoho a začátkem dalšího setkání (napříč všemi programy a běhy) musí být aspoň tato pauza.
export const MIN_ODSTUP_MIN = 90;

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
export const denSPredlozkou = (den) => DEN_S_PREDLOZKOU[den] || den;
export const formatCz = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
};
export const dlouhyCz = (iso, cas) => `${nazevDne(iso)} ${formatCz(iso)}${cas ? ` v ${cas}` : ''}`;
const minutyZCasu = (cas) => {
  const [h, m] = cas.split(':').map(Number);
  return h * 60 + m;
};

// Dnešní datum v Praze (ne v časovém pásmu serveru).
export const dnesPraha = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

// ---------- generování a kontrola ----------
// Termíny po 7 dnech od prvního data (počet podle programu). Vynechané datum se přeskočí, další termín pak následuje o týden později.
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

// Selže s jasnou chybou, pokud jsou data špatně: chybný formát, termín na vynechaném datu, překrytí nebo příliš malý odstup
// jakýchkoli dvou setkání (napříč všemi programy a běhy).
export function zkontrolujData(data) {
  const chyby = [];
  const vynechane = data.vynechaneDatumy || [];
  for (const v of vynechane) {
    try { parseDatum(v); } catch (e) { chyby.push(`vynechaneDatumy: ${e.message}`); }
  }
  for (const pole of ['uzavreniDniPredZacatkem', 'splatnostDni']) {
    if (!Number.isInteger(data[pole]) || data[pole] < 0) chyby.push(`${pole} musí být nezáporné celé číslo.`);
  }
  if (!Array.isArray(data.programy) || !data.programy.length) chyby.push('programy musí být neprázdné pole.');

  const programIds = new Set();
  const behIds = new Set();
  const setkani = [];
  for (const program of data.programy || []) {
    const pkdo = `Program „${program.id || program.nazev || '?'}“`;
    if (!/^[a-z0-9-]+$/.test(program.id || '')) chyby.push(`${pkdo}: id smí obsahovat jen malá písmena, číslice a pomlčku.`);
    if (programIds.has(program.id)) chyby.push(`${pkdo}: id se opakuje.`);
    programIds.add(program.id);
    for (const pole of ['nazev', 'podtitul']) {
      if (typeof program[pole] !== 'string' || !program[pole].trim()) chyby.push(`${pkdo}: chybí ${pole}.`);
    }
    if (!Number.isInteger(program.cena) || program.cena <= 0) chyby.push(`${pkdo}: cena musí být kladné celé číslo.`);
    if (!Number.isInteger(program.pocetSetkani) || program.pocetSetkani < 1) chyby.push(`${pkdo}: pocetSetkani musí být kladné celé číslo.`);
    if (!Number.isInteger(program.delkaMinut) || program.delkaMinut < 15) chyby.push(`${pkdo}: delkaMinut musí být celé číslo (aspoň 15).`);
    const casOk = /^([01]\d|2[0-3]):[0-5]\d$/.test(program.cas || '');
    if (!casOk) chyby.push(`${pkdo}: cas musí mít tvar HH:MM.`);
    const denOk = program.den in DNY_V_TYDNU;
    if (!denOk) chyby.push(`${pkdo}: den „${program.den}“ není název dne v týdnu.`);
    if (!Array.isArray(program.behy) || !program.behy.length) {
      chyby.push(`${pkdo}: behy musí být neprázdné pole.`);
      continue;
    }

    for (const beh of program.behy) {
      const kdo = `${pkdo}, běh „${beh.id || '?'}“`;
      if (!/^[a-z0-9-]+$/.test(beh.id || '')) chyby.push(`${kdo}: id smí obsahovat jen malá písmena, číslice a pomlčku.`);
      if (behIds.has(beh.id)) chyby.push(`${kdo}: id se opakuje.`);
      behIds.add(beh.id);
      if (!STAVY.includes(beh.stav)) chyby.push(`${kdo}: stav musí být ${STAVY.join(', ')} (je „${beh.stav}“).`);
      if (!denOk || !casOk || !Number.isInteger(program.pocetSetkani) || program.pocetSetkani < 1 || !Number.isInteger(program.delkaMinut)) continue;
      try { parseDatum(beh.prvniDatum); } catch (e) { chyby.push(`${kdo}: ${e.message}`); continue; }
      if (denVTydnu(beh.prvniDatum) !== DNY_V_TYDNU[program.den]) chyby.push(`${kdo}: první datum ${beh.prvniDatum} není ${program.den}.`);
      if (vynechane.includes(beh.prvniDatum)) {
        chyby.push(`${kdo}: první termín ${formatCz(beh.prvniDatum)} spadá na vynechané datum. Zvolte jiné první datum.`);
        continue;
      }
      for (const t of terminyBehu(beh, vynechane, program.pocetSetkani)) {
        if (vynechane.includes(t)) chyby.push(`${kdo}: termín ${formatCz(t)} spadá na vynechané datum.`);
        const zacatek = parseDatum(t) / 60000 + minutyZCasu(program.cas);
        setkani.push({ kdo, datum: t, cas: program.cas, zacatek, konec: zacatek + program.delkaMinut });
      }
    }
  }

  // Jedno setkání nesmí splývat s jiným ani být blíž než MIN_ODSTUP_MIN minut od konce předchozího.
  setkani.sort((a, b) => a.zacatek - b.zacatek);
  for (let i = 0; i < setkani.length; i++) {
    for (let j = i + 1; j < setkani.length && setkani[j].zacatek < setkani[i].konec + MIN_ODSTUP_MIN; j++) {
      const a = setkani[i];
      const b = setkani[j];
      const preryti = b.zacatek < a.konec ? 'se překrývá s' : `je blíž než ${MIN_ODSTUP_MIN} minut od`;
      chyby.push(`Setkání ${dlouhyCz(b.datum, b.cas)} (${b.kdo}) ${preryti} setkáním ${dlouhyCz(a.datum, a.cas)} (${a.kdo}).`);
    }
  }
  if (chyby.length) throw new Error(`Neplatná data seminářů (data/seminare.json):\n- ${chyby.join('\n- ')}`);
  return true;
}

// Vrátí programy s vypočítanými termíny každého běhu a datem, od kterého je běh uzavřený pro rezervace.
export function pripravProgramy(data) {
  zkontrolujData(data);
  return data.programy.map((program) => ({
    ...program,
    behy: program.behy.map((beh, i) => ({
      ...beh,
      programId: program.id,
      nazev: `Běh ${i + 1}`,
      den: program.den,
      cas: program.cas,
      terminy: terminyBehu(beh, data.vynechaneDatumy, program.pocetSetkani),
      uzavreniOd: pridejDny(beh.prvniDatum, -data.uzavreniDniPredZacatkem),
    })),
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
