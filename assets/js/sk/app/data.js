// Obsah a pravidla aplikace. Texty principů jsou od autora, ostatní texty jsou návrh ke schválení.

export const TOPICS = [
  ['kontrolovani', 'Kontrolovanie', 'zámky, spotrebiče, „nechal som niečo otvorené“'],
  ['kontaminace', 'Kontaminácia', 'nečistota, baktérie, chemikálie'],
  ['symetrie', 'Symetria a „tak akurát“', 'veci musia byť presne, rovnomerne, „správne“'],
  ['agresivni', 'Agresívne myšlienky', 'vtieravé predstavy ublíženia, ktorých sa desíte'],
  ['sexualni', 'Sexuálne myšlienky', 'vtieravé sexuálne myšlienky alebo obrazy'],
  ['nabozenske', 'Náboženské a morálne', 'strach z hriechu alebo z toho, že ste zlý človek'],
  ['zdravotni', 'Zdravotné', 'strach z choroby, sledovanie príznakov'],
  ['vztahove', 'Vzťahové', 'pochybnosti o vzťahu, o citoch, o partnerovi'],
  ['magicke', 'Magické myslenie', '„keď si to pomyslím, stane sa to“'],
  ['hyperzodpovednost', 'Hyperzodpovednosť', 'strach, že spôsobíte škodu, keď nezasiahnete'],
  ['realevent', 'Real-event', 'pochybnosti o tom, čo sa naozaj stalo v minulosti'],
  ['senzomotoricke', 'Senzomotorické', 'vnímanie dychu, žmurkania, prehĺtania, tela'],
  ['existencialni', 'Existenciálne', 'otázky o zmysle, realite, smrti'],
  ['pureo', 'Pure O', 'mentálne rituály bez viditeľných kompulzií'],
];

export const COMPULSIONS = {
  visible: ['Umývanie, čistenie, dezinfekcia', 'Kontrolovanie', 'Opakovanie úkonov', 'Usporadúvanie, symetria', 'Dotýkanie, odklepávanie'],
  mental: ['Opakovanie slov alebo viet v hlave', 'Analyzovanie a premýšľanie dookola', '„Rušenie“ myšlienky inou myšlienkou', 'Prechádzanie spomienok', 'Počítanie', 'Modlitby alebo formuly'],
  reassurance: ['Pýtam sa blízkych', 'Pýtam sa lekára', 'Vyhľadávam na internete', 'Pýtam sa AI', 'Čítam fóra a skúsenosti iných', 'Testujem sa alebo meriam'],
};
export const KIND_LABEL = { visible: 'Viditeľná', mental: 'Mentálne', reassurance: 'Uisťovanie' };

export const IMPACT_LIMITS = ['Práca alebo škola', 'Vzťahy a rodina', 'Spánok', 'Jedlo', 'Voľný čas a koníčky', 'Starostlivosť o domácnosť', 'Pohyb mimo domova'];
export const TIME_OPTIONS = ['Menej ako 1 hodinu', '1–3 hodiny', '3–6 hodín', 'Viac ako 6 hodín'];

