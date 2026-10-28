// Načtení .env.local do process.env (jen lokální vývoj a testy). Už nastavené proměnné se nepřepisují.
import { existsSync, readFileSync } from 'node:fs';

export function nactiEnvLocal(soubor = new URL('../.env.local', import.meta.url)) {
  if (!existsSync(soubor)) return false;
  for (const radek of readFileSync(soubor, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(radek);
    if (!m || radek.trim().startsWith('#')) continue;
    const hodnota = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = hodnota;
  }
  return true;
}
