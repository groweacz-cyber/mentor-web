// Texty nových stránek (Fáze 2). Všechno kromě /pomoc jsou koncepty čekající na schválení.
// Pravidla: žádné diagnózy, žádné sliby vyléčení, žádné návody na samostatné expozice, žádná vymyšlená čísla ani citace.

export const UPDATED = '2026-10-23';

// ---------- /vtirave-myslenky (pilířový průvodce) ----------
export const PILIR_VTIRAVE = {
  lead: 'Vtíravé myšlenky zná většina lidí. U OCD se ale „lepí“ a točí se kolem nich smyčka, která bere čas i energii. Tady je srozumitelný přehled, jak to funguje.',
  sections: [
    {
      h: 'Co jsou vtíravé myšlenky',
      html: `<p>Vtíravé myšlenky jsou nechtěné myšlenky, představy nebo nutkání, které se objeví samy a působí rušivě. Může to být pochybnost, jestli jste zamkli, obraz nehody, nevhodná myšlenka uprostřed schůzky nebo otázka, na kterou nechcete odpovídat. Zažívá je většina lidí, a většinou je nechají odeznít.</p>
<aside class="fact"><p><strong>Věděli jste?</strong> Vtíravé myšlenky zažívá většina lidí, v mezinárodní studii zhruba 94 %. <span class="fact-src">Zdroj: Radomsky a kol., 2014</span></p></aside>`,
    },
    {
      h: 'Proč se u OCD „lepí“',
      html: `<p>U OCD se často liší hlavně to, jak člověk s myšlenkou naloží. Myšlenka vyvolá strach, a protože se zdá nebezpečná nebo důležitá, snaží se ji zastavit, vyvrátit nebo „odčinit“. Snaha myšlenku potlačit ji ale obvykle posiluje. Čím víc se člověk brání, tím víc se myšlenka vrací.</p>
<p>Pomáhá i to, že vtíravá myšlenka bývá v rozporu s tím, co člověk doopravdy chce a čemu věří. Právě proto děsí.</p>`,
    },
    {
      h: 'Smyčka OCD',
      html: `<p>Vtíravá myšlenka sama nedělá OCD. Dělá ho smyčka, ve které se myšlenka pravidelně opakuje:</p>
<ol class="rules">
  <li><strong>Napětí:</strong> objeví se vtíravá myšlenka a s ní strach nebo nepříjemné napětí.</li>
  <li><strong>Akce:</strong> člověk udělá něco, aby napětí rychle povolilo (kompulze, třeba kontrola, ujišťování nebo mentální rituál).</li>
  <li><strong>Úleva:</strong> napětí na chvíli povolí.</li>
  <li><strong>Posílení:</strong> mozek si zapíše, že akce pomohla, takže příště přijde nutkání silnější.</li>
</ol>
<p>Jednotlivé fáze si můžete projít v <a href="/#lp-h">interaktivní smyčce na úvodní stránce</a>.</p>`,
    },
    {
      h: 'Co to o vás neříká',
      html: `<p>Myšlenka není přání, plán ani důkaz o vaší povaze. Že se vám nějaká myšlenka vybavila, nic nevypovídá o tom, jaký jste člověk ani co uděláte. Pokud vás myšlenka děsí, je to spíš známka toho, že odporuje tomu, na čem vám záleží.</p>`,
    },
    {
      h: 'Co obvykle nepomáhá',
      html: `<ul class="rules">
  <li><strong>Potlačování:</strong> snaha myšlenku vytlačit z hlavy ji obvykle vrací.</li>
  <li><strong>Nekonečné rozebírání:</strong> hledání „správné“ odpovědi dává krátkou úlevu a udržuje potřebu ji hledat.</li>
  <li><strong>Ujišťování</strong> u blízkých, na internetu nebo u umělé inteligence. Proč to nefunguje, popisuje <a href="/clanky/proc-ujisteni-krmi-ocd">článek o ujišťování</a>.</li>
  <li><strong>Vyhýbání</strong> všemu, co myšlenku spouští. Svět se zužuje a strach roste.</li>
</ul>`,
    },
    {
      h: 'Jak se k tomu obecně přistupuje',
      html: `<p>Základní směr je odlišný od boje: zůstat s myšlenkou a s napětím a nepředat se kompulzi. V <a href="/metoda">metodě</a>, kterou používám, k tomu patří sebepřijetí a sebevíra („ať se stane cokoli, obstojím“). V odborné péči se k podobnému směru používá například expozice s prevencí reakce (ERP) nebo inferenční kognitivně-behaviorální přístup (I-CBT). Odborník nastavuje tempo a plán.</p>
<p>Konkrétní kroky tady nenajdete záměrně. Postup expozic patří do rukou odborníka, ne do návodu na internetu.</p>`,
    },
    {
      h: 'Kam dál',
      html: `<ul class="rules">
  <li><a href="/typy-ocd">Typy OCD</a>: přehled podob, například <a href="/typy-ocd/zdravotni-ocd">zdravotní OCD</a>, <a href="/typy-ocd/kontrolovani">kontrolování</a> nebo <a href="/typy-ocd/vztahove-ocd">vztahové OCD</a>.</li>
  <li><a href="/pro-blizke">Pro blízké</a>: jak pomáhat a nekrmit OCD.</li>
  <li><a href="/myty-o-ocd">Mýty o OCD</a> a <a href="/slovnicek">slovníček pojmů</a>.</li>
  <li>Články: <a href="/clanky/proc-nutkani-prichazi-ve-vlnach">nutkání přichází ve vlnách</a> a <a href="/clanky/kompulze-a-prijeti">kompulze a přijetí</a>.</li>
  <li><a href="/kviz">Kvíz Metal, nebo Pop?</a> a <a href="/jak-to-probiha">jak probíhá peer mentoring</a>.</li>
</ul>`,
    },
  ],
  related: ['/typy-ocd', '/pro-blizke', '/myty-o-ocd', '/clanky/proc-ujisteni-krmi-ocd'],
};

