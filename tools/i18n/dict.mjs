// Slovník čeština → angličtina: sloučí všechny soubory tools/i18n/en/*.mjs (každý exportuje pole dvojic [cs, en]).
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'en');
const pary = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
  const modul = await import(pathToFileURL(join(dir, f)).href);
  pary.push(...modul.default);
}
export default pary;
