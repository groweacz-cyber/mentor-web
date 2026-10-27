// Generátor OG obrázků 1200×630 ve stylu webu: `npm run og` (nebo `npm run og -- --force`).
// Seznam stránek vyrábí tools/gen.mjs (seo/og-pages.json). Vykresluje se v prohlížeči Edge/Chrome, který na počítači už je (bez balíčků).
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const browser = BROWSERS.find((b) => existsSync(b));
if (!browser) {
  console.error('Nenalezen Edge ani Chrome.');
  process.exit(1);
}

const pages = JSON.parse(readFileSync(join(ROOT, 'seo/og-pages.json'), 'utf8'));
const stateFile = join(ROOT, 'seo/og-state.json');
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
mkdirSync(join(ROOT, 'assets/og'), { recursive: true });

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rays = Array.from({ length: 8 }, (_, i) => `<line y1="-10" y2="-14" transform="rotate(${i * 45})"/>`).join('');
const sun = `<svg viewBox="-16 -16 32 32" width="64" height="64"><g stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round">${rays}</g><circle r="6.5" fill="#ffc83d" stroke="#f59e0b" stroke-width="1.5"/></svg>`;

function card(p) {
  const art = p.art ? pathToFileURL(join(ROOT, p.art)).href : '';
  const len = p.text.length;
  const fs = len <= 26 ? 92 : len <= 44 ? 76 : 62;
  const width = art ? 620 : 1000;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:1200px;height:630px;background:#fbf7ef;font-family:"Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:#1b2a41;position:relative;overflow:hidden}
.glow{position:absolute;right:-140px;top:-190px;width:700px;height:700px;border-radius:50%;background:radial-gradient(#fff0c4,rgba(255,240,196,0) 68%)}
.bar{position:absolute;left:0;right:0;bottom:0;height:18px;background:linear-gradient(90deg,#ef5b5b,#f5923e,#fcc934,#5bbf8a,#4aa3df,#5b6fd6,#9a6fd0)}
.brand{position:absolute;left:72px;top:54px;display:flex;align-items:center;gap:16px;font-weight:800;font-size:36px}
.main{position:absolute;left:72px;top:176px;width:${width}px}
h1{font-size:${fs}px;line-height:1.08;font-weight:800;letter-spacing:-.02em}
.sub{margin-top:26px;font-size:36px;line-height:1.3;color:#46566d;font-weight:600}
.foot{position:absolute;left:72px;bottom:56px;font-size:25px;color:#46566d;font-style:italic}
.dom{position:absolute;right:72px;bottom:54px;font-size:30px;font-weight:800}
.art.portrait{width:293px;height:440px;right:110px}
.art{position:absolute;right:72px;top:92px;width:400px;height:440px;border-radius:30px;object-fit:cover;box-shadow:0 20px 50px rgba(27,42,65,.22);border:6px solid #fff}
</style></head><body>
<div class="glow"></div>
<div class="brand">${sun}<span>OCD mentor</span></div>
<div class="main"><h1>${esc(p.text)}</h1>${p.sub ? `<p class="sub">${esc(p.sub)}</p>` : ''}</div>
${art ? `<img class="art${p.portrait ? ' portrait' : ''}" src="${art}" alt="">` : ''}
<p class="foot">Peer podpora je doplněk k odborné péči.</p>
<p class="dom">ocdmentor.cz</p>
<div class="bar"></div>
</body></html>`;
}

const pngSize = (file) => {
  const b = readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

const tmp = mkdtempSync(join(tmpdir(), 'ocd-og-'));
let made = 0;
for (const p of pages) {
  const out = join(ROOT, 'assets/og', `${p.slug}.png`);
  const hash = createHash('sha1').update(JSON.stringify(p)).digest('hex').slice(0, 12);
  if (!FORCE && existsSync(out) && state[p.slug] === hash) continue;
  const html = join(tmp, `${p.slug}.html`);
  writeFileSync(html, card(p), 'utf8');
  const r = spawnSync(
    browser,
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630', `--user-data-dir=${join(tmp, 'profile')}`, `--screenshot=${out}`, pathToFileURL(html).href],
    { timeout: 60000, stdio: 'ignore' }
  );
  if (!existsSync(out)) {
    console.error(`Selhalo: ${p.slug} (kód ${r.status})`);
    continue;
  }
  const [w, h] = pngSize(out);
  if (w !== 1200 || h !== 630) console.warn(`Pozor: ${p.slug}.png má rozměr ${w}×${h}`);
  state[p.slug] = hash;
  made++;
}
writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
rmSync(tmp, { recursive: true, force: true });
console.log(`OG obrázky: vytvořeno ${made}, celkem stránek ${pages.length}.`);