// ---------- Typy OCD: plné koncepty ----------
const ODBORNIK = `<p>Odborníci (psychiatr, klinický psycholog, psychoterapeut) pracují s OCD obvykle metodami, jako je expozice s prevencí reakce (ERP), případně inferenční kognitivně-behaviorální přístup (I-CBT). Odborník také určuje tempo, plán a případně i medikaci. Tato stránka není návodem, jak takové postupy provádět samostatně doma.</p>
<p>Jak odbornou pomoc najít, shrnuje stránka <a href="/pomoc">Pomoc hned</a> a část <a href="/pro-koho#odborna-pece">Kam dál: odborná péče</a>.</p>`;

const peer = (zkusenost) => `<p>${zkusenost}</p>
<p>Mohu vás doprovázet vedle odborné péče: sdílím, co mně pomáhalo zůstat u svého života, pomáhám s motivací a s kroky mezi sezeními. Nediagnostikuji, neslibuji vyléčení, neradím s léky a nenahrazuji odborníka. Nevíte, kde začít? Zkuste <a href="/kviz">kvíz Metal, nebo Pop?</a> nebo se podívejte, <a href="/jak-to-probiha">jak peer mentoring probíhá</a>. Úvodní konzultace je zdarma.</p>`;

export const TYPY_PLNY = {
  'zdravotni-ocd': {
    lead: 'Zdravotní OCD je podoba OCD, při které se obsese točí kolem nemoci: obava, že nějakou vážnou nemoc mám nebo dostanu, a nekonečné hledání jistoty, že jsem zdravý.',
    co: `<p>Při zdravotním OCD vyvolá tělesný pocit, zpráva o nemoci nebo jen pomyšlení na ni silný strach. Myšlenka „co když je to něco vážného?“ se nedá pustit a člověk dělá všechno pro to, aby si ověřil, že je v pořádku. Ověřování ale přináší jen krátkou úlevu a pochybnosti se vrátí, často silnější.</p>
<p>Zdravotní obavy samy o sobě nejsou OCD. Starat se o zdraví je normální. O OCD začínáme uvažovat, když obavy a kontroly zabírají hodně času, vyčerpávají a omezují každodenní život. Zda jde právě o OCD, nebo o jiný typ obtíží, rozliší jen odborník. Tento web nic nediagnostikuje.</p>
<p>Důležité: OCD nevylučuje skutečné onemocnění. Pokud máte nový nebo trvající příznak, patří k lékaři.</p>`,
    obsese: [
      'Co když ta změna na kůži znamená začátek vážné nemoci?',
      'Co když jsem přehlédl příznak, který jsem měl vzít vážně?',
      'Vtíravé obrazy vlastní nemoci nebo nemocničního pokoje.',
      'Strach, že mi lékař něco neřekl nebo že něco přehlédl.',
    ],
    kompulze: [
      'Opakované prohmatávání a prohlížení těla, měření tlaku, tepu nebo teploty.',
      'Vyhledávání příznaků na internetu nebo u umělé inteligence.',
      'Opakované návštěvy lékaře nebo žádosti o další vyšetření „pro jistotu“.',
      'Ujišťování u blízkých („Nevypadám nemocně?“).',
      'Mentální přezkoumávání: procházení příznaků v hlavě a porovnávání s popisem nemoci.',
      'Vyhýbání se zdravotnickým zprávám, nemocnicím nebo lidem, kteří jsou nemocní.',
    ],
    myty: [
      ['Je to jen přehnaná opatrnost.', 'Rozumná péče o zdraví má své meze a po vyřízení úkolu končí. Zdravotní OCD se točí dokola a každá další kontrola potřebu další kontroly zvyšuje.'],
      ['Když se nechám ještě jednou vyšetřit, konečně se uklidním.', 'Úleva trvá krátce a pochybnost se vrátí. Další vyšetření „pro klid“ smyčku obvykle posiluje. Kdy je vyšetření opravdu na místě, posoudí lékař.'],
      ['Googlit příznaky je zodpovědné.', 'Hledání příznaků na internetu bývá jednou z kompulzí. Čím víc se hledá, tím víc „důkazů“ pro obavu se najde.'],
      ['Mám zdravotní OCD, takže mi nic být nemůže.', 'To tvrdit nelze a nikdo takovou jistotu dát nemůže, ani já, ani tento web. OCD a skutečná nemoc mohou existovat vedle sebe. Proto na zdravotní otázky odpovídá lékař.'],
    ],
    odbornik: ODBORNIK + '<p>Při zdravotních obavách je dobré mít vedle psychiatra nebo psychologa i praktického lékaře, který posoudí tělesné potíže.</p>',
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách, včetně zdravotního tématu. Znám smyčku zevnitř, ale nejsem lékař a nikdy vám neřeknu, že vám nic není.'),
    souvisejici: ['kontrolovani', 'senzomotoricke-ocd', 'strach-ze-zesileni', 'pure-o'],
  },

  kontrolovani: {
    lead: 'Kontrolování je podoba OCD, při které se člověk znovu a znovu ujišťuje, že nezpůsobil nebo nezpůsobí škodu: zamknuté dveře, vypnutý sporák, vlastní činy.',
    co: `<p>Při kontrolování zní obsese jako pochybnost: „Zamkl jsem? Vypnul jsem sporák? Neudělal jsem něco, co někomu uškodí?“ Kontrola chvíli uleví, ale pochybnost se vrátí a kontrola se opakuje. Často se přidává pocit, že kdyby se něco stalo, byla by to moje vina.</p>
<p>Zkontrolovat zámek je normální. O OCD začínáme uvažovat, když je kontrol hodně, trvají dlouho, nejdou zastavit a po každé další kontrole je strach spíš větší. Posoudit to může jen odborník.</p>`,
    obsese: [
      'Co když jsem nechal zapnutý sporák a vznikne požár?',
      'Co když jsem nezamkl a někdo se k nám vloupal?',
      'Co když jsem při řízení někoho srazil a nevšiml jsem si?',
      'Co když jsem udělal chybu v e-mailu nebo v práci, kterou už nejde vzít zpět?',
    ],
    kompulze: [
      'Opakované kontroly zámků, spotřebičů, oken nebo světel.',
      'Vracení se domů nebo k autu.',
      'Fotografování nebo natáčení „pro jistotu“.',
      'Opakované čtení a kontrola textů, e-mailů nebo dokladů.',
      'Ptaní se druhých, jestli jsem to udělal, nebo ověřování s jejich pomocí.',
      'Mentální přehrávání: v duchu si situaci „přehrávám“, abych si ověřil, že jsem ji zvládl.',
    ],
    myty: [
      ['Zkontrolovat to ještě jednou přece nezaškodí.', 'Škodí právě opakování: kontrola učí mozek, že bez ní je situace nebezpečná. Kontroly obvykle trvají stále déle a jistoty se nikdy nedosáhne.'],
      ['Kdo kontroluje, ten je zodpovědný.', 'Zodpovědnost není totéž co kontrola do nekonečna. Zodpovědný člověk po rozumné míře kontroly ví, že je hotovo, a jde dál.'],
      ['Za pochybnostmi je špatná paměť.', 'Za pochybnostmi nemusí být špatná paměť. U OCD jde hlavně o to, že se těžko snáší nejistota, a tak se ověřování opakuje, i když si člověk pamatuje, že už kontroloval.'],
    ],
    odbornik: ODBORNIK,
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách, včetně kontrolovacího tématu. Znám smyčku zevnitř a vím, jak těžké je přestat „ještě jednou zkontrolovat“.'),
    souvisejici: ['hyperzodpovednost', 'real-event-ocd', 'zdravotni-ocd', 'pure-o'],
  },

  'vztahove-ocd': {
    lead: 'Vztahové OCD je podoba OCD, při které se obsese točí kolem vztahu: miluji partnera doopravdy? Je to ten pravý? Nesedí mi někdo jiný?',
    co: `<p>Při vztahovém OCD zní obsese jako nekonečná pochybnost o vztahu, o partnerovi nebo o vlastních citech. Člověk testuje, jestli „to cítí správně“, porovnává se s jinými páry a hledá jistotu, že vztah je v pořádku. Pochybnosti ale přicházejí i po chvílích blízkosti a znovu zesilují.</p>
<p>Pochybnosti ve vztahu jsou normální a někdy jsou na místě. O OCD začínáme uvažovat, když se točí stále dokola, zabírají hodně času a nelze je rozumně uzavřít. To, že vztah může mít opravdové problémy, OCD nevylučuje. Rozlišit to pomůže odborník, ne web.</p>`,
    obsese: [
      'Miluji ho doopravdy, nebo jen žiju z pohodlí?',
      'Co když jsem s nesprávným člověkem a promarním život?',
      'Cítím k ní dost, když mě teď nic netěší?',
      'Co když mě přitahuje někdo jiný a znamená to, že vztah nefunguje?',
    ],
    kompulze: [
      'Zkoumání pocitů: neustálé „testování“, jestli cítím dost.',
      'Porovnávání partnera a vztahu s jinými lidmi a páry.',
      'Ujišťování u partnera nebo u přátel („Myslíš, že se k sobě hodíme?“).',
      'Mentální přehrávání společných situací a hledání důkazů pro a proti.',
      'Vyhýbání se tématům, nebo naopak neustálé probírání vztahu.',
      'Hledání odpovědí v článcích, kvízech nebo u umělé inteligence.',
    ],
    myty: [
      ['Kdo pochybuje, ten už nemiluje.', 'Pochybnost sama o ničem nerozhoduje. U OCD je spíš součástí smyčky: čím víc se po jistotě pátrá, tím víc pochybností vzniká.'],
      ['Musím mít jistotu, než udělám další krok.', 'Úplná jistota ve vztazích neexistuje. Čekání na ni obvykle vztah brzdí a smyčku udržuje.'],
      ['Když se rozejdu, pochybnosti zmizí.', 'Rozhodnutí o vztahu je vaše a nikdo vám ho nevezme. Obsese ale mohou přejít na další téma nebo na dalšího partnera. Při velkém rozhodnutí je dobré mít oporu u odborníka.'],
      ['Je to věc vztahu, ne OCD.', 'Může to být obojí. Skutečné problémy ve vztahu stojí za řešení a OCD je může zdánlivě zvětšovat. Odborník pomůže rozlišit, co je co.'],
    ],
    odbornik: ODBORNIK + '<p>Pokud OCD zatěžuje i partnera nebo partnerku, může pomoct stránka <a href="/pro-blizke">Pro blízké</a>.</p>',
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách, i když ne přesně s tímto tématem. Nebudu tvrdit, že vím přesně, jak to prožíváte, ale smyčku, pochybnosti a snahu mít jistotu znám zevnitř.'),
    souvisejici: ['pure-o', 'zpovedni-ocd', 'skrupulozita', 'hyperzodpovednost'],
  },
};

