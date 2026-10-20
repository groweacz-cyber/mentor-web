# OCD mentor – web peer mentora (OCD)

Statický web v češtině: čisté HTML, CSS a minimum JavaScriptu (jen odeslání dotazníku). Bez build kroku, bez databáze, bez cookies a bez analytiky.

## Struktura

```
index.html                      Úvod
metoda/ pro-koho/ dotaznik/
o-mne/ clanky/ kontakt/
ochrana-osobnich-udaju/         Zásady ochrany osobních údajů (GDPR), vyplněné
404.html
sablony/clanek.html             Šablona nového článku (noindex, nezveřejňovat)
assets/css/style.css
assets/js/dotaznik.js           Převod formuláře na e-mail / text
assets/img/favicon.svg
assets/img/uvod-poster.webp     Poster snímek úvodního videa, i Open Graph obrázek
assets/video/uvod.mp4           Úvodní video na hlavní stránce (autoplay, ztlumené, smyčka)
assets/img/o-mne-vaclav.webp    Portrét autora na stránce O mně
assets/img/kontakt-ilustrace.webp  Ilustrace na stránce Kontakt
assets/img/clanky/druhy-ocd.webp   Obrázek k článku „Druhy OCD“
clanky/druhy-ocd-9-typu/        Článek (Article + FAQPage JSON-LD)
clanky/proc-ujisteni-krmi-ocd/  Článek (Article JSON-LD)
clanky/proc-nutkani-prichazi-ve-vlnach/  Článek (Article JSON-LD)
sitemap.xml  robots.txt  vercel.json
```

## Spuštění lokálně

```bash
npx serve .
```

Otevřete adresu, kterou příkaz vypíše (obvykle http://localhost:3000).

## Nasazení

1. Vytvořte repozitář na GitHubu s výchozí větví `main` a pushněte obsah složky.
2. Na vercel.com zvolte **Add New → Project**, importujte repozitář. Framework preset **Other**, build command prázdný, output directory `.`.
3. Každý push do `main` se nasadí automaticky. Výchozí adresa je `<projekt>.vercel.app`.

## Placeholdery k doplnění

E-mail (`ocdmentor@gmail.com`), doména (`ocdmentor.cz`), IČ (`87690772`), značka (`OCD mentor`), jméno autora (Václav Kodeš, i v `Person` strukturovaných datech), zásady ochrany osobních údajů a rezervace konzultace (oficiální widget Reservanto, id 25616, na úvodní stránce) už jsou doplněné. Zbývá: žlutě označené bloky `placeholder` (příběh, aktuální stav, výcvik, supervize, stížnosti, české zdroje odborné péče, telefon/rezervace) a `[DATUM]` (datum poslední kontroly obsahu na stránkách Metoda a Pro koho).

Zásady ochrany osobních údajů jsou napsané podle skutečného zpracování na webu (žádný server, žádné cookies). Doporučuji je nechat ještě zkontrolovat právníkem, než web ostře spustíte.

## Před ostrým spuštěním

V `vercel.json` je dočasná hlavička `X-Robots-Tag: noindex, nofollow`, aby vyhledávače web neindexovaly, dokud jsou v něm placeholdery. Před spuštěním ji smažte a doplňte zbývající placeholdery.

## Nový článek

Nové články se teď přidávají přímo v `gen.mjs`: zkopírujte blok `// ---------- Článek: Druhy OCD ----------` jako vzor, přidejte záznam do pole `ARTICLES` (slug, titulek, perex, datum) a spusťte generátor. Sitemap se doplní automaticky z `ARTICLES`. Starý postup přes `sablony/clanek.html` (ruční kopie do `clanky/<slug>/index.html`) pořád funguje, pokud generátor nechcete upravovat.

## Zásady

V repozitáři nesmí být osobní data, odpovědi z dotazníků ani testovací údaje klientů. Hesla, tokeny a klíče se do kódu neukládají.
