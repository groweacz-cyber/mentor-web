// Obsah a pravidla aplikace. Texty principů jsou od autora, ostatní texty jsou návrh ke schválení.

export const TOPICS = [
  ['kontrolovani', 'Checking', 'locks, appliances, "I left something open"'],
  ['kontaminace', 'Contamination', 'dirt, germs, chemicals'],
  ['symetrie', 'Symmetry and "just right"', 'things must be exact, even, "right"'],
  ['agresivni', 'Aggressive thoughts', 'intrusive images of harming someone, which horrify you'],
  ['sexualni', 'Sexual thoughts', 'intrusive sexual thoughts or images'],
  ['nabozenske', 'Religious and moral', 'fear of sin or of being a bad person'],
  ['zdravotni', 'Health', 'fear of illness, watching for symptoms'],
  ['vztahove', 'Relationship', 'doubts about the relationship, feelings and the partner'],
  ['magicke', 'Magical thinking', '"if I think it, it will happen"'],
  ['hyperzodpovednost', 'Hyper-responsibility', 'fear that you will cause harm if you do not intervene'],
  ['realevent', 'Real-event', 'doubts about what really happened in the past'],
  ['senzomotoricke', 'Sensorimotor', 'awareness of breathing, blinking, swallowing, the body'],
  ['existencialni', 'Existential', 'questions about meaning, reality, death'],
  ['pureo', 'Pure O', 'mental rituals without visible compulsions'],
];

export const COMPULSIONS = {
  visible: ['Washing, cleaning, disinfecting', 'Checking', 'Repeating actions', 'Arranging, symmetry', 'Touching, tapping'],
  mental: ['Repeating words or sentences in my head', 'Analysing and going over things again and again', '"Cancelling" a thought with another thought', 'Going through memories', 'Counting', 'Prayers or formulas'],
  reassurance: ['Asking people close to me', 'Asking a doctor', 'Searching the internet', 'Asking AI', 'Reading forums and other people\'s experiences', 'Testing or measuring myself'],
};
export const KIND_LABEL = { visible: 'Visible', mental: 'Mental', reassurance: 'Reassurance' };

export const IMPACT_LIMITS = ['Work or school', 'Relationships and family', 'Sleep', 'Food', 'Free time and hobbies', 'Housework', 'Movement outside the home'];
export const TIME_OPTIONS = ['Less than 1 hour', '1–3 hours', '3–6 hours', 'More than 6 hours'];

export const PRINCIPLES = [
  { t: 'No protection from fear', x: 'Nothing in the method may work as protection from fear.' },
  { t: 'A compulsion is an act of non-acceptance', x: 'A compulsion is an act of non-acceptance and of distrust in myself. The answer is a return to self-acceptance, not punishment.' },
  { t: 'Self-trust from situations managed', x: 'Self-trust is built through situations I get through. The fear can be present and I still act.' },
  { t: 'Thoughts without power', x: 'Self-acceptance and self-trust will not stop intrusive thoughts, but they take away their power.' },
  { t: 'Exposure without reassurance', x: 'An exposure text must not end with reassurance.' },
  { t: 'A vision is a life', x: 'The target vision describes a life, not the absence of an illness.' },
  { t: 'Where I have a chance', x: 'I start where I have a chance to win and work towards what limits me most.' },
  { t: 'Where the fear came from', x: 'I understand where my fear came from, without blame and without endless analysis. The story explains, exposure heals.' },
  { t: 'Body and anxiety', x: 'The body speaks the language of anxiety. I learn to understand it, but I do not let it decide.' },
  { t: 'Music charges me up', x: 'Music recharges me, but it does not hide me from fear.' },
  { t: 'I count on OCD', x: 'I do not wait for OCD to ambush me. I expect it, and when it comes I greet it and carry on.' },
  { t: 'Solid ground, understanding, courage', x: 'Firm ground first, then understanding, then courage.' },
];

export const cardOfDay = () => PRINCIPLES[Math.floor(Date.now() / 86400000) % PRINCIPLES.length];

