// Překladač vygenerovaných stránek do angličtiny podle slovníku (čeština → angličtina).
// Jednotkou překladu je „listový“ blok (odstavec, položka seznamu, nadpis, tlačítko, popisek…). Vložené značky (a, strong, abbr, span…)
// se ve slovníku zapisují jako číslované značky {1}…{/1}, atributy zůstávají zachované a odkazy se přepisují na anglické adresy.
// Bez překladu jednotka zůstane česky a zapíše se do seznamu chybějících překladů (test pak selže, dokud slovník není úplný).

const BLOCK = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'div', 'section', 'article', 'aside', 'main', 'header', 'footer', 'nav', 'details', 'summary', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'form', 'fieldset', 'legend', 'label', 'button', 'select', 'option', 'blockquote', 'figure', 'figcaption', 'dialog', 'caption', 'body', 'html', 'head', 'optgroup', 'datalist', 'output', 'canvas', 'noscript', 'address', 'pre', 'hgroup', 'menu', 'iframe', 'video', 'audio', 'picture', 'object', 'template', 'summary', 'search']);
const VOID = new Set(['br', 'img', 'input', 'meta', 'link', 'hr', 'wbr', 'source', 'area', 'col', 'embed', 'track']);
const ATTR_PREKLAD = ['alt', 'title', 'aria-label', 'placeholder', 'data-text', 'data-label', 'data-section', 'aria-description', 'aria-roledescription'];

export const decodeAttr = (v) => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
export const encodeAttr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
export const normText = (t) => t.replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const maPismena = (t) => /\p{L}/u.test(t);

// Odstraní číslované značky ze slovníkového klíče nebo hodnoty (pro porovnání s prostým textem, např. v JSON-LD).
export const bezZnacek = (t) => t.replace(/\{\/?\d+\/?\}/g, '');

