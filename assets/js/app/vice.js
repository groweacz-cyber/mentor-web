// Rozcestník všech modulů aplikace.
import { h, boot, $ } from './ui.js';

const root = $('#app-root');
boot(root);

const GROUPS = [
  ['Každodenní nástroje', [
    ['/aplikace/denik', 'Expoziční deník', 'Časovač, záznam a graf'],
    ['/aplikace/obsese', 'Tracker obsesí', 'Denní záznam témat a síly'],
    ['/aplikace/kompulze', 'Tracker kompulzí', 'Odolal/a jsem, udělal/a jsem'],
    ['/aplikace/text', 'Expoziční text', 'Napsat a zkontrolovat'],
  ]],
  ['Porozumění', [
    ['/aplikace/kruh', 'Kruh OCD', 'Nástroj u každého článku'],
    ['/aplikace/icbt', 'Porozumění pochybnosti', 'Krátké lekce o pochybnosti'],
    ['/aplikace/telo', 'Tělo ve strachu', 'Psychoedukace'],
    ['/aplikace/principy', 'Karty principů', 'Dvanáct pravidel na každý den'],
  ]],
  ['Já a můj život', [
    ['/aplikace/pilire', 'Pilíře', 'Týdenní sebepřijetí a sebedůvěra'],
    ['/aplikace/vize', 'Vize', 'Život, který chci žít'],
    ['/aplikace/koreny', 'Kořeny', 'Osa životních milníků'],
    ['/aplikace/hudba', 'Hudba', 'Playlisty a hudba'],
  ]],
  ['Data', [
    ['/aplikace/export', 'Export pro terapeuta', 'Přehled do PDF'],
    ['/aplikace/nastaveni', 'Data a připomínky', 'Záloha, smazání, kalendář'],
  ]],
];

root.replaceChildren(...GROUPS.flatMap(([title, items]) => [
  h('h2', {}, title),
  h('div', { class: 'tiles' }, items.map(([href, t, x]) => h('a', { class: 'tile', href }, h('strong', {}, t), h('span', {}, x)))),
]));