// ---------- /pro-blizke ----------
export const PRO_BLIZKE = {
  lead: 'Když má někdo blízký OCD, chcete pomoct. Nemusíte mít jistotu ani vyřešit jeho obavy. Často pomůže, když přestanete krmit smyčku a zůstanete s ním.',
  sections: [
    {
      h: 'Co je přizpůsobování',
      html: `<p>Přizpůsobování je, když blízký kvůli OCD mění své chování: odpovídá na ujišťovací otázky, vyhýbá se spouštěčům, vyřizuje věci za něj nebo se účastní rituálů. Dělá to z lásky a ze snahy ulevit.</p>
<p>Krátkodobě to funguje. Napětí povolí a v domácnosti je klid. Dlouhodobě ale OCD roste, protože se potvrzuje, že bez rituálu by bylo něco špatně.</p>`,
    },
    {
      h: 'Proč ujišťování nepomáhá',
      html: `<p>Otázka „Je to opravdu v pořádku?“ pokaždé vyžaduje nové ujištění. Čím víc odpovědí zazní, tím víc se potřeba ptát vrací. Podrobněji o tom píše <a href="/clanky/proc-ujisteni-krmi-ocd">článek o ujišťování</a>.</p>`,
    },
    {
      h: 'Co dělat místo toho',
      html: `<ul class="rules">
  <li><strong>Uznejte pocit, ne obsah.</strong> Řekněte, že vidíte, že se bojí, a že u něj zůstanete. Neodpovídejte na otázku „co když“.</li>
  <li><strong>Domluvte se předem a klidně.</strong> Až ve chvíli největší úzkosti se domlouvá špatně. Změny bez domluvy bývají pro oba těžké.</li>
  <li><strong>Měňte postupně.</strong> Nemusíte přestat ze dne na den. Důležitější je dohodnout směr a tempo, ideálně s oporou odborníka.</li>
  <li><strong>Nechte odpovědnost u něj.</strong> Nepřebírejte rituály ani rozhodnutí za něj.</li>
</ul>`,
    },
    {
      h: 'Ukázky odpovědí',
      html: `<p>Několik vět, které se dají použít místo ujištění. Slouží jako inspirace, ne jako scénář, který funguje na všechno. Ladit je můžete s blízkým i s odborníkem.</p>
<ul class="quotes">
  <li>„Vidím, že se bojíš. Odpověď ti teď dávat nebudu, ale jsem tady s tebou.“</li>
  <li>„Chápu, že je to teď těžké. Věřím, že to uneseš.“</li>
  <li>„Vím, že to je nepříjemné. Pojďme to chvíli spolu vydržet.“</li>
</ul>`,
    },
    {
      h: 'Co tahle stránka není',
      html: `<p>Není to návod na vedení expozic doma. Expozice vede odborník, ne partner, rodič nebo kamarád. Role blízkého je podporovat, ne vést odbornou péči.</p>`,
    },
    {
      h: 'I vy si zasloužíte podporu',
      html: `<p>Žít vedle OCD může být vyčerpávající. Můžete se cítit bezmocně, rozčileně nebo provinile, a to je v pořádku. Mluvte o tom s někým, komu důvěřujete, a pokud je toho moc, vyhledejte oporu i pro sebe. Hranice, které si nastavíte, nejsou sobecké.</p>
<!-- [PODPORA PRO BLÍZKÉ: doplní autor, odkazy na organizace a linky podpory pro rodiny a partnery] -->`,
    },
  ],
  related: ['/vtirave-myslenky', '/typy-ocd', '/myty-o-ocd', '/pribehy', '/pro-terapeuty'],
};

