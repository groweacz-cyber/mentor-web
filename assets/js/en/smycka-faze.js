// Texty interaktivní smyčky OCD na úvodní stránce. Pořadí fází určuje pořadí v kruhu.
// zlom: true označí fázi, kde se kruh láme (vizuální zvýraznění).
window.OCD_SMYCKA = {
  stred: 'The loop can be interrupted at every point.',
  znovu: '↺ a znovu dokola',
  faze: [
    {
      nazev: 'Trigger',
      co: 'Something sets off an alarm: an article, a news item, a bodily sensation, a situation or a thought.',
      metoda: 'Map of triggers and Roots. I understand when and why the fear is set off, without blame and without endless analysing.'
    },
    {
      nazev: 'Doubt',
      co: 'What if…? The brain manufactures a doubt and pretends it needs an answer right now.',
      metoda: 'Understanding (I-CBT). A doubt built on imagination does not need an answer.'
    },
    {
      nazev: 'Catastrophic scenario',
      co: 'The doubt turns into a film about the worst possible ending. It feels real, but it is only an image.',
      metoda: 'Self-acceptance and self-trust. I do not know exactly what will happen. When a difficulty comes, I will look for a way to deal with it.'
    },
    {
      nazev: 'Anxiety',
      co: 'The body sets off an alarm: a pounding heart, tension, a clenched stomach, a fog in the head.',
      metoda: 'Body in fear. I name what I feel and let it be. The body speaks the language of anxiety, but it does not decide.'
    },
    {
      nazev: 'Compulsions',
      co: 'Ritual, checking, reassurance, searching or avoidance. Anything meant to switch the fear off quickly.',
      metoda: 'React differently to the urge. The fear may be present and I act anyway.'
    },
    {
      nazev: 'Relief',
      co: 'The fear eases for a moment and the brain records: the ritual saved me.',
      metoda: 'This is where the circle breaks. Relief comes from bearing the fear, not from certainty.',
      zlom: true
    },
    {
      nazev: 'Reinforcement',
      co: 'Next time the urge comes stronger and the loop turns faster.',
      metoda: 'Instead of "the ritual saved me", "I can handle it" is formed. Self-trust grows from that.'
    }
  ]
};
