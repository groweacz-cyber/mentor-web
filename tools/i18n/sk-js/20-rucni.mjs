// Slovník skriptů čeština → slovenčina: položky, které se nedají najít automaticky (české texty bez diakritiky, regulární výrazy bez diakritiky,
// jazykové kódy, kratičké spojky skládané do vět).
export default [
  ['cs-CZ', 'sk-SK'],
  ['cs', 'sk'],
  [' minut', ' minút'],
  [' v ', ' o '],
  [' z ', ' z '],
  ['sobota', 'sobota'],
  ['PRODID:-//Seminar//CS', 'PRODID:-//Seminar//SK'],
  ['/seminare/rezervace/potvrzeni', '/sk/seminare/rezervacia/potvrdenie'],
  ['pochybnosti o vztahu, o citech, o partnerovi', 'pochybnosti o vzťahu, o citoch, o partnerovi'],

  // Kontrola expozičního textu: ujištění (porovnává se text bez diakritiky, malými písmeny)
  ['/jsem zdrav/', '/som zdrav/'],
  ['/nic mi (neni|nehrozi|nejde)/', '/nic mi (nie je|nehrozi|nechyba)/'],
  ['/veri?m,? ze (jsem )?(v bezpeci|zdrav)/', '/veri?m,? ze (som )?(v bezpeci|zdrav)/'],
  ['/jsem v bezpeci/', '/som v bezpeci/'],
  ['/(je|bude|jsem) (to )?v poradku/', '/(je|bude|som) (to )?v poriadku/'],
  ['/vse (bude|je) (dobre|v poradku)/', '/vsetko (bude|je) (dobre|v poriadku)/'],
  ['/nic se (nestane|nestalo)/', '/nic sa (nestane|nestalo)/'],
  ['/urcite (ne|nic|nebudu|nemam|se nestane)/', '/urcite (nie|nic|nebudem|nemam|sa nestane)/'],
  ['/nemuze se mi nic stat/', '/nemoze sa mi nic stat/'],
  ['/na 100 ?%/', '/na 100 ?%|sto percent/'],
  ['/jiste (ne|nic)/', '/iste (nie|nic)/'],

  // Kontrola expozičního textu: přijetí nejhoršího scénáře
  ['/prijm/', '/prijm|prijim/'],
  ['/i kdyby/', '/aj keby/'],
  ['/kdyby (to )?prisl/', '/keby (to )?prisl/'],
  ['/zvladn/', '/zvladn/'],
  ['/obstoj/', '/obstoj/'],
  ['/snesu/', '/unes|zniesol|vydrz/'],

  // Vize: upozornění, když vize popisuje zdravotní stav místo života
  ['/bez ocd/', '/bez ocd/'],
  ['/zbav/', '/zbav/'],
  ['/vylec/', '/vylie/'],
  ['/zdrav/', '/zdrav/'],
  ['/bez (uzkost|obsesi|strachu|nemoci|kompulz)/', '/bez (uzkost|obsesi|strachu|choroby|kompulzi)/'],
  ['/nebudu mit/', '/nebudem mat/'],
  ['/uz (nikdy )?nebudu/', '/uz (nikdy )?nebudem/'],
];
