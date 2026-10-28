// Vývojový server: statické soubory + /api/rezervace (e-maily se jen ukládají do tools/.outbox).
// Hlavičky z vercel.json (včetně CSP) se přidávají stejně jako na Vercelu, takže se dá ověřit, že nic nerozbíjejí.
// Spuštění: npm run dev          (výchozí port 8920)
//           npm run dev -- --port 3000 --real-mail    (--real-mail = e-maily opravdu odeslat přes SMTP, potřeba SMTP_PASSWORD)
import http from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { nactiEnvLocal } from './env.mjs';
import { ibanPoSkupinach, rozlozUcet, vytvorIban } from '../api/_lib/platba.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const PORT = Number(argv[argv.indexOf('--port') + 1]) || 8920;
const REAL_MAIL = argv.includes('--real-mail');
const OUTBOX = join(ROOT, 'tools', '.outbox');

if (nactiEnvLocal()) console.log('Načteno .env.local');
if (!REAL_MAIL) {
  process.env.MAIL_OUTBOX_DIR = OUTBOX;
}
process.env.ALLOWED_ORIGINS = `http://localhost:${PORT},http://127.0.0.1:${PORT}`;
process.env.SITE_URL = `http://localhost:${PORT}`;

const TYPY = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.ics': 'text/calendar; charset=utf-8',
};

const globalniHlavicky = () => {
  try {
    const v = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
    return (v.headers || []).filter((h) => h.source === '/(.*)' && !h.has).flatMap((h) => h.headers.map((x) => [x.key, x.value]));
  } catch {
    return [];
  }
};

const cteni = (req, limit = 100000) =>
  new Promise((ok, chyba) => {
    const casti = [];
    let n = 0;
    req.on('data', (c) => { n += c.length; if (n > limit) { chyba(new Error('velke telo')); req.destroy(); } else casti.push(c); });
    req.on('end', () => ok(Buffer.concat(casti).toString('utf8')));
    req.on('error', chyba);
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  for (const [k, v] of globalniHlavicky()) res.setHeader(k, v);
  try {
    if (url.pathname === '/__stop' && req.method === 'POST') { res.end('bye'); setTimeout(() => process.exit(0), 100); return; }
    if (url.pathname === '/api/rezervace') {
      const { default: handler } = await import(`${pathToFileURL(join(ROOT, 'api', 'rezervace.js')).href}?t=${Date.now()}`);
      const surove = req.method === 'POST' ? await cteni(req) : '';
      req.body = /json/i.test(req.headers['content-type'] || '') && surove ? (() => { try { return JSON.parse(surove); } catch { return surove; } })() : surove || undefined;
      return await handler(req, res);
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    else if (!extname(rel)) rel += '/index.html';
    const soubor = resolve(ROOT, '.' + rel);
    if (!soubor.startsWith(ROOT + sep) || /[\\/](tools|seo|\.git|node_modules)[\\/]/.test(soubor.slice(ROOT.length)) || !existsSync(soubor) || !statSync(soubor).isFile()) {
      res.writeHead(404, { 'Content-Type': TYPY['.html'], 'Cache-Control': 'no-store' });
      return res.end(readFileSync(join(ROOT, '404.html')));
    }
    res.writeHead(200, { 'Content-Type': TYPY[extname(soubor)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(readFileSync(soubor));
  } catch (e) {
    console.error('[dev-server]', e.message);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Chyba dev serveru');
  }
});

server.listen(PORT, () => {
  console.log(`Vývojový server běží na http://localhost:${PORT}`);
  console.log(REAL_MAIL ? 'E-maily se ODESÍLAJÍ přes SMTP.' : 'E-maily se neodesílají, ukládají se do tools/.outbox.');
  // IBAN k porovnání s internetovým bankovnictvím (QR kód na potvrzovací stránce obsahuje právě tento IBAN)
  if (process.env.BANK_ACCOUNT) {
    try {
      const ucet = rozlozUcet(process.env.BANK_ACCOUNT);
      console.log(`Účet ${ucet.zobrazeni}, IBAN pro QR platbu: ${ibanPoSkupinach(vytvorIban(ucet))}`);
    } catch (e) {
      console.log(`BANK_ACCOUNT: ${e.message}`);
    }
  } else {
    console.log('BANK_ACCOUNT není nastaven (.env.local), rezervace vrátí chybu konfigurace.');
  }
});
