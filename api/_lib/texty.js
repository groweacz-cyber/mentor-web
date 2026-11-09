// Texty používané na webu (generátor) i v e-mailech (serverová funkce). Jedno místo, aby se nikdy nerozešly.

// Doslovné texty o povaze semináře (jeden pro každý program): rámeček na /seminare a /seminare/rezervace, bod B3 obchodních podmínek.
export const POVAHA_SEMINARE =
  'Seminář vychází z mé osobní životní zkušenosti a cesty s OCD. Nejde o odbornou ani lékařskou radu, psychoterapii ani zdravotní službu a nenahrazuje péči psychologa, psychoterapeuta ani psychiatra. Nejsem psycholog, psychoterapeut ani psychiatr. Na semináři nediagnostikuji, neléčím a neradím s léky.';

export const POVAHA_BLIZKE =
  'Seminář vychází z mé osobní zkušenosti s OCD a z pohledu člověka, který OCD zná z vlastního života. Nejde o odbornou ani lékařskou radu, psychoterapii, rodinnou terapii ani zdravotní službu a nenahrazuje péči psychologa, psychoterapeuta ani psychiatra. Nejsem psycholog, psychoterapeut ani psychiatr. Na semináři nediagnostikuji, neléčím a neradím s léky.';

// Rámeček na přehledu seminářů (obecná, neutrální formulace pro oba programy).
export const POVAHA_PREHLED =
  'Semináře vycházejí z mé osobní životní zkušenosti. Nejde o odbornou ani lékařskou radu, psychoterapii, rodinnou terapii ani zdravotní službu a nenahrazují péči psychologa, psychoterapeuta ani psychiatra. Nejsem psycholog, psychoterapeut ani psychiatr. Na seminářích nediagnostikuji, neléčím a neradím s léky.';

// V e-mailu se slovo „OCD“ objevit nesmí (e-mail může zůstat v poště, v náhledu nebo ve zprávách třetích stran),
// proto je pro oba programy použit tento neutrální text.
export const POVAHA_SEMINARE_EMAIL =
  'Seminář vychází z mé osobní životní zkušenosti. Nejde o odbornou ani lékařskou radu, psychoterapii, rodinnou terapii ani zdravotní službu a nenahrazuje péči psychologa, psychoterapeuta ani psychiatra. Nejsem psycholog, psychoterapeut ani psychiatr. Na semináři nediagnostikuji, neléčím a neradím s léky.';

// Texty vázané na program (klíč = id programu v data/seminare.json). Označení v e-mailech a na potvrzení nesmí obsahovat „OCD“.
export const TEXTY_PROGRAMU = {
  'pro-lidi-s-ocd': {
    povaha: POVAHA_SEMINARE,
    pocet: 5,
    vsechnaSetkani: 'Všech pět setkání',
    propojenaSetkani: 'pět propojených setkání',
    presunuSlovy: 'dvakrát',
    formatDodatek: '',
    popis: 'Individuální program pěti setkání',
    emailPopis: 'Seminář – individuální program pěti setkání',
    majitelPopis: 'pět setkání',
  },
  'pro-blizke': {
    povaha: POVAHA_BLIZKE,
    pocet: 3,
    vsechnaSetkani: 'Všechna tři setkání',
    propojenaSetkani: 'tři propojená setkání',
    presunuSlovy: 'jednou',
    formatDodatek: 'Na setkání se může připojit i druhý blízký z vaší domácnosti bez příplatku.',
    popis: 'Individuální program tří setkání',
    emailPopis: 'Seminář – individuální program tří setkání',
    majitelPopis: 'tři setkání pro blízké',
  },
};

// Selže, pokud program v datech nemá své texty (generátor webu i server tak nikdy neposkytnou program bez textů).
export function textyProgramu(id) {
  const t = TEXTY_PROGRAMU[id];
  if (!t) throw new Error(`Program „${id}“ nemá texty v api/_lib/texty.js (TEXTY_PROGRAMU).`);
  return t;
}

// Anglické verze textů o povaze semináře (informativní překlad, rozhodující je české znění).
export const POVAHA_SEMINARE_EN =
  'The seminar is based on my personal life experience and my journey with OCD. It is not professional or medical advice, psychotherapy or a health service, and it does not replace the care of a psychologist, psychotherapist or psychiatrist. I am not a psychologist, psychotherapist or psychiatrist. At the seminar I do not diagnose, treat or advise on medication.';