export const PRINCIPLES = [
  { t: 'Žiadna ochrana pred strachom', x: 'Nič v metóde nesmie fungovať ako ochrana pred strachom.' },
  { t: 'Kompulzia je akt neprijatia', x: 'Kompulzia je akt neprijatia a nedôvery k sebe. Odpoveďou je návrat k sebaprijatiu, nie trest.' },
  { t: 'Sebadôvera zo zvládnutých situácií', x: 'Sebadôvera sa buduje zvládnutými situáciami. Strach môže byť prítomný a ja napriek tomu konám.' },
  { t: 'Myšlienky bez moci', x: 'Sebaprijatie a sebadôvera vtieravé myšlienky nezastavia, ale vezmú im moc.' },
  { t: 'Expozícia bez uistenia', x: 'Expozičný text nesmie končiť uistením.' },
  { t: 'Vízia je život', x: 'Cieľová vízia opisuje život, nie absenciu choroby.' },
  { t: 'Tam, kde mám šancu', x: 'Začínam tam, kde mám šancu vyhrať, a postupujem k tomu, čo ma najviac obmedzuje.' },
  { t: 'Odkiaľ strach prišiel', x: 'Pochopím, odkiaľ môj strach prišiel, bez viny a bez nekonečného rozoberania. Príbeh vysvetľuje, expozícia lieči.' },
  { t: 'Telo a úzkosť', x: 'Telo hovorí jazykom úzkosti. Učím sa mu rozumieť, ale nenechám ho rozhodovať.' },
  { t: 'Hudba nabíja', x: 'Hudba ma nabíja, ale pred strachom ma neschováva.' },
  { t: 'Rátam s OCD', x: 'Nečakám, kým ma OCD prepadne. Rátam s ním, a keď príde, pozdravím ho a idem ďalej.' },
  { t: 'Pevná pôda, porozumenie, odvaha', x: 'Najprv pevná pôda, potom porozumenie, potom odvaha.' },
];

export const cardOfDay = () => PRINCIPLES[Math.floor(Date.now() / 86400000) % PRINCIPLES.length];

// Podpůrné zprávy. Po „udělal jsem“ nikdy výčitka (pravidlo 2).
export const MSG_DID = [
  'Stalo sa. Kompulzia je znamenie, že sa strach ozval, nie zlyhanie. Vráťte sa k sebaprijatiu: prijímam seba aj túto chvíľu.',
  'Nič sa tým neprerušuje a nič sa nepočíta ako prehra. Vráťte sa k sebe a pokračujte, ako chcete.',
  'Prijmite seba aj toto. Ďalšia príležitosť konať inak príde sama.',
];
export const MSG_RESISTED = [
  'Strach bol prítomný a vy ste napriek tomu konali inak. To je presne tá sila, ktorú budujete.',
  'Neistota zostala a vy ste šli ďalej. Takto rastie sebadôvera.',
  'Zvládli ste to bez ochrany. Zapíšte si to a choďte ďalej.',
];

// Kontrola expozičního textu. Porovnává se bez diakritiky a malými písmeny.
export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const REASSURE = [
  /som zdrav/, /nic mi (nie je|nehrozi|nechyba)/, /veri?m,? ze (som )?(v bezpeci|zdrav)/, /som v bezpeci/,
  /(je|bude|som) (to )?v poriadku/, /vsetko (bude|je) (dobre|v poriadku)/, /nic sa (nestane|nestalo)/,
  /urcite (nie|nic|nebudem|nemam|sa nestane)/, /nemoze sa mi nic stat/, /na 100 ?%|sto percent/, /iste (nie|nic)/,
];
export const ACCEPT = [/prijm|prijim/, /aj keby/, /keby (to )?prisl/, /zvladn/, /obstoj/, /unes|zniesol|vydrz/];

// Kruh OCD: každý článek má nástroj metody (odvozeno z pravidel metody).
export const CIRCLE = [
  { name: 'Spúšťač', x: 'Nečakám, kým ma OCD prepadne. Rátam s ním, a keď príde, pozdravím ho a idem ďalej.', href: '/aplikace/principy', cta: 'Karty princípov' },
  { name: 'Pochybnosť', x: 'Pochopiť, ako pochybnosť vzniká a na čom stojí. Pochybnosť z reality sa líši od pochybnosti z predstavivosti („čo keby…“).', href: '/aplikace/icbt', cta: 'Porozumenie pochybnosti' },
  { name: 'Katastrofický scenár', x: 'Expozičný text: priznám neistotu a prijmem najhorší scenár. Nepotrebujem istotu, aby som obstál/a.', href: '/aplikace/text', cta: 'Expozičný text' },
  { name: 'Úzkosť', x: 'Strach môže byť prítomný a ja napriek tomu konám. Telo hovorí jazykom úzkosti, rozumiem mu, ale nenechám ho rozhodovať.', href: '/aplikace/telo', cta: 'Telo v strachu' },
  { name: 'Kompulzie', x: 'Prevencia reakcie: kompulziu nevykonám. Keď sa stane, je to akt neprijatia. Odpoveďou je návrat k sebaprijatiu, nie trest.', href: '/aplikace/kompulze', cta: 'Tracker kompulzií' },
  { name: 'Úľava', x: 'Úľava z kompulzie je to, čo kruh točí ďalej. Expozíciu preto nekončím uistením.', href: '/aplikace/text', cta: 'Kontrola textu' },
  { name: 'Posilnenie', x: 'Sebadôvera sa buduje zvládnutými situáciami, nie úľavou. Každá expozícia bez ochrany je skúsenosť, z ktorej sa dá učiť.', href: '/aplikace/denik', cta: 'Expozičný denník' },
];

