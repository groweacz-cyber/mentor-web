# [NÁZEV] – web peer mentora (OCD)

Statický web v češtině: čisté HTML, CSS a minimum JavaScriptu (jen odeslání dotazníku). Bez build kroku, bez databáze, bez cookies a bez analytiky.

## Struktura

```
index.html                      Úvod
metoda/ pro-koho/ dotaznik/
o-mne/ clanky/ kontakt/
ochrana-osobnich-udaju/         Zásady (text doplní autor, noindex do doplnění)
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

Hledejte v celém projektu: `[NÁZEV]`, `EMAIL@DOPLNIT.cz`, `https://DOMENA.cz` (canonical, Open Graph, sitemap, robots), `[JMÉNO AUTORA]`, a žlutě označené bloky `placeholder` (příběh, aktuální stav, výcvik, supervize, stížnosti, české zdroje odborné péče, telefon/rezervace, zásady ochrany osobních údajů) a `[DATUM]` (datum poslední kontroly obsahu na stránkách Metoda a Pro koho).

## Před ostrým spuštěním

V `vercel.json` je dočasná hlavička `X-Robots-Tag: noindex, nofollow`, aby vyhledávače web neindexovaly, dokud jsou v něm placeholdery. Před spuštěním ji smažte, doplňte všechny placeholdery a u stránky `ochrana-osobnich-udaju` odstraňte `noindex` v `<head>`.

## Nový článek

Zkopírujte `sablony/clanek.html` do `clanky/<slug>/index.html`, upravte, přidejte odkaz do `clanky/index.html` a adresu do `sitemap.xml`.

## Zásady

V repozitáři nesmí být osobní data, odpovědi z dotazníků ani testovací údaje klientů. Hesla, tokeny a klíče se do kódu neukládají.
