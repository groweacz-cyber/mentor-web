// Texty a HTML stránek Online semináře: /seminare, /seminare/rezervace a /seminare/rezervace/potvrzeni.
// Termíny, cena a stavy běhů se berou z data/seminare.json (přes api/_lib/seminare.js), nikdy se nepíšou ručně.
import { dlouhyCz, formatCz, stavBehu } from '../../api/_lib/seminare.js';
import { POVAHA_SEMINARE, formatCastka } from '../../api/_lib/texty.js';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const NADPIS = 'Cesta s OCD: sebepřijetí, sebevíra a svobodnější život';
export const PODTITUL = 'Individuální program pěti setkání 1:1 podle knihy. Jak jsem na to šel já a co z toho můžeš využít ty.';
export const KRIZE = 'V akutní krizi volejte 112 nebo Linku první psychické pomoci 116 123.';

export const formatProgramu = (data) =>
  `${data.pocetSetkani} setkání po ${data.delkaMinut} minutách, 1× týdně ve čtvrtek v 18:00, online 1:1. Cena ${formatCastka(data.cena)} za celý program. Cena je konečná, nejsem plátce DPH.`;

export const KARTY = [
  ['Nejsi své OCD', 'Jak funguje cyklus OCD a proč sebepřijetí není rezignace.'],
  ['Proč nás některé myšlenky zasahují', 'Význam, který strachu dáváme, a proč myšlenka není předpověď.'],
  ['Zvědomění vzorců a sebepřijetí', 'Naučená pravidla a druhotný boj se sebekritikou.'],
  ['Sebedůvěra, nejistota a síla středu', 'Důvěra bez záruk, rovnováha místo extrémů.'],
  ['Kompulze, každodenní svoboda a když se obtíže vracejí', 'Oheň jako metafora a kdy vyhledat odborníka.'],
];

export const JAK_PROBIHAJI = [
  'Jen já a vy, videohovor přes Google Meet.',
  'Kamera je dobrovolná.',
  'Setkání nenahrávám.',
  'Nic z toho, co zazní, nesdílím dál (výjimka: vážné ohrožení života nebo zdraví).',
  'Neuklidňuji vás ujišťováním typu „nic se vám nestane“ a nevedu vás ke zpracování traumat.',
  'Praktická cvičení z knihy jsou nepovinná reflexe, ne domácí úkol.',
];

export const PRO_KOHO = 'Program je vhodný pro lidi, kteří jsou v péči odborníka nebo se do ní aktivně objednávají. Pokud hledáte léčbu nebo diagnózu, obraťte se na psychologa, psychoterapeuta nebo psychiatra. V akutní krizi volejte 112 nebo Linku první psychické pomoci 116 123.';

// Texty odpovědí jsou stejné ve viditelném HTML i ve strukturovaných datech FAQPage. `html` je jen verze s odkazem.
export const FAQ = [
  { q: 'Je to terapie?', a: 'Ne. Sdílím svou osobní zkušenost a cestu. Neposkytuji odbornou ani lékařskou radu, nediagnostikuji a neradím s léky.' },
  { q: 'Jak probíhá setkání?', a: 'Videohovor přes Google Meet, 60 minut, jen vy a já. Odkaz vám pošlu e-mailem po připsání platby.' },
  { q: 'Mohu setkání přesunout?', a: 'Ano, nejpozději 24 hodin předem po domluvě e-mailem, nejvýše dvakrát během programu. Neomluvená neúčast se počítá jako uskutečněné setkání.' },
  {
    q: 'Co když se zhorším?',
    a: 'Obraťte se na svého lékaře nebo terapeuta. Odkazy a krizové kontakty najdete na stránce Pomoc. V akutní krizi volejte 112 nebo 116 123.',
    html: 'Obraťte se na svého lékaře nebo terapeuta. Odkazy a krizové kontakty najdete na stránce <a href="/pomoc">Pomoc</a>. V akutní krizi volejte 112 nebo 116 123.',
  },
  { q: 'Jak se platí?', a: 'Po rezervaci dostanete QR kód a platební údaje. Platí se bankovním převodem do 3 dnů, termín je do té doby držený pro vás.' },
  { q: 'Co je v ceně?', a: 'Všech pět setkání po 60 minutách. Jiné poplatky nejsou.' },
  { q: 'Čím se liší od jednotlivých sezení?', a: 'Jednotlivá sezení jsou volná podpora podle aktuálního tématu. Program je strukturovaný podle knihy a tvoří ho pět propojených setkání.' },
  { q: 'Konají se setkání i o svátcích?', a: 'Ne. O Vánocích a na Silvestra se nekonají, program se o tyto týdny posune.' },
];

