// Anglické kopie skriptů webu (assets/js/en/…). Z každého zdrojového skriptu se vyjmou řetězcové literály, šablonové řetězce
// a regulární výrazy s českým textem a nahradí se překladem ze slovníku tools/i18n/en-js/*.mjs. Logika skriptu zůstává beze změny.
// Co ve slovníku chybí, zůstane česky a zapíše se do tools/i18n/chybejici-js.json (test pak selže, dokud slovník není úplný).
import { rozeber } from './jsliterals.mjs';
import { normText, bezZnacek } from './translate.mjs';

const DIA = /[ěščřžýáíéúůďťňĚŠČŘŽÝÁÍÉÚŮĎŤŇ]/;
const JEDNO_SLOVO = /^[A-Z][a-z]{3,}$/;
const VETA = /^[A-Z][a-z]+[ ,.!?…–][A-Za-z0-9 ,.!?…–'’()%/+-]*$/;
const CESKA_SLOVA = /(^|\s)(nebo|pro|jsem|není|když|jen|bez|při|ještě|že|jak|aby|ale|jako|také|tento|tato|tuto|ve|se|je|na|do|od|ze)(\s|[.,:;!?]|$)/;

// Český text, který má smysl překládat. Cokoli, co vypadá jako text a ve slovníku není, se hlásí jako chybějící.
export const jeCesky = (t) => {
  const s = t.trim();
  if (!/\p{L}/u.test(s)) return false;
  return DIA.test(s) || JEDNO_SLOVO.test(s) || VETA.test(s) || CESKA_SLOVA.test(s);
};

// Zápis klíče do jednoho řádku (soubor s dávkami k překladu) a zpět.
export const kodujKlic = (s) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
export const dekodujKlic = (s) => s.replace(/\\(\\|n|t)/g, (_m, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : '\\'));

const uvozovka = (hodnota, q) =>
  q + hodnota.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q).replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + q;
const uvozeniSablony = (t) => t.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
const vyrobHodnotu = (zdroj) => new Function('"use strict"; return ' + zdroj)();
const kvaziNaText = (kv) => new Function('return `' + kv + '`')();

const znacky = (t) => [...t.matchAll(/\{\d+\}/g)].map((x) => x[0]).sort().join('');
const htmlZnacky = (t) => [...t.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)/g)].map((x) => x[0].toLowerCase()).sort().join('');

