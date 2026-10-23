// SEO audit statických stránek: `npm run audit`. Bez závislostí, jen čte vygenerované HTML.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://ocdmentor.cz';
const SKIP = new Set(['node_modules', '.git', '.vercel', 'tools', 'seo', 'assets']);

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const pages = {};
const problems = [];
const warn = (page, msg) => problems.push(`${page}: ${msg}`);

const urlOf = (f) => {
  const r = relative(ROOT, f).split(sep).join('/');
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'/index.html'.length);
  return '/' + r.replace(/\.html$/, '');
};
const decode = (t) => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const strip = (t) => decode(t.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const url = urlOf(f);
  const get = (re) => (html.match(re) || [])[1];
  const robots = get(/<meta name="robots" content="([^"]*)"/);
  pages[url] = {
    file: f,
    html,
    title: get(/<title>([\s\S]*?)<\/title>/),
    desc: get(/<meta name="description" content="([^"]*)"/),
    canonical: get(/<link rel="canonical" href="([^"]*)"/),
    robots,
    noindex: !!robots && /noindex/.test(robots),
    lang: get(/<html lang="([^"]*)"/),
    h1: [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => strip(m[1])),
    ids: new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])),
  };
}

const titleSeen = {}, descSeen = {};
const resolveUrl = (u) => {
  const clean = u.replace(/[?#].*$/, '').replace(/\/$/, '') || '/';
  if (pages[clean]) return clean;
  const rel = clean.replace(/^\//, '');
  if (rel && existsSync(join(ROOT, rel)) && statSync(join(ROOT, rel)).isFile()) return 'file';
  return null;
};

for (const [url, p] of Object.entries(pages)) {
  const name = url;
  const title = p.title ? decode(p.title) : '';
  const desc = p.desc ? decode(p.desc) : '';
  if (!title) warn(name, 'chybí <title>');
  else {
    if (title.length > 60) warn(name, `title má ${title.length} znaků (cíl do 60): "${title}"`);
    if (!/ \| ocdmentor\.cz$/.test(title) && url !== '/') warn(name, `title nemá formát „Téma | ocdmentor.cz“: "${title}"`);
    (titleSeen[title] ||= []).push(name);
  }
  if (!desc) warn(name, 'chybí meta description');
  else if (!p.noindex) {
    if (desc.length < 120 || desc.length > 160) warn(name, `description má ${desc.length} znaků (cíl 120–160)`);
    (descSeen[desc] ||= []).push(name);
  }
  if (p.h1.length !== 1) warn(name, `počet H1: ${p.h1.length}`);
  if (p.lang !== 'cs') warn(name, 'chybí lang="cs"');
  if (!p.noindex) {
    if (!p.canonical) warn(name, 'chybí canonical');
    else if (p.canonical !== SITE + (url === '/' ? '/' : url)) warn(name, `canonical nesedí: ${p.canonical}`);
    if (!/property="og:image"/.test(p.html)) warn(name, 'chybí og:image');
    if (!/name="twitter:image"/.test(p.html)) warn(name, 'chybí twitter:image');
    if (!/application\/ld\+json/.test(p.html)) warn(name, 'bez strukturovaných dat');
  }
  // strukturovaná data
  for (const m of p.html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const types = (j['@graph'] || [j]).map((n) => n['@type']);
      if (!p.noindex && url !== '/' && !types.includes('BreadcrumbList')) warn(name, 'JSON-LD bez BreadcrumbList');
      if (types.some((t) => /Medical|Physician|AggregateRating|Review/.test(String(t)))) warn(name, 'JSON-LD obsahuje zakázaný typ: ' + types.join(','));
    } catch (e) {
      warn(name, 'JSON-LD není validní JSON: ' + e.message);
    }
  }
  // obrázky
  for (const m of p.html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt=/.test(tag)) warn(name, `<img> bez alt: ${tag.slice(0, 80)}`);
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) warn(name, `<img> bez width/height: ${tag.slice(0, 80)}`);
  }
  // odkazy
  for (const m of p.html.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/g)) {
    const href = m[1];
    if (/^(mailto:|tel:|javascript:)/.test(href)) continue;
    if (/^https?:\/\//.test(href)) {
      if (/target="_blank"/.test(m[0]) && !/rel="[^"]*noopener/.test(m[0])) warn(name, `externí odkaz bez rel=noopener: ${href}`);
      continue;
    }
    if (href.startsWith('#')) {
      if (href.length > 1 && !p.ids.has(href.slice(1))) warn(name, `kotva ${href} na stránce neexistuje`);
      continue;
    }
    if (!href.startsWith('/')) { warn(name, `relativní odkaz ${href}`); continue; }
    const t = resolveUrl(href);
    if (!t) warn(name, `rozbitý odkaz ${href}`);
    else if (href.includes('#') && t !== 'file' && !pages[t].ids.has(href.split('#')[1])) warn(name, `kotva v odkazu ${href} neexistuje`);
  }
  // obsah doplňovaný jen JavaScriptem (prázdné kořeny)
  for (const id of p.noindex ? [] : ['lp-root', 'kviz-root', 'app-root']) {
    const re = new RegExp(`<div id="${id}"[^>]*>\\s*</div>`);
    if (re.test(p.html)) warn(name, `obsah #${id} se vykresluje jen JavaScriptem`);
  }
  if (/id="pd-text"[^>]*>\s*<\/p>/.test(p.html)) warn(name, 'princip dne (#pd-text) se vykresluje jen JavaScriptem');
}