// ---------- /pribehy ----------
export const PRIBEHY = {
  lead: 'Příběhy ukazují, že v tom člověk není sám. Tady bude můj příběh a prostor pro příběhy dalších lidí. Zatím jde o osnovu.',
  sections: [
    {
      h: 'Můj příběh (osnova)',
      html: `<p>Bez podrobností o traumatech, bez tvrzení o vyléčení a bez rad k lékům. Každý bod doplní autor.</p>
<ol class="rules">
  <li class="placeholder">[Kdy a jak se OCD poprvé objevilo, bez detailů traumat]</li>
  <li class="placeholder">[Jak vypadala smyčka v mém životě: témata, rituály, vyhýbání]</li>
  <li class="placeholder">[Co nepomáhalo]</li>
  <li class="placeholder">[Co pomohlo: odborná péče, sebepřijetí, malé kroky]</li>
  <li class="placeholder">[Kde jsem dnes a co na tom není hotové, bez slibů]</li>
  <li class="placeholder">[Co bych chtěl říct člověku, který právě čte]</li>
</ol>`,
    },
    {
      h: 'Příběhy dalších lidí (šablona)',
      html: `<p>Příběh jiného člověka zveřejním jen za těchto podmínek:</p>
<ul class="rules">
  <li>Mám <strong>písemný souhlas</strong> a člověk ho může kdykoli odvolat.</li>
  <li>Příběh je <strong>anonymizovaný</strong>: bez jmen, míst a jedinečných detailů, podle kterých by šel člověk poznat.</li>
  <li><strong>Neobsahuje žádné tvrzení o vyléčení</strong>, o výsledcích ani konkrétní rady k lékům.</li>
  <li>Příběhy ani recenze nežádám výměnou za schůzky.</li>
</ul>
<h3>Otázky, na které může příběh odpovídat</h3>
<ul class="rules">
  <li class="placeholder">[S čím jsem přišel a jak to vypadalo v běžném dni?]</li>
  <li class="placeholder">[Co pro mě bylo nejtěžší?]</li>
  <li class="placeholder">[Co mi pomáhá teď?]</li>
  <li class="placeholder">[Co bych vzkázal někomu, kdo začíná?]</li>
</ul>`,
    },
  ],
  related: ['/o-mne', '/jak-to-probiha', '/pro-blizke', '/myty-o-ocd', '/pro-terapeuty'],
};

