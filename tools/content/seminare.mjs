// Texty a HTML stránek Online semináře: /seminare, /seminare/rezervace a /seminare/rezervace/potvrzeni.
// Programy, termíny, ceny a stavy běhů se berou z data/seminare.json (přes api/_lib/seminare.js), nikdy se nepíšou ručně.
import { readFileSync } from 'node:fs';
import { denSPredlozkou, dlouhyCz, formatCz, stavBehu } from '../../api/_lib/seminare.js';
import { textyProgramu, formatCastka } from '../../api/_lib/texty.js';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- komunikace a aplikace ----------
// QR kódy odkazů do oficiálních obchodů se generují při sestavení webu (stejnou knihovnou jako QR Platba), na stránce nejsou žádné cizí skripty ani obrázky.
const qrBalik = { exports: {} };
new Function('module', 'exports', readFileSync(new URL('../../assets/js/vendor/qrcode.js', import.meta.url), 'utf8'))(qrBalik, qrBalik.exports);
const qrcode = qrBalik.exports;
const qrSvg = (url, popis) => {
  const qr = qrcode(0, 'M');
  qr.addData(url, 'Byte');
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true }).replace('<svg ', `<svg role="img" aria-label="${esc(popis)}" focusable="false" `);
};
export const APLIKACE = [
  {
    nazev: 'Google Meet',
    obchody: [
      ['App Store', 'iPhone a iPad', 'https://apps.apple.com/app/google-meet/id1013231476'],
      ['Google Play', 'Android', 'https://play.google.com/store/apps/details?id=com.google.android.apps.tachyon'],
    ],
  },
  {
    nazev: 'WhatsApp',
    obchody: [
      ['App Store', 'iPhone a iPad', 'https://apps.apple.com/app/whatsapp-messenger/id310633997'],
      ['Google Play', 'Android', 'https://play.google.com/store/apps/details?id=com.whatsapp'],
    ],
  },
];
const aplikaceHtml = () => APLIKACE.map((a) => `    <article class="card app-dl">
      <h4>${esc(a.nazev)}</h4>
${a.obchody.map(([obchod, zarizeni, url]) => `      <div class="app-dl-row">
        <div class="app-dl-qr">${qrSvg(url, `QR kód: ${a.nazev} v obchodě ${obchod}, ${zarizeni}`)}</div>
        <p><a href="${esc(url)}" target="_blank" rel="noopener">${esc(a.nazev)} v obchodě ${esc(obchod)}<span class="sr-only"> (otevře se nové okno)</span></a><br><span class="small">${esc(zarizeni)}</span></p>
      </div>`).join('\n')}
    </article>`).join('\n');

export const SPOJENI_ZKRATKA = 'Po rezervaci a připsání platby se vám ozvu já, nemusíte se mi ozývat sami. Videohovor 1:1 probíhá přes Google Meet nebo WhatsApp.';

export const NADPIS_STRANKY = 'Online semináře';
export const PODTITUL_STRANKY = 'Dva individuální programy 1:1: jeden pro lidi s OCD, druhý pro jejich blízké. Vyberte ten, který vám sedí.';
export const KRIZE = 'V akutní krizi volejte 112 nebo Linku první psychické pomoci 116 123.';
export const SPAM_UPOZORNENI = 'Platební údaje a termíny vám pošlu e-mailem z adresy info@ocdmentor.cz. Zpráva může skončit ve spamu nebo v záložce Hromadné či Reklamy. Pokud ji v doručené poště nenajdete, podívejte se tam a označte ji jako „Není spam“.';

// Věta o formátu a ceně z dat programu (den, čas, počet a délka setkání i cena se nepíšou ručně).
export const formatProgramu = (p) => {
  const t = textyProgramu(p.id);
  return `${p.pocetSetkani} setkání po ${p.delkaMinut} minutách, 1× týdně ${denSPredlozkou(p.den)} v ${p.cas}, online 1:1.${t.formatDodatek ? ` ${t.formatDodatek}` : ''} Cena ${formatCastka(p.cena)} za celý program. Cena je konečná, nejsem plátce DPH.`;
};
export const shrnutiProgramu = (p) => `Individuální program ${p.pocetSetkani} setkání · ${formatCastka(p.cena)}`;

