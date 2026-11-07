// Rozcestník všech modulů aplikace.
import { h, boot, $ } from './ui.js';

const root = $('#app-root');
boot(root);

const GROUPS = [
  ['Každodenné nástroje', [
    ['/aplikace/denik', 'Expozičný denník', 'Časovač, záznam a graf'],
    ['/aplikace/obsese', 'Tracker obsesií', 'Denný záznam tém a sily'],
    ['/aplikace/kompulze', 'Tracker kompulzií', 'Odolal/a som, urobil/a som'],
    ['/aplikace/text', 'Expozičný text', 'Napísať a skontrolovať'],
    ['/aplikace/zebricek', 'Rebríček tém', 'Od najslabšieho po najsilnejšie'],
  ]],
  ['Porozumenie', [
    ['/aplikace/kruh', 'Kruh OCD', 'Nástroj pri každom článku'],
    ['/aplikace/icbt', 'Porozumenie pochybnosti', 'Pop cesta, 4–8 týždňov'],
    ['/aplikace/telo', 'Telo v strachu', 'Psychoedukácia'],
    ['/aplikace/principy', 'Karty princípov', 'Dvanásť pravidiel metódy'],
  ]],
  ['Ja a môj život', [
    ['/aplikace/pilire', 'Piliere', 'Týždenné sebaprijatie a sebadôvera'],
    ['/aplikace/vize', 'Vízia', 'Život, ktorý chcem žiť'],
    ['/aplikace/koreny', 'Korene', 'Os životných míľnikov'],
    ['/aplikace/hudba', 'Hudba', 'Playlisty pred expozíciou a po nej'],
  ]],
  ['Dotazník a dáta', [
    ['/aplikace/start', 'Vstupný dotazník', 'Zopakovať a porovnať'],
    ['/aplikace/export', 'Export pre terapeuta', 'Prehľad do PDF'],
    ['/aplikace/nastaveni', 'Dáta a pripomienky', 'Záloha, vymazanie, kalendár'],
  ]],
];

root.replaceChildren(...GROUPS.flatMap(([title, items]) => [
  h('h2', {}, title),
  h('div', { class: 'tiles' }, items.map(([href, t, x]) => h('a', { class: 'tile', href }, h('strong', {}, t), h('span', {}, x)))),
]));