// ---------- /pro-terapeuty ----------
export const PRO_TERAPEUTY = {
  lead: 'Peer mentoring je doplněk odborné péče, ne její náhrada. Tady najdete, co dělám, co ne a jak spolu můžeme spolupracovat.',
  sections: [
    {
      h: 'Co dělám',
      html: `<ul class="rules">
  <li>Doprovázím klienty vedle odborné péče, ne místo ní.</li>
  <li>Sdílím vlastní zkušenost s OCD a to, co mně pomáhalo zůstat u svého života.</li>
  <li>Pomáhám s motivací a s kroky mezi sezeními, které si klient domluví s odborníkem.</li>
  <li>Podporuji klienta v tom, aby chodil na odbornou péči a držel se jejího plánu.</li>
</ul>`,
    },
    {
      h: 'Co nedělám',
      html: `<ul class="rules">
  <li>Nejsem terapeut ani psycholog, nestanovuji diagnózu a nevedu psychoterapii.</li>
  <li>Nepředepisuji ani neřeším léky a nikdy klienta nevedu k jejich vysazení nebo k ukončení péče.</li>
  <li>ERP a I-CBT jsou odborné metody. Klienta při nich doprovázím, nevedu je.</li>
  <li>Neposkytuji ujištění, že se obava nesplní.</li>
  <li>V akutní krizi nebo při zhoršení odkážu na odbornou pomoc.</li>
</ul>`,
    },
    {
      h: 'S kým pracuji',
      html: `<p>Pracuji s lidmi, kteří jsou v péči odborníka, nebo se do ní aktivně chystají. Na úvodní konzultaci diagnóza ani terapeut potřeba nejsou, pro pravidelnou spolupráci je ale důležité, aby klient odbornou péči měl nebo ji vyhledával.</p>`,
    },
    {
      h: 'Jak může spolupráce vypadat',
      html: `<ul class="rules">
  <li>Klient rozhodne, zda a jaké informace mezi námi sdílíme. Bez jeho souhlasu odborníkovi nic nesděluji.</li>
  <li>Klient si v aplikaci může připravit přehled pro vaši konzultaci (tisk nebo PDF).</li>
  <li>Pokud se role překrývají nebo si nejste jistí, domluvme se, kdo za co odpovídá.</li>
</ul>`,
    },
    {
      h: 'Kontakt pro spolupráci',
      html: `<p>Napište na <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>. V akutní situaci prosím použijte krizové kontakty, ne e-mail.</p>`,
    },
  ],
  related: ['/o-mne', '/metoda', '/jak-to-probiha', '/pro-koho', '/pribehy'],
};

