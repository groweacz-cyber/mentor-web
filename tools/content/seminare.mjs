// Texty a HTML stránek Online semináře: přehled /seminare, stránky programů /seminare/<stranka>, /seminare/rezervace a /seminare/rezervace/potvrzeni.
// Programy, termíny, ceny a stavy běhů se berou z data/seminare.json (přes api/_lib/seminare.js), nikdy se nepíšou ručně.
// Každá funkce má parametr `jaz` ('cs' výchozí, 'en' = anglická verze psaná přímo, ne překladem podle slovníku, protože obsahuje data).
import { readFileSync } from 'node:fs';
import { denSPredlozkou, denSPredlozkouEn, dlouhyDatumJ, formatDatumJ, mesiceEn, stavBehu } from '../../api/_lib/seminare.js';
import { POVAHA_PREHLED, POVAHA_PREHLED_EN, textyProgramu, formatCastkaJ } from '../../api/_lib/texty.js';
import { anglickaAdresa } from '../i18n/slugs.mjs';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const L = (jaz, cs, en) => (jaz === 'en' ? en : cs);

// Adresa české stránky v zadaném jazyce (pro odkazy ve stránkách psaných přímo).
const lnk = (csCesta, jaz) => (jaz === 'en' ? anglickaAdresa(csCesta) || csCesta : csCesta);

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
      ['App Store', 'iPhone a iPad', 'iPhone and iPad', 'https://apps.apple.com/app/google-meet/id1013231476'],
      ['Google Play', 'Android', 'Android', 'https://play.google.com/store/apps/details?id=com.google.android.apps.tachyon'],
    ],
  },
  {
    nazev: 'WhatsApp',
    obchody: [
      ['App Store', 'iPhone a iPad', 'iPhone and iPad', 'https://apps.apple.com/app/whatsapp-messenger/id310633997'],
      ['Google Play', 'Android', 'Android', 'https://play.google.com/store/apps/details?id=com.whatsapp'],
    ],
  },
];
const aplikaceHtml = (jaz) => APLIKACE.map((a) => `    <article class="card app-dl">
      <h4>${esc(a.nazev)}</h4>
${a.obchody.map(([obchod, zarizeniCs, zarizeniEn, url]) => {
    const zarizeni = L(jaz, zarizeniCs, zarizeniEn);
    return `      <div class="app-dl-row">
        <div class="app-dl-qr">${qrSvg(url, L(jaz, `QR kód: ${a.nazev} v obchodě ${obchod}, ${zarizeni}`, `QR code: ${a.nazev} in ${obchod}, ${zarizeni}`))}</div>
        <p><a href="${esc(url)}" target="_blank" rel="noopener">${L(jaz, `${esc(a.nazev)} v obchodě ${esc(obchod)}<span class="sr-only"> (otevře se nové okno)</span>`, `${esc(a.nazev)} on ${esc(obchod)}<span class="sr-only"> (opens in a new window)</span>`)}</a><br><span class="small">${esc(zarizeni)}</span></p>
      </div>`;
  }).join('\n')}
    </article>`).join('\n');

export const SPOJENI_ZKRATKA = 'Po rezervaci a připsání platby se vám ozvu já, nemusíte se mi ozývat sami. Videohovor 1:1 probíhá přes Google Meet nebo WhatsApp.';
const SPOJENI_ZKRATKA_EN = 'After you book and your payment arrives, I will contact you, you do not need to contact me. The one-to-one video call takes place on Google Meet or WhatsApp.';
const spojeniZkratka = (jaz) => L(jaz, SPOJENI_ZKRATKA, SPOJENI_ZKRATKA_EN);

// ---------- společné texty ----------
export const NADPIS_PREHLEDU = 'Online semináře';
export const UVOD_PREHLEDU = 'Dva individuální programy podle mé osobní zkušenosti s OCD. Vyberte ten, který vám sedí.';
export const KRIZE = 'V akutní krizi volejte 112 nebo Linku první psychické pomoci 116 123.';
const KRIZE_EN = 'In an acute crisis call 112 (emergency services) or the Czech psychological first-aid line 116 123 (in Czech).';
export const SPAM_UPOZORNENI = 'Platební údaje a termíny vám pošlu e-mailem z adresy info@ocdmentor.cz. Zpráva může skončit ve spamu nebo v záložce Hromadné či Reklamy. Pokud ji v doručené poště nenajdete, podívejte se tam a označte ji jako „Není spam“.';
const SPAM_UPOZORNENI_EN = 'I will send the payment details and dates from info@ocdmentor.cz. The message may end up in spam or in the Promotions or Updates tab. If you cannot find it in your inbox, look there and mark it as "Not spam".';
const krize = (jaz) => L(jaz, KRIZE, KRIZE_EN);
const spam = (jaz) => L(jaz, SPAM_UPOZORNENI, SPAM_UPOZORNENI_EN);

// Název, podtitul a další popisky programu v daném jazyce.
export const popisProgramu = (p, jaz = 'cs') => (jaz === 'en' ? { ...p, ...textyProgramu(p.id).en } : p);
// Adresa stránky programu (z pole `stranka` v datech).
export const adresaProgramu = (p, jaz = 'cs') => lnk(`/seminare/${p.stranka}`, jaz);
export const podtitulMenu = (p, jaz = 'cs') => `${popisProgramu(p, jaz).komu} · ${p.pocetSetkani} ${L(jaz, 'setkání', 'meetings')}`;
export const shrnutiProgramu = (p, jaz = 'cs') => L(jaz, `Individuální program ${p.pocetSetkani} setkání · ${formatCastkaJ(p.cena, jaz)}`, `Individual programme of ${p.pocetSetkani} meetings · ${formatCastkaJ(p.cena, jaz)}`);

// Věta o formátu a ceně z dat programu (den, čas, počet a délka setkání i cena se nepíšou ručně).
const formatBezCeny = (p, jaz = 'cs') => {
  const t = jaz === 'en' ? textyProgramu(p.id).en : textyProgramu(p.id);
  return L(
    jaz,
    `${p.pocetSetkani} setkání po ${p.delkaMinut} minutách, 1× týdně ${denSPredlozkou(p.den)} v ${p.cas}, online 1:1.${t.formatDodatek ? ` ${t.formatDodatek}` : ''}`,
    `${p.pocetSetkani} meetings of ${p.delkaMinut} minutes, once a week ${denSPredlozkouEn(p.den)} at ${p.cas} (Prague time), online 1:1.${t.formatDodatek ? ` ${t.formatDodatek}` : ''}`
  );
};
export const formatProgramu = (p, jaz = 'cs') => L(
  jaz,
  `${formatBezCeny(p, jaz)} Cena ${formatCastkaJ(p.cena, jaz)} za celý program. Cena je konečná, nejsem plátce DPH.`,
  `${formatBezCeny(p, jaz)} Price: ${formatCastkaJ(p.cena, jaz)} for the whole programme. The price is final, I am not a VAT payer.`
);

