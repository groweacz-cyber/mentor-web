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

E-mail (`ocdmentor@gmail.com`), doména (`ocdmentor.cz`), IČ (`87690772`), značka (`OCD mentor`) a zásady ochrany osobních údajů už jsou doplněné. Zbývá: `[JMÉNO AUTORA]` a žlutě označené bloky `placeholder` (příběh, aktuální stav, výcvik, supervize, stížnosti, české zdroje odborné péče, telefon/rezervace) a `[DATUM]` (datum poslední kontroly obsahu na stránkách Metoda a Pro koho).

Zásady ochrany osobních údajů jsou napsané podle skutečného zpracování na webu (žádný server, žádné cookies). Doporučuji je nechat ještě zkontrolovat právníkem, než web ostře spustíte.

## Před ostrým spuštěním

V `vercel.json` je dočasná hlavička `X-Robots-Tag: noindex, nofollow`, aby vyhledávače web neindexovaly, dokud jsou v něm placeholdery. Před spuštěním ji smažte a doplňte zbývající placeholdery.

## Nový článek

Zkopírujte `sablony/clanek.html` do `clanky/<slug>/index.html`, upravte, přidejte odkaz do `clanky/index.html` a adresu do `sitemap.xml`.

## Zásady

V repozitáři nesmí být osobní data, odpovědi z dotazníků ani testovací údaje klientů. Hesla, tokeny a klíče se do kódu neukládají.
