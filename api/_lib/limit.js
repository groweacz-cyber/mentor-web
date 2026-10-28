// Jednoduchý rate limit v paměti funkce (bez databáze). Platí pro jednu běžící instanci, takže je to ochrana před
// zahlcením, ne absolutní pojistka. IP adresa se neukládá, drží se jen její zkrácený otisk a jen po dobu okna.
import { createHash } from 'node:crypto';

const zaznamy = new Map();
const MAX_KLICU = 2000;

export const otisk = (ip) => createHash('sha256').update(String(ip || 'neznama')).digest('hex').slice(0, 16);

// Vrátí true, pokud je limit pro daný klíč překročen. Každé volání se počítá (i neúspěšné).
export function limitPrekrocen(klic, { max = 5, oknoMs = 15 * 60 * 1000, ted = Date.now() } = {}) {
  if (zaznamy.size > MAX_KLICU) {
    for (const [k, casy] of zaznamy) if (!casy.some((t) => ted - t < oknoMs)) zaznamy.delete(k);
    if (zaznamy.size > MAX_KLICU) zaznamy.clear();
  }
  const casy = (zaznamy.get(klic) || []).filter((t) => ted - t < oknoMs);
  casy.push(ted);
  zaznamy.set(klic, casy);
  return casy.length > max;
}

export const vynulujLimity = () => zaznamy.clear();