for (const [t, ps] of Object.entries(titleSeen)) if (ps.length > 1) problems.push(`DUPLICITNÍ title „${t}“: ${ps.join(', ')}`);
for (const [d, ps] of Object.entries(descSeen)) if (ps.length > 1) problems.push(`DUPLICITNÍ description (${d.slice(0, 50)}…): ${ps.join(', ')}`);

// sitemap
const sm = existsSync(join(ROOT, 'sitemap.xml')) ? readFileSync(join(ROOT, 'sitemap.xml'), 'utf8') : '';
const smUrls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
for (const u of smUrls) {
  const path = u.replace(SITE, '') || '/';
  if (!pages[path]) problems.push(`sitemap: ${u} nemá stránku`);
  else if (pages[path].noindex) problems.push(`sitemap: ${u} je noindex`);
}
for (const [url, p] of Object.entries(pages)) {
  if (!p.noindex && !smUrls.includes(SITE + (url === '/' ? '/' : url)) && url !== '/404') problems.push(`sitemap: chybí ${url}`);
}

// příchozí odkazy: každá stránka (mimo aplikaci a interní přehled) má mít aspoň 3 odkazy z jiných stránek
const inbound = {};
for (const [url, p] of Object.entries(pages)) {
  const seen = new Set();
  for (const m of p.html.matchAll(/<a\b[^>]*\bhref="(\/[^"#?]*)/g)) {
    const to = m[1].replace(/\/$/, '') || '/';
    if (to !== url && !seen.has(to)) {
      seen.add(to);
      (inbound[to] ||= new Set()).add(url);
    }
  }
}
for (const [url] of Object.entries(pages)) {
  if (url === '/' || url === '/404' || url.startsWith('/aplikace') || url.startsWith('/sablony') || url === '/koncepty') continue;
  const n = inbound[url] ? inbound[url].size : 0;
  if (n < 3) problems.push(`málo příchozích odkazů (${n}): ${url}`);
}

console.log(`Stránek: ${Object.keys(pages).length}, indexovatelných: ${Object.values(pages).filter((p) => !p.noindex).length}`);
console.log(problems.length ? `\nProblémy (${problems.length}):\n- ` + problems.join('\n- ') : '\nŽádné problémy.');
process.exitCode = problems.length ? 1 : 0;
