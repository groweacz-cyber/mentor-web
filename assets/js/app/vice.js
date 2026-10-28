// Rozcestník všech modulů aplikace.
import { h, boot, $ } from './ui.js';

const root = $('#app-root');
boot(root);

const GROUPS = [
  ['Každodenní nástroje', [
    ['/aplikace/denik', 'Expoziční deník', 'Časovač, záznam a graf'],
    ['/aplikace/kompulze', 'Tracker kompulzí', 'Odolal/a jsem, udělal/a jsem'],
    ['/aplikace/text', 'Expoziční text', 'Napsat a zkontrolovat'],
    ['/aplikace/zebricek', 'Žebříček témat', 'Od nejslabšího po nejsilnější'],
  ]],
  ['Porozumění', [
    ['/aplikace/kruh', 'Kruh OCD', 'Nástroj u každého článku'],
    ['/aplikace/icbt', 'Porozumění pochybnosti', 'Pop cesta, 4–8 týdnů'],
    ['/aplikace/telo', 'Tělo ve strachu', 'Psychoedukace'],
    ['/aplikace/principy', 'Karty principů', 'Dvanáct pravidel metody'],
  ]],
  ['Já a můj život', [
    ['/aplikace/pilire', 'Pilíře', 'Týdenní sebepřijetí a sebedůvěra'],
    ['/aplikace/vize', 'Vize', 'Život, který chci žít'],
    ['/aplikace/koreny', 'Kořeny', 'Osa životních milníků'],
    ['/aplikace/hudba', 'Hudba', 'Playlisty před a po expozici'],
  ]],
  ['Dotazník a data', [
    ['/aplikace/start', 'Vstupní dotazník', 'Zopakovat a porovnat'],
    ['/aplikace/export', 'Export pro terapeuta', 'Přehled do PDF'],
    ['/aplikace/nastaveni', 'Data a připomínky', 'Záloha, smazání, kalendář'],
  ]],
];

root.replaceChildren(...GROUPS.flatMap(([title, items]) => [
  h('h2', {}, title),
  h('div', { class: 'tiles' }, items.map(([href, t, x]) => h('a', { class: 'tile', href }, h('strong', {}, t), h('span', {}, x)))),
]));
