// Texty používané na webu (generátor) i v e-mailech (serverová funkce). Jedno místo, aby se nikdy nerozešly.

// Doslovný text o povaze semináře: rámeček na /seminare a /seminare/rezervace, bod 3 obchodních podmínek.
export const POVAHA_SEMINARE =
  'Seminář vychází z mé osobní životní zkušenosti a cesty s OCD. Nejde o odbornou ani lékařskou radu, psychoterapii ani zdravotní službu a nenahrazuje péči psychologa, psychoterapeuta ani psychiatra. Nejsem psycholog, psychoterapeut ani psychiatr. Na semináři nediagnostikuji, neléčím a neradím s léky.';

// V e-mailu se slovo „OCD“ objevit nesmí (e-mail může zůstat v poště, v náhledu nebo ve zprávách třetích stran),
// proto je text stejný, jen bez zmínky o diagnóze. Zbytek je doslova.
export const POVAHA_SEMINARE_EMAIL = POVAHA_SEMINARE.replace(' a cesty s OCD.', ' a cesty.');

export const ZPRAVA_PRO_PRIJEMCE = 'SEMINAR';

export const formatCastka = (kc) => `${String(kc).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Kč`;
