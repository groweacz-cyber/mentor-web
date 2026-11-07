// Tracker obsesí v aplikaci: stránka ve všech jazycích, navigace, napojení na ostatní moduly a úložiště.
// Před spuštěním: npm run gen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nacti = (p) => readFileSync(join(ROOT, p), 'utf8');

test('stránka trackeru obsesí existuje česky, anglicky i slovensky, je noindex a načítá svůj modul', () => {
  for (const [p, jaz, js] of [['aplikace/obsese', 'cs', 'assets/js/app/obsessions.js'], ['en/app/obsessions', 'en', 'assets/js/en/app/obsessions.js'], ['sk/aplikacia/obsesie', 'sk', 'assets/js/sk/app/obsessions.js']]) {
    assert.ok(existsSync(join(ROOT, `${p}/index.html`)), `${p}`);
    const h = nacti(`${p}/index.html`);
    assert.ok(h.includes(`<html lang="${jaz}">`) && /name="robots" content="noindex/.test(h), `${p}: lang a noindex`);
    assert.ok(h.includes(`/${js}`), `${p}: modul ${js}`);
    assert.ok(existsSync(join(ROOT, js)), `${js} existuje`);
    assert.ok(!h.includes('cookie-banner'), `${p}: v aplikaci není lišta cookies`);
  }
});

test('navigace aplikace obsahuje Obsese před Kompulzemi a rozcestník i přehled odkazují na tracker', () => {
  const h = nacti('aplikace/denik/index.html');
  assert.ok(h.indexOf('/aplikace/obsese') > 0 && h.indexOf('/aplikace/obsese') < h.indexOf('/aplikace/kompulze'));
  assert.match(nacti('assets/js/app/vice.js'), /\/aplikace\/obsese/);
  assert.match(nacti('assets/js/app/home.js'), /\/aplikace\/obsese/);
  assert.match(nacti('assets/js/app/compulsions.js'), /\/aplikace\/obsese/);
});

test('úložiště má pole obsessions, modul zapisuje téma, sílu a čas a export obsahuje obsese', () => {
  assert.match(nacti('assets/js/app/store.js'), /obsessions: \[\]/);
  const m = nacti('assets/js/app/obsessions.js');
  assert.match(m, /d\.obsessions\.push\(\{ id: uid\(\), at: Date\.now\(\), topic, intensity \}\)/);
  assert.match(nacti('assets/js/app/export.js'), /sel\.obs && d\.obsessions\.length/);
  assert.match(nacti('assets/js/app/settings.js'), /d\.obsessions\.length/);
});
