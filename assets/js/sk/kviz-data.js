// Otázky, odpovědi (body v p), hranice a texty výsledků kvízu „Metal, nebo Pop?“.
// Maximum je 9 bodů. Výsledek: součet <= metalMax = Metal, součet <= mezimax = Někde mezi, jinak Pop.
window.OCD_KVIZ = {
  hranice: { metalMax: 3, mezMax: 5.5 },
  otazky: [
    {
      q: 'Keď príde obava, ako veľmi jej v tej chvíli veríte?',
      a: [
        { t: 'Viem, že je to OCD, aj keď je to nepríjemné.', p: 0 },
        { t: 'Napoly. Niekedy neviem, čomu veriť.', p: 1 },
        { t: 'Pripadá mi úplne skutočná.', p: 2 }
      ]
    },
    {
      q: 'Ako teraz zvládate bežný deň (práca, rodina, spánok)?',
      a: [
        { t: 'Väčšinou dobre.', p: 0 },
        { t: 'S námahou, ale zvládam.', p: 1 },
        { t: 'Úzkosť ma veľmi brzdí a dochádzajú mi sily.', p: 2 }
      ]
    },
    {
      q: 'Máte už skúsenosť s expozíciami (ERP)?',
      a: [
        { t: 'Áno a pomáhali mi.', p: 0 },
        { t: 'Zatiaľ nie.', p: 1 },
        { t: 'Áno, ale bolo to na mňa priveľa, a tak to skončilo.', p: 2 }
      ]
    },
    {
      q: 'Predstavte si, že zajtra urobíte krok priamo do svojho strachu. Ako to vidíte?',
      a: [
        { t: 'Idem do toho.', p: 0 },
        { t: 'Najprv chcem pochopiť, čo sa so mnou deje.', p: 1 },
        { t: 'Teraz si to neviem predstaviť.', p: 2 }
      ]
    },
    {
      q: 'Aký štýl vám viac sedí?',
      a: [
        { t: 'Rýchlo a naplno, aj keď to bude nepríjemné.', p: 0 },
        { t: 'Niečo medzi.', p: 0.5 },
        { t: 'Postupne, s vysvetlením prečo.', p: 1 }
      ]
    }
  ],
  vysledky: {
    metal: {
      nazev: 'Skôr Metal',
      text: 'Sedí vám ísť do strachu priamo: expozícia s prevenciou reakcie (ERP) od začiatku, opretá o sebaprijatie a sebadôveru.'
    },
    mezi: {
      nazev: 'Niekde medzi',
      text: 'Asi vám sadne kombinácia: krátke porozumenie na začiatku a čoskoro postupná expozícia. Cesty sa dajú kombinovať aj počas spolupráce.'
    },
    pop: {
      nazev: 'Skôr Pop',
      text: 'Sedí vám miernejší vstup: najprv pevná pôda a porozumenie tomu, ako OCD vyrába pochybnosti (I-CBT), potom postupná expozícia. Aj táto cesta do expozície dôjde, len iným tempom.'
    }
  },
  spolecne: {
    cesta: 'Cesta sa líši, cieľ nie. Každý sa nakoniec postaví strachu, len iným tempom.',
    upozorneni: 'Výsledok je orientačný, nejde o test ani diagnózu. Finálnu cestu vyberieme spolu na úvodnej konzultácii.'
  }
};
