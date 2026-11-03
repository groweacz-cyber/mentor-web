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

export const ZPRAVA_PRO_PRIJEMCE = 'SEMINAR';

export const formatCastka = (kc) => `${String(kc).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Kč`;
