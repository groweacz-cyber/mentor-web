// Obsah a pravidla aplikace. Texty principů jsou od autora, ostatní texty jsou návrh ke schválení.

export const TOPICS = [
  ['kontrolovani', 'Kontrolování', 'zámky, spotřebiče, „nechal jsem něco otevřené“'],
  ['kontaminace', 'Kontaminace', 'nečistota, bakterie, chemikálie'],
  ['symetrie', 'Symetrie a „tak akorát“', 'věci musí být přesně, rovnoměrně, „správně“'],
  ['agresivni', 'Agresivní myšlenky', 'vtíravé představy ublížení, kterých se děsíte'],
  ['sexualni', 'Sexuální myšlenky', 'vtíravé sexuální myšlenky nebo obrazy'],
  ['nabozenske', 'Náboženské a morální', 'strach z hříchu nebo z toho, že jste špatný člověk'],
  ['zdravotni', 'Zdravotní', 'strach z nemoci, sledování příznaků'],
  ['vztahove', 'Vztahové', 'pochybnosti o vztahu, o citech, o partnerovi'],
  ['magicke', 'Magické myšlení', '„když si to pomyslím, stane se to“'],
  ['hyperzodpovednost', 'Hyperzodpovědnost', 'strach, že způsobíte škodu, když nezasáhnete'],
  ['realevent', 'Real-event', 'pochybnosti o tom, co se doopravdy stalo v minulosti'],
  ['senzomotoricke', 'Senzomotorické', 'vnímání dechu, mrkání, polykání, těla'],
  ['existencialni', 'Existenciální', 'otázky po smyslu, realitě, smrti'],
  ['pureo', 'Pure O', 'mentální rituály bez viditelných kompulzí'],
];

export const COMPULSIONS = {
  visible: ['Mytí, čištění, dezinfekce', 'Kontrolování', 'Opakování úkonů', 'Uspořádávání, symetrie', 'Dotýkání, odklepávání'],
  mental: ['Opakování slov nebo vět v hlavě', 'Analyzování a promýšlení dokola', '„Rušení“ myšlenky jinou myšlenkou', 'Procházení vzpomínek', 'Počítání', 'Modlitby nebo formule'],
  reassurance: ['Ptám se blízkých', 'Ptám se lékaře', 'Vyhledávám na internetu', 'Ptám se AI', 'Čtu fóra a zkušenosti jiných', 'Testuji se nebo měřím'],
};
export const KIND_LABEL = { visible: 'Viditelná', mental: 'Mentální', reassurance: 'Ujišťování' };

export const IMPACT_LIMITS = ['Práce nebo škola', 'Vztahy a rodina', 'Spánek', 'Jídlo', 'Volný čas a koníčky', 'Péče o domácnost', 'Pohyb mimo domov'];
export const TIME_OPTIONS = ['Méně než 1 hodinu', '1–3 hodiny', '3–6 hodin', 'Více než 6 hodin'];

export const PRINCIPLES = [
  { t: 'Žádná ochrana před strachem', x: 'Nic v metodě nesmí fungovat jako ochrana před strachem.' },
  { t: 'Kompulze je akt nepřijetí', x: 'Kompulze je akt nepřijetí a nedůvěry k sobě. Odpovědí je návrat k sebepřijetí, ne trest.' },
  { t: 'Sebevíra ze zvládnutých situací', x: 'Sebevíra se buduje zvládnutými situacemi. Strach může být přítomen a já přesto jednám.' },
  { t: 'Myšlenky bez moci', x: 'Sebepřijetí a sebevíra vtíravé myšlenky nezastaví, ale vezmou jim moc.' },
  { t: 'Expozice bez ujištění', x: 'Expoziční text nesmí končit ujištěním.' },
  { t: 'Vize je život', x: 'Cílová vize popisuje život, ne absenci nemoci.' },
  { t: 'Tam, kde mám šanci', x: 'Začínám tam, kde mám šanci vyhrát, a postupuji k tomu, co mě nejvíc omezuje.' },
  { t: 'Odkud strach přišel', x: 'Pochopím, odkud můj strach přišel, bez viny a bez nekonečného rozebírání. Příběh vysvětluje, expozice léčí.' },
  { t: 'Tělo a úzkost', x: 'Tělo mluví jazykem úzkosti. Učím se mu rozumět, ale nenechám ho rozhodovat.' },
  { t: 'Hudba nabíjí', x: 'Hudba mě nabíjí, ale před strachem mě neschovává.' },
  { t: 'Počítám s OCD', x: 'Nečekám, až mě OCD přepadne. Počítám s ním, a když přijde, pozdravím ho a jdu dál.' },
  { t: 'Pevná půda, porozumění, odvaha', x: 'Nejdřív pevná půda, pak porozumění, pak odvaha.' },
];

