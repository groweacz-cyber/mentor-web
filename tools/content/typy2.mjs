// Plné texty dalších typů OCD (stejná struktura jako TYPY_PLNY ve faze2.mjs).
// Pravidla: žádné diagnózy, žádné sliby vyléčení ani ujištění, žádné návody na samostatné expozice, žádná vymyšlená čísla ani citace.
// Zkušenost autora se tvrdí jen u témat, která sám uvádí na stránce O mně (magické, zdravotní, kontaminační, kontrolovací, Pure O).
import { ODBORNIK, peer } from './faze2.mjs';

const CRISIS = 'volejte 112, 155 nebo Linku první psychické pomoci 116 123';

const BEZ_TEMATU = 'Mám vlastní zkušenost s OCD v několika podobách, i když ne přesně s tímto tématem. Nebudu tvrdit, že vím přesně, jak to prožíváte, ale smyčku, pochybnosti a snahu mít jistotu znám zevnitř.';
const CITLIVE = ' O citlivých tématech se mnou můžete mluvit klidně a bez soudu. Zda jde o OCD, ale posoudit nemohu a neřeknu vám, že se nic nestane.';

export const TYPY_DALSI = {
  kontaminace: {
    lead: 'Kontaminace je podoba OCD, při které se obsese točí kolem nečistoty, nákazy nebo chemikálií a rituály kolem mytí a čištění mají strach utišit.',
    co: `<p>Při kontaminaci vyvolá strach dotek, předmět nebo místo, které člověk vnímá jako „špinavé“ nebo nebezpečné: kliky, peníze, toalety, zvířata, jiní lidé. Obava z nákazy nebo z toho, že nečistotu přenesu na druhé, je mnohem silnější, než odpovídá skutečnému riziku, a utišit ji dokáže jen rituál. Úleva ale trvá krátce.</p>
<p>Dbát na hygienu je normální. O OCD začínáme uvažovat, když mytí a čištění zabírá hodně času, bolí z něj kůže, omezuje práci a vztahy a jen těžko se zastavuje. Pocit nečistoty se může objevit i bez dotyku, například po nepříjemné myšlence nebo po setkání s někým. Posoudit to může jen odborník.</p>`,
    obsese: [
      'Co když jsem se dotkl něčeho, co mě nakazí vážnou nemocí?',
      'Co když přenesu nečistotu nebo nákazu na své blízké?',
      'Co když ve věcech zůstala chemikálie, která uškodí?',
      'Pocit, že jsem „špinavý“, i když na sobě nic nevidím.',
    ],
    kompulze: [
      'Dlouhé nebo opakované mytí rukou, sprchování nebo dezinfekce podle pevných pravidel.',
      'Čištění a uklízení domácnosti, dokud „to není čisté“.',
      'Převlékání, praní oblečení nebo vyhazování věcí, které se „znečistily“.',
      'Vyhýbání se místům, předmětům nebo lidem (toalety, kliky, nemocnice).',
      'Požadování, aby se blízcí řídili stejnými pravidly (zouvání bot, mytí po příchodu).',
      'Ujišťování u druhých, že už je „čisté“, nebo hledání informací o nákaze.',
    ],
    myty: [
      ['Je to jen důslednost v hygieně.', 'Hygiena má jasný cíl a po splnění končí. U kontaminačního OCD se mytí a čištění opakuje, i když člověk ví, že je hotovo, a utrpení i ztráta času rostou.'],
      ['Stačí se umýt ještě jednou a bude klid.', 'Klid trvá krátce a nutkání se vrací, často silnější. Každé další mytí obvykle smyčku posiluje.'],
      ['Opatrnost je vždycky dobrá.', 'Rozumná opatrnost má smysl. Pokud ale strach rozhoduje o tom, kam chodíte, čeho se dotknete a kolik hodin trávíte čištěním, přestává chránit a začíná omezovat život.'],
    ],
    odbornik: ODBORNIK + '<p>Při vyrážce, ekzému nebo poranění kůže z častého mytí je dobré obrátit se i na praktického nebo kožního lékaře.</p>',
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách, včetně kontaminačního tématu. Vím, jak silné je nutkání „ještě jednou se umýt“.'),
    souvisejici: ['zdravotni-ocd', 'magicke-mysleni', 'hyperzodpovednost', 'kontrolovani'],
  },

  'symetrie-just-right': {
    lead: 'Symetrie a „just right“ je podoba OCD, při které nepříjemný pocit „ještě to není ono“ neustoupí, dokud věc není srovnaná, souměrná nebo vykonaná „správně“.',
    co: `<p>Nejde vždy o strach z katastrofy, ale o tělesný nebo vnitřní pocit nesouladu: věc stojí „špatně“, pohyb se nepovedl „akorát“, něco „nesedí“. Napětí povolí, až když člověk věc srovná, zopakuje nebo dotáhne do konce. Pak se ale často objeví další nerovnost a další opravování. U některých lidí je s tím spojený i pocit, že by se jinak stalo něco zlého.</p>
<p>Mít rád pořádek je normální. O OCD začínáme uvažovat, když srovnávání zabírá hodně času, zdržuje, vyčerpává a nejde zastavit, i když si člověk uvědomuje, že je to nadměrné. Rozlišit to může odborník.</p>`,
    obsese: [
      'Ten pocit, že to ještě není „akorát“, nepustí.',
      'Věci musí být souměrné nebo ve „správném“ pořadí.',
      'Pohyb nebo věta se nepovedly „dobře“ a musí se zopakovat.',
      'Co když se stane něco špatného, když to nesrovnám?',
    ],
    kompulze: [
      'Uspořádávání a srovnávání předmětů, dokud „to sedí“.',
      'Opakování pohybů, chůze nebo dotyků, dokud se to „povede“.',
      'Dotýkání se stejně z obou stran (symetrie).',
      'Počítání nebo opakování slov a vět v duchu.',
      'Přepisování, přemazávání nebo přerovnávání, třeba v práci nebo ve škole.',
      'Vyhýbání se činnostem, při kterých pocit „nesedí“ nejde napravit.',
    ],
    myty: [
      ['Jsem jen pedant a mám rád pořádek.', 'Pořádek je volba a dělá radost. U OCD je to nutkání, které tlačí, zabírá čas a omezuje život, a pořádek po něm trvale neuleví.'],
      ['Až to srovnám, bude klid.', 'Klid trvá krátce. Nutkání se vrací a nároky na „správnost“ obvykle rostou.'],
      ['Jde hlavně o vzhled a estetiku.', 'U OCD jde o úlevu od napětí, ne o estetiku. Člověk to často sám vnímá jako zbytečné, a přesto se tomu nedokáže vzepřít.'],
    ],
    odbornik: ODBORNIK,
    peer: peer(BEZ_TEMATU),
    souvisejici: ['perfekcionisticke-ocd', 'magicke-mysleni', 'kontrolovani', 'kontaminace'],
  },

  'agresivni-vtirave-myslenky': {
    lead: 'Agresivní vtíravé myšlenky jsou nechtěné myšlenky nebo obrazy, že někomu ublížím, i když to vůbec nechci. Děsí právě proto, že odporují tomu, na čem člověku záleží.',
    co: `<p>Může jít o náhlý obraz, že upustím dítě, ublížím blízkému nebo ztratím kontrolu při řízení. Člověk je z takové myšlenky vyděšený, stydí se a snaží se ji zastavit nebo si ověřit, že by nic takového neudělal. Podobné nechtěné myšlenky se někdy objeví i lidem bez OCD, ale u OCD se „lepí“ a zabírají velkou část dne.</p>
<p>Myšlenka sama o sobě není plán ani přání. U OCD ji člověk prožívá jako cizí a odpudivou a snaží se, aby se nikdy nesplnila. Úplnou jistotu ale nemůže mít nikdo, a proto se obava vrací. Dát takovou jistotu nedokáže ani tento web, ani peer mentor, k posouzení slouží odborník.</p>
<aside class="fact"><p><strong>Důležité:</strong> Pokud cítíte skutečný záměr někomu ublížit nebo máte myšlenky na sebepoškození či sebevraždu, neodkládejte kontakt s odborníkem a ${CRISIS}.</p></aside>`,
    obsese: [
      'Co když ublížím svému dítěti, partnerovi nebo někomu blízkému?',
      'Vtíravý obraz násilí, který člověka vyděsí.',
      'Strach, že ztratím kontrolu a „něco udělám“.',
      'Co když ta myšlenka znamená, že jsem nebezpečný?',
    ],
    kompulze: [
      'Vyhýbání se ostrým předmětům nebo místům, kde by se „něco“ mohlo stát.',
      'Vyhýbání se lidem, kterým se bojím ublížit, včetně blízkých.',
      'Ujišťování u druhých, že jsem nikomu neublížil.',
      'Mentální kontrola: ověřování, jestli to doopravdy „nechci“.',
      'Vnitřní „vyrušení“ myšlenky: formulky, počítání, opačná představa.',
      'Zpětné procházení vzpomínek, jestli jsem něco neudělal.',
    ],
    myty: [
      ['Myšlenka znamená, že to doopravdy udělám.', 'Myšlenka sama o sobě není plán ani přání a nechtěné myšlenky zažívá většina lidí. Rozlišit obsesi od skutečného záměru ale patří odborníkovi, ne webu.'],
      ['Musím mít myšlenky pod kontrolou.', 'Úplnou kontrolu nad myšlenkami nemá nikdo. Pokus o ni myšlenku obvykle posiluje.'],
      ['O takových myšlenkách se nedá s nikým mluvit.', 'Dá. Odborníci takové téma znají a mluvit o něm je důležitý první krok. Hanba je častý důvod, proč lidé pomoc odkládají.'],
    ],
    odbornik: ODBORNIK + '<p>Citlivé téma patří do rukou odborníka, který OCD zná. Je v pořádku říct hned na začátku, že jde o myšlenky, které vás děsí a které nechcete.</p>',
    peer: peer(BEZ_TEMATU + CITLIVE),
    souvisejici: ['sexualni-vtirave-myslenky', 'pure-o', 'skrupulozita', 'strach-ze-zesileni'],
  },

  'sexualni-vtirave-myslenky': {
    lead: 'Sexuální vtíravé myšlenky jsou nechtěné sexuální myšlenky, představy nebo pochybnosti, které člověk prožívá jako cizí a odpudivé a které vyvolávají hanbu a strach.',
    co: `<p>Může jít o rušivou myšlenku nebo obraz, který se objeví zničehonic a zdá se nepatřičný, nebo o pochybnosti o tom, co „opravdu“ chci a kdo „opravdu“ jsem. Je to téma, o kterém se mluví těžko, a hanba často brání vyhledat pomoc. Jde ale o známou podobu OCD, o které se s odborníkem dá mluvit bez studu.</p>
<p>Myšlenka není přání ani důkaz o povaze člověka. Nechtěné myšlenky různého druhu zažívá většina lidí. U OCD jde o to, jak člověk s myšlenkou naloží: reaguje strachem a hledá jistotu. Otázky o vlastní identitě a orientaci mohou být součástí lidského hledání a samy o sobě nejsou porucha. O OCD uvažujeme, když se točí dokola, nejdou uzavřít a vyvolávají silné napětí. Posoudit to může jen odborník.</p>`,
    obsese: [
      'Nechtěná sexuální myšlenka nebo obraz, který se objeví zničehonic a zdá se nepatřičný.',
      'Co když ta myšlenka znamená, že doopravdy chci něco, co chtít nechci?',
      'Pochybnosti o vlastní sexuální orientaci, které přicházejí s pocitem naléhavosti a hrůzy.',
      'Strach z toho, že se budu chovat nevhodně.',
    ],
    kompulze: [
      'Zkoumání vlastních tělesných reakcí, jestli „něco“ cítím.',
      'Vyhýbání se lidem, místům, filmům nebo situacím, které myšlenku spouštějí.',
      'Ujišťování u blízkých nebo na internetu.',
      'Mentální přehrávání: v duchu si situaci procházím, abych si ověřil, že jsem „v pořádku“.',
      'Snaha myšlenku zastavit, vyvrátit nebo „odčinit“ (formulka, modlitba, opačná představa).',
    ],
    myty: [
      ['Myšlenka odhaluje, kdo doopravdy jsem.', 'Myšlenka nevypovídá o tom, kdo jste. U OCD udržuje smyčku hlavně strach z ní a snaha ji vyvrátit.'],
      ['Když mě myšlenka děsí, musí být „pravdivá“.', 'Strach a odpor jsou součástí obsese, ne důkaz její pravdivosti. Jistota se u OCD ujišťováním získat nedá.'],
      ['O takové věci se s nikým mluvit nedá.', 'Dá. Odborníci takové téma obvykle znají a mluvit o něm není ostuda. Hanba je častý důvod, proč lidé pomoc odkládají.'],
    ],
    odbornik: ODBORNIK + '<p>Je v pořádku říct odborníkovi hned na začátku, že jde o nechtěné sexuální myšlenky, které vás děsí. Není to nic, co by odborníka mělo překvapit.</p>',
    peer: peer(BEZ_TEMATU + CITLIVE),
    souvisejici: ['agresivni-vtirave-myslenky', 'vztahove-ocd', 'skrupulozita', 'pure-o'],
  },

  skrupulozita: {
    lead: 'Skrupulozita je podoba OCD, při které se obsese točí kolem morálky a víry: neudělal jsem něco špatného, hříšného nebo nepřijatelného?',
    co: `<p>Při skrupulozitě zní pochybnost třeba takto: „Byl jsem dost čestný? Neublížil jsem někomu? Neurazil jsem Boha?“ Člověk si své jednání, myšlenky i úmysly zpětně přezkoumává a hledá jistotu, že je v pořádku. Ta ale nepřichází, nebo jen na chvíli.</p>
<p>Svědomí a víra jsou pro mnoho lidí důležité a samy o sobě poruchou nejsou. O OCD začínáme uvažovat, když pochybnosti zabírají hodně času, berou radost a omezují život. Tento web nehodnotí víru ani žádné náboženství. Zda jde o OCD, posoudí odborník.</p>`,
    obsese: [
      'Co když jsem udělal něco morálně špatného a nevím o tom?',
      'Co když jsem se při modlitbě „špatně soustředil“ a nebyla platná?',
      'Strach, že jsem někoho nechtěně zranil, oklamal nebo okradl.',
      'Pochybnosti, jestli jsem opravdu „dobrý člověk“.',
    ],
    kompulze: [
      'Opakovaná modlitba, zpověď nebo omluva, dokud se to nezdá správné.',
      'Přezkoumávání svého svědomí a minulých činů.',
      'Ujišťování u duchovních, blízkých nebo na internetu.',
      'Vyhýbání se situacím, ve kterých by se mohl objevit „hřích“.',
      'Přehnaná snaha o morální dokonalost, třeba nadměrné omlouvání.',
    ],
    myty: [
      ['Je to prostě silné svědomí.', 'Zdravé svědomí pomáhá a po vyřízení věci se uklidní. Skrupulozita se točí dokola, bere čas i radost a trvalou úlevu nepřináší.'],
      ['Když budu dost zbožný nebo poctivý, pochybnosti zmizí.', 'Pochybnosti se tím obvykle nevyřeší. Čím víc se člověk snaží dokázat si čistotu svědomí, tím víc se vrací pocit, že to nestačilo.'],
      ['Týká se to jen věřících.', 'Skrupulozita nemusí být vázaná na náboženství. Může se týkat i čestnosti, spravedlnosti nebo vztahů k druhým.'],
    ],
    odbornik: ODBORNIK,
    peer: peer(BEZ_TEMATU),
    souvisejici: ['zpovedni-ocd', 'hyperzodpovednost', 'real-event-ocd', 'vztahove-ocd'],
  },

  'pure-o': {
    lead: 'Pure O je neformální označení pro OCD, při kterém převažují obsese a kompulze probíhají hlavně v hlavě, takže zvenku nejsou vidět.',
    co: `<p>Název „Pure O“ (z anglického obsessional, „čistě obsedantní“) může být zavádějící. Neznamená OCD bez kompulzí: kompulze tam jsou, jen skryté. Jsou to mentální rituály, například přemítání, analyzování, procházení vzpomínek, kontrola pocitů, vnitřní formulky a ujišťování sebe sama. Člověk může vypadat klidně a uvnitř vést dlouhý boj.</p>
<p>Pure O není samostatná diagnóza. Je to pohodlné slovo, kterým lidé pojmenovávají svou zkušenost. Zda jde o OCD, posoudí odborník.</p>`,
    obsese: [
      'Nechtěné myšlenky a obrazy na různá témata, které děsí svou nepatřičností.',
      'Strach, že ta myšlenka něco znamená.',
      'Neustálá potřeba mít jistotu, že jsem „v pořádku“.',
      'Pocit, že musím myšlenku vyřešit hned.',
    ],
    kompulze: [
      'Přemítání a analyzování, dokud nenajdu „správnou“ odpověď.',
      'Procházení vzpomínek a situací, jestli jsem to „udělal správně“.',
      'Kontrola pocitů: cítím něco? Cítím dost?',
      'Vnitřní formulky, počítání nebo opakování slov.',
      'Mentální „vyrušování“ myšlenky opačnou myšlenkou.',
      'Ujišťování: ptaní se druhých nebo vyhledávání na internetu, abych se uklidnil.',
    ],
    myty: [
      ['Pure O je OCD bez kompulzí.', 'Kompulze jsou, jen probíhají v hlavě a zvenku nejsou vidět. Proto se hůř rozpoznávají i u sebe.'],
      ['Když se nic neděje navenek, není to tak vážné.', 'Mentální rituály mohou zabírat hodiny denně a vyčerpávají stejně jako ty viditelné.'],
      ['Stačí myšlenky v hlavě vyřešit.', 'Hledání odpovědi v hlavě je typicky kompulze. Krátce uleví a udržuje smyčku, takže se „vyřešená“ otázka obvykle jen vymění za další.'],
    ],
    odbornik: ODBORNIK,
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách, včetně Pure O. Nekonečné přemítání v hlavě znám zevnitř.'),
    souvisejici: ['agresivni-vtirave-myslenky', 'sexualni-vtirave-myslenky', 'existencialni-ocd', 'real-event-ocd'],
  },

  'senzomotoricke-ocd': {
    lead: 'Senzomotorické OCD je podoba OCD, při které se pozornost zasekne na tělesných vjemech, které jinak běží samy: dýchání, mrkání, polykání nebo tep.',
    co: `<p>Jakmile si člověk začne uvědomovat, že dýchá nebo mrká, vjem se zesílí a „nejde pustit“. Pozornost se k němu vrací, i když se snažíme myslet na něco jiného, a vzniká obava, že to nikdy neskončí. Snaha vjem „nastavit správně“ ho obvykle udržuje.</p>
<p>Důležité: OCD nevylučuje skutečné tělesné potíže. Pokud máte nový nebo trvající příznak, patří k lékaři. Zda jde o senzomotorické OCD, posoudí odborník, tento web ani peer mentor to nemůže.</p>`,
    obsese: [
      'Co když si budu pořád uvědomovat dýchání a už to nikdy nepustím?',
      'Strach, že si nepřirozeně uvědomuji tělo a už se to nevrátí do normálu.',
      'Vjem mrkání nebo polykání, který ruší práci, spánek a soustředění.',
      'Pocit, že si musím vjem hlídat, jinak se „něco pokazí“.',
    ],
    kompulze: [
      'Sledování vlastního dýchání, mrkání nebo polykání.',
      'Snaha vjem „nastavit“: dýchat, mrkat nebo polykat „správně“.',
      'Vyhýbání se tichu, spánku nebo situacím, ve kterých se vjem zesiluje.',
      'Ujišťování u blízkých nebo u lékaře, že je to normální.',
      'Vyhledávání informací o tom, jak vjem „vypnout“.',
    ],
    myty: [
      ['Je to prostě něco s tělem.', 'Tělesné potíže posoudí lékař a tento web nic nevylučuje. Pokud lékař žádnou příčinu nenajde a pozornost se na vjem vrací stále dokola, může pomoci odborník na duševní zdraví.'],
      ['Stačí se víc soustředit na něco jiného.', 'Snaha vjem vytlačit pozornost obvykle ještě víc přitahuje. Vůlí se vjem „vypnout“ nedá.'],
      ['Když tomu budu věnovat víc pozornosti, pochopím, co se děje.', 'Sledování vjemu ho obvykle posiluje. Je to podobné jako u jiných kompulzí: krátce zjistím, že je to „v pořádku“, a za chvíli se zeptám znovu.'],
    ],
    odbornik: ODBORNIK + '<p>Při tělesných potížích je dobré mít vedle psychiatra nebo psychologa i praktického lékaře, který posoudí tělesné příznaky.</p>',
    peer: peer(BEZ_TEMATU),
    souvisejici: ['zdravotni-ocd', 'emetofobni-ocd', 'pure-o', 'strach-ze-zesileni'],
  },

  'existencialni-ocd': {
    lead: 'Existenciální OCD je podoba OCD, při které se filozofické otázky o smyslu, realitě, existenci nebo smrti mění v nutkání mít na ně jistou odpověď.',
    co: `<p>Zajímat se o velké otázky je lidské. U existenciálního OCD se ale otázka „Co když to nemá smysl?“ nebo „Co když není nic skutečné?“ mění v obsesi: vyvolává úzkost a člověk se ji snaží vyřešit přemýšlením, čtením a hledáním argumentů. Jistá odpověď ale neexistuje, a tak se hledání opakuje.</p>
<p>Rozdíl není v tématu, ale v tom, co s ním člověk dělá a kolik místa v životě zabírá. Pokud se pochybnosti točí dokola a zabírají hodně času, může jít o OCD. Podobné pocity se mohou objevit i při depersonalizaci nebo derealizaci. Rozlišit to dokáže odborník.</p>`,
    obsese: [
      'Co když nic nemá smysl?',
      'Co když svět, který vnímám, není skutečný?',
      'Strach z vlastní smrti nebo z toho, co bude po ní.',
      'Co když si nikdy nebudu moct být jistý, že existuju?',
    ],
    kompulze: [
      'Dlouhé přemítání a hledání „správné“ odpovědi.',
      'Čtení filozofie, článků nebo diskuzí v naději, že najdu jistotu.',
      'Zkoušení reality: testování, jestli je něco „skutečné“.',
      'Ptaní se druhých nebo umělé inteligence, co si o tom myslí.',
      'Vyhýbání se tématům, která otázku spouštějí (filmy, zprávy, rozhovory).',
    ],
    myty: [
      ['Stačí najít správnou odpověď.', 'Na velké otázky jistá odpověď neexistuje. Hledání jistoty je právě ta kompulze, která smyčku drží.'],
      ['Takové otázky řeší jen hluboký myslitel.', 'Zamýšlet se nad smyslem je lidské a obohacující. U OCD ale otázka vyvolává úzkost, zabírá spoustu času a nepřináší klid, jen další otázky.'],
      ['Když o tom nebudu přemýšlet, otázky zmizí.', 'Potlačování obvykle otázky vrací. Jiný směr než boj je přijmout, že na některé otázky odpověď mít nemusím.'],
    ],
    odbornik: ODBORNIK,
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách a také s depersonalizací a derealizací, i když ne přesně s tímto tématem. Nekonečné hledání jistoty ale znám zevnitř.'),
    souvisejici: ['pure-o', 'strach-ze-zesileni', 'magicke-mysleni', 'skrupulozita'],
  },

  'magicke-mysleni': {
    lead: 'Magické myšlení je podoba OCD, při které má člověk pocit, že určitá myšlenka, číslo nebo rituál ovlivní, zda se něco stane.',
    co: `<p>Může jít o pocit, že „špatné“ číslo, barva nebo slovo přitáhne neštěstí, nebo že určitý rituál nehodě zabrání. Člověk většinou ví, že to „nedává smysl“, a přesto se bojí, že kdyby rituál nevykonal, stalo by se něco zlého. Myšlenka a skutečnost se v hlavě propojí, a rituál tak zdánlivě chrání.</p>
<p>Pověry jsou běžné a samy o sobě nic neznamenají. O OCD začínáme uvažovat, když rituály zabírají hodně času, nelze je vynechat a vyvolávají napětí nebo strach. Posoudit to může jen odborník.</p>`,
    obsese: [
      'Co když se stane něco zlého, když si pomyslím tu „špatnou“ věc?',
      'Co když určité číslo nebo slovo přinese neštěstí?',
      'Co když rituál vynechám a někomu se něco stane?',
      'Strach, že moje myšlenka může ovlivnit skutečnost.',
    ],
    kompulze: [
      'Rituály „aby se nic nestalo“: dotýkání, klepání, opakování.',
      'Vyhýbání se „špatným“ číslům, barvám, slovům nebo dnům.',
      'Vnitřní formulky nebo „dobré“ myšlenky, které mají to zlé zrušit.',
      'Počítání a opakování, dokud to „nevyjde“.',
      'Ujišťování druhých nebo sebe, že se nic nestane.',
    ],
    myty: [
      ['Je to jen pověrčivost.', 'Pověry bývají nezávazné. U OCD je spojení mezi myšlenkou a událostí prožívané vážně a rituál se nedá vynechat bez silného napětí.'],
      ['Je to jen zvyk.', 'Zvyk se dá bez velkého napětí změnit. Rituál z OCD drží strach a vynechat ho bývá velmi těžké.'],
      ['Když se rituál povede, pomáhá.', 'Pomáhá krátce, protože zmírní strach. Zároveň ale potvrzuje, že bez rituálu by bylo něco špatně, a smyčku posiluje.'],
    ],
    odbornik: ODBORNIK,
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách, včetně magického myšlení. Vím, jak přesvědčivě rituál „chrání“.'),
    souvisejici: ['kontaminace', 'symetrie-just-right', 'hyperzodpovednost', 'kontrolovani'],
  },

  hyperzodpovednost: {
    lead: 'Hyperzodpovědnost je podoba OCD, při které člověk cítí přehnanou odpovědnost za to, aby se nikomu nic nestalo, i když to nemá pod kontrolou.',
    co: `<p>Jde o silný pocit, že kdyby se něco stalo, byla by to moje vina a já jsem povinen tomu předejít. Z toho vznikají kontroly a ujišťování, ale také vyhýbání se rozhodnutím nebo naopak přebírání cizí odpovědnosti. Odpovědnost je pro mnoho lidí důležitá hodnota. U OCD ale přerůstá míru, kterou lze unést.</p>
<p>Pocit odpovědnosti je normální. O OCD začínáme uvažovat, když zabírá hodně času, vyčerpává, nejde zastavit a po každé další „pojistce“ je strach spíš větší. Posoudit to může jen odborník.</p>`,
    obsese: [
      'Co když se někomu něco stane a bude to moje vina?',
      'Co když jsem na něco zapomněl a způsobím škodu?',
      'Musím mít jistotu, že jsem udělal všechno, co šlo.',
      'Co když jsem jediný, kdo tomu může zabránit?',
    ],
    kompulze: [
      'Opakované kontroly a „pojistky“ proti možné škodě.',
      'Ujišťování u druhých, že jsem nic nezanedbal.',
      'Vyhýbání se rozhodnutím, ve kterých by hrozila chyba.',
      'Přebírání cizích úkolů a starostí, aby se nic nepokazilo.',
      'Mentální přehrávání situací a otázek „co jsem mohl udělat jinak“.',
    ],
    myty: [
      ['Odpovědný člověk musí mít jistotu.', 'Odpovědnost jistotu nevyžaduje. Nikdo nemůže zabránit všemu a hledání absolutní jistoty smyčku jen živí.'],
      ['Kdyby se něco stalo, byla by to moje vina.', 'Pocit viny a skutečná odpovědnost nejsou totéž. U OCD je pocit odpovědnosti často mnohem větší než skutečný vliv.'],
      ['Když si dám pozor na všechno, budu klidnější.', 'Pozornost se stupňuje a klid nepřichází. Každá další pojistka zvyšuje pocit, že je potřeba.'],
    ],
    odbornik: ODBORNIK,
    peer: peer(BEZ_TEMATU),
    souvisejici: ['kontrolovani', 'real-event-ocd', 'skrupulozita', 'zpovedni-ocd'],
  },

  'real-event-ocd': {
    lead: 'Real-event OCD je podoba OCD, při které se obsese točí kolem skutečných událostí z minulosti: neudělal jsem tehdy něco špatně?',
    co: `<p>Člověk se vrací k události, která se opravdu stala, a nedokáže se zbavit pochybnosti, jestli se nezachoval špatně, nikomu neublížil nebo neřekl něco nevhodného. Snaží se na ni přesně vzpomenout, protože doufá, že tak najde jistotu. Paměť ale není přesný záznam, a tak se pátrání opakuje bez konce.</p>
<p>Přemýšlet o minulosti a litovat chyb je normální. O OCD začínáme uvažovat, když se přemítání točí dokola, bere hodně času a nepřináší žádný závěr. Pokud v minulosti existuje událost, která opravdu někomu ublížila, stojí za to s ní zacházet s odborníkem. OCD takovou možnost nevylučuje. Rozlišit to dokáže odborník.</p>`,
    obsese: [
      'Co když jsem tehdy někomu ublížil a nevím o tom?',
      'Co když jsem řekl něco, co mě bude pronásledovat?',
      'Co když jsem na něco zapomněl, nebo si to pamatuji špatně?',
      'Co když ta událost znamená, že jsem špatný člověk?',
    ],
    kompulze: [
      'Mentální přehrávání vzpomínek, dokud si nebudu „jistý“.',
      'Vyptávání se druhých, jak se to opravdu stalo.',
      'Hledání důkazů: zpráv, fotek, záznamů.',
      'Přiznávání a omlouvání se za něco, co možná ani nebylo.',
      'Ujišťování, že „to bylo v pořádku“.',
    ],
    myty: [
      ['Když si vzpomenu přesně, ulevím si.', 'Paměť není přesný záznam a jistotu z ní získat nejde. Čím víc se pátrá, tím víc „mezer“ se najde.'],
      ['Když mě to pořád trápí, musí v tom být něco pravdy.', 'Intenzita strachu o pravdivosti nic neříká. U OCD bývá trápení silné i tam, kde skutečnost nic zlého nepotvrzuje.'],
      ['Musím to nejdřív vyřešit a pak půjdu dál.', 'Vyřešení se obvykle nedostaví. Obecně pomáhá naučit se pochybnost unést, ne ji vyřešit.'],
    ],
    odbornik: ODBORNIK,
    peer: peer(BEZ_TEMATU),
    souvisejici: ['zpovedni-ocd', 'kontrolovani', 'skrupulozita', 'pure-o'],
  },

  'emetofobni-ocd': {
    lead: 'Emetofobní OCD je podoba OCD, při které je středem obav zvracení: strach z něj a rituály, které mají zvracení předejít.',
    co: `<p>Strach ze zvracení může ovlivňovat jídlo, cestování, společenské akce i vztahy. Člověk kontroluje potraviny a data spotřeby, vyhýbá se lidem, kteří by mohli být nemocní, a drží pevná pravidla kolem jídla. Mnohé z těchto kroků jsou kompulze: krátce uleví a strach nakonec posilují.</p>
<p>Obavy z nevolnosti jsou běžné. Emetofobie (specifická fobie ze zvracení) a OCD se mohou prolínat, a rozlišit je může jen odborník. Pokud máte potíže s jídlem, hubnete nebo vás trápí tělesné příznaky, obraťte se na lékaře.</p>`,
    obsese: [
      'Co když mi bude špatně a nebudu moct odejít?',
      'Co když se nakazím od někoho, kdo je nemocný?',
      'Co když mi jídlo uškodí a budu zvracet?',
      'Strach z pocitu nevolnosti a z toho, že ho nezvládnu.',
    ],
    kompulze: [
      'Kontrola potravin, dat spotřeby a způsobu přípravy jídla.',
      'Vyhýbání se určitým jídlům, restauracím, dopravě nebo lidem.',
      'Rituály kolem jídla: pevná pravidla, porce, doba po jídle.',
      'Sledování tělesných pocitů kvůli nevolnosti.',
      'Ujišťování u druhých, že jsou zdraví nebo že je jídlo v pořádku.',
      'Vyhledávání informací o nemocech a otravách.',
    ],
    myty: [
      ['Je to jen opatrnost kolem jídla.', 'Rozumná opatrnost chrání. Pokud ale pravidla rozhodují o tom, co jíte, kam chodíte a s kým se vídáte, omezují život víc, než jim hrozí.'],
      ['Když se vyhnu všemu rizikovému, bude klid.', 'Vyhýbání krátce uleví a život zužuje. Strach se obvykle zvětšuje a počet „nebezpečných“ situací roste.'],
      ['Je to jen zažívání.', 'Zažívací potíže posoudí lékař. Strach ze zvracení ale může vyvolávat i tělesné pocity, jako je nevolnost, a potíže se strachem se pak navzájem zesilují.'],
    ],
    odbornik: ODBORNIK + '<p>Při potížích s jídlem, úbytku hmotnosti nebo opakovaných tělesných příznacích je dobré mít vedle psychiatra nebo psychologa i praktického lékaře.</p>',
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách a také se zažívacími potížemi, které vyvolávala úzkost, i když ne přesně s tímto tématem. Smyčku ale znám zevnitř.'),
    souvisejici: ['zdravotni-ocd', 'kontaminace', 'senzomotoricke-ocd', 'strach-ze-zesileni'],
  },

  'perfekcionisticke-ocd': {
    lead: 'Perfekcionistické OCD je neformální pojmenování situace, kdy se potřeba udělat věc „dokonale“ nebo „přesně“ vymkla běžnému perfekcionismu a mění se v nekonečné opravování.',
    co: `<p>Člověk opakuje, přepisuje a kontroluje detaily, protože se mu nikdy nezdá, že je to „akorát“. Dokončit práci je těžké a odevzdání je spojené s úzkostí. Často za tím stojí obava, že drobná chyba bude mít vážné následky nebo že bez dokonalosti „nebude dost dobrý“.</p>
<p>Mít vysoké nároky je normální a často užitečné. O OCD začínáme uvažovat, když se nároky stanou nesplnitelnými, berou hodně času, bolí a omezují práci, studium nebo vztahy. Název je neformální, nejde o samostatnou diagnózu. Perfekcionismus a OCD se mohou potkávat a prolínat, a rozlišit je může odborník.</p>`,
    obsese: [
      'Co když je v tom chyba, kterou jsem přehlédl?',
      'Musí to být dokonalé, jinak to nemá cenu.',
      'Co když to nebude „akorát“ a budu se za to stydět?',
      'Co když mě druzí odsoudí za nedokonalost?',
    ],
    kompulze: [
      'Opakované přepisování a opravování.',
      'Kontrola detailů znovu a znovu.',
      'Odkládání dokončení nebo odevzdání.',
      'Ptaní se druhých, jestli je to „dost dobré“.',
      'Vyhýbání se úkolům, které by se mohly nepovést.',
    ],
    myty: [
      ['Je to jen vysoké nároky na sebe.', 'Vysoké nároky mohou pohánět. U OCD vyvolá úkol napětí, které se po splnění nezklidní, a čas i energie odtékají do opravování.'],
      ['Když to nebude dokonalé, selžu.', 'Dokonalost není měřítko, které by kdokoli splnil. Hledání dokonalosti obvykle zvyšuje tlak, ne kvalitu.'],
      ['Perfekcionismus je vždycky silná stránka.', 'V malé míře pomáhá. Když ale zabírá hodně času a bolí, přestává být výhodou.'],
    ],
    odbornik: ODBORNIK,
    peer: peer(BEZ_TEMATU),
    souvisejici: ['symetrie-just-right', 'kontrolovani', 'hyperzodpovednost', 'skrupulozita'],
  },

  'zpovedni-ocd': {
    lead: 'Zpovědní OCD je podoba OCD, při které se člověk nutkavě přiznává nebo ověřuje u druhých, zda neudělal něco špatně.',
    co: `<p>Nutkání říct druhým o svých myšlenkách nebo činech vzniká proto, aby napětí povolilo. Člověk se přiznává opakovaně, i drobnostem, a hledá reakci, která mu potvrdí, že je v pořádku. Přiznání se mění v kompulzi: úleva trvá krátce, a tak je potřeba říkat znovu a víc.</p>
<p>Upřímnost je hodnota a někdy je správné se přiznat. O OCD začínáme uvažovat, když přiznání vychází hlavně z potřeby zbavit se napětí, opakuje se a nepřináší trvalou úlevu. Zda jde o OCD, posoudí odborník. U skutečného činu, který druhému ublížil, je namístě poradit se s odborníkem.</p>`,
    obsese: [
      'Co když jsem udělal něco špatného a musím to říct?',
      'Co když mlčením někoho klamu?',
      'Napětí, které povolí, až když se přiznám.',
      'Strach, že druzí „musejí vědět“, co si myslím nebo co jsem udělal.',
    ],
    kompulze: [
      'Opakovaná přiznání partnerovi, rodině nebo přátelům.',
      'Vyptávání se druhých na reakci a ujištění, že je vše v pořádku.',
      'Psaní omluv, vysvětlování a „opravování“ toho, co jsem řekl.',
      'Mentální přehrávání rozhovorů a příprava „přiznání“.',
      'Vyhýbání se situacím, ve kterých bych se mohl „provinit“.',
    ],
    myty: [
      ['Čestnost znamená říct všechno.', 'Čestnost neznamená vysvětlovat každou myšlenku a chybu. U OCD se nutkání přiznat opakuje a slouží hlavně k úlevě od napětí.'],
      ['Když se přiznám, ulevím si.', 'Úleva trvá krátce a nutkání se vrací, často silnější.'],
      ['Druzí mi řeknou, jak to je.', 'Reakce druhých jistotu nedá. Slouží jako další ujištění a smyčka pokračuje. Blízcí se mohou naučit odpovídat jinak, více na stránce Pro blízké.'],
    ],
    odbornik: ODBORNIK,
    peer: peer(BEZ_TEMATU),
    souvisejici: ['skrupulozita', 'real-event-ocd', 'vztahove-ocd', 'hyperzodpovednost'],
  },

  'strach-ze-zesileni': {
    lead: 'Strach ze zešílení je podoba OCD, při které se obsese točí kolem obavy ze ztráty kontroly nebo zdravého rozumu.',
    co: `<p>Vtíravá myšlenka nebo zvláštní pocit (nereálnost, rozptýlená pozornost, nezvyklá představa) vyvolá obavu, že se „zbláznim“ nebo ztratím kontrolu. Člověk si hlídá myšlenky a pocity, hledá příznaky a ujišťuje se, že je v pořádku. Kontrola ale strach obvykle posiluje.</p>
<p>Strach ze zešílení není totéž co psychóza. Psychotické stavy vyžadují odborné vyšetření a o tom, co se děje, rozhoduje psychiatr, ne tento web. Pokud slyšíte hlasy, vidíte věci, které druzí nevidí, nebo ztrácíte kontakt s realitou, neodkládejte vyšetření. V akutní krizi nebo při myšlenkách na sebepoškození ${CRISIS}.</p>`,
    obsese: [
      'Co když se zblázním a ztratím kontrolu?',
      'Co když ta myšlenka znamená, že se mi s hlavou něco děje?',
      'Co když ten pocit nereálnosti už nikdy nezmizí?',
      'Strach, že nezvládnu vlastní myšlenky a „něco udělám“.',
    ],
    kompulze: [
      'Hlídání myšlenek: kontrola, jestli jsou „normální“.',
      'Vyhledávání příznaků duševních poruch na internetu nebo u umělé inteligence.',
      'Ujišťování u blízkých nebo u lékaře, že jsem „v pořádku“.',
      'Vyhýbání se situacím, které spouštějí podivné pocity nebo myšlenky.',
      'Mentální rituály: opakování formulek, počítání, „testování“ pozornosti.',
    ],
    myty: [
      ['Strach ze zešílení znamená, že zešílím.', 'Strach sám o ničem nerozhoduje. Co se skutečně děje, posoudí odborník, ne tento web.'],
      ['Musím si ověřit, že jsem v pořádku.', 'Ověřování uleví na chvíli a strach vrací, často silnější. Je to kompulze, ne řešení.'],
      ['Stačí myslet na něco jiného.', 'Potlačování myšlenek je obvykle posiluje. Pomáhá spíš naučit se s nimi zůstat bez boje, ideálně s oporou odborníka.'],
    ],
    odbornik: ODBORNIK + '<p>Pokud si nejste jistí, zda jde o OCD, nebo o jiný stav, obraťte se na psychiatra. Posoudí, co se děje, a navrhne další postup.</p>',
    peer: peer('Mám vlastní zkušenost s OCD v několika podobách a také s pocity nereálnosti (depersonalizací a derealizací). Vím, jak děsivé to může být, ale nejsem lékař a neřeknu vám, že vám nic není.'),
    souvisejici: ['pure-o', 'existencialni-ocd', 'zdravotni-ocd', 'agresivni-vtirave-myslenky'],
  },
};