// Kontrola, že ruční texty programu odpovídají datům (počet setkání), aby web nikdy neříkal dvě různé věci.
export function zkontrolujTextyProgramu(programy) {
  for (const p of programy) {
    const t = textyProgramu(p.id);
    if (t.pocet !== p.pocetSetkani) throw new Error(`Program „${p.id}“: texty v api/_lib/texty.js počítají s ${t.pocet} setkáními, ale data mají ${p.pocetSetkani}.`);
    if (!t.en) throw new Error(`Program „${p.id}“ nemá anglické texty v api/_lib/texty.js (TEXTY_PROGRAMU.<id>.en).`);
    if (!OBSAH[p.id] || !OBSAH_EN[p.id]) throw new Error(`Program „${p.id}“ nemá obsah (česky i anglicky) v tools/content/seminare.mjs (OBSAH, OBSAH_EN).`);
    if (!SOUHLASY[p.id] || !SOUHLASY_EN[p.id]) throw new Error(`Program „${p.id}“ nemá texty souhlasů (česky i anglicky) v tools/content/seminare.mjs.`);
    if (!anglickaAdresa(`/seminare/${p.stranka}`)) throw new Error(`Program „${p.id}“ nemá anglickou adresu v tools/i18n/slugs.mjs.`);
  }
}