export const cardOfDay = () => PRINCIPLES[Math.floor(Date.now() / 86400000) % PRINCIPLES.length];

// Podpůrné zprávy. Po „udělal jsem“ nikdy výčitka (pravidlo 2).
export const MSG_DID = [
  'Stalo se. Kompulze je znamení, že se strach ozval, ne selhání. Vraťte se k sebepřijetí: přijímám sebe i tuhle chvíli.',
  'Nic se tím nepřerušuje a nic se nepočítá jako prohra. Vraťte se k sobě a pokračujte, jak chcete.',
  'Přijměte sebe i tohle. Další příležitost jednat jinak přijde sama.',
];
export const MSG_RESISTED = [
  'Strach byl přítomen a vy jste přesto jednali jinak. To je přesně ta síla, kterou budujete.',
  'Nejistota zůstala a vy jste šli dál. Takhle roste sebevíra.',
  'Zvládli jste to bez ochrany. Zapište si to a jděte dál.',
];

// Kontrola expozičního textu. Porovnává se bez diakritiky a malými písmeny.
export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const REASSURE = [
  /jsem zdrav/, /nic mi (neni|nehrozi|nejde)/, /veri?m,? ze (jsem )?(v bezpeci|zdrav)/, /jsem v bezpeci/,
  /(je|bude|jsem) (to )?v poradku/, /vse (bude|je) (dobre|v poradku)/, /nic se (nestane|nestalo)/,
  /urcite (ne|nic|nebudu|nemam|se nestane)/, /nemuze se mi nic stat/, /na 100 ?%/, /jiste (ne|nic)/,
];
export const ACCEPT = [/prijm/, /i kdyby/, /kdyby (to )?prisl/, /zvladn/, /obstoj/, /snesu/];

export function pathLabel(p) {
  return { metal: 'Metal cesta', pop: 'Pop cesta', mezi: 'Něco mezi (spektrum)' }[p] || p;
}

// Doporučení cesty podle kritérií. Je to nápověda, ne rozhodnutí.
export function recommend(c) {
  let s = 0;
  const why = [];
  if (c.belief <= 4) { s++; why.push('Obavám věříte spíš málo, můžete se jim postavit přímo.'); }
  else if (c.belief >= 7) { s--; why.push('Obavám věříte velmi silně. Pomůže nejdřív porozumět tomu, jak pochybnost vzniká.'); }
  if (c.functioning >= 6) { s++; why.push('Běžný den zvládáte dobře, máte z čeho vycházet.'); }
  else if (c.functioning <= 3) { s--; why.push('Běžný den je teď hodně náročný, vhodný je pomalejší start a stabilizace.'); }
  if (c.erp === 'pomohlo') { s++; why.push('S expozicí máte dobrou zkušenost.'); }
  else if (c.erp === 'vzdal') { s--; why.push('Dřívější expozice vás zahltila nebo jste ji vzdali, proto doporučuji jemnější start.'); }
  if (c.ready === 'ano') { s++; why.push('Jste připraveni jít do strachu hned.'); }
  else if (c.ready === 'ne') { s--; why.push('Zatím se nechcete hned vystavovat strachu, a to je v pořádku.'); }
  const path = s >= 2 ? 'metal' : s <= -1 ? 'pop' : 'mezi';
  return { path, score: s, reasons: why };
}

// Vyhodnocení bezpečnostních otázek: high / mild / none.
export function riskLevel(sf) {
  if (!sf) return 'none';
  if (sf.harm !== 'ne' || sf.hopeless === 'casto' || sf.depressed === 'casto') return 'high';
  if (sf.hopeless === 'obcas' || sf.depressed === 'obcas') return 'mild';
  return 'none';
}

// Žebříček z posledního dotazníku: od nejslabšího po nejsilnější. Doporučený start má úzkost 4–6.
export function buildLadder(a) {
  if (!a) return [];
  const items = a.topics.filter((t) => t.score > 0).map((t) => ({ id: t.id, name: t.name, score: t.score })).sort((x, y) => x.score - y.score || x.name.localeCompare(y.name, 'cs'));
  return items;
}
export function recommendedStart(items, done) {
  const open = items.filter((i) => !done.includes(i.id));
  if (!open.length) return null;
  const inRange = open.filter((i) => i.score >= 4 && i.score <= 6);
  if (inRange.length) return inRange[0];
  return open.slice().sort((x, y) => Math.abs(x.score - 5) - Math.abs(y.score - 5) || x.score - y.score)[0];
}