// I-CBT: krátké lekce (návrh textů ke schválení autorem).
export const ICBT_LESSONS = [
  { t: 'Ako OCD vyrába pochybnosť', x: 'OCD často nezačína faktom, ale otázkou „čo keby…“. Pochybnosť príde ako príbeh o tom, čo všetko by sa mohlo stať. Nemusí mať oporu v tom, čo práve vidíte, počujete a viete.' },
  { t: 'Dva druhy pochybnosti', x: 'Pochybnosť z reality stojí na tom, čo vnímate zmyslami a čo poznáte z priamej skúsenosti. Pochybnosť z predstavivosti stojí na tom, čo by teoreticky mohlo byť. Pýtajte sa: odkiaľ tá pochybnosť pochádza?' },
  { t: 'Možné nie je to isté čo pravdepodobné', x: 'Skoro čokoľvek je možné. OCD z možného robí dôležité. Podľa toho, čo je možné, nežije žiadny človek.' },
  { t: 'Nedôvera k sebe a k zmyslom', x: 'Pochybnosť často hovorí: never tomu, čo vidíš, a never sebe. Tu sa dá vrátiť k sebaviere a k tomu, čo skutočne vnímate.' },
  { t: 'Príbeh nie je dôkaz', x: 'Aj presvedčivý príbeh je len príbeh. Môžete ho nechať byť, nehádať sa s ním, nebrať ho ako fakt a ísť ďalej.' },
];

export const BODY = [
  { t: 'Čo sa v tele deje pri strachu', x: 'Pri strachu sa telo prepne do pohotovosti. Zrýchli sa dych a tep, napnú sa svaly, môže sa zmeniť trávenie a ťažšie sa sústreďuje. Je to prirodzená reakcia, nie dôkaz, že je niečo zle.' },
  { t: 'Kruh „strach → príznak → dôkaz → viac strachu“', x: 'Všimnem si telesný pocit, mozog v ňom hľadá „dôkaz“ pre obavu, strach vzrastie a telesný pocit zosilnie. Kruh sa preruší, keď pocitu len rozumiem a nenechám ho rozhodovať.' },
  { t: 'Čo s tým', x: 'Pomenujem to: „telo hovorí jazykom úzkosti“. Nekontrolujem, nehľadám, nevyhľadávam. Pokračujem v tom, čo robím.' },
];
export const BODY_MEDICAL = 'Nové, trvalé alebo výrazné príznaky patria k lekárovi v rámci bežnej starostlivosti. Úzkosť o tom nerozhoduje. Aplikácia príznaky nekontroluje a na otázky o nich neodpovedá.';

// Vize: upozornit, pokud popisuje zdravotní stav místo života.
export const VISION_HEALTH = [/bez ocd/, /zbav/, /vylie/, /zdrav/, /bez (uzkost|obsesi|strachu|choroby|kompulzi)/, /nebudem mat/, /uz (nikdy )?nebudem/, /ziadn[ae] (obsesie|ocd|uzkost)/];
