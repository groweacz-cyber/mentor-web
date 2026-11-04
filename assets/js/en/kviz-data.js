// Otázky, odpovědi (body v p), hranice a texty výsledků kvízu „Metal, nebo Pop?“.
// Maximum je 9 bodů. Výsledek: součet <= metalMax = Metal, součet <= mezimax = Někde mezi, jinak Pop.
window.OCD_KVIZ = {
  hranice: { metalMax: 3, mezMax: 5.5 },
  otazky: [
    {
      q: 'When a worry comes, how much do you believe it at that moment?',
      a: [
        { t: 'I know it is OCD, even though it is unpleasant.', p: 0 },
        { t: 'Halfway. Sometimes I do not know what to believe.', p: 1 },
        { t: 'It feels completely real to me.', p: 2 }
      ]
    },
    {
      q: 'How are you coping with an ordinary day now (work, family, sleep)?',
      a: [
        { t: 'Mostly well.', p: 0 },
        { t: 'With effort, but I manage.', p: 1 },
        { t: 'Anxiety holds me back a lot and I am running out of strength.', p: 2 }
      ]
    },
    {
      q: 'Do you already have experience with exposure (ERP)?',
      a: [
        { t: 'Yes, and it helped me.', p: 0 },
        { t: 'Not yet.', p: 1 },
        { t: 'Yes, but it was too much for me and so it ended.', p: 2 }
      ]
    },
    {
      q: 'Imagine that tomorrow you take a step straight into your fear. How do you see it?',
      a: [
        { t: 'I am going for it.', p: 0 },
        { t: 'First I want to understand what is happening to me.', p: 1 },
        { t: 'Right now I cannot imagine it.', p: 2 }
      ]
    },
    {
      q: 'Which style suits you better?',
      a: [
        { t: 'Fast and all in, even if it is unpleasant.', p: 0 },
        { t: 'Something in between.', p: 0.5 },
        { t: 'Gradually, with an explanation of why.', p: 1 }
      ]
    }
  ],
  vysledky: {
    metal: {
      nazev: 'More Metal',
      text: 'Going straight into the fear suits you: exposure and response prevention (ERP) from the start, supported by self-acceptance and self-trust.'
    },
    mezi: {
      nazev: 'Somewhere in between',
      text: 'A combination will probably suit you: a short period of understanding at the start and soon gradual exposure. The paths can also be combined during the cooperation.'
    },
    pop: {
      nazev: 'More Pop',
      text: 'A gentler entry suits you: firm ground first and an understanding of how OCD produces doubts (I-CBT), then gradual exposure. This path also reaches exposure, just at a different pace.'
    }
  },
  spolecne: {
    cesta: 'The path differs, the goal does not. Everyone eventually faces the fear, just at a different pace.',
    upozorneni: 'The result is only indicative, it is not a test or a diagnosis. We will choose the final path together at the introductory consultation.'
  }
};