const MESICE_2P = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
const spoj = (a, jaz = 'cs') => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} ${L(jaz, 'a', 'and')} ${a[a.length - 1]}`);
// „24. a 31. prosince“ (česky) nebo „24 and 31 December“ (anglicky) z pole vynechaneDatumy.
export function vynechanaDnyText(data, jaz = 'cs') {
  const skupiny = [];
  for (const iso of [...data.vynechaneDatumy].sort()) {
    const [y, m, d] = iso.split('-').map(Number);
    let s = skupiny.find((x) => x.k === `${y}-${m}`);
    if (!s) { s = { k: `${y}-${m}`, m, dny: [] }; skupiny.push(s); }
    s.dny.push(d);
  }
  return spoj(skupiny.map((s) => (jaz === 'en' ? `${spoj(s.dny.map(String), jaz)} ${mesiceEn[s.m - 1]}` : `${spoj(s.dny.map((d) => `${d}.`))} ${MESICE_2P[s.m - 1]}`)), jaz);
}

// ---------- obsah programů (klíč = id programu v data/seminare.json) ----------
const KARTY_OCD = [
  ['Nejsi své OCD', 'Jak funguje cyklus OCD a proč sebepřijetí není rezignace.'],
  ['Proč nás některé myšlenky zasahují', 'Význam, který strachu dáváme, a proč myšlenka není předpověď.'],
  ['Zvědomění vzorců a sebepřijetí', 'Naučená pravidla a druhotný boj se sebekritikou.'],
  ['Sebedůvěra, nejistota a síla středu', 'Důvěra bez záruk, rovnováha místo extrémů.'],
  ['Každodennost a když se obtíže vracejí', 'Oheň jako metafora a kdy vyhledat odborníka.'],
];
const KARTY_OCD_EN = [
  ['You are not your OCD', 'How the OCD cycle works and why self-acceptance is not resignation.'],
  ['Why some thoughts affect us so much', 'The meaning we give to fear, and why a thought is not a prediction.'],
  ['Becoming aware of patterns and self-acceptance', 'Learned rules and the secondary struggle with self-criticism.'],
  ['Self-trust, uncertainty and the strength of the middle', 'Trust without guarantees, balance instead of extremes.'],
  ['Everyday life and when difficulties return', 'Fire as a metaphor, and when to look for a professional.'],
];

const JAK_SPOLECNE = [
  'Jen já a vy, videohovor přes Google Meet nebo WhatsApp (podle toho, co vám vyhovuje).',
  'Ozvu se vám já: po připsání platby vám napíšu e-mailem a domluvíme spojení. Nemusíte se mi ozývat sami.',
  'Kamera je dobrovolná.',
  'Setkání nenahrávám.',
  'Nic z toho, co zazní, nesdílím dál (výjimka: vážné ohrožení života nebo zdraví).',
];
const JAK_SPOLECNE_EN = [
  'Just you and me, a video call on Google Meet or WhatsApp (whichever suits you).',
  'I will contact you: once your payment arrives I will write to you by e-mail and we will arrange how to connect. You do not need to contact me yourself.',
  'The camera is optional.',
  'I do not record the meetings.',
  'I do not share anything that is said with anyone else (exception: serious danger to life or health).',
  'We can meet in English or in Czech, whichever you prefer.',
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
    druhy: { otazka: 'Hledáte seminář pro blízké?', program: 'pro-blizke' },
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
      'Nenaučím vás, jak OCD léčit, to patří odborníkům.',
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
    druhy: { otazka: 'Hledáte seminář pro lidi s OCD?', program: 'pro-lidi-s-ocd' },
  },
};

export const OBSAH_EN = {
  'pro-lidi-s-ocd': {
    odkaz: '',
    intro: '',
    kniha: true,
    kartyNadpis: 'Five meetings',
    karty: KARTY_OCD_EN,
    jak: [
      ...JAK_SPOLECNE_EN,
      'I do not reassure you with sentences like "nothing will happen to you" and I do not guide you through processing traumas.',
      'The practical exercises from the book are optional reflection, not homework.',
    ],
    proKoho: 'The programme suits people who are in the care of a professional or are actively arranging it. If you are looking for treatment or a diagnosis, please contact a psychologist, psychotherapist or psychiatrist. In an acute crisis call 112 or the Czech psychological first-aid line 116 123 (in Czech).',
    faq: [],
    druhy: { otazka: 'Are you looking for a seminar for relatives?', program: 'pro-blizke' },
  },
  'pro-blizke': {
    odkaz: '<p>You can read more about the topic on the page <a href="{ODKAZ_BLIZKE}">When OCD Lives Next to You</a>.</p>',
    intro: 'Do you live with someone who has OCD, or do you look after someone like that? You may feel that everything you try does not help, or even makes things worse. Well-meant help often keeps OCD going without anyone intending it. In this programme I will show you how it looks from the inside, what helps, and how to keep your own life while doing it.',
    kniha: false,
    kartyNadpis: 'Three meetings',
    karty: [
      ['OCD from the inside', 'How the OCD cycle works, why a person cannot simply "stop", and why rituals make sense to the person with OCD even when they look illogical from outside.'],
      ['Accommodation and reassurance', 'How we unintentionally feed OCD with goodwill. You will learn to answer kindly and firmly at the same time, for example: "I can see you are afraid. I am not going to give you the answer now, but I am here with you." or "I understand it is hard right now. I believe you can bear it."'],
      ['Looking after yourself and boundaries', 'How to keep your own life, how to talk about professional help, and what to do when difficulties get worse.'],
    ],
    jak: [
      ...JAK_SPOLECNE_EN,
      'I draw on my own experience with OCD; I am not an expert on family relationships.',
      'I do not judge any specific person, I do not resolve family conflicts, and I do not decide for you whether to persuade your relative to seek treatment.',
      'I will not teach you how to treat OCD, that belongs to professionals.',
      'I do not promise that OCD will disappear if you do everything right.',
      'Please do not share identifying details about your relative (names, diagnoses, specifics). General situations are enough.',
    ],
    proKoho: 'For partners, parents, adult children, siblings and friends of people with OCD who want to better understand how OCD works and how not to feed it. The programme does not replace care for your relative or for you. If you are in a difficult situation yourself, please contact your doctor or a psychologist. In an acute crisis call 112 or the Czech psychological first-aid line 116 123 (in Czech).',
    faq: [
      { q: 'Does my relative have to know about the seminar?', a: 'No. If it is safe and appropriate, I recommend telling them about the seminar so they do not feel they are being talked about behind their back. The seminar is about your approach, not their treatment.' },
      { q: 'Can you tell me whether my relative has OCD?', a: 'No. I do not diagnose and I do not assess specific people. If you need to know, please contact a psychologist or psychiatrist.' },
      { q: 'Will I learn how to treat my relative?', a: 'No. The programme explains how not to feed OCD and how to keep your own life. Treatment belongs to professionals.' },
      { q: 'Can I come with my partner or another relative?', a: 'Yes. One more person from your household can join the meetings at no extra charge. I do not collect their personal data.' },
      { q: 'What if my relative is in an acute crisis?', a: 'Call 112 or 116 123 (Czech). A seminar cannot deal with a crisis.' },
    ],
    druhy: { otazka: 'Are you looking for a seminar for people with OCD?', program: 'pro-lidi-s-ocd' },
  },
};

// Společné otázky se hodnotami konkrétního programu (počet setkání, délka, přesuny, splatnost, vynechané dny). Texty odpovědí jsou stejné
// ve viditelném HTML i ve strukturovaných datech FAQPage. `html` je jen verze s odkazem.
export function spolecneFaq(p, data, jaz = 'cs') {
  const t = jaz === 'en' ? textyProgramu(p.id).en : textyProgramu(p.id);
  const o = OBSAH[p.id];
  if (jaz === 'en') {
    return [
      { q: 'Is this therapy?', a: 'No. I share my personal experience and my journey. I do not give professional or medical advice, I do not diagnose and I do not advise on medication.' },
      { q: 'How does a meeting work?', a: `A video call on Google Meet or WhatsApp, ${p.delkaMinut} minutes, just you and me. Once your payment arrives I will contact you by e-mail and we will agree how to connect.` },
      { q: 'In which language are the meetings?', a: 'In English or in Czech, whichever you prefer. Just tell me when we arrange the call.' },
      { q: 'Do I have to contact you myself?', a: 'No. After you book and your payment arrives, I will get in touch by e-mail and send you the link to the first meeting.' },
      {
        q: 'Which app do I need?',
        a: 'Google Meet or WhatsApp. On a computer Google Meet works in the browser; on a phone or tablet you need the app. You will find store links and QR codes on this page.',
        html: 'Google Meet or WhatsApp. On a computer Google Meet works in the browser; on a phone or tablet you need the app. You will find store links and QR codes <a href="#spojeni">on this page</a>.',
      },
      { q: 'Can I reschedule or cancel a meeting?', a: `Cancelling or rescheduling at least 24 hours in advance is free of charge. If you cancel later or fail to attend without an apology, the provider is entitled to reasonable compensation for the reserved time in the amount of [DOPLNIT: e.g. 50 % of the session price]. The rest of the price is refunded within 14 days. In case of illness or for serious reasons (including an acute worsening of health), a meeting can be rescheduled free of charge even after the deadline. This does not affect the consumer's right to withdraw from the contract. Rescheduling is possible by arrangement via e-mail, at most ${t.presunuSlovy} during the programme.` },
      {
        q: 'What if I get worse?',
        a: 'Please contact your doctor or therapist. You will find links and crisis contacts on the Help page. In an acute crisis call 112 or 116 123 (Czech).',
        html: `Please contact your doctor or therapist. You will find links and crisis contacts on the <a href="${lnk('/pomoc', 'en')}">Help</a> page. In an acute crisis call 112 or 116 123 (Czech).`,
      },
      { q: 'I have not received the e-mail. What should I do?', a: 'Check your Spam folder and the Promotions or Updates tabs. Messages come from info@ocdmentor.cz and may land there. Mark the message as "Not spam". You also have the payment details on the page shown after you submit the booking. If you cannot find the e-mail there either, write to ocdmentor@gmail.com.' },
      { q: 'How do I pay?', a: `After booking you receive a QR code and payment details. You pay by bank transfer within ${data.splatnostDni} days, and the date is held for you until then. If you pay from abroad, use the IBAN shown with the payment details.` },
      { q: 'What is included in the price?', a: `${t.vsechnaSetkani} of ${p.delkaMinut} minutes. There are no other fees.` },
      { q: 'How is a programme different from single sessions?', a: `Single sessions are free-form support based on the current topic. The programme is structured${o.kniha ? ' around the book' : ''} and consists of ${t.propojenaSetkani}.` },
      { q: 'Are there meetings during the holidays?', a: `No, there are no meetings on ${vynechanaDnyText(data, 'en')}; the programme shifts by those weeks.` },
    ];
  }
  return [
    { q: 'Je to terapie?', a: 'Ne. Sdílím svou osobní zkušenost a cestu. Neposkytuji odbornou ani lékařskou radu, nediagnostikuji a neradím s léky.' },
    { q: 'Jak probíhá setkání?', a: `Videohovor přes Google Meet nebo WhatsApp, ${p.delkaMinut} minut, jen vy a já. Po připsání platby se vám ozvu já e-mailem a domluvíme, jak se spojíme.` },
    { q: 'Musím se vám ozvat sám/sama?', a: 'Ne. Po rezervaci a připsání platby se ozvu já, napíšu vám e-mailem a pošlu odkaz na první setkání.' },
    {
      q: 'Jakou aplikaci potřebuji?',
      a: 'Google Meet nebo WhatsApp. Na počítači Google Meet funguje v prohlížeči, na telefonu a tabletu je potřeba aplikace. Odkazy do obchodů a QR kódy najdete na této stránce.',
      html: 'Google Meet nebo WhatsApp. Na počítači Google Meet funguje v prohlížeči, na telefonu a tabletu je potřeba aplikace. Odkazy do obchodů a QR kódy najdete <a href="#spojeni">na této stránce</a>.',
    },
    { q: 'Mohu setkání přesunout nebo zrušit?', a: `Zrušení nebo přesun nejpozději 24 hodin předem je bezplatný. Při pozdějším zrušení nebo nedostavení se bez omluvy má poskytovatel nárok na přiměřenou kompenzaci za rezervovaný čas ve výši [DOPLNIT: např. 50 % ceny sezení]. Zbytek ceny se vrátí do 14 dnů. Při nemoci nebo z vážných důvodů (včetně akutního zhoršení zdravotního stavu) lze setkání přesunout bez poplatku i po lhůtě. Tím není dotčeno právo spotřebitele na odstoupení od smlouvy. Přesun je možný po domluvě e-mailem, nejvýše ${t.presunuSlovy} během programu.` },
    {
      q: 'Co když se zhorším?',
      a: 'Obraťte se na svého lékaře nebo terapeuta. Odkazy a krizové kontakty najdete na stránce Pomoc. V akutní krizi volejte 112 nebo 116 123.',
      html: 'Obraťte se na svého lékaře nebo terapeuta. Odkazy a krizové kontakty najdete na stránce <a href="/pomoc">Pomoc</a>. V akutní krizi volejte 112 nebo 116 123.',
    },
    { q: 'Nedorazil mi e-mail. Co mám dělat?', a: 'Zkontrolujte složku Spam a záložky Hromadné nebo Reklamy. Zprávy chodí z adresy info@ocdmentor.cz a mohou tam spadnout. Zprávu označte jako „Není spam“. Platební údaje máte i na stránce po odeslání rezervace. Pokud e-mail nenajdete ani tam, napište na ocdmentor@gmail.com.' },
    { q: 'Jak se platí?', a: `Po rezervaci dostanete QR kód a platební údaje. Platí se bankovním převodem do ${data.splatnostDni} dnů, termín je do té doby držený pro vás.` },
    { q: 'Co je v ceně?', a: `${t.vsechnaSetkani} po ${p.delkaMinut} minutách. Jiné poplatky nejsou.` },
    { q: 'Čím se liší program od jednotlivých sezení?', a: `Jednotlivá sezení jsou volná podpora podle aktuálního tématu. Program je strukturovaný${o.kniha ? ' podle knihy' : ''} a tvoří ho ${t.propojenaSetkani}.` },
    { q: 'Konají se setkání i o svátcích?', a: `Ne, ${vynechanaDnyText(data)} se nekonají, program se o tyto týdny posune.` },
  ];
}

