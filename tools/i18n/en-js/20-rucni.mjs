// Slovník skriptů čeština → angličtina: položky, které se nedají najít automaticky (české texty bez diakritiky, regulární výrazy bez diakritiky,
// jazykové kódy, kratičké spojky skládané do vět).
export default [
  ['cs-CZ', 'en-GB'],
  ['cs', 'en'],
  [' minut', ' minutes'],
  [' v ', ' at '],
  [' z ', ' of '],
  ['sobota', 'Saturday'],
  ['PRODID:-//Seminar//CS', 'PRODID:-//Seminar//EN'],
  ['/seminare/rezervace/potvrzeni', '/en/seminars/booking/confirmation'],
  ['pochybnosti o vztahu, o citech, o partnerovi', 'doubts about the relationship, feelings and the partner'],

  // Kontrola expozičního textu: ujištění (porovnává se text bez diakritiky, malými písmeny)
  ['/jsem zdrav/', "/\\bi(?: a|'|’)?m (?:healthy|fine|safe|ok|okay|all right|alright)/"],
  ['/nic mi (neni|nehrozi|nejde)/', '/nothing (?:is|will be|can be) wrong with me|nothing (?:is going to|can|will) happen to me/'],
  ['/veri?m,? ze (jsem )?(v bezpeci|zdrav)/', "/i (?:believe|know|trust),? (?:that )?i(?: a|'|’)?m (?:safe|healthy)/"],
  ['/jsem v bezpeci/', "/\\bi(?: a|'|’)?m (?:safe|secure)/"],
  ['/(je|bude|jsem) (to )?v poradku/', "/(?:it(?:'|’)s|it is|it will be|i am|i(?:'|’)m) (?:all right|alright|ok|okay|fine)/"],
  ['/vse (bude|je) (dobre|v poradku)/', '/(?:everything|all) (?:will be|is|is going to be) (?:fine|ok|okay|all right|alright|good)/'],
  ['/nic se (nestane|nestalo)/', '/nothing (?:will|is going to|would) happen|nothing happened/'],
  ['/urcite (ne|nic|nebudu|nemam|se nestane)/', "/(?:definitely|certainly|surely) (?:not|nothing|i (?:won(?:'|’)?t|will not|do not|don(?:'|’)?t|have no))/"],
  ['/nemuze se mi nic stat/', '/nothing (?:bad )?can happen to me/'],
  ['/na 100 ?%/', '/100 ?%|hundred percent/'],
  ['/jiste (ne|nic)/', '/(?:for sure|for certain|certainly|definitely) (?:not|nothing)/'],

  // Kontrola expozičního textu: přijetí nejhoršího scénáře
  ['/prijm/', '/accept/'],
  ['/i kdyby/', '/even if/'],
  ['/kdyby (to )?prisl/', '/if (?:it|that) (?:came|happened|were to come|comes|happens)/'],
  ['/zvladn/', '/(?:cope|manage|handle|bear|survive)/'],
  ['/obstoj/', '/(?:stand firm|stand up to|hold my ground|get through)/'],
  ['/snesu/', '/(?:i can bear|i will bear|i can stand|i can tolerate|i will tolerate)/'],

  // Vize: upozornění, když vize popisuje zdravotní stav místo života
  ['/bez ocd/', '/(?:without|no) ocd/'],
  ['/zbav/', '/(?:get rid of|rid of|free of|free from)/'],
  ['/vylec/', '/(?:cured|cure|recover)/'],
  ['/zdrav/', '/(?:healthy|healed)/'],
  ['/bez (uzkost|obsesi|strachu|nemoci|kompulz)/', '/(?:without|free of|no) (?:anxiety|obsessions?|fear|illness|disease|compulsions?)/'],
  ['/nebudu mit/', "/(?:will not|won(?:'|’)?t) have/"],
  ['/uz (nikdy )?nebudu/', '/(?:never again|no longer|will never)/'],
];