// Značky v jednotce bez vlastního textu (odkaz s obrázkem, ikona): překládají se jen jejich atributy (alt, aria-label…).
const TAG_V_TEXTU = /<[a-zA-Z][a-zA-Z0-9-]*(?:[^>"']|"[^"]*"|'[^']*')*>/g;

const TOKEN = /<!--[\s\S]*?-->|<(script|style|svg|textarea)\b[^>]*>[\s\S]*?<\/\1>|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+|</g;

export function createTranslator({ dictPairs, mapHref }) {
  const dict = new Map();
  const plain = new Map();
  const duplicates = [];
  for (const [cz, en] of dictPairs) {
    const k = normText(cz);
    if (dict.has(k) && dict.get(k) !== en) duplicates.push(k);
    dict.set(k, en);
    plain.set(normText(bezZnacek(k)), normText(bezZnacek(en)));
  }

  // Hledání ve slovníku: nejdřív přesná shoda, potom vzor s čísly nahrazenými {#} (např. „Pro blízké · {#} setkání“, ať se text při změně dat nemusí překládat znovu).
  const hledej = (k, slovnik) => {
    const presne = slovnik.get(k);
    if (presne !== undefined) return presne;
    const cisla = k.match(/\d+/g);
    if (!cisla) return undefined;
    const vzor = slovnik.get(k.replace(/\d+/g, '{#}'));
    if (vzor === undefined) return undefined;
    let i = 0;
    return vzor.replace(/\{#\}/g, () => cisla[i++] ?? '');
  };

  // Přepíše atributy jedné značky: překlad popisků a mapování odkazů.
  function tagString(raw, missing) {
    return raw.replace(/(\s)([a-zA-Z-]+)=("([^"]*)"|'([^']*)')/g, (m, sp, name, q, v1, v2) => {
      const v = v1 !== undefined ? v1 : v2;
      const ln = name.toLowerCase();
      if (ln === 'href') {
        const novy = mapHref(decodeAttr(v));
        return novy === decodeAttr(v) ? m : `${sp}${name}="${encodeAttr(novy)}"`;
      }
      if (ATTR_PREKLAD.includes(ln) || (ln === 'value' && /type="checkbox"/.test(raw))) { // hodnoty zaškrtávátek se vkládají do textu dotazníku
        const cz = normText(decodeAttr(v));
        if (!maPismena(cz)) return m;
        const en = hledej(cz, plain);
        if (en === undefined) { missing.add(cz); return m; }
        return `${sp}${name}="${encodeAttr(en)}"`;
      }
      return m;
    });
  }

  // Překlad prostého textu (titulek, popis, atributy, řetězce v JSON-LD). Vrací null, když překlad chybí.
  const prostyText = (cz) => {
    const k = normText(cz);
    if (!maPismena(k)) return k;
    const v = hledej(k, plain);
    return v === undefined ? null : v;
  };

  function translateFragment(html, missing = new Set()) {
    const out = [];
    let buf = [];
    let native = false;
    const flush = () => {
      if (!buf.length) return;
      const raw = buf.map((x) => x.raw).join('');
      buf = [];
      const core = raw.trim();
      if (!core || !maPismena(core.replace(/<[^>]*>/g, ''))) { out.push(raw.replace(TAG_V_TEXTU, (t) => tagString(t, missing))); return; }
      const lead = raw.slice(0, raw.length - raw.trimStart().length);
      const trail = raw.slice(raw.trimEnd().length);
      // značky → číslované značky
      const tags = {};
      let n = 0;
      const stack = [];
      let key = '';
      const items = [];
      const re = /<svg\b[^>]*>[\s\S]*?<\/svg>|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+|</g;
      let m;
      while ((m = re.exec(core))) {
        if (m[0].startsWith('<svg')) {
          n += 1;
          tags[n] = { open: m[0], void: true };
          key += `{${n}/}`;
        } else if (m[2]) {
          const closing = m[1] === '/';
          const name = m[2].toLowerCase();
          if (closing) {
            const id = stack.pop();
            if (id === undefined) throw new Error('Osiřelá zavírací značka v jednotce: ' + core.slice(0, 120));
            key += `{/${id}}`;
            tags[id].close = m[0];
          } else if (VOID.has(name) || /\/\s*$/.test(m[3])) {
            n += 1;
            tags[n] = { open: m[0], void: true };
            key += `{${n}/}`;
          } else {
            n += 1;
            tags[n] = { open: m[0], close: `</${name}>` };
            stack.push(n);
            key += `{${n}}`;
          }
        } else {
          key += m[0];
        }
      }
      if (stack.length) throw new Error('Nezavřená značka v jednotce: ' + core.slice(0, 120));
      const k = normText(key);
      if (!maPismena(bezZnacek(k))) { out.push(raw.replace(TAG_V_TEXTU, (t) => tagString(t, missing))); return; }
      const en = hledej(k, dict);
      if (en === undefined) { missing.add(k); out.push(raw); return; }
      // kontrola, že překlad obsahuje stejné značky
      const znaky = (t) => [...t.matchAll(/\{\/?\d+\/?\}/g)].map((x) => x[0]).sort().join('');
      if (znaky(k) !== znaky(en)) throw new Error(`Překlad má jiné značky než originál:\n  cs: ${k}\n  en: ${en}`);
      const hotovo = en.replace(/\{(\/?)(\d+)(\/?)\}/g, (_x, sl, id, sl2) => {
        const t = tags[id];
        if (!t) throw new Error(`Překlad odkazuje na neexistující značku {${id}}:\n  cs: ${k}\n  en: ${en}`);
        if (t.void) return tagString(t.open, missing);
        return sl ? t.close : tagString(t.open, missing);
      });
      out.push(lead + hotovo + trail);
    };

    let m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(html))) {
      const tok = m[0];
      if (tok.startsWith('<!--')) {
        if (tok === '<!--EN:NATIVE-->') { flush(); native = true; continue; }
        if (tok === '<!--/EN:NATIVE-->') { native = false; continue; }
        if (!native) flush(); // poznámky pro autora (komentáře) se do anglické verze nepřenášejí
        continue;
      }
      if (native) { out.push(tok); continue; }
      if (m[1] === 'svg') { buf.push({ raw: tok }); continue; } // vložené SVG je součástí jednotky (ikona v odkazu nebo tlačítku)
      if (m[1]) { flush(); out.push(m[1] === 'textarea' ? tok.replace(/^<textarea\b[^>]*>/, (t) => tagString(t, missing)) : tok); continue; } // script, style: beze změny; u textarea se přeloží jen atributy (data-label, placeholder)
      if (m[3]) {
        const name = m[3].toLowerCase();
        if (BLOCK.has(name)) { flush(); out.push(tagString(tok, missing)); } else buf.push({ raw: tok });
        continue;
      }
      buf.push({ raw: tok });
    }
    flush();
    return out.join('');
  }

  // JSON-LD: přeloží textové hodnoty a přepíše adresy na anglické.
  const BEZ_PREKLADU = new Set(['@type', '@id', '@context', 'url', 'item', 'contentUrl', 'thumbnailUrl', 'uploadDate', 'datePublished', 'dateModified', 'duration', 'price', 'priceCurrency', 'image', 'serviceUrl', 'sameAs', 'email', 'telephone', 'mainEntityOfPage', 'inLanguage', 'position', 'availability', 'embedUrl', 'identifier']);
  function jsonLd(node, missing, mapUrl) {
    if (Array.isArray(node)) return node.map((x) => jsonLd(x, missing, mapUrl));
    if (node && typeof node === 'object') {
      const o = {};
      for (const [k, v] of Object.entries(node)) {
        if (k === 'inLanguage') { o[k] = 'en'; continue; }
        if (typeof v === 'string' && ['@id', 'url', 'item', 'serviceUrl', 'mainEntityOfPage', 'sameAs'].includes(k)) { o[k] = mapUrl(v); continue; }
        if (typeof v === 'string' && v.startsWith('http')) { o[k] = v; continue; }
        if (typeof v === 'string' && !BEZ_PREKLADU.has(k)) {
          const en = prostyText(v);
          if (en === null) { missing.add(normText(v)); o[k] = v; } else o[k] = en;
          continue;
        }
        o[k] = jsonLd(v, missing, mapUrl);
      }
      return o;
    }
    return node;
  }

  return { translateFragment, prostyText, tagString, jsonLd, duplicates, size: dict.size };
}