// Všechny otázky, které jsou na stránce programu vidět (nejdřív otázky programu, pak společné), ve stejném pořadí jako na stránce.
export function faqProgramu(p, data, jaz = 'cs') {
  const vse = [...(jaz === 'en' ? OBSAH_EN : OBSAH)[p.id].faq, ...spolecneFaq(p, data, jaz)];
  const videne = new Set();
  for (const f of vse) {
    if (videne.has(f.q)) throw new Error(`Otázka „${f.q}“ je ve FAQ programu „${p.id}“ dvakrát.`);
    videne.add(f.q);
  }
  return vse;
}

export const faqJsonLd = (p, data, jaz = 'cs') => ({
  '@type': 'FAQPage',
  mainEntity: faqProgramu(p, data, jaz).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

const faqDetails = (seznam) => seznam.map((f) => `  <details>
    <summary>${esc(f.q)}</summary>
    <p>${f.html || esc(f.a)}</p>
  </details>`).join('\n');

// ---------- stavy běhů ----------
const STAV = {
  otevreno: ['Otevřeno', 'Open', 'badge--ok'],
  uzavreno: ['Uzavřeno', 'Closed', 'badge--muted'],
  obsazeno: ['Obsazeno', 'Fully booked', 'badge--muted'],
  pripravujeme: ['Připravujeme', 'Coming soon', 'badge--soft'],
};
const badge = (stav, jaz) => `<span class="badge ${STAV[stav][2]}" data-stav-text>${L(jaz, STAV[stav][0], STAV[stav][1])}</span>`;
const spolecneAtributy = (beh, stav) => `data-beh="${esc(beh.id)}" data-program="${esc(beh.programId)}" data-stav="${stav}" data-uzavreni-od="${esc(beh.uzavreniOd)}"`;
const mailtoDalsiTermin = (jaz) => `mailto:ocdmentor@gmail.com?subject=${encodeURIComponent(L(jaz, 'Dotaz na další termín', 'Question about another date'))}`;
const odkazRezervace = (program, beh, jaz = 'cs') => `${lnk('/seminare/rezervace', jaz)}?program=${esc(program)}${beh ? `&amp;beh=${esc(beh)}` : ''}`;

const behKarta = (beh, data, now, jaz) => {
  const stav = stavBehu(beh, data, now);
  const posledni = beh.terminy[beh.terminy.length - 1];
  return `    <article class="run" ${spolecneAtributy(beh, stav)}>
      <div class="run-head"><h3>${L(jaz, esc(beh.nazev), `Run ${beh.nazev.replace(/\D+/g, '')}`)}</h3>${badge(stav, jaz)}</div>
      <p class="run-meta">${L(jaz, `Od ${formatDatumJ(beh.prvniDatum, jaz)} do ${formatDatumJ(posledni, jaz)}`, `From ${formatDatumJ(beh.prvniDatum, jaz)} to ${formatDatumJ(posledni, jaz)}`)}</p>
      <ol class="run-dates">
${beh.terminy.map((t) => `        <li><time datetime="${t}T${beh.cas}">${dlouhyDatumJ(t, beh.cas, jaz)}</time></li>`).join('\n')}
      </ol>
${stav === 'otevreno' ? `      <p class="cta" data-rezervovat><a class="btn btn-cta" href="${odkazRezervace(beh.programId, beh.id, jaz)}">${L(jaz, 'Rezervovat místo', 'Book a place')}</a></p>\n` : ''}    </article>`;
};

const terminyBlok = (p, data, now, jaz) => `<section class="wrap block" id="terminy">
  <h2>${L(jaz, 'Termíny', 'Dates')}</h2>
  <p>${L(jaz, `Program se koná vždy ${denSPredlozkou(p.den)} v ${p.cas}. Běhy jdou po sobě, protože v daném čase vedu jen jednoho klienta. Rezervace se uzavírá ${data.uzavreniDniPredZacatkem} dny před prvním setkáním, aby se stihla platba i odeslání odkazu.`, `The programme always takes place ${denSPredlozkouEn(p.den)} at ${p.cas} (Prague time). The runs follow one another because I work with only one client at a time. Booking closes ${data.uzavreniDniPredZacatkem} days before the first meeting so that there is time for the payment and for sending the link.`)}</p>
  <p class="callout-inline"><strong>${L(jaz, 'Jak to bude dál:', 'What happens next:')}</strong> ${spojeniZkratka(jaz)} <a href="#spojeni">${L(jaz, 'Podrobnosti a aplikace ke stažení', 'Details and apps to download')}</a>.</p>
  <div class="runs">
${p.behy.map((b) => behKarta(b, data, now, jaz)).join('\n')}
  </div>
  <p class="run-none" data-run-none hidden>${L(jaz, 'Aktuálně není otevřený žádný termín. Napište mi a ozvu se, jakmile bude další.', 'No dates are open at the moment. Write to me and I will get in touch as soon as there is another one.')}</p>
  <p class="run-other"><a href="${mailtoDalsiTermin(jaz)}">${L(jaz, 'Žádný termín mi nevyhovuje', 'None of the dates suit me')}</a></p>
</section>`;

const spojeniSekce = (jaz) => `<section class="wrap block" id="spojeni">
  <h2>${L(jaz, 'Jak spolu budeme v kontaktu', 'How we will stay in touch')}</h2>
  <ul class="rules">
    <li>${L(jaz, 'Setkání probíhají jako videohovor 1:1 přes <strong>Google Meet</strong> nebo <strong>WhatsApp</strong>. Aplikaci si vyberete podle toho, co vám vyhovuje.', 'The meetings are one-to-one video calls on <strong>Google Meet</strong> or <strong>WhatsApp</strong>. You choose the app that suits you.')}</li>
    <li>${L(jaz, '<strong>Nemusíte se mi ozývat.</strong> Po rezervaci a připsání platby se ozvu já: napíšu vám e-mailem, domluvíme způsob spojení a pošlu odkaz na první setkání. U WhatsAppu si e-mailem domluvíme výměnu telefonního čísla.', '<strong>You do not need to contact me.</strong> After you book and your payment arrives, I will get in touch: I will write to you by e-mail, we will agree how to connect and I will send the link to the first meeting. For WhatsApp we will exchange phone numbers by e-mail.')}</li>
    <li>${L(jaz, 'Kamera je dobrovolná. Stačí telefon, tablet nebo počítač s internetem, sluchátka nebo reproduktor a klidné místo.', 'The camera is optional. A phone, tablet or computer with internet, headphones or a speaker, and a quiet place are enough.')}</li>
  </ul>
  <h3>${L(jaz, 'Aplikace si můžete stáhnout předem', 'You can download the apps in advance')}</h3>
  <p>${L(jaz, 'Google Meet funguje na počítači i v prohlížeči bez instalace. Na telefonu a tabletu je potřeba aplikace. Naskenujte QR kód mobilem, nebo klikněte na odkaz do obchodu. Doporučuji aplikaci vyzkoušet před prvním setkáním.', 'Google Meet works on a computer in the browser without installation. On a phone or tablet you need the app. Scan the QR code with your phone or click the store link. I recommend trying the app before the first meeting.')}</p>
  <div class="cards app-dl-grid">
${aplikaceHtml(jaz)}
  </div>
  <p class="small">${L(jaz, `Odkazy vedou do oficiálních obchodů Apple a Google a na externí weby mimo ${esc('ocdmentor.cz')}. Aplikace provozují jejich výrobci.`, `The links lead to the official Apple and Google stores and to external sites outside ${esc('ocdmentor.cz')}. The apps are operated by their makers.`)}</p>
</section>`;

// ---------- /seminare (přehled) ----------
// Staré kotvy z doby, kdy byly programy záložkami na jedné stránce, přesměruje skript seminare.js na stránky programů.
const stareKotvy = (programy) => JSON.stringify(Object.fromEntries(programy.map((p) => [p.id, adresaProgramu(p)])));

const kartaProgramu = (p, jaz) => {
  const pp = popisProgramu(p, jaz);
  return `    <article class="card prog-card">
      <p class="prog-komu">${esc(pp.komu)}</p>
      <h2>${esc(pp.nazev)}</h2>
      <p>${esc(pp.anotace)}</p>
      <p class="prog-format">${esc(formatBezCeny(p, jaz))}</p>
      <p class="prog-cena"><strong>${formatCastkaJ(p.cena, jaz)}</strong> ${L(jaz, 'za celý program, cena je konečná, nejsem plátce DPH', 'for the whole programme, the price is final, I am not a VAT payer')}</p>
      <p class="cta"><a class="btn btn-cta" href="${adresaProgramu(p, jaz)}">${L(jaz, 'Zobrazit program', 'View programme')}<span class="sr-only">: ${esc(pp.kratkyNazev)}</span></a></p>
    </article>`;
};

// `konzultaceHtml` = existující tlačítko Reservanto z webu (předává generátor); bez něj se odkazuje na /kontakt.
export function prehledBody({ programy, konzultaceHtml = '<a class="btn btn-ghost" href="/kontakt">Napsat mi</a>', jaz = 'cs' }) {
  return `
<section class="wrap page-head">
  <h1>${L(jaz, esc(NADPIS_PREHLEDU), 'Online seminars')}</h1>
  <p class="lead">${L(jaz, esc(UVOD_PREHLEDU), 'Two individual programmes based on my personal experience with OCD. Choose the one that suits you.')}</p>
</section>

<section class="wrap block"${jaz === 'cs' ? ` data-stare-kotvy='${esc(stareKotvy(programy)).replace(/&quot;/g, '"')}'` : ''}>
  <div class="prog-cards">
${programy.map((p) => kartaProgramu(p, jaz)).join('\n')}
  </div>
  <div class="callout-inline disclaimer sem-box" role="note">
    <p>${esc(L(jaz, POVAHA_PREHLED, POVAHA_PREHLED_EN))}</p>
  </div>
</section>

<section class="wrap block" id="konzultace">
  <p><strong>${L(jaz, 'Chcete si nejdřív promluvit?', 'Would you like to talk first?')}</strong> ${L(jaz, 'Rezervujte si úvodní konzultaci zdarma (20 minut).', 'Book a free introductory consultation (20 minutes).')}</p>
  ${konzultaceHtml}
  <p class="small">${esc(krize(jaz))}</p>
</section>
`;
}

// ---------- /seminare/<stranka> (jeden program) ----------
export function programBody({ program: p, programy, data, now = new Date(), jaz = 'cs' }) {
  const o = (jaz === 'en' ? OBSAH_EN : OBSAH)[p.id];
  const t = jaz === 'en' ? textyProgramu(p.id).en : textyProgramu(p.id);
  const pp = popisProgramu(p, jaz);
  const druhy = programy.find((x) => x.id === o.druhy.program);
  const maOtevreny = p.behy.some((b) => stavBehu(b, data, now) === 'otevreno');
  const odkazBlizke = lnk('/pro-blizke', jaz);
  return `
<section class="wrap page-head">
  <h1>${esc(pp.nazev)}</h1>
  <p class="lead">${esc(pp.podtitul)}</p>
  <div class="callout-inline disclaimer sem-box" role="note">
    <p>${esc(t.povaha)}</p>
  </div>
</section>

<section class="wrap block">
  <p class="sem-format">${esc(formatProgramu(p, jaz))}</p>
${o.intro ? `  <p>${esc(o.intro)}</p>\n` : ''}${o.odkaz ? `  ${o.odkaz.replace('{ODKAZ_BLIZKE}', odkazBlizke)}\n` : ''}${o.kniha ? `  <p>${L(jaz, `Program vychází z knihy, kterou si můžete stáhnout zdarma: <a href="${lnk('/ebook', jaz)}">Cesta k sebepřijetí, sebevíře a svobodnějšímu životu s OCD</a>.`, `The programme is based on a book that you can download for free: <a href="${lnk('/ebook', jaz)}">The Path to Self-Acceptance, Self-Belief and a Freer Life with OCD</a> (the book is in Czech).`)}</p>\n` : ''}</section>

${terminyBlok(p, data, now, jaz)}

<section class="wrap block">
  <h2>${esc(o.kartyNadpis)}</h2>
  <div class="cards sem-cards">
${o.karty.map(([nazev, text], i) => `    <article class="card">
      <p class="sem-num" aria-hidden="true">${i + 1}</p>
      <h3>${esc(nazev)}</h3>
      <p>${esc(text)}</p>
    </article>`).join('\n')}
  </div>
</section>

<section class="wrap block prose">
  <h2>${L(jaz, 'Jak setkání probíhají', 'How the meetings work')}</h2>
  <ul class="rules">
${o.jak.map((x) => `    <li>${esc(x)}</li>`).join('\n')}
  </ul>
</section>

<section class="wrap block prose">
  <h2>${L(jaz, 'Pro koho to je', 'Who it is for')}</h2>
  <p>${esc(o.proKoho)}</p>
${maOtevreny ? `  <p class="cta" data-rezervovat-program><a class="btn btn-cta" href="${odkazRezervace(p.id, undefined, jaz)}">${L(jaz, 'Rezervovat místo', 'Book a place')}</a></p>\n` : ''}</section>

${spojeniSekce(jaz)}

<section class="wrap block faq" id="faq">
  <h2>${L(jaz, 'Časté dotazy', 'Frequently asked questions')}</h2>
${faqDetails(faqProgramu(p, data, jaz))}
</section>

<section class="wrap block prog-dalsi">
  <p><strong>${esc(o.druhy.otazka)}</strong> <a href="${adresaProgramu(druhy, jaz)}">${esc(popisProgramu(druhy, jaz).kratkyNazev)}</a></p>
  <p class="cta"><a class="btn btn-ghost" href="${lnk('/seminare', jaz)}">${L(jaz, 'Zpět na přehled seminářů', 'Back to the seminars overview')}</a></p>
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
const SOUHLASY_EN = {
  'pro-lidi-s-ocd': {
    zpracovani: 'I consent to the processing of my name, e-mail address and phone number for the purpose of booking, organising the programme and contacting me. I understand that merely taking part in a seminar about OCD may say something about my health, and I consent to the processing of this information too. I can withdraw my consent at any time by e-mail. <a href="{PRIVACY}">Privacy policy</a>.',
    povaha: 'I understand that the seminar is based on the author\'s personal experience and is not professional or medical advice, therapy or a health service.',
  },
  'pro-blizke': {
    zpracovani: 'I consent to the processing of my name, e-mail address and phone number for the purpose of booking, organising the programme and contacting me. I understand that merely taking part in a seminar about OCD may say something about the health of the participant or their relative, and I consent to the processing of this information about myself too. I can withdraw my consent at any time by e-mail. <a href="{PRIVACY}">Privacy policy</a>.',
    povaha: 'I understand that the seminar is based on the author\'s personal experience and is not professional or medical advice, therapy, family therapy or a health service, and that I will not share identifying details about my relative at the seminar (names, diagnoses, specifics).',
  },
};
const PODMINKY_SOUHLAS = 'Seznámil/a jsem se s <a href="/obchodni-podminky">obchodními podmínkami</a> a <a href="/ochrana-osobnich-udaju">zásadami ochrany osobních údajů</a>.';
const ZAHAJENI_SOUHLAS = 'Výslovně žádám, aby poskytovatel zahájil poskytování mnou rezervované služby před uplynutím 14denní lhůty pro odstoupení od smlouvy. Beru na vědomí, že pokud od smlouvy odstoupím, uhradím poměrnou část ceny za již poskytnuté plnění, a že po úplném poskytnutí služby právo na odstoupení zaniká.';
const ZAHAJENI_SOUHLAS_EN = 'I expressly request that the provider start providing the service I have booked before the 14-day period for withdrawing from the contract has expired. I acknowledge that if I withdraw from the contract, I will pay a proportionate part of the price for the performance already provided, and that once the service has been fully provided, the right of withdrawal expires.';
const PODMINKY_SOUHLAS_EN = 'I have read the <a href="{TERMS}">terms and conditions</a> and the <a href="{PRIVACY}">privacy policy</a>.';

const blokProgramu = (p, data, now, jaz) => {
  const t = jaz === 'en' ? textyProgramu(p.id).en : textyProgramu(p.id);
  return `    <div class="program-blok" id="blok-${esc(p.id)}" data-program="${esc(p.id)}" hidden>
      <div class="callout-inline disclaimer sem-box" role="note">
        <p>${esc(t.povaha)}</p>
      </div>
      <p class="sem-format">${esc(formatProgramu(p, jaz))}</p>
      <p class="callout-inline"><strong>${L(jaz, 'Jak to bude dál:', 'What happens next:')}</strong> ${spojeniZkratka(jaz)} <a href="${adresaProgramu(p, jaz)}#spojeni">${L(jaz, 'Podrobnosti a aplikace ke stažení', 'Details and apps to download')}</a>.</p>
      <fieldset class="run-choice" aria-describedby="err-beh-${esc(p.id)}">
        <legend>${L(jaz, 'Vyberte termín', 'Choose dates')}</legend>
${p.behy.map((b) => {
    const stav = stavBehu(b, data, now);
    return `        <div class="run-option" ${spolecneAtributy(b, stav)}>
          <input type="radio" id="beh-${esc(b.id)}" name="beh" value="${esc(b.id)}" aria-describedby="terminy-${esc(b.id)}"${stav === 'otevreno' ? '' : ' disabled'}>
          <label for="beh-${esc(b.id)}"><span class="run-name">${L(jaz, esc(b.nazev), `Run ${b.nazev.replace(/\D+/g, '')}`)}</span> ${badge(stav, jaz)}</label>
          <p id="terminy-${esc(b.id)}" class="run-dates-text">${b.terminy.map((x) => dlouhyDatumJ(x, b.cas, jaz)).join('; ')}</p>
        </div>`;
  }).join('\n')}
        ${chyba(`beh-${esc(p.id)}`)}
        <p class="small"><a href="${mailtoDalsiTermin(jaz)}">${L(jaz, 'Žádný termín mi nevyhovuje', 'None of the dates suit me')}</a></p>
      </fieldset>
    </div>`;
};

const souhlasyProgramu = (p, jaz) => {
  const s = (jaz === 'en' ? SOUHLASY_EN : SOUHLASY)[p.id];
  if (!s) throw new Error(`Program „${p.id}“ nemá texty souhlasů v tools/content/seminare.mjs (SOUHLASY).`);
  const id = esc(p.id);
  const pole = (kod, idPole, text) => `      <div class="field-check">
        <label class="check"><input type="checkbox" id="${idPole}-${id}" name="${kod}" aria-describedby="err-${kod}-${id}"><span>${text}</span></label>
        ${chyba(`${kod}-${id}`)}
      </div>`;
  const zprac = jaz === 'en' ? s.zpracovani.replace('{PRIVACY}', lnk('/ochrana-osobnich-udaju', jaz)) : s.zpracovani;
  const podm = jaz === 'en' ? PODMINKY_SOUHLAS_EN.replace('{TERMS}', lnk('/obchodni-podminky', jaz)).replace('{PRIVACY}', lnk('/ochrana-osobnich-udaju', jaz)) : PODMINKY_SOUHLAS;
  const zahaj = jaz === 'en' ? ZAHAJENI_SOUHLAS_EN : ZAHAJENI_SOUHLAS;
  return `    <fieldset class="program-souhlasy" id="souhlasy-${id}" data-program="${id}" hidden>
      <legend>${L(jaz, 'Souhlasy', 'Consents')}</legend>
${pole('souhlasZpracovani', 'rez-souhlas-zpracovani', zprac)}
${pole('souhlasPovaha', 'rez-souhlas-povaha', s.povaha)}
${pole('souhlasPodminky', 'rez-souhlas-podminky', podm)}
${pole('souhlasZahajeni', 'rez-souhlas-zahajeni', zahaj)}
    </fieldset>`;
};

export function rezervaceBody({ data, programy, now = new Date(), jaz = 'cs' }) {
  return `
<section class="wrap page-head">
  <h1>${L(jaz, 'Rezervace místa', 'Book your place')}</h1>
  <p class="lead">${L(jaz, 'Vyberte program a termín a vyplňte jméno, e-mail a telefon. Po odeslání se vám zobrazí QR kód s platebními údaji.', 'Choose a programme and dates and fill in your name, e-mail and phone number. After you submit, you will see a QR code with the payment details.')}</p>
</section>

<section class="wrap block">
  <noscript><p class="callout-inline">${L(jaz, 'Rezervační formulář potřebuje zapnutý JavaScript. Bez něj mi prosím napište na <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.', 'The booking form needs JavaScript. Without it, please write to me at <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.')}</p></noscript>
  <form id="rez-form" class="form rez-form" novalidate>
    <div id="rez-chyby" class="err-summary" role="alert" tabindex="-1" hidden></div>

    <fieldset class="program-choice" aria-describedby="err-program">
      <legend>${L(jaz, 'Vyberte program', 'Choose a programme')}</legend>
${programy.map((p) => `      <div class="program-option">
        <input type="radio" id="program-${esc(p.id)}" name="program" value="${esc(p.id)}" aria-controls="blok-${esc(p.id)} souhlasy-${esc(p.id)}">
        <label for="program-${esc(p.id)}"><span class="run-name">${esc(popisProgramu(p, jaz).nazev)}</span> <span class="program-meta">${esc(shrnutiProgramu(p, jaz))}</span></label>
      </div>`).join('\n')}
      ${chyba('program')}
    </fieldset>

${programy.map((p) => blokProgramu(p, data, now, jaz)).join('\n\n')}

    <fieldset>
      <legend>${L(jaz, 'Vaše údaje', 'Your details')}</legend>
      <div class="field"><label for="rez-jmeno">${L(jaz, 'Jméno', 'First name')}</label><input type="text" id="rez-jmeno" name="jmeno" maxlength="50" autocomplete="given-name" aria-describedby="err-jmeno">${chyba('jmeno')}</div>
      <div class="field"><label for="rez-prijmeni">${L(jaz, 'Příjmení', 'Last name')}</label><input type="text" id="rez-prijmeni" name="prijmeni" maxlength="50" autocomplete="family-name" aria-describedby="err-prijmeni">${chyba('prijmeni')}</div>
      <div class="field"><label for="rez-email">E-mail</label><input type="email" id="rez-email" name="email" maxlength="254" autocomplete="email" inputmode="email" aria-describedby="err-email">${chyba('email')}</div>
      <div class="field"><label for="rez-email2">${L(jaz, 'E-mail znovu', 'E-mail again')}</label><input type="email" id="rez-email2" name="email2" maxlength="254" autocomplete="off" inputmode="email" aria-describedby="err-email2">${chyba('email2')}</div>
      <div class="field"><label for="rez-telefon">${L(jaz, 'Telefon (pro WhatsApp)', 'Phone (for WhatsApp)')}</label><input type="tel" id="rez-telefon" name="telefon" maxlength="30" autocomplete="tel" inputmode="tel" aria-describedby="hint-telefon err-telefon"><p class="small" id="hint-telefon">${L(jaz, 'Slouží ke spojení přes WhatsApp. Číslo bez předvolby bereme jako české (+420), u zahraničního čísla uveďte předvolbu, například +421.', 'Used to reach you on WhatsApp. A number without a country code is taken as Czech (+420); for a foreign number include the country code, for example +44.')}</p>${chyba('telefon')}</div>
      <div class="hp" aria-hidden="true"><label>${L(jaz, 'Toto pole nechte prázdné', 'Leave this field empty')} <input type="text" name="web" tabindex="-1" autocomplete="off"></label></div>
    </fieldset>

${programy.map((p) => souhlasyProgramu(p, jaz)).join('\n\n')}

    <p class="callout-inline"><strong>${L(jaz, 'Zkontrolujte i spam.', 'Check your spam folder too.')}</strong> ${spam(jaz)} ${L(jaz, 'Platební údaje uvidíte i na stránce po odeslání rezervace.', 'You will also see the payment details on the page after you submit the booking.')}</p>

    <div class="actions"><button type="submit" class="btn btn-cta" id="rez-odeslat">${L(jaz, 'Odeslat rezervaci', 'Submit booking')}</button></div>
    <p id="rez-stav" class="msg" role="status" aria-live="polite"></p>
    <p class="small">${L(jaz, 'Údaje se odesílají jen kvůli rezervaci. Neposílají se v adrese stránky a neukládají se do prohlížeče.', 'The details are sent only for the booking. They are not sent in the page address and are not stored in the browser.')} ${esc(krize(jaz))}</p>
  </form>
</section>
`;
}

// ---------- /seminare/rezervace/potvrzeni ----------
const radekPlatby = (id, popisek, kopirovat, jaz) => `        <div class="pay-row"><dt>${popisek}</dt><dd id="pay-${id}"></dd>${kopirovat ? `<button type="button" class="btn btn-ghost btn-sm" data-copy="${id}">${L(jaz, 'Kopírovat', 'Copy')}<span class="sr-only"> ${kopirovat}</span></button>` : ''}</div>`;
export function potvrzeniBody(jaz = 'cs') {
  return `
<section class="wrap page-head">
  <h1>${L(jaz, 'Rezervace přijata', 'Booking received')}</h1>
  <p class="lead">${L(jaz, 'Děkuji. Níže najdete QR kód a platební údaje.', 'Thank you. Below you will find the QR code and the payment details.')}<span id="potvrzeni-email" hidden>${L(jaz, ' Stejné údaje vám přišly e-mailem.', ' The same details have been sent to you by e-mail.')}</span></p>
</section>

<section class="wrap block" id="potvrzeni-data" hidden>
  <p class="callout-inline"><strong>${L(jaz, 'Místo je pro vás rezervované do splatnosti.', 'Your place is reserved until the payment due date.')}</strong> ${L(jaz, 'Po připsání platby se vám ozvu já e-mailem a domluvíme videohovor (Google Meet nebo WhatsApp). Nemusíte se mi ozývat sami. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.', 'Once your payment arrives I will contact you by e-mail and we will arrange the video call (Google Meet or WhatsApp). You do not need to contact me yourself. Do not write anything in the message for the recipient, the variable symbol is enough.')}</p>
  <p class="callout-inline"><strong>${L(jaz, 'Zkontrolujte i spam.', 'Check your spam folder too.')}</strong> ${spam(jaz)} ${L(jaz, 'Platební údaje máte i na této stránce.', 'You also have the payment details on this page.')}</p>
  <div class="pay-grid">
    <div class="pay-qr">
      <div id="qr" class="qr-box" role="img" aria-label="${L(jaz, 'QR kód pro platbu semináře', 'QR code for the seminar payment')}"></div>
      <p class="small">${L(jaz, 'Naskenujte kód v bankovní aplikaci, platební údaje se předvyplní.', 'Scan the code in your banking app and the payment details will be filled in. (QR Payment is a Czech standard; if your bank does not support it, enter the IBAN below.)')}</p>
    </div>
    <div>
      <h2>${L(jaz, 'Platební údaje', 'Payment details')}</h2>
      <dl class="pay-list">
${radekPlatby('castka', L(jaz, 'Částka', 'Amount'), L(jaz, 'částku', 'amount'), jaz)}
${radekPlatby('ucet', L(jaz, 'Číslo účtu', 'Account number'), L(jaz, 'číslo účtu', 'account number'), jaz)}
${radekPlatby('iban', 'IBAN', 'IBAN', jaz)}
${radekPlatby('vs', L(jaz, 'Variabilní symbol', 'Variable symbol'), L(jaz, 'variabilní symbol', 'variable symbol'), jaz)}
${radekPlatby('majitel', L(jaz, 'Majitel účtu', 'Account holder'), '', jaz)}
${radekPlatby('splatnost', L(jaz, 'Splatnost', 'Due date'), '', jaz)}
      </dl>
      <p id="kopirovano" class="msg ok" role="status" aria-live="polite"></p>
    </div>
  </div>
  <h2>${L(jaz, 'Termíny', 'Dates')}</h2>
  <p class="small" id="pay-beh"></p>
  <ol class="run-dates" id="pay-terminy"></ol>
  <p class="cta"><button type="button" class="btn btn-ghost" id="ics-btn">${L(jaz, 'Přidat do kalendáře (.ics)', 'Add to calendar (.ics)')}</button></p>
</section>

<section class="wrap block" id="potvrzeni-nic">
  <p>${L(jaz, 'Údaje o rezervaci se na této stránce zobrazují jen v okně, ve kterém jste ji právě odeslali. Pokud jste rezervaci právě odeslali a e-mail s platebními údaji vám nepřišel, zkontrolujte nevyžádanou poštu nebo mi napište na <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.', 'The booking details are shown on this page only in the window in which you have just submitted it. If you have just submitted a booking and the e-mail with the payment details has not arrived, check your junk mail or write to me at <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.')}</p>
  <p class="cta"><a class="btn btn-ghost" href="${lnk('/seminare/rezervace', jaz)}">${L(jaz, 'Zpět na rezervaci', 'Back to booking')}</a><a class="btn btn-ghost" href="${lnk('/seminare', jaz)}">${L(jaz, 'Zpět na přehled', 'Back to the overview')}</a></p>
</section>
`;
}
