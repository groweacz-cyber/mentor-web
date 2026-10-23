// Texty interaktivní smyčky OCD na úvodní stránce. Pořadí fází určuje pořadí v kruhu.
// zlom: true označí fázi, kde se kruh láme (vizuální zvýraznění).
window.OCD_SMYCKA = {
  stred: 'Smyčku jde přerušit v každém bodě.',
  znovu: '↺ a znovu dokola',
  faze: [
    {
      nazev: 'Spouštěč',
      co: 'Něco spustí poplach: článek, zpráva, tělesný pocit, situace nebo myšlenka.',
      metoda: 'Mapa spouštěčů a Kořeny. Pochopím, kdy a proč se strach spouští, bez viny a bez nekonečného rozebírání.'
    },
    {
      nazev: 'Pochybnost',
      co: 'Co když…? Mozek vyrobí pochybnost a tváří se, že potřebuje odpověď hned.',
      metoda: 'Porozumění (I-CBT). Pochybnost postavená na představivosti nepotřebuje odpověď.'
    },
    {
      nazev: 'Katastrofický scénář',
      co: 'Z pochybnosti se stane film o nejhorším možném konci. Působí skutečně, ale je to jen představa.',
      metoda: 'Sebepřijetí a sebevíra. Ať se stane cokoli, obstojím.'
    },
    {
      nazev: 'Úzkost',
      co: 'Tělo spustí poplach: bušení srdce, napětí, sevřený žaludek, mlha v hlavě.',
      metoda: 'Tělo ve strachu. Pojmenuji, co cítím, a nechám to být. Tělo mluví jazykem úzkosti, ale nerozhoduje.'
    },
    {
      nazev: 'Kompulze',
      co: 'Rituál, kontrola, ujišťování, vyhledávání nebo vyhýbání. Cokoli, co má strach rychle vypnout.',
      metoda: 'Expozice bez kompulze. Strach může být přítomen a já přesto jednám.'
    },
    {
      nazev: 'Úleva',
      co: 'Strach na chvíli povolí a mozek si zapíše: rituál mě zachránil.',
      metoda: 'Tady se kruh láme. Úleva přichází z unesení strachu, ne z jistoty.',
      zlom: true
    },
    {
      nazev: 'Posílení',
      co: 'Příště přijde nutkání silnější a smyčka se točí rychleji.',
      metoda: 'Místo „rituál mě zachránil“ vzniká „zvládám to“. Z toho roste sebevíra.'
    }
  ]
};