// htmlPairs: slovník HTML stránek; texty skriptů, které se shodují s některou celou jednotkou stránek, se berou odtud (bez značek).
export function createJsTranslator({ dictPairs, ignore = [], htmlPairs = [] }) {
  const dict = new Map(dictPairs);
  const zHtml = new Map(htmlPairs.map(([cz, en]) => [normText(bezZnacek(cz)), normText(bezZnacek(en))]));
  const ignorovat = new Set(ignore);

  function preloz(src, soubor, hlaseni) {
    const casti = rozeber(src);
    let out = '';
    for (const c of casti) {
      if (c.typ === 'kod') { out += c.zdroj; continue; }
      if (c.typ === 'retezec') {
        const hodnota = vyrobHodnotu(c.zdroj);
        const jadro = hodnota.trim();
        const lead = hodnota.slice(0, hodnota.length - hodnota.trimStart().length);
        const trail = hodnota.slice(hodnota.trimEnd().length);
        const presne = dict.get(hodnota);
        const enJadro = presne !== undefined || !jadro ? undefined : dict.get(jadro) ?? zHtml.get(normText(jadro));
        if (presne !== undefined) {
          out += uvozovka(presne, c.uvozovka);
        } else if (enJadro !== undefined) {
          out += uvozovka(lead + enJadro + trail, c.uvozovka);
        } else {
          if (jeCesky(hodnota) && !ignorovat.has(hodnota) && !ignorovat.has(jadro)) hlaseni.chybi.add(hodnota);
          out += c.zdroj;
        }
        continue;
      }
      if (c.typ === 'regex') {
        const en = dict.get(c.zdroj);
        if (en !== undefined) out += en;
        else {
          if (DIA.test(c.zdroj) && !ignorovat.has(c.zdroj)) hlaseni.chybi.add(c.zdroj);
          out += c.zdroj;
        }
        continue;
      }
      // šablonový řetězec: výrazy se přeloží zvlášť (obsahují vlastní literály), statický text jako celek se zvýrazněnými zástupci {1}, {2}…
      const vyrazy = c.vyrazy.map((v) => preloz(v, soubor, hlaseni));
      let text = '';
      c.kvazi.forEach((kv, i) => { text += kvaziNaText(kv) + (i < c.vyrazy.length ? `{${i + 1}}` : ''); });
      const jadroSurove = text.trim();
      const lead = text.slice(0, text.length - text.trimStart().length);
      const trail = text.slice(text.trimEnd().length);
      const jeHtml = /<[a-zA-Z/]/.test(jadroSurove);
      const klic = jeHtml ? jadroSurove.replace(/\s+/g, ' ') : jadroSurove;
      const bezZastupcu = klic.replace(/\{\d+\}/g, '').replace(/<[^>]*>/g, '');
      let en = dict.get(klic);
      if (en === undefined) {
        if (jadroSurove && jeCesky(bezZastupcu) && !ignorovat.has(klic)) hlaseni.chybi.add(klic);
        en = null;
      }
      if (en === null) {
        // bez překladu: původní text šablony beze změny, jen s (případně přeloženými) výrazy
        out += '`' + c.kvazi.map((kv, i) => kv + (i < vyrazy.length ? '${' + vyrazy[i] + '}' : '')).join('') + '`';
        continue;
      }
      if (znacky(klic) !== znacky(en)) throw new Error(`${soubor}: překlad má jiné zástupce {n} než originál:\n  cs: ${klic}\n  en: ${en}`);
      if (jeHtml && htmlZnacky(klic) !== htmlZnacky(en)) throw new Error(`${soubor}: překlad má jiné HTML značky než originál:\n  cs: ${klic}\n  en: ${en}`);
      // znovu složit šablonu: text se zástupci {n} → ${výraz}
      const hotovo = (lead + en + trail).split(/(\{\d+\})/).map((p) => {
        const m = /^\{(\d+)\}$/.exec(p);
        if (m && vyrazy[Number(m[1]) - 1] !== undefined) return '${' + vyrazy[Number(m[1]) - 1] + '}';
        return uvozeniSablony(p);
      }).join('');
      out += '`' + hotovo + '`';
    }
    return out;
  }

  // Přeloží jeden skript. Vrací { kod, chybi: [klíče], zmeneno }.
  function prelozSkript(src, soubor) {
    const hlaseni = { chybi: new Set() };
    const kod = preloz(src, soubor, hlaseni);
    return { kod, chybi: [...hlaseni.chybi], zmeneno: kod !== src };
  }

  return { prelozSkript, velikost: dict.size };
}

// Sestaví anglické kopie všech skriptů do assets/js/en/. Moduly aplikace (assets/js/app) se kopírují vždy celé, protože se importují
// relativními cestami; ostatní skripty jen tehdy, když se překladem změnily. Vrací množinu zdrojových adres (/assets/js/…), které mají anglickou kopii.
export async function sestavAnglickeSkripty({ out, dictPairs, ignore = [], htmlPairs = [], kod = 'en' }) {
  const { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } = await import('node:fs');
  const { join } = await import('node:path');
  const tr = createJsTranslator({ dictPairs, ignore, htmlPairs });
  const koren = join(out, 'assets/js');
  const cil = join(koren, kod);
  const zdroje = [];
  for (const f of readdirSync(koren)) if (f.endsWith('.js')) zdroje.push([f, false]);
  for (const f of readdirSync(join(koren, 'app'))) if (f.endsWith('.js')) zdroje.push([`app/${f}`, true]);
  const skripty = new Set();
  const chybi = new Map();
  mkdirSync(join(cil, 'app'), { recursive: true });
  for (const [rel, vzdyKopie] of zdroje) {
    const src = readFileSync(join(koren, rel), 'utf8');
    const r = tr.prelozSkript(src, rel);
    if (r.chybi.length) chybi.set(rel, r.chybi);
    const dest = join(cil, rel);
    if (r.zmeneno || vzdyKopie) {
      if (!existsSync(dest) || readFileSync(dest, 'utf8') !== r.kod) writeFileSync(dest, r.kod, 'utf8');
      skripty.add('/assets/js/' + rel);
    } else if (existsSync(dest)) {
      // skript už překlad nepotřebuje: zastaralou kopii nechat být nelze, mohla by se omylem načíst
      rmSync(dest);
    }
  }
  return { skripty, chybi };
}