// Podpůrné zprávy. Po „udělal jsem“ nikdy výčitka (pravidlo 2).
export const MSG_DID = [
  'It happened. A compulsion is a sign that the fear spoke up, not a failure. Return to self-acceptance: I accept myself and this moment too.',
  'Nothing is interrupted by this and nothing counts as a loss. Come back to yourself and carry on as you wish.',
  'Accept yourself and this too. The next opportunity to act differently will come by itself.',
];
export const MSG_RESISTED = [
  'The fear was present and you acted differently anyway. That is exactly the strength you are building.',
  'The uncertainty stayed and you went on. That is how self-trust grows.',
  'You managed it without protection. Note it down and go on.',
];

// Kontrola expozičního textu. Porovnává se bez diakritiky a malými písmeny.
export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const REASSURE = [
  /\bi(?: a|'|’)?m (?:healthy|fine|safe|ok|okay|all right|alright)/, /nothing (?:is|will be|can be) wrong with me|nothing (?:is going to|can|will) happen to me/, /i (?:believe|know|trust),? (?:that )?i(?: a|'|’)?m (?:safe|healthy)/, /\bi(?: a|'|’)?m (?:safe|secure)/,
  /(?:it(?:'|’)s|it is|it will be|i am|i(?:'|’)m) (?:all right|alright|ok|okay|fine)/, /(?:everything|all) (?:will be|is|is going to be) (?:fine|ok|okay|all right|alright|good)/, /nothing (?:will|is going to|would) happen|nothing happened/,
  /(?:definitely|certainly|surely) (?:not|nothing|i (?:won(?:'|’)?t|will not|do not|don(?:'|’)?t|have no))/, /nothing (?:bad )?can happen to me/, /100 ?%|hundred percent/, /(?:for sure|for certain|certainly|definitely) (?:not|nothing)/,
];
export const ACCEPT = [/accept/, /even if/, /if (?:it|that) (?:came|happened|were to come|comes|happens)/, /(?:cope|manage|handle|bear|survive)/, /(?:stand firm|stand up to|hold my ground|get through)/, /(?:i can bear|i will bear|i can stand|i can tolerate|i will tolerate)/];

// Kruh OCD: každý článek má nástroj metody (odvozeno z pravidel metody).
export const CIRCLE = [
  { name: 'Trigger', x: 'I do not wait for OCD to ambush me. I expect it, and when it comes I greet it and carry on.', href: '/aplikace/principy', cta: 'Principle cards' },
  { name: 'Doubt', x: 'To understand how a doubt arises and what it rests on. A doubt from reality differs from a doubt from imagination ("what if…").', href: '/aplikace/icbt', cta: 'Understanding doubt' },
  { name: 'Catastrophic scenario', x: 'Exposure text: I admit the uncertainty and accept the worst scenario. I do not need certainty to stand firm.', href: '/aplikace/text', cta: 'Exposure text' },
  { name: 'Anxiety', x: 'The fear may be present and I act anyway. The body speaks the language of anxiety; I understand it, but I do not let it decide.', href: '/aplikace/telo', cta: 'Body in fear' },
  { name: 'Compulsions', x: 'Response prevention: I do not carry out the compulsion. If it happens, it is an act of non-acceptance. The answer is a return to self-acceptance, not punishment.', href: '/aplikace/kompulze', cta: 'Compulsion tracker' },
  { name: 'Relief', x: 'Relief from a compulsion is what keeps the circle turning. That is why I do not end an exposure with reassurance.', href: '/aplikace/text', cta: 'Text check' },
  { name: 'Reinforcement', x: 'Self-trust is built through situations managed, not through relief. Every exposure without protection is an experience to learn from.', href: '/aplikace/denik', cta: 'Exposure diary' },
];

// I-CBT: krátké lekce (návrh textů ke schválení autorem).
export const ICBT_LESSONS = [
  { t: 'How OCD manufactures doubt', x: 'OCD often does not start with a fact but with the question "what if…". The doubt arrives as a story about everything that could happen. It need not have any support in what you are seeing, hearing and knowing right now.' },
  { t: 'Two kinds of doubt', x: 'A doubt from reality rests on what you perceive with your senses and know from direct experience. A doubt from imagination rests on what could theoretically be. Ask: where does this doubt come from?' },
  { t: 'Possible is not the same as probable', x: 'Almost anything is possible. OCD turns what is possible into what is important. No human being lives according to what is possible.' },
  { t: 'Distrust of yourself and of your senses', x: 'A doubt often says: do not believe what you see, and do not believe yourself. Here you can return to self-belief and to what you actually perceive.' },
  { t: 'A story is not evidence', x: 'Even a convincing story is only a story. You can let it be, not argue with it, not take it as fact and move on.' },
];

export const BODY = [
  { t: 'What happens in the body in fear', x: 'In fear the body switches to alert. Breathing and pulse speed up, muscles tense, digestion may change and it is harder to concentrate. It is a natural reaction, not proof that something is wrong.' },
  { t: 'The circle "fear → symptom → evidence → more fear"', x: 'I notice a bodily sensation, the brain looks in it for "evidence" for the worry, the fear rises and the sensation grows stronger. The circle is broken when I merely understand the sensation and do not let it decide.' },
  { t: 'What to do', x: 'I name it: "the body is speaking the language of anxiety". I do not check, I do not search, I do not look things up. I carry on with what I am doing.' },
];
export const BODY_MEDICAL = 'New, persistent or marked symptoms belong with a doctor as part of ordinary care. Anxiety does not decide that. The app does not check symptoms and does not answer questions about them.';

// Vize: upozornit, pokud popisuje zdravotní stav místo života.
export const VISION_HEALTH = [/(?:without|no) ocd/, /(?:get rid of|rid of|free of|free from)/, /(?:cured|cure|recover)/, /(?:healthy|healed)/, /(?:without|free of|no) (?:anxiety|obsessions?|fear|illness|disease|compulsions?)/, /(?:will not|won(?:'|’)?t) have/, /(?:never again|no longer|will never)/, /no (obsessions?|ocd|anxiety)/];

export function pathLabel(p) {
  return { metal: 'Metal path', pop: 'Pop path', mezi: 'Something in between (spectrum)' }[p] || p;
}

// Doporučení cesty podle kritérií. Je to nápověda, ne rozhodnutí.
export function recommend(c) {
  let s = 0;
  const why = [];
  if (c.belief <= 4) { s++; why.push('You believe the worries only a little, so you can face them directly.'); }
  else if (c.belief >= 7) { s--; why.push('You believe the worries very strongly. It will help to understand first how doubt arises.'); }
  if (c.functioning >= 6) { s++; why.push('You cope well with an ordinary day, so you have something to build on.'); }
  else if (c.functioning <= 3) { s--; why.push('An ordinary day is very demanding at the moment, so a slower start and stabilisation are suitable.'); }
  if (c.erp === 'pomohlo') { s++; why.push('You have had a good experience with exposure.'); }
  else if (c.erp === 'vzdal') { s--; why.push('Earlier exposure overwhelmed you or you gave it up, so I recommend a gentler start.'); }
  if (c.ready === 'ano') { s++; why.push('You are ready to go into the fear straight away.'); }
  else if (c.ready === 'ne') { s--; why.push('You do not want to expose yourself to the fear straight away yet, and that is fine.'); }
  const path = s >= 2 ? 'metal' : s <= -1 ? 'pop' : 'mezi';
  return { path, score: s, reasons: why };
}

// Vyhodnocení bezpečnostních otázek: high / mild / none.
export function riskLevel(sf) {
  if (!sf) return 'none';
  if (sf.harm !== 'ne' || sf.hopeless === 'casto' || sf.depressed === 'casto') return 'high';
  if (sf.hopeless === 'obcas' || sf.depressed === 'obcas') return 'mild';
  return 'none';
}

// Žebříček z posledního dotazníku: od nejslabšího po nejsilnější. Doporučený start má úzkost 4–6.
export function buildLadder(a) {
  if (!a) return [];
  const items = a.topics.filter((t) => t.score > 0).map((t) => ({ id: t.id, name: (TOPICS.find((x) => x[0] === t.id) || [])[1] || t.name, score: t.score })).sort((x, y) => x.score - y.score || x.name.localeCompare(y.name, 'en'));
  return items;
}
export function recommendedStart(items, done) {
  const open = items.filter((i) => !done.includes(i.id));
  if (!open.length) return null;
  const inRange = open.filter((i) => i.score >= 4 && i.score <= 6);
  if (inRange.length) return inRange[0];
  return open.slice().sort((x, y) => Math.abs(x.score - 5) - Math.abs(y.score - 5) || x.score - y.score)[0];
}
