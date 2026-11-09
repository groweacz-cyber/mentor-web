// Rozcestník všech modulů aplikace.
import { h, boot, $ } from './ui.js';

const root = $('#app-root');
boot(root);

const GROUPS = [
  ['Everyday tools', [
    ['/aplikace/denik', 'Exposure diary', 'Timer, log and chart'],
    ['/aplikace/obsese', 'Obsession tracker', 'Daily log of themes and strength'],
    ['/aplikace/kompulze', 'Compulsion tracker', 'I resisted, I did it'],
    ['/aplikace/text', 'Exposure text', 'Write and check'],
    ['/aplikace/zebricek', 'Ladder of themes', 'From the weakest to the strongest'],
  ]],
  ['Understanding', [
    ['/aplikace/kruh', 'OCD circle', 'A tool for every link'],
    ['/aplikace/icbt', 'Understanding doubt', 'Short lessons on doubt'],
    ['/aplikace/telo', 'Body in fear', 'Psychoeducation'],
    ['/aplikace/principy', 'Principle cards', 'Twelve rules for every day'],
  ]],
  ['Me and my life', [
    ['/aplikace/pilire', 'Pillars', 'Weekly self-acceptance and self-trust'],
    ['/aplikace/vize', 'Vision', 'The life I want to live'],
    ['/aplikace/koreny', 'Roots', 'A timeline of life milestones'],
    ['/aplikace/hudba', 'Music', 'Playlists and music'],
  ]],
  ['Questionnaire and data', [
    ['/aplikace/start', 'Intake questionnaire', 'Repeat and compare'],
    ['/aplikace/export', 'Export for the therapist', 'Overview as PDF'],
    ['/aplikace/nastaveni', 'Data and reminders', 'Backup, deletion, calendar'],
  ]],
];

root.replaceChildren(...GROUPS.flatMap(([title, items]) => [
  h('h2', {}, title),
  h('div', { class: 'tiles' }, items.map(([href, t, x]) => h('a', { class: 'tile', href }, h('strong', {}, t), h('span', {}, x)))),
]));
