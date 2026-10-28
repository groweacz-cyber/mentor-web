// Otázky, odpovědi (body v p), hranice a texty výsledků kvízu „Metal, nebo Pop?“.
// Maximum je 9 bodů. Výsledek: součet <= metalMax = Metal, součet <= mezimax = Někde mezi, jinak Pop.
window.OCD_KVIZ = {
  hranice: { metalMax: 3, mezMax: 5.5 },
  otazky: [
    {
      q: 'Když přijde obava, jak moc jí v tu chvíli věříte?',
      a: [
        { t: 'Vím, že je to OCD, i když je to nepříjemné.', p: 0 },
        { t: 'Napůl. Někdy nevím, čemu věřit.', p: 1 },
        { t: 'Připadá mi úplně skutečná.', p: 2 }
      ]
    },
    {
      q: 'Jak teď zvládáte běžný den (práce, rodina, spánek)?',
      a: [
        { t: 'Většinou dobře.', p: 0 },
        { t: 'S námahou, ale zvládám.', p: 1 },
        { t: 'Úzkost mě hodně brzdí a docházejí mi síly.', p: 2 }
      ]
    },
    {
      q: 'Máte už zkušenost s expozicemi (ERP)?',
      a: [
        { t: 'Ano a pomáhaly mi.', p: 0 },
        { t: 'Zatím ne.', p: 1 },
        { t: 'Ano, ale bylo to na mě moc, a tak to skončilo.', p: 2 }
      ]
    },
    {
      q: 'Představte si, že zítra uděláte krok přímo do svého strachu. Jak to vidíte?',
      a: [
        { t: 'Jdu do toho.', p: 0 },
        { t: 'Nejdřív chci pochopit, co se se mnou děje.', p: 1 },
        { t: 'Teď si to neumím představit.', p: 2 }
      ]
    },
    {
      q: 'Jaký styl vám víc sedí?',
      a: [
        { t: 'Rychle a naplno, i když to bude nepříjemné.', p: 0 },
        { t: 'Něco mezi.', p: 0.5 },
        { t: 'Postupně, s vysvětlením proč.', p: 1 }
      ]
    }
  ],
  vysledky: {
    metal: {
      nazev: 'Spíš Metal',
      text: 'Sedí vám jít do strachu přímo: expozice s prevencí reakce (ERP) od začátku, opřená o sebepřijetí a sebedůvěru.'
    },
    mezi: {
      nazev: 'Někde mezi',
      text: 'Nejspíš vám sedne kombinace: krátké porozumění na začátku a brzy postupná expozice. Cesty se dají kombinovat i během spolupráce.'
    },
    pop: {
      nazev: 'Spíš Pop',
      text: 'Sedí vám mírnější vstup: nejdřív pevná půda a porozumění tomu, jak OCD vyrábí pochybnosti (I-CBT), pak postupná expozice. I tahle cesta do expozice dojde, jen jiným tempem.'
    }
  },
  spolecne: {
    cesta: 'Cesta se liší, cíl ne. Každý se nakonec postaví strachu, jen jiným tempem.',
    upozorneni: 'Výsledek je orientační, nejde o test ani diagnózu. Finální cestu vybereme spolu na úvodní konzultaci.'
  }
};