// ---------- obsah programů (klíč = id programu v data/seminare.json) ----------
const KARTY_OCD = [
  ['Nejsi své OCD', 'Jak funguje cyklus OCD a proč sebepřijetí není rezignace.'],
  ['Proč nás některé myšlenky zasahují', 'Význam, který strachu dáváme, a proč myšlenka není předpověď.'],
  ['Zvědomění vzorců a sebepřijetí', 'Naučená pravidla a druhotný boj se sebekritikou.'],
  ['Sebedůvěra, nejistota a síla středu', 'Důvěra bez záruk, rovnováha místo extrémů.'],
  ['Kompulze, každodenní svoboda a když se obtíže vracejí', 'Oheň jako metafora a kdy vyhledat odborníka.'],
];

const JAK_SPOLECNE = [
  'Jen já a vy, videohovor přes Google Meet nebo WhatsApp (podle toho, co vám vyhovuje).',
  'Ozvu se vám já: po připsání platby vám napíšu e-mailem a domluvíme spojení. Nemusíte se mi ozývat sami.',
  'Kamera je dobrovolná.',
  'Setkání nenahrávám.',
  'Nic z toho, co zazní, nesdílím dál (výjimka: vážné ohrožení života nebo zdraví).',
];

export const OBSAH = {
  'pro-lidi-s-ocd': {
    odkaz: '',
    intro: '',
    kniha: true,
    kartyNadpis: 'Pět setkání',
    karty: KARTY_OCD,
    jak: [
      ...JAK_SPOLECNE,
      'Neuklidňuji vás ujišťováním typu „nic se vám nestane“ a nevedu vás ke zpracování traumat.',
      'Praktická cvičení z knihy jsou nepovinná reflexe, ne domácí úkol.',
    ],
    proKoho: 'Program je vhodný pro lidi, kteří jsou v péči odborníka nebo se do ní aktivně objednávají. Pokud hledáte léčbu nebo diagnózu, obraťte se na psychologa, psychoterapeuta nebo psychiatra. V akutní krizi volejte 112 nebo Linku první psychické pomoci 116 123.',
    faq: [],
  },
  'pro-blizke': {
    odkaz: '<p>Víc o tématu najdete na stránce <a href="/pro-blizke">Když OCD žije vedle vás</a>.</p>',
    intro: 'Žijete s člověkem, který má OCD, nebo se o někoho takového staráte? Možná máte pocit, že všechno, co zkusíte, nepomáhá nebo situaci dokonce zhoršuje. Dobře míněná pomoc totiž OCD často nechtěně udržuje. Na tomto programu vám ukážu, jak to vypadá zevnitř, co pomáhá a jak si přitom zachovat vlastní život.',
    kniha: false,
    kartyNadpis: 'Tři setkání',
    karty: [
      ['OCD zevnitř', 'Jak cyklus OCD funguje, proč se nedá „jen přestat“ a proč rituály dávají člověku s OCD smysl, i když se zvenku jeví nelogicky.'],
      ['Přizpůsobování a ujišťování', 'Jak OCD nechtěně krmíme dobrou vůlí. Naučíte se odpovídat laskavě a zároveň pevně, například: „Vidím, že se bojíš. Odpověď ti teď dávat nebudu, ale jsem tady s tebou.“ nebo „Chápu, že je to teď těžké. Věřím, že to uneseš.“'],
      ['Péče o sebe a hranice', 'Jak si zachovat vlastní život, jak mluvit o odborné pomoci a co dělat, když se obtíže zhorší.'],
    ],
    jak: [
      ...JAK_SPOLECNE,
      'Vycházím z vlastní zkušenosti s OCD, nejsem odborník na rodinné vztahy.',
      'Neposuzuji konkrétního člověka, neřeším rodinné konflikty a nerozhoduji za vás, zda blízkého k léčbě přesvědčovat.',
      'Nenaučím vás, jak OCD léčit nebo vést expozice doma, to patří odborníkům.',
      'Neslibuji, že když budete postupovat správně, OCD zmizí.',
      'Prosím, nesdílejte o svém blízkém identifikující údaje (jména, diagnózy, podrobnosti). Stačí obecné situace.',
    ],
    proKoho: 'Pro partnery, rodiče, dospělé děti, sourozence i přátele lidí s OCD, kteří chtějí lépe rozumět tomu, jak OCD funguje a jak ho nekrmit. Program nenahrazuje péči pro vašeho blízkého ani pro vás. Pokud jste sami v tíživé situaci, obraťte se na svého lékaře nebo psychologa. V akutní krizi volejte 112 nebo Linku první psychické pomoci 116 123.',
    faq: [
      { q: 'Musí můj blízký o semináři vědět?', a: 'Nemusí. Pokud je to bezpečné a vhodné, doporučuji mu o semináři říct, aby nemusel mít pocit, že se o něm mluví za zády. Seminář se týká vašeho přístupu, ne jeho léčby.' },
      { q: 'Můžete mi říct, jestli má můj blízký OCD?', a: 'Ne. Nediagnostikuji a nehodnotím konkrétní lidi. Pokud to potřebujete vědět, obraťte se na psychologa nebo psychiatra.' },
      { q: 'Naučím se, jak blízkého léčit?', a: 'Ne. Program vysvětluje, jak OCD nekrmit a jak si zachovat vlastní život. Léčba patří odborníkům.' },
      { q: 'Mohu přijít s partnerem nebo jiným blízkým?', a: 'Ano. Na setkání se může připojit jeden další člověk z vaší domácnosti bez příplatku. Jeho osobní údaje neshromažďuji.' },
      { q: 'Co když je můj blízký v akutní krizi?', a: 'Volejte 112 nebo Linku první psychické pomoci 116 123. Seminář krizi řešit nemůže.' },
    ],
  },
};

