// Kontrola vstupu rezervačního formuláře na serveru. Nikdy se nespoléhá na klienta.
const ZNAKY_OVLADACI = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/;
const JMENO = /^\p{L}[\p{L}\p{M} '’.\-]{0,49}$/u;
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export const MIN_DOBA_VYPLNENI_MS = 4000;

// Telefon: číslice, mezery, pomlčky, závorky a „+“ na začátku. Číslo bez předvolby je české (+420). Vrací tvar +420777123456 nebo null.
const TELEFON_ZNAKY = /^[0-9 +()\-./]{1,30}$/;
export function normalizujTelefon(v) {
  if (typeof v !== 'string' || !TELEFON_ZNAKY.test(v)) return null;
  let t = v.replace(/[\s().\-/]/g, '');
  if (t.startsWith('00')) t = `+${t.slice(2)}`;
  if (/^\d{9}$/.test(t)) t = `+420${t}`;
  return /^\+[1-9]\d{8,14}$/.test(t) ? t : null;
}

const retezec = (v) => (typeof v === 'string' ? v.trim() : null);

// Vrací { ok: true, hodnoty } nebo { ok: false, kod, chyby: { pole: kod } }.
export function validujRezervaci(vstup, znameBehy) {
  const chyby = {};
  if (!vstup || typeof vstup !== 'object' || Array.isArray(vstup)) return { ok: false, kod: 'neplatny-pozadavek', chyby: {} };

  // Past na roboty: pole, které člověk nevidí, musí zůstat prázdné.
  if (vstup.web !== undefined && vstup.web !== '') return { ok: false, kod: 'neplatny-pozadavek', chyby: {} };
  // Příliš rychlé odeslání (formulář nejde vyplnit za pár sekund).
  const doba = Number(vstup.doba);
  if (!Number.isFinite(doba) || doba < MIN_DOBA_VYPLNENI_MS) return { ok: false, kod: 'prilis-rychle', chyby: {} };

  const jmeno = retezec(vstup.jmeno);
  const prijmeni = retezec(vstup.prijmeni);
  const email = retezec(vstup.email);
  const email2 = retezec(vstup.email2);
  const telefon = retezec(vstup.telefon);
  const beh = retezec(vstup.beh);

  for (const [pole, hodnota] of [['jmeno', jmeno], ['prijmeni', prijmeni], ['email', email], ['email2', email2], ['telefon', telefon], ['beh', beh]]) {
    if (hodnota === null || hodnota === '') chyby[pole] = 'povinne';
    else if (ZNAKY_OVLADACI.test(hodnota)) chyby[pole] = 'neplatne-znaky';
  }
  if (!chyby.jmeno && !JMENO.test(jmeno)) chyby.jmeno = 'neplatne';
  if (!chyby.prijmeni && !JMENO.test(prijmeni)) chyby.prijmeni = 'neplatne';
  if (!chyby.email && (email.length > 254 || !EMAIL.test(email))) chyby.email = 'neplatne';
  if (!chyby.email2 && !chyby.email && email.toLowerCase() !== email2.toLowerCase()) chyby.email2 = 'neshoduji-se';
  const telefonNormalizovany = chyby.telefon ? null : normalizujTelefon(telefon);
  if (!chyby.telefon && !telefonNormalizovany) chyby.telefon = 'neplatne';
  if (!chyby.beh && !znameBehy.includes(beh)) chyby.beh = 'neznamy-beh';

  for (const pole of ['souhlasZpracovani', 'souhlasPovaha', 'souhlasPodminky']) {
    if (vstup[pole] !== true) chyby[pole] = 'povinne';
  }

  if (Object.keys(chyby).length) return { ok: false, kod: 'neplatny-vstup', chyby };
  return { ok: true, hodnoty: { jmeno, prijmeni, email: email.toLowerCase(), telefon: telefonNormalizovany, beh } };
}