export const faqJsonLd = () => ({
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

// ---------- stavy běhů ----------
const STAV = {
  otevreno: ['Otevřeno', 'badge--ok'],
  uzavreno: ['Uzavřeno', 'badge--muted'],
  obsazeno: ['Obsazeno', 'badge--muted'],
  pripravujeme: ['Připravujeme', 'badge--soft'],
};
const badge = (stav) => `<span class="badge ${STAV[stav][1]}" data-stav-text>${STAV[stav][0]}</span>`;
const spolecneAtributy = (beh, stav) => `data-beh="${esc(beh.id)}" data-stav="${stav}" data-uzavreni-od="${esc(beh.uzavreniOd)}"`;
const mailtoDalsiTermin = `mailto:ocdmentor@gmail.com?subject=${encodeURIComponent('Dotaz na další termín')}`;

const behKarta = (beh, data, now) => {
  const stav = stavBehu(beh, data, now);
  const posledni = beh.terminy[beh.terminy.length - 1];
  return `    <article class="run" ${spolecneAtributy(beh, stav)}>
      <div class="run-head"><h3>${esc(beh.nazev)}</h3>${badge(stav)}</div>
      <p class="run-meta">Od ${formatCz(beh.prvniDatum)} do ${formatCz(posledni)}</p>
      <ol class="run-dates">
${beh.terminy.map((t) => `        <li><time datetime="${t}T${beh.cas}">${dlouhyCz(t, beh.cas)}</time></li>`).join('\n')}
      </ol>
${stav === 'otevreno' ? `      <p class="cta" data-rezervovat><a class="btn btn-cta" href="/seminare/rezervace?beh=${esc(beh.id)}">Rezervovat místo</a></p>\n` : ''}    </article>`;
};

// ---------- /seminare ----------
export function seminareBody({ data, behy, now = new Date() }) {
  return `
<section class="wrap page-head">
  <h1>${esc(NADPIS)}</h1>
  <p class="lead">${esc(PODTITUL)}</p>
  <div class="callout-inline disclaimer sem-box" role="note">
    <p>${esc(POVAHA_SEMINARE)}</p>
  </div>
</section>

<section class="wrap block">
  <p class="sem-format">${esc(formatProgramu(data))}</p>
  <p>Program vychází z knihy, kterou si můžete stáhnout zdarma: <a href="/ebook">Cesta k sebepřijetí, sebevíře a svobodnějšímu životu s OCD</a>.</p>
</section>

<section class="wrap block">
  <h2>Pět setkání</h2>
  <div class="cards sem-cards">
${KARTY.map(([nazev, text], i) => `    <article class="card">
      <p class="sem-num" aria-hidden="true">${i + 1}</p>
      <h3>${esc(nazev)}</h3>
      <p>${esc(text)}</p>
    </article>`).join('\n')}
  </div>
</section>

<section class="wrap block prose">
  <h2>Jak setkání probíhají</h2>
  <ul class="rules">
${JAK_PROBIHAJI.map((t) => `    <li>${esc(t)}</li>`).join('\n')}
  </ul>
</section>

<section class="wrap block prose">
  <h2>Pro koho to je</h2>
  <p>${esc(PRO_KOHO)}</p>
</section>

<section class="wrap block" id="terminy">
  <h2>Termíny</h2>
  <p>Programy se konají vždy ve čtvrtek v 18:00. Běhy jdou po sobě, protože v daném čase vedu jen jednoho klienta. Rezervace se uzavírá ${data.uzavreniDniPredZacatkem} dny před prvním setkáním, aby se stihla platba i odeslání odkazu.</p>
  <div class="runs">
${behy.map((b) => behKarta(b, data, now)).join('\n')}
  </div>
  <p class="run-none" data-run-none hidden>Aktuálně není otevřený žádný termín. Napište mi a ozvu se, jakmile bude další.</p>
  <p class="run-other"><a href="${mailtoDalsiTermin}">Žádný termín mi nevyhovuje</a></p>
</section>

<section class="wrap block faq">
  <h2>Časté dotazy</h2>
${FAQ.map((f) => `  <details>
    <summary>${esc(f.q)}</summary>
    <p>${f.html || esc(f.a)}</p>
  </details>`).join('\n')}
</section>
`;
}

// ---------- /seminare/rezervace ----------
const chyba = (pole) => `<p class="field-err" id="err-${pole}" hidden></p>`;
export function rezervaceBody({ data, behy, now = new Date() }) {
  return `
<section class="wrap page-head">
  <h1>Rezervace místa</h1>
  <p class="lead">Vyberte termín a vyplňte jméno a e-mail. Po odeslání se vám zobrazí QR kód s platebními údaji a stejné údaje dostanete e-mailem.</p>
  <div class="callout-inline disclaimer sem-box" role="note">
    <p>${esc(POVAHA_SEMINARE)}</p>
  </div>
</section>

<section class="wrap block">
  <p class="sem-format">${esc(formatProgramu(data))}</p>
  <noscript><p class="callout-inline">Rezervační formulář potřebuje zapnutý JavaScript. Bez něj mi prosím napište na <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.</p></noscript>
  <form id="rez-form" class="form rez-form" novalidate>
    <div id="rez-chyby" class="err-summary" role="alert" tabindex="-1" hidden></div>

    <fieldset class="run-choice" aria-describedby="err-beh">
      <legend>Vyberte termín</legend>
${behy.map((b) => {
    const stav = stavBehu(b, data, now);
    return `      <div class="run-option" ${spolecneAtributy(b, stav)}>
        <input type="radio" id="beh-${esc(b.id)}" name="beh" value="${esc(b.id)}" aria-describedby="terminy-${esc(b.id)}"${stav === 'otevreno' ? '' : ' disabled'}>
        <label for="beh-${esc(b.id)}"><span class="run-name">${esc(b.nazev)}</span> ${badge(stav)}</label>
        <p id="terminy-${esc(b.id)}" class="run-dates-text">${b.terminy.map((t) => dlouhyCz(t, b.cas)).join('; ')}</p>
      </div>`;
  }).join('\n')}
      ${chyba('beh')}
      <p class="small"><a href="${mailtoDalsiTermin}">Žádný termín mi nevyhovuje</a></p>
    </fieldset>

    <fieldset>
      <legend>Vaše údaje</legend>
      <div class="field"><label for="rez-jmeno">Jméno</label><input type="text" id="rez-jmeno" name="jmeno" maxlength="50" autocomplete="given-name" aria-describedby="err-jmeno">${chyba('jmeno')}</div>
      <div class="field"><label for="rez-prijmeni">Příjmení</label><input type="text" id="rez-prijmeni" name="prijmeni" maxlength="50" autocomplete="family-name" aria-describedby="err-prijmeni">${chyba('prijmeni')}</div>
      <div class="field"><label for="rez-email">E-mail</label><input type="email" id="rez-email" name="email" maxlength="254" autocomplete="email" inputmode="email" aria-describedby="err-email">${chyba('email')}</div>
      <div class="field"><label for="rez-email2">E-mail znovu</label><input type="email" id="rez-email2" name="email2" maxlength="254" autocomplete="off" inputmode="email" aria-describedby="err-email2">${chyba('email2')}</div>
      <div class="hp" aria-hidden="true"><label>Toto pole nechte prázdné <input type="text" name="web" tabindex="-1" autocomplete="off"></label></div>
    </fieldset>

    <fieldset>
      <legend>Souhlasy</legend>
      <div class="field-check">
        <label class="check"><input type="checkbox" id="rez-souhlas-zpracovani" name="souhlasZpracovani" aria-describedby="err-souhlasZpracovani"><span>Souhlasím se zpracováním jména a e-mailu za účelem rezervace a organizace programu. Chápu, že už samotná účast na semináři o OCD může vypovídat o mém zdravotním stavu, a souhlasím se zpracováním i této informace. Souhlas mohu kdykoli odvolat e-mailem. <a href="/ochrana-osobnich-udaju">Zásady ochrany osobních údajů</a>.</span></label>
        ${chyba('souhlasZpracovani')}
      </div>
      <div class="field-check">
        <label class="check"><input type="checkbox" id="rez-souhlas-povaha" name="souhlasPovaha" aria-describedby="err-souhlasPovaha"><span>Rozumím, že seminář vychází z osobní zkušenosti autora a nejde o odbornou ani lékařskou radu, terapii ani zdravotní službu.</span></label>
        ${chyba('souhlasPovaha')}
      </div>
      <div class="field-check">
        <label class="check"><input type="checkbox" id="rez-souhlas-podminky" name="souhlasPodminky" aria-describedby="err-souhlasPodminky"><span>Souhlasím s <a href="/obchodni-podminky">obchodními podmínkami</a>.</span></label>
        ${chyba('souhlasPodminky')}
      </div>
    </fieldset>

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
  <p class="lead">Děkuji. Níže najdete QR kód a platební údaje. Stejné údaje vám přišly e-mailem.</p>
</section>

<section class="wrap block" id="potvrzeni-data" hidden>
  <p class="callout-inline"><strong>Místo je pro vás rezervované do splatnosti.</strong> Po připsání platby vám pošlu odkaz na videohovor. Do zprávy pro příjemce nic nepište, variabilní symbol stačí.</p>
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
  <p>Údaje o rezervaci se na této stránce zobrazují jen v okně, ve kterém jste ji právě odeslali. Platební údaje a termíny najdete také v e-mailu, který vám přišel. Pokud nedorazil, zkontrolujte nevyžádanou poštu nebo mi napište na <a href="mailto:ocdmentor@gmail.com">ocdmentor@gmail.com</a>.</p>
  <p class="cta"><a class="btn btn-ghost" href="/seminare/rezervace">Zpět na rezervaci</a><a class="btn btn-ghost" href="/seminare">Zpět na přehled</a></p>
</section>
`;
}