// Společné otázky (jednou pro oba programy). Texty odpovědí jsou stejné ve viditelném HTML i ve strukturovaných datech FAQPage. `html` je jen verze s odkazem.
export const FAQ = [
  { q: 'Je to terapie?', a: 'Ne. Sdílím svou osobní zkušenost a cestu. Neposkytuji odbornou ani lékařskou radu, nediagnostikuji a neradím s léky.' },
  { q: 'Jak probíhá setkání?', a: 'Videohovor přes Google Meet nebo WhatsApp, 60 minut, jen vy a já. Po připsání platby se vám ozvu já e-mailem a domluvíme, jak se spojíme.' },
  {
    q: 'Musím se vám ozvat sám/sama?',
    a: 'Ne. Po rezervaci a připsání platby se ozvu já, napíšu vám e-mailem a pošlu odkaz na první setkání.',
  },
  {
    q: 'Jakou aplikaci potřebuji?',
    a: 'Google Meet nebo WhatsApp. Na počítači Google Meet funguje v prohlížeči, na telefonu a tabletu je potřeba aplikace. Odkazy do obchodů a QR kódy najdete na stránce Online semináře.',
    html: 'Google Meet nebo WhatsApp. Na počítači Google Meet funguje v prohlížeči, na telefonu a tabletu je potřeba aplikace. Odkazy do obchodů a QR kódy najdete na stránce <a href="/seminare#spojeni">Online semináře</a>.',
  },
  { q: 'Mohu setkání přesunout?', a: 'Ano, nejpozději 24 hodin předem po domluvě e-mailem. U programu pěti setkání nejvýše dvakrát, u programu tří setkání nejvýše jednou. Neomluvená neúčast se počítá jako uskutečněné setkání.' },
  {
    q: 'Co když se zhorším?',
    a: 'Obraťte se na svého lékaře nebo terapeuta. Odkazy a krizové kontakty najdete na stránce Pomoc. V akutní krizi volejte 112 nebo 116 123.',
    html: 'Obraťte se na svého lékaře nebo terapeuta. Odkazy a krizové kontakty najdete na stránce <a href="/pomoc">Pomoc</a>. V akutní krizi volejte 112 nebo 116 123.',
  },
  { q: 'Nedorazil mi e-mail. Co mám dělat?', a: 'Zkontrolujte složku Spam a záložky Hromadné nebo Reklamy. Zprávy chodí z adresy info@ocdmentor.cz a mohou tam spadnout. Zprávu označte jako „Není spam“. Platební údaje máte i na stránce po odeslání rezervace. Pokud e-mail nenajdete ani tam, napište na ocdmentor@gmail.com.' },
  { q: 'Jak se platí?', a: 'Po rezervaci dostanete QR kód a platební údaje. Platí se bankovním převodem do 3 dnů, termín je do té doby držený pro vás.' },
  { q: 'Co je v ceně?', a: 'Všechna setkání daného programu. Jiné poplatky nejsou.' },
  { q: 'Čím se liší program od jednotlivých sezení?', a: 'Jednotlivá sezení jsou volná podpora podle aktuálního tématu. Programy jsou strukturované a tvoří je propojená setkání.' },
  { q: 'Konají se setkání i o svátcích?', a: 'Ne, 24. a 31. prosince se nekonají, program se o tyto týdny posune.' },
];

