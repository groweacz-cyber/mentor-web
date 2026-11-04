// Slovník skriptů čeština → angličtina: sloučí všechny soubory tools/i18n/en-js/*.mjs (každý exportuje pole dvojic [cs, en]).
// Klíčem je hodnota řetězce (u šablon s výrazy text se zástupci {1}, {2}…, u regulárních výrazů jeho zápis i s lomítky).
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const zaklad = dirname(fileURLToPath(import.meta.url));
const dir = join(zaklad, 'en-js');
const pary = [];
for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
  const modul = await import(pathToFileURL(join(dir, f)).href);
  pary.push(...modul.default);
}
export const ignore = JSON.parse(readFileSync(join(zaklad, 'js-ignore.json'), 'utf8'));
export default pary;
