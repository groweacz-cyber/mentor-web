// IndexNow: odešle URL ze sitemap.xml Seznamu a Bingu. Spouštějte až PO nasazení webu: `npm run indexnow`.
// `npm run indexnow -- --dry-run` jen vypíše, co by se odeslalo.
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://ocdmentor.cz';
const HOST = 'ocdmentor.cz';
const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const ENDPOINTS = ['https://search.seznam.cz/indexnow', 'https://api.indexnow.org/indexnow'];

const { indexnowKey: key } = JSON.parse(readFileSync(join(ROOT, 'tools/config.json'), 'utf8'));
if (!key) {
  console.error('V tools/config.json chybí indexnowKey.');
  process.exit(1);
}
const keyLocation = `${SITE}/${key}.txt`;
const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

console.log(`URL ke odeslání: ${urlList.length}`);
urlList.forEach((u) => console.log(' -', u));
if (DRY) process.exit(0);

// Bez nasazeného klíčového souboru by vyhledávače odeslání zamítly.
try {
  const r = await fetch(keyLocation);
  const body = (await r.text()).trim();
  if (!r.ok || body !== key) throw new Error(`HTTP ${r.status}`);
} catch (e) {
  console.error(`Klíčový soubor ${keyLocation} není na webu dostupný (${e.message}). Nejdřív web nasaďte, nebo použijte --force.`);
  if (!FORCE) process.exit(1);
}

for (const endpoint of ENDPOINTS) {
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
    });
    console.log(`${endpoint} -> ${r.status} ${r.statusText}`);
  } catch (e) {
    console.error(`${endpoint} -> chyba: ${e.message}`);
  }
}
console.log('Hotovo. Kódy 200 a 202 znamenají přijato.');
