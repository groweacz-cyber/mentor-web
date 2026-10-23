// Ikony webové aplikace (PWA): `node tools/icons.mjs`. Vykresluje se v Edge/Chrome, zmenšení dělá npx sharp-cli.
import { existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const browser = BROWSERS.find((b) => existsSync(b));
if (!browser) throw new Error('Nenalezen Edge ani Chrome.');

const outDir = join(ROOT, 'assets/icons');
mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'ocd-icons-'));
const rays = Array.from({ length: 8 }, (_, i) => `<line y1="-10" y2="-14" transform="rotate(${i * 45})"/>`).join('');
// scale = podíl plochy, který zabere slunce (maskable ikona potřebuje bezpečnou zónu)
const page = (scale) => `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}body{width:512px;height:512px;background:#1b2a41;display:grid;place-items:center;overflow:hidden}svg{width:${Math.round(512 * scale)}px;height:${Math.round(512 * scale)}px}</style></head><body><svg viewBox="-16 -16 32 32"><g stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round">${rays}</g><circle r="6.5" fill="#ffc83d" stroke="#f59e0b" stroke-width="1.5"/></svg></body></html>`;

function shot(scale, file) {
  const html = join(tmp, `${file}.html`);
  writeFileSync(html, page(scale), 'utf8');
  const out = join(outDir, file);
  spawnSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=512,512', `--user-data-dir=${join(tmp, 'p')}`, `--screenshot=${out}`, pathToFileURL(html).href], { timeout: 60000, stdio: 'ignore' });
  if (!existsSync(out)) throw new Error(`Selhalo: ${file}`);
}

shot(0.8, 'icon-512.png');
shot(0.58, 'icon-maskable-512.png');
for (const [size, name] of [[192, 'icon-192.png'], [180, 'apple-touch-icon.png']]) {
  const r = spawnSync('npx', ['-y', 'sharp-cli', '-i', join(outDir, 'icon-512.png'), '-o', join(outDir, name), 'resize', String(size), String(size)], { shell: true, timeout: 120000 });
  if (r.status !== 0) copyFileSync(join(outDir, 'icon-512.png'), join(outDir, name));
}
rmSync(tmp, { recursive: true, force: true });
console.log('Ikony vytvořeny v assets/icons');