// ---------- /pomoc (zveřejněno hned, není koncept) ----------
export const POMOC = {
  lead: 'Pokud je vám nebo někomu vedle vás teď zle, nečekejte. Níže jsou kontakty a stručný přehled, kde hledat odbornou pomoc.',
  sections: [
    {
      h: 'V akutní krizi volejte hned',
      html: `<p>Pokud máte myšlenky na sebevraždu nebo sebepoškození, nebo jde o akutní ohrožení života či zdraví, zavolejte:</p>
<ul class="crisis-list">
  <li><a href="tel:112"><strong>112</strong><span>tísňová linka</span></a></li>
  <li><a href="tel:155"><strong>155</strong><span>zdravotnická záchranná služba</span></a></li>
  <li><a href="tel:116123"><strong>116 123</strong><span>Linka první psychické pomoci</span></a></li>
</ul>
<p>Pokud můžete, nezůstávejte sami a řekněte to někomu blízkému. Peer mentor ani tento web krizovou pomoc neposkytují.</p>`,
    },
    {
      h: 'Kde hledat odbornou pomoc',
      html: `<ul class="rules">
  <li><strong>Praktický lékař:</strong> dobrý první kontakt. Posoudí tělesné potíže a může poradit další krok.</li>
  <li><strong>Psychiatr:</strong> lékař, který posuzuje duševní obtíže a může předepsat léky.</li>
  <li><strong>Klinický psycholog a psychoterapeut:</strong> pracují s obtížemi pomocí rozhovoru a konkrétních postupů. U OCD se obvykle používá expozice s prevencí reakce (ERP) nebo inferenční kognitivně-behaviorální přístup (I-CBT).</li>
  <li><strong>Centra duševního zdraví:</strong> poskytují péči v komunitě, blíž k domovu. Podmínky přijetí si ověřte u konkrétního centra.</li>
</ul>
<p>Ověřené organizace a adresáře najdete v části <a href="/pro-koho#odborna-pece">Kam dál: odborná péče</a>.</p>
<!-- ODKAZY NA KONKRÉTNÍ ORGANIZACE: doplní autor -->`,
    },
    {
      h: 'Peer podpora je doplněk, ne náhrada',
      html: `<p>Pokud odbornou péči máte, nebo se do ní chystáte, a hledáte oporu navíc, podívejte se, <a href="/jak-to-probiha">jak peer mentoring probíhá</a>. Pokud odbornou péči nemáte a vaše obavy vás hodně omezují, začněte u lékaře. Peer podpora ji nenahrazuje.</p>`,
    },
  ],
};