export const POVAHA_BLIZKE_EN =
  'The seminar is based on my personal experience with OCD and on the perspective of someone who knows OCD from their own life. It is not professional or medical advice, psychotherapy, family therapy or a health service, and it does not replace the care of a psychologist, psychotherapist or psychiatrist. I am not a psychologist, psychotherapist or psychiatrist. At the seminar I do not diagnose, treat or advise on medication.';
export const POVAHA_PREHLED_EN =
  'The seminars are based on my personal life experience. They are not professional or medical advice, psychotherapy, family therapy or a health service, and they do not replace the care of a psychologist, psychotherapist or psychiatrist. I am not a psychologist, psychotherapist or psychiatrist. At the seminars I do not diagnose, treat or advise on medication.';
// V e-mailu se slovo „OCD“ nesmí objevit ani v angličtině.
export const POVAHA_SEMINARE_EMAIL_EN =
  'The seminar is based on my personal life experience. It is not professional or medical advice, psychotherapy, family therapy or a health service, and it does not replace the care of a psychologist, psychotherapist or psychiatrist. I am not a psychologist, psychotherapist or psychiatrist. At the seminar I do not diagnose, treat or advise on medication.';

TEXTY_PROGRAMU['pro-lidi-s-ocd'].en = {
  povaha: POVAHA_SEMINARE_EN,
  nazev: 'The Path with OCD: self-acceptance and self-belief. Five meetings over a book',
  kratkyNazev: 'The Path with OCD',
  komu: 'For people with OCD',
  anotace: 'Meetings over my book about self-acceptance and self-belief, for people who live with OCD.',
  podtitul: 'An individual programme of five 1:1 meetings based on the book. How I did it and what you can take from it.',
  vsechnaSetkani: 'All five meetings',
  propojenaSetkani: 'five connected meetings',
  presunuSlovy: 'twice',
  formatDodatek: '',
  popis: 'Individual programme of five meetings',
  emailPopis: 'Seminar – individual programme of five meetings',
};
TEXTY_PROGRAMU['pro-blizke'].en = {
  povaha: POVAHA_BLIZKE_EN,
  nazev: 'When OCD Lives Next to You: a guide for relatives',
  kratkyNazev: 'When OCD Lives Next to You',
  komu: 'For relatives',
  anotace: 'How not to feed OCD with well-meant help and how to keep your own life, for partners, parents and friends of people with OCD.',
  podtitul: 'An individual programme of three 1:1 meetings. What helps people with OCD, what harms them, and how not to wear yourself out.',
  vsechnaSetkani: 'All three meetings',
  propojenaSetkani: 'three connected meetings',
  presunuSlovy: 'once',
  formatDodatek: 'One more relative from your household can join the meetings at no extra charge.',
  popis: 'Individual programme of three meetings',
  emailPopis: 'Seminar – individual programme of three meetings',
};

// Slovenské verze textů programů a e-mailu (rezervace ze slovenských stránek). Slovo „OCD“ se v e-mailu nesmí objevit.
TEXTY_PROGRAMU['pro-lidi-s-ocd'].sk = { popis: 'Individuálny program piatich stretnutí', emailPopis: 'Seminár – individuálny program piatich stretnutí' };
TEXTY_PROGRAMU['pro-blizke'].sk = { popis: 'Individuálny program troch stretnutí', emailPopis: 'Seminár – individuálny program troch stretnutí' };
export const POVAHA_SEMINARE_EMAIL_SK =
  'Seminár vychádza z mojej osobnej životnej skúsenosti. Nejde o odbornú ani lekársku radu, psychoterapiu, rodinnú terapiu ani zdravotnú službu a nenahrádza starostlivosť psychológa, psychoterapeuta ani psychiatra. Nie som psychológ, psychoterapeut ani psychiater. Na seminári nediagnostikujem, neliečim a neradím s liekmi.';

export const ZPRAVA_PRO_PRIJEMCE = 'SEMINAR';

export const formatCastka = (kc) => `${String(kc).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Kč`;
export const formatCastkaEn = (kc) => `${String(kc).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} CZK`;
export const formatCastkaJ = (kc, jaz) => (jaz === 'en' ? formatCastkaEn(kc) : formatCastka(kc));
