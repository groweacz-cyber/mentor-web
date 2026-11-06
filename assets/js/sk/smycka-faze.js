// Texty interaktivní smyčky OCD na úvodní stránce. Pořadí fází určuje pořadí v kruhu.
// zlom: true označí fázi, kde se kruh láme (vizuální zvýraznění).
window.OCD_SMYCKA = {
  stred: 'Slučku možno prerušiť v každom bode.',
  znovu: '↺ a znovu dokola',
  faze: [
    {
      nazev: 'Spúšťač',
      co: 'Niečo spustí poplach: článok, správa, telesný pocit, situácia alebo myšlienka.',
      metoda: 'Mapa spúšťačov a Korene. Pochopím, kedy a prečo sa strach spúšťa, bez viny a bez nekonečného rozoberania.'
    },
    {
      nazev: 'Pochybnosť',
      co: 'Čo ak…? Mozog vyrobí pochybnosť a tvári sa, že potrebuje odpoveď hneď.',
      metoda: 'Porozumenie (I-CBT). Pochybnosť postavená na predstavivosti nepotrebuje odpoveď.'
    },
    {
      nazev: 'Katastrofický scenár',
      co: 'Z pochybnosti sa stane film o najhoršom možnom konci. Pôsobí skutočne, ale je to len predstava.',
      metoda: 'Sebaprijatie a sebadôvera. Neviem presne, čo sa stane. Keď príde ťažkosť, budem hľadať spôsob, ako ju riešiť.'
    },
    {
      nazev: 'Úzkosť',
      co: 'Telo spustí poplach: búšenie srdca, napätie, zovretý žalúdok, hmla v hlave.',
      metoda: 'Telo v strachu. Pomenujem, čo cítim, a nechám to byť. Telo hovorí jazykom úzkosti, ale nerozhoduje.'
    },
    {
      nazev: 'Kompulzie',
      co: 'Rituál, kontrola, uisťovanie, vyhľadávanie alebo vyhýbanie sa. Čokoľvek, čo má strach rýchlo vypnúť.',
      metoda: 'Reagovať inak na nutkanie. Strach môže byť prítomný a ja napriek tomu konám.'
    },
    {
      nazev: 'Úľava',
      co: 'Strach na chvíľu povolí a mozog si zapíše: rituál ma zachránil.',
      metoda: 'Tu sa kruh láme. Úľava prichádza z unesenia strachu, nie z istoty.',
      zlom: true
    },
    {
      nazev: 'Posilnenie',
      co: 'Nabudúce príde nutkanie silnejšie a slučka sa točí rýchlejšie.',
      metoda: 'Namiesto „rituál ma zachránil“ vzniká „zvládam to“. Z toho rastie sebadôvera.'
    }
  ]
};
