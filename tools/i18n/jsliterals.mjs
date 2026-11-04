// Rozbor zdrojového JavaScriptu na řetězcové literály, šablonové řetězce a regulární výrazy.
// Slouží k sestavení anglických kopií skriptů (assets/js/en/…): každý literál s českým textem se nahradí překladem ze slovníku.
// Není to plný parser: stačí na ručně psané skripty tohoto webu (bez JSX, bez dekorátorů).

const ID_KONEC = /[A-Za-z0-9_$)\]}]/;
const KLICOVA_SLOVA_PRED_REGEXEM = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'instanceof', 'yield', 'await']);

// Vrátí pole částí: { typ: 'kod' | 'retezec' | 'sablona' | 'regex', zdroj, ... }, jejichž spojení dává původní text.
export function rozeber(src) {
  const casti = [];
  let i = 0;
  let kodStart = 0;
  let posledni = ''; // poslední významný znak nebo slovo (pro rozlišení dělení a regulárního výrazu)
  const pushKod = (konec) => { if (konec > kodStart) casti.push({ typ: 'kod', zdroj: src.slice(kodStart, konec) }); };

  const preskocRegexTrida = (j) => {
    // j ukazuje za úvodní lomítko
    let trida = false;
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '\\') { j++; continue; }
      if (c === '[') trida = true;
      else if (c === ']') trida = false;
      else if (c === '/' && !trida) return j + 1;
      else if (c === '\n') throw new Error('Nezavřený regulární výraz');
    }
    throw new Error('Nezavřený regulární výraz');
  };

  // rozbor šablonového řetězce: vrací { konec, kvazi: [text…], vyrazy: [zdroj…] }
  const rozeberSablonu = (j) => {
    const kvazi = [];
    const vyrazy = [];
    let cur = '';
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '\\') { cur += c + src[j + 1]; j++; continue; }
      if (c === '`') { kvazi.push(cur); return { konec: j + 1, kvazi, vyrazy }; }
      if (c === '$' && src[j + 1] === '{') {
        kvazi.push(cur); cur = '';
        let hloubka = 1;
        let k = j + 2;
        const zac = k;
        for (; k < src.length && hloubka > 0; k++) {
          const d = src[k];
          if (d === '\'' || d === '"') { k = konecRetezce(k); k--; continue; }
          if (d === '`') { const s = rozeberSablonu(k + 1); k = s.konec - 1; continue; }
          if (d === '{') hloubka++;
          else if (d === '}') hloubka--;
        }
        vyrazy.push(src.slice(zac, k - 1));
        j = k - 1;
        continue;
      }
      cur += c;
    }
    throw new Error('Nezavřená šablona');
  };
  const konecRetezce = (j) => {
    const q = src[j];
    for (j++; j < src.length; j++) {
      if (src[j] === '\\') { j++; continue; }
      if (src[j] === q) return j + 1;
      if (src[j] === '\n') throw new Error('Nezavřený řetězec na pozici ' + j);
    }
    throw new Error('Nezavřený řetězec');
  };

  while (i < src.length) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? src.length : e + 2; continue; }
    if (c === '\'' || c === '"') {
      pushKod(i);
      const e = konecRetezce(i);
      casti.push({ typ: 'retezec', zdroj: src.slice(i, e), uvozovka: c, hodnota: src.slice(i + 1, e - 1) });
      i = e; kodStart = i; posledni = 'x';
      continue;
    }
    if (c === '`') {
      pushKod(i);
      const s = rozeberSablonu(i + 1);
      casti.push({ typ: 'sablona', zdroj: src.slice(i, s.konec), kvazi: s.kvazi, vyrazy: s.vyrazy });
      i = s.konec; kodStart = i; posledni = 'x';
      continue;
    }
    if (c === '/') {
      const regex = !(ID_KONEC.test(posledni) && !KLICOVA_SLOVA_PRED_REGEXEM.has(posledni));
      if (regex) {
        pushKod(i);
        const e = preskocRegexTrida(i + 1);
        let f = e;
        while (f < src.length && /[a-z]/.test(src[f])) f++;
        casti.push({ typ: 'regex', zdroj: src.slice(i, f) });
        i = f; kodStart = i; posledni = 'x';
        continue;
      }
    }
    if (/\s/.test(c)) { i++; continue; }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++;
      posledni = src.slice(i, j);
      i = j;
      continue;
    }
    posledni = c;
    i++;
  }
  pushKod(src.length);
  return casti;
}