// Všechny otázky, které jsou na stránce vidět (otázky v záložkách programů i společné), ve stejném pořadí jako na stránce.
export const vsechnyFaq = (programy) => {
  const vse = [...programy.flatMap((p) => OBSAH[p.id].faq), ...FAQ];
  const videne = new Set();
  for (const f of vse) {
    if (videne.has(f.q)) throw new Error(`Otázka „${f.q}“ je ve FAQ semináře dvakrát.`);
    videne.add(f.q);
  }
  return vse;
};

export const faqJsonLd = (programy) => ({
  '@type': 'FAQPage',
  mainEntity: vsechnyFaq(programy).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const faqDetails = (seznam) => seznam.map((f) => `  <details>
    <summary>${esc(f.q)}</summary>
    <p>${f.html || esc(f.a)}</p>
  </details>`).join('\n');

// ---------- stavy běhů ----------
const STAV = {
  otevreno: ['Otevřeno', 'badge--ok'],
  uzavreno: ['Uzavřeno', 'badge--muted'],
  obsazeno: ['Obsazeno', 'badge--muted'],
  pripravujeme: ['Připravujeme', 'badge--soft'],
};
const badge = (stav) => `<span class="badge ${STAV[stav][1]}" data-stav-text>${STAV[stav][0]}</span>`;
const spolecneAtributy = (beh, stav) => `data-beh="${esc(beh.id)}" data-program="${esc(beh.programId)}" data-stav="${stav}" data-uzavreni-od="${esc(beh.uzavreniOd)}"`;
const mailtoDalsiTermin = `mailto:ocdmentor@gmail.com?subject=${encodeURIComponent('Dotaz na další termín')}`;
const odkazRezervace = (program, beh) => `/seminare/rezervace?program=${esc(program)}${beh ? `&amp;beh=${esc(beh)}` : ''}`;

const behKarta = (beh, data, now) => {
  const stav = stavBehu(beh, data, now);
  const posledni = beh.terminy[beh.terminy.length - 1];
  return `    <article class="run" ${spolecneAtributy(beh, stav)}>
      <div class="run-head"><h4>${esc(beh.nazev)}</h4>${badge(stav)}</div>
      <p class="run-meta">Od ${formatCz(beh.prvniDatum)} do ${formatCz(posledni)}</p>
      <ol class="run-dates">
${beh.terminy.map((t) => `        <li><time datetime="${t}T${beh.cas}">${dlouhyCz(t, beh.cas)}</time></li>`).join('\n')}
      </ol>
${stav === 'otevreno' ? `      <p class="cta" data-rezervovat><a class="btn btn-cta" href="${odkazRezervace(beh.programId, beh.id)}">Rezervovat místo</a></p>\n` : ''}    </article>`;
};

const terminyBlok = (p, data, now) => `      <h3 id="terminy-${esc(p.id)}">Termíny</h3>
      <p>Program se koná vždy ${denSPredlozkou(p.den)} v ${p.cas}. Běhy jdou po sobě, protože v daném čase vedu jen jednoho klienta. Rezervace se uzavírá ${data.uzavreniDniPredZacatkem} dny před prvním setkáním, aby se stihla platba i odeslání odkazu.</p>
      <p class="callout-inline"><strong>Jak to bude dál:</strong> ${SPOJENI_ZKRATKA} <a href="#spojeni">Podrobnosti a aplikace ke stažení</a>.</p>
      <div class="runs">
${p.behy.map((b) => behKarta(b, data, now)).join('\n')}
      </div>
      <p class="run-none" data-run-none hidden>Aktuálně není otevřený žádný termín. Napište mi a ozvu se, jakmile bude další.</p>
      <p class="run-other"><a href="${mailtoDalsiTermin}">Žádný termín mi nevyhovuje</a></p>`;

const programZalozka = (p, data, now, otevrena) => {
  const o = OBSAH[p.id];
  if (!o) throw new Error(`Program „${p.id}“ nemá obsah v tools/content/seminare.mjs (OBSAH).`);
  const t = textyProgramu(p.id);
  const maOtevreny = p.behy.some((b) => stavBehu(b, data, now) === 'otevreno');
  return `  <details class="prog-tab" id="${esc(p.id)}" name="program" data-program-tab${otevrena ? ' open' : ''}>
    <summary><h2 class="prog-title">${esc(p.nazev)}</h2><span class="prog-meta">${esc(shrnutiProgramu(p))}</span></summary>
    <div class="prog-body">
      <p class="lead">${esc(p.podtitul)}</p>
      <div class="callout-inline disclaimer sem-box" role="note">
        <p>${esc(t.povaha)}</p>
      </div>
      <p class="sem-format">${esc(formatProgramu(p))}</p>
${o.intro ? `      <p>${esc(o.intro)}</p>\n` : ''}${o.odkaz ? `      ${o.odkaz}\n` : ''}${terminyBlok(p, data, now)}
${o.kniha ? `      <p>Program vychází z knihy, kterou si můžete stáhnout zdarma: <a href="/ebook">Cesta k sebepřijetí, sebevíře a svobodnějšímu životu s OCD</a>.</p>\n` : ''}
      <h3>${esc(o.kartyNadpis)}</h3>
      <div class="cards sem-cards">
${o.karty.map(([nazev, text], i) => `        <article class="card">
          <p class="sem-num" aria-hidden="true">${i + 1}</p>
          <h4>${esc(nazev)}</h4>
          <p>${esc(text)}</p>
        </article>`).join('\n')}
      </div>

      <h3>Jak setkání probíhají</h3>
      <ul class="rules">
${o.jak.map((x) => `        <li>${esc(x)}</li>`).join('\n')}
      </ul>

      <h3>Pro koho to je</h3>
      <p>${esc(o.proKoho)}</p>
${maOtevreny ? `      <p class="cta" data-rezervovat-program><a class="btn btn-cta" href="${odkazRezervace(p.id)}">Rezervovat místo</a></p>\n` : ''}${o.faq.length ? `
      <div class="faq">
        <h3>Časté otázky k tomuto programu</h3>
${faqDetails(o.faq).replace(/^/gm, '    ')}
      </div>
` : ''}    </div>
  </details>`;
};

const spojeniSekce = () => `<section class="wrap block" id="spojeni">
  <h2>Jak spolu budeme v kontaktu</h2>
  <ul class="rules">
    <li>Setkání probíhají jako videohovor 1:1 přes <strong>Google Meet</strong> nebo <strong>WhatsApp</strong>. Aplikaci si vyberete podle toho, co vám vyhovuje.</li>
    <li><strong>Nemusíte se mi ozývat.</strong> Po rezervaci a připsání platby se ozvu já: napíšu vám e-mailem, domluvíme způsob spojení a pošlu odkaz na první setkání. U WhatsAppu si e-mailem domluvíme výměnu telefonního čísla.</li>
    <li>Kamera je dobrovolná. Stačí telefon, tablet nebo počítač s internetem, sluchátka nebo reproduktor a klidné místo.</li>
  </ul>
  <h3>Aplikace si můžete stáhnout předem</h3>
  <p>Google Meet funguje na počítači i v prohlížeči bez instalace. Na telefonu a tabletu je potřeba aplikace. Naskenujte QR kód mobilem, nebo klikněte na odkaz do obchodu. Doporučuji aplikaci vyzkoušet před prvním setkáním.</p>
  <div class="cards app-dl-grid">
${aplikaceHtml()}
  </div>
  <p class="small">Odkazy vedou do oficiálních obchodů Apple a Google a na externí weby mimo ${esc('ocdmentor.cz')}. Aplikace provozují jejich výrobci.</p>
</section>`;

// ---------- /seminare ----------
// `konzultaceHtml` = existující tlačítko Reservanto z webu (předává generátor); bez něj se odkazuje na /kontakt.
export function seminareBody({ data, programy, now = new Date(), konzultaceHtml = '<a class="btn btn-ghost" href="/kontakt">Napsat mi</a>' }) {
  return `
<section class="wrap page-head">
  <h1>${esc(NADPIS_STRANKY)}</h1>
  <p class="lead">${esc(PODTITUL_STRANKY)}</p>
</section>

<section class="wrap block prog-tabs">
${programy.map((p, i) => programZalozka(p, data, now, i === 0)).join('\n\n')}
</section>

${spojeniSekce()}

<section class="wrap block faq" id="faq">
  <h2>Časté otázky k oběma programům</h2>
${faqDetails(FAQ)}
</section>

<section class="wrap block" id="konzultace">
  <p><strong>Chcete si nejdřív promluvit?</strong> Rezervujte si úvodní konzultaci zdarma (20 minut).</p>
  ${konzultaceHtml}
</section>
`;
}

// ---------- /seminare/rezervace ----------
const chyba = (pole) => `<p class="field-err" id="err-${pole}" hidden></p>`;
const SOUHLASY = {
  'pro-lidi-s-ocd': {
    zpracovani: 'Souhlasím se zpracováním jména, e-mailu a telefonního čísla za účelem rezervace, organizace programu a spojení se mnou. Chápu, že už samotná účast na semináři o OCD může vypovídat o mém zdravotním stavu, a souhlasím se zpracováním i této informace. Souhlas mohu kdykoli odvolat e-mailem. <a href="/ochrana-osobnich-udaju">Zásady ochrany osobních údajů</a>.',
    povaha: 'Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii ani zdravotní službu.',
  },
  'pro-blizke': {
    zpracovani: 'Souhlasím se zpracováním jména, e-mailu a telefonního čísla za účelem rezervace, organizace programu a spojení se mnou. Chápu, že už samotná účast na semináři o OCD může vypovídat o zdravotním stavu účastníka nebo jeho blízkého, a souhlasím se zpracováním i této informace o sobě. Souhlas mohu kdykoli odvolat e-mailem. <a href="/ochrana-osobnich-udaju">Zásady ochrany osobních údajů</a>.',
    povaha: 'Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii, rodinnou terapii ani zdravotní službu, a že na semináři nebudu sdílet identifikující údaje o svém blízkém (jména, diagnózy, podrobnosti).',
  },
};
const PODMINKY_SOUHLAS = 'Souhlasím s <a href="/obchodni-podminky">obchodními podmínkami</a>.';

const blokProgramu = (p, data, now) => {
  const t = textyProgramu(p.id);
  return `    <div class="program-blok" id="blok-${esc(p.id)}" data-program="${esc(p.id)}" hidden>
      <div class="callout-inline disclaimer sem-box" role="note">
        <p>${esc(t.povaha)}</p>
      </div>
      <p class="sem-format">${esc(formatProgramu(p))}</p>
      <p class="callout-inline"><strong>Jak to bude dál:</strong> ${SPOJENI_ZKRATKA} <a href="/seminare#spojeni">Podrobnosti a aplikace ke stažení</a>.</p>
      <fieldset class="run-choice" aria-describedby="err-beh-${esc(p.id)}">
        <legend>Vyberte termín</legend>
${p.behy.map((b) => {
    const stav = stavBehu(b, data, now);
    return `        <div class="run-option" ${spolecneAtributy(b, stav)}>
          <input type="radio" id="beh-${esc(b.id)}" name="beh" value="${esc(b.id)}" aria-describedby="terminy-${esc(b.id)}"${stav === 'otevreno' ? '' : ' disabled'}>
          <label for="beh-${esc(b.id)}"><span class="run-name">${esc(b.nazev)}</span> ${badge(stav)}</label>
          <p id="terminy-${esc(b.id)}" class="run-dates-text">${b.terminy.map((x) => dlouhyCz(x, b.cas)).join('; ')}</p>
        </div>`;
  }).join('\n')}
        ${chyba(`beh-${esc(p.id)}`)}
        <p class="small"><a href="${mailtoDalsiTermin}">Žádný termín mi nevyhovuje</a></p>
      </fieldset>
    </div>`;
};

const souhlasyProgramu = (p) => {
  const s = SOUHLASY[p.id];
  if (!s) throw new Error(`Program „${p.id}“ nemá texty souhlasů v tools/content/seminare.mjs (SOUHLASY).`);
  const id = esc(p.id);
  const pole = (kod, idPole, text) => `      <div class="field-check">
        <label class="check"><input type="checkbox" id="${idPole}-${id}" name="${kod}" aria-describedby="err-${kod}-${id}"><span>${text}</span></label>
        ${chyba(`${kod}-${id}`)}
      </div>`;
  return `    <fieldset class="program-souhlasy" id="souhlasy-${id}" data-program="${id}" hidden>
      <legend>Souhlasy</legend>
${pole('souhlasZpracovani', 'rez-souhlas-zpracovani', s.zpracovani)}
${pole('souhlasPovaha', 'rez-souhlas-povaha', s.povaha)}
${pole('souhlasPodminky', 'rez-souhlas-podminky', PODMINKY_SOUHLAS)}
    </fieldset>`;
};

export function rezervaceBody({ data, programy, now = new Date() }) {
  return `
<section class="wrap page-head">
  <h1>Rezervace místa</h1>
  <p class="lead">Vyberte program a termín a vyplňte jméno, e-mail a telefon. Po odeslání se vám zobrazí QR kód s platebními údaji.</p>
</section>

<section class="wrap block">
  <noscript><p class="callout-inline">Rezervační formulář potřebuje zapnutý JavaScript. Bez něj mi prosím napište na <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.</p></noscript>
  <form id="rez-form" class="form rez-form" novalidate>
    <div id="rez-chyby" class="err-summary" role="alert" tabindex="-1" hidden></div>

    <fieldset class="program-choice" aria-describedby="err-program">
      <legend>Vyberte program</legend>
${programy.map((p) => `      <div class="program-option">
        <input type="radio" id="program-${esc(p.id)}" name="program" value="${esc(p.id)}" aria-controls="blok-${esc(p.id)} souhlasy-${esc(p.id)}">
        <label for="program-${esc(p.id)}"><span class="run-name">${esc(p.nazev)}</span> <span class="program-meta">${esc(shrnutiProgramu(p))}</span></label>
      </div>`).join('\n')}
      ${chyba('program')}
    </fieldset>

${programy.map((p) => blokProgramu(p, data, now)).join('\n\n')}

    <fieldset>
      <legend>Vaše údaje</legend>
      <div class="field"><label for="rez-jmeno">Jméno</label><input type="text" id="rez-jmeno" name="jmeno" maxlength="50" autocomplete="given-name" aria-describedby="err-jmeno">${chyba('jmeno')}</div>
      <div class="field"><label for="rez-prijmeni">Příjmení</label><input type="text" id="rez-prijmeni" name="prijmeni" maxlength="50" autocomplete="family-name" aria-describedby="err-prijmeni">${chyba('prijmeni')}</div>
      <div class="field"><label for="rez-email">E-mail</label><input type="email" id="rez-email" name="email" maxlength="254" autocomplete="email" inputmode="email" aria-describedby="err-email">${chyba('email')}</div>
      <div class="field"><label for="rez-email2">E-mail znovu</label><input type="email" id="rez-email2" name="email2" maxlength="254" autocomplete="off" inputmode="email" aria-describedby="err-email2">${chyba('email2')}</div>
      <div class="field"><label for="rez-telefon">Telefon (pro WhatsApp)</label><input type="tel" id="rez-telefon" name="telefon" maxlength="30" autocomplete="tel" inputmode="tel" aria-describedby="hint-telefon err-telefon"><p class="small" id="hint-telefon">Slouží ke spojení přes WhatsApp. Číslo bez předvolby bereme jako české (+420), u zahraničního čísla uveďte předvolbu, například +421.</p>${chyba('telefon')}</div>
      <div class="hp" aria-hidden="true"><label>Toto pole nechte prázdné <input type="text" name="web" tabindex="-1" autocomplete="off"></label></div>
    </fieldset>

${programy.map((p) => souhlasyProgramu(p)).join('\n\n')}

    <p class="callout-inline"><strong>Zkontrolujte i spam.</strong> ${SPAM_UPOZORNENI} Platební údaje uvidíte i na stránce po odeslání rezervace.</p>

    <div class="actions"><button type="submit" class="btn btn-cta" id="rez-odeslat">Odeslat rezervaci</button></div>
    <p id="rez-stav" class="msg" role="status" aria-live="polite"></p>
    <p class="small">Údaje se odesílají jen kvůli rezervaci. Neposílají se v adrese stránky a neukládají se do prohlížeče. ${esc(KRIZE)}</p>
  </form>
</section>
`;
}

// ---------- /seminare/rezervace/potvrzeni ----------
const radekPlatby = (id, popisek, kopirovat) => `        <div class="pay-row"><dt>${popisek}</dt><dd id="pay-${id}"></dd>${kopirovat ? `<button type="button" class="btn btn-ghost btn-sm" data-copy="${id}">Kopírovat<span class="sr-only"> ${kopirovat}</span></button>` : ''}</div>`;
export function potvrzeniBody() {
  return `
<section class="wrap page-head">
  <h1>Rezervace přijata</h1>
  <p class="lead">Děkuji. Níže najdete QR kód a platební údaje.<span id="potvrzeni-email" hidden> Stejné údaje vám přišly e-mailem.</span></p>
</section>

<section class="wrap block" id="potvrzeni-data" hidden>
  <p class="callout-inline"><strong>Místo je pro vás rezervované do splatnosti.</strong> Po připsání platby se vám ozvu já e-mailem a domluvíme videohovor (Google Meet nebo WhatsApp). Nemusíte se mi ozývat sami. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.</p>
  <p class="callout-inline"><strong>Zkontrolujte i spam.</strong> ${SPAM_UPOZORNENI} Platební údaje máte i na této stránce.</p>
  <div class="pay-grid">
    <div class="pay-qr">
      <div id="qr" class="qr-box" role="img" aria-label="QR kód pro platbu semináře"></div>
      <p class="small">Naskenujte kód v bankovní aplikaci, platební údaje se předvyplní.</p>
    </div>
    <div>
      <h2>Platební údaje</h2>
      <dl class="pay-list">
${radekPlatby('castka', 'Částka', 'částku')}
${radekPlatby('ucet', 'Číslo účtu', 'číslo účtu')}
${radekPlatby('iban', 'IBAN', 'IBAN')}
${radekPlatby('vs', 'Variabilní symbol', 'variabilní symbol')}
${radekPlatby('majitel', 'Majitel účtu', '')}
${radekPlatby('splatnost', 'Splatnost', '')}
      </dl>
      <p id="kopirovano" class="msg ok" role="status" aria-live="polite"></p>
    </div>
  </div>
  <h2>Termíny</h2>
  <p class="small" id="pay-beh"></p>
  <ol class="run-dates" id="pay-terminy"></ol>
  <p class="cta"><button type="button" class="btn btn-ghost" id="ics-btn">Přidat do kalendáře (.ics)</button></p>
</section>

<section class="wrap block" id="potvrzeni-nic">
  <p>Údaje o rezervaci se na této stránce zobrazují jen v okně, ve kterém jste ji právě odeslali. Pokud jste rezervaci právě odeslali a e-mail s platebními údaji vám nepřišel, zkontrolujte nevyžádanou poštu nebo mi napište na <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.</p>
  <p class="cta"><a class="btn btn-ghost" href="/seminare/rezervace">Zpět na rezervaci</a><a class="btn btn-ghost" href="/seminare">Zpět na přehled</a></p>
</section>
`;
}
