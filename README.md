# OCD mentor – ocdmentor.cz

Statický web v češtině: HTML, CSS a minimum JavaScriptu. Bez databáze a bez vlastní analytiky; měření reklamy (Meta Pixel) se zapíná jen po souhlasu v liště cookies (viz níže). Stránky se generují Node skriptem a výsledek se commituje do repozitáře.

## Rychlý start

```bash
npm run gen      # vygeneruje HTML, sitemap.xml, robots.txt a seo/*.json do kořene repozitáře
npm run og       # vyrobí OG obrázky 1200×630 (assets/og), jen pro změněné stránky; --force pro všechny
npm run audit    # SEO kontrola: title, description, H1, canonical, odkazy, obrázky, JSON-LD, sitemap
npx serve .      # lokální náhled (http://localhost:3000)
```

Po každé úpravě textů, šablon nebo datových souborů spusťte `npm run gen`, zkontrolujte `npm run audit` a commitněte vygenerované soubory. Node 18+; žádné závislosti se neinstalují.

## Struktura

```
tools/gen.mjs            Generátor stránek (šablona, texty, menu, JSON-LD, sitemap)
tools/config.json        Nastavení: facebookUrl, kódy pro ověření webu, klíč IndexNow
tools/audit.mjs          SEO audit
tools/og.mjs             OG obrázky (vykresluje Edge nebo Chrome, který už v počítači je)
tools/indexnow.mjs       Odeslání URL Seznamu a Bingu po nasazení
seo/                     mapa-klicovych-slov.md, lastmod.json, og-pages.json (generované)
assets/css, assets/js    Styly a skripty (assets/js/app = aplikace)
assets/data              Datové soubory (jak-to-probiha.json: kroky, ceník, FAQ)
assets/og                OG obrázky (generované)
```

Soubory ze složek `tools` a `seo` se na web nenasazují (`.vercelignore`).

## Kde upravit obsah

- **Texty stránek, menu, titulky a popisky:** `tools/gen.mjs`.
- **Ceník, kroky a FAQ stránky Jak to probíhá:** `assets/data/jak-to-probiha.json`. FAQ se do strukturovaných dat (FAQPage) dostane samo; odpověď obsahující nedoplněný `[placeholder]` se do nich zatím nedává.
- **E-book:** stránka `/ebook` je v `tools/gen.mjs` (indexovatelná, v sitemapě, strukturovaná data Book), soubor `assets/ebook/Cesta_k_sebeprijeti.pdf` (19 stran, A5) je volně ke stažení bez e-mailu a service worker ho nekešuje. Náhled titulní strany je `assets/img/ebook-titulka.webp` (vyříznutý z PDF). Při výměně PDF aktualizujte počet stran a velikost (5,3 MB) v textu stránky.
- **Nový článek:** přidat záznam do pole `ARTICLES` v `tools/gen.mjs` (`slug`, `seoTitle`, `title`, `excerpt`, `date`, obrázky) a podle existujících článků napsat blok stránky. Sitemap, drobečky, JSON-LD a OG obrázek se doplní samy.
- **Obsahové stránky (Typy OCD, Vtíravé myšlenky, Pro blízké, Mýty, Slovníček, Příběhy, Pro terapeuty):** texty v `tools/content/faze2.mjs` a `tools/content/typy2.mjs`, typy OCD v `assets/data/typy-ocd.json`, pojmy ve `assets/data/slovnicek.json`, mýty v `assets/data/myty.json`.

## Funkce pro návštěvníky

- **Kalkulačka `/kolik-casu-mi-bere-ocd`:** `assets/js/kalkulacka.js`. Počítá jen v prohlížeči, nic se neukládá ani neodesílá. Odkaz na ni je na úvodní stránce a v souvisejících stránkách.
- **Úvodní video:** `assets/video/uvod.webm` (+ `uvod.mp4`), titulky `assets/video/uvod.cs.vtt`, textový přepis je v `<p id="video-prepis" class="sr-only">`. Video se načte až po načtení stránky a nespustí se při `prefers-reduced-motion`, úsporném datovém režimu, v Klidném režimu ani při vypnutém pohybu.
- **Klidný režim:** tlačítko v horní liště, vypíná animace a video; volba je jen v `localStorage` (`ocd-calm`) v prohlížeči návštěvníka.
- **Plovoucí lišta „Konzultace zdarma“:** jen na mobilu, `assets/js/lista.js`; zobrazí se po odrolování, lze ji zavřít (pamatuje si to jen do konce návštěvy) a nezobrazuje se nad otevřeným dialogem nebo rezervačním oknem.
- **PWA a offline:** `manifest.webmanifest` a `sw.js` generuje `tools/gen.mjs` (verze cache se mění s obsahem webu), šablona je `tools/sw.template.js`. Navštívené stránky fungují bez připojení, ostatní ukáží `/offline`. Ikony se vyrábějí příkazem `node tools/icons.mjs` do `assets/icons/`.
- **Stránka 404:** ilustrace se bere z `notFoundImage` v `tools/config.json`; když je prázdné, použije se stávající ilustrace panáčka.

## Online semináře: rezervace a platba QR kódem

Stránky `/seminare` (přehled dvou programů), `/seminare/<stranka>` (jedna stránka na program: `/seminare/cesta-s-ocd`, `/seminare/pro-blizke`), `/seminare/rezervace` a `/seminare/rezervace/potvrzeni` jsou statické, rezervaci obsluhuje serverová funkce `api/rezervace.js` (Vercel, region `fra1`, EU). V hlavním menu má „Online semináře“ odkaz na přehled a samostatné tlačítko podmenu se dvěma programy (menu a stránky se generují z `data/seminare.json`). Starý odkaz s kotvou `/seminare#pro-blizke` nebo `#pro-lidi-s-ocd` přesměruje skript `assets/js/seminare.js` na stránku programu. Funkce nic neukládá: ověří vstup (program a běh, který k němu patří), z dat webu vezme termíny a cenu zvoleného programu, vygeneruje variabilní symbol a QR Platbu a přes Resend (nebo SMTP) pošle dva e-maily (účastníkovi platební údaje, majiteli upozornění).

```
data/seminare.json        programy (cena, počet setkání, den, čas), běhy, termíny a stavy (čte generátor i funkce)
api/rezervace.js          POST /api/rezervace
api/_lib/                 termíny, platba (IBAN, SPD), e-maily, validace, rate limit, konfigurace
tools/content/seminare.mjs   texty a HTML stránek seminářů
assets/js/seminare.js, rezervace.js, potvrzeni.js, vendor/qrcode.js   skripty (QR kód: knihovna qrcode-generator, MIT)
tools/dev-server.mjs      lokální server s API (e-maily do složky)
tools/test/               testy (npm test)
```

### Správa termínů (`data/seminare.json`)

- Pole `programy`: každý program má `id` (zůstává v adrese rezervace `?program=`), `stranka` (adresa `/seminare/<stranka>`), `nazev`, `kratkyNazev` a `komu` (menu, drobečky, karty), `anotace` (věta na kartě přehledu), `podtitul`, `pocetSetkani`, `delkaMinut`, `cena`, `den`, `cas` a `behy`. Běh má `id` (jedinečné napříč programy) a `prvniDatum` a `stav` (`otevreno`, `obsazeno`, `pripravujeme`); název „Běh 1“, „Běh 2“ se odvodí z pořadí. Termíny se počítají po 7 dnech od `prvniDatum` (počet podle `pocetSetkani`), data ze společného pole `vynechaneDatumy` se přeskakují.
- `npm run gen` selže s jasnou chybou, pokud termín spadá na vynechané datum, první datum není v den týdne programu, nebo se jakákoli dvě setkání (napříč všemi programy a běhy) překrývají či mezi koncem jednoho a začátkem dalšího chybí aspoň 90 minut (jeden klient v daném čase).
- **Nový program:** záznam v `programy`, texty v `TEXTY_PROGRAMU` (`api/_lib/texty.js`, včetně `pocet`, který se musí shodovat s `pocetSetkani`), obsah a souhlasy v `OBSAH` a `SOUHLASY` (`tools/content/seminare.mjs`) a titulek a popis v `SEM_TITULEK` a `SEM_POPIS` (`tools/gen.mjs`). Generátor i server selžou, pokud program texty nemá. Ceny, počty setkání, termíny i věty ve FAQ (přesuny, splatnost, vynechané dny) se berou z dat.
- Rezervace se uzavírá `uzavreniDniPredZacatkem` (4) dny před prvním setkáním. Stav „Uzavřeno“ se na webu upraví i bez nového nasazení (skript podle data v Praze), server ho při rezervaci kontroluje vždy.
- **Po každé přijaté rezervaci nastavte běh na `obsazeno`, spusťte `npm run gen` a web nasaďte.** Funkce nemá databázi, takže jinak by si stejný běh mohl rezervovat další člověk.

### Proměnné prostředí

Vzor je v `.env.example`. Lokálně do `.env.local` (je v `.gitignore`), na Vercelu Settings > Environment Variables (Production): `BANK_ACCOUNT`, `BANK_ACCOUNT_HOLDER`, `SELLER_ICO`, `NOTIFY_EMAIL`, `MAIL_FROM`, `RESEND_API_KEY` (nebo místo něj `SMTP_PASSWORD`). Nepovinné: `SEND_TO_PARTICIPANT` (`ne` = e-mail účastníkovi se neposílá, nutné bez ověřené domény v Resend), `SMTP_USER`, `SMTP_HOST`, `SMTP_PORT`, `ALLOWED_ORIGINS`, `SITE_URL`. Po změně proměnných je potřeba nové nasazení.

### Lokální vývoj a testy

```bash
npm run dev          # http://localhost:8920, e-maily se ukládají do tools/.outbox (bez odesílání)
npm run dev -- --real-mail   # e-maily se opravdu odešlou (potřeba RESEND_API_KEY)
npm run iban         # vypíše IBAN z BANK_ACCOUNT k porovnání s bankovnictvím
npm test             # jednotkové testy a kontrola vygenerovaných stránek (nejdřív npm run gen)
```

### Content-Security-Policy

Politika se skládá v `tools/gen.mjs` a zapisuje do hlavičky v `vercel.json` při každém `npm run gen` (jediný inline skript webu se povolí hashem, skripty smí být jen z vlastní domény a z Reservanta). Generátor selže, pokud by na webu byla inline obslužná funkce (`onclick` apod.).

## Anglická verze (/en/…)

Každá stránka, která má záznam v `tools/i18n/slugs.mjs`, má anglickou dvojnici (`/en/…`), přepínač jazyka (CZ | EN) v záhlaví, `hreflang` a položku v sitemapě. Koncepty (`/skupiny`) anglickou verzi nemají.

- **Stránky:** generátor vyrobí českou stránku a anglickou vytvoří překladem podle slovníku `tools/i18n/en/*.mjs` (dvojice `[česky, anglicky]`, vložené značky se zapisují jako `{1}…{/1}`, čísla ve vzorech jako `{#}`). Seminářové stránky se píšou anglicky přímo (`opts.en`, parametr `jaz` v `tools/content/seminare.mjs`).
- **Skripty:** `tools/i18n/jsbuild.mjs` vyrobí z `assets/js/**` anglické kopie v `assets/js/en/**` (nahradí textové literály, šablony a regulární výrazy podle slovníku `tools/i18n/en-js/*.mjs`; logika se nemění). Jazykově závislou logiku (datum, měna, `jazyk` v rezervaci) čtou skripty z `<html lang>`.
- **Chybějící překlad:** po `npm run gen` musí být `tools/i18n/chybejici.json` a `tools/i18n/chybejici-js.json` prázdné (`jednotek: 0`), jinak selže test. Nový nebo změněný český text se tedy po generování objeví v seznamu a stačí k němu doplnit dvojici do slovníku (nová dvojice do nového souboru `tools/i18n/en/NN-nazev.mjs`, resp. `tools/i18n/en-js/`).
- **Rezervace seminářů:** formulář posílá `jazyk: "en"`, server pak píše e-mail účastníkovi a odpověď anglicky (e-mail majiteli zůstává česky a uvádí jazyk stránky). Setkání se konají anglicky nebo česky.
- **Mimo překlad:** právní stránky (podmínky, zásady) mají anglický courtesy překlad, rozhodující je české znění. Widget Reservanto se přepnout do angličtiny nedá.
- **Obrázky pro sociální sítě:** `npm run og` vyrobí i anglické (`assets/og/en-*.png`). Offline stránku pro angličtinu zajišťuje `sw.js` (`/en/offline`).
- **Aplikace:** uložená data (`localStorage`) obsahují u některých voleb text v jazyce, ve kterém se vyplňovaly; při přepnutí jazyka uprostřed používání se staré odpovědi u těchto voleb nezobrazí jako zaškrtnuté.

### Slovenská verze (/sk/…)

Slovenština funguje stejně jako angličtina (stejný generátor, přepínač CZ | EN | SK, `hreflang`, sitemapa), s těmito rozdíly:

- **Všechno se překládá z češtiny slovníkem**, včetně seminářů a rezervace (žádné stránky se nepíšou slovensky přímo). Slovník stránek je `tools/i18n/sk/*.mjs`, slovník skriptů `tools/i18n/sk-js/*.mjs`, adresy `SK_STRANKY` v `tools/i18n/slugs.mjs`, kopie skriptů `assets/js/sk/`. Chybějící překlady hlásí `tools/i18n/chybejici-sk.json` a `chybejici-js-sk.json` (musí být prázdné, hlídá to `tools/test/slovencina.test.mjs`).
- **Čísla a data ve slovníku** se zapisují vzorem `{#}` (např. „štvrtok {#}. {#}. {#} o {#}:{#}“), aby se po změně termínů v `data/seminare.json` nemuselo překládat znovu. Texty s pevnými čísly (např. „3 590 Kč“) se překládají přesně.
- **Krizová linka** je na slovenských stránkách „Linka dôvery Nezábudka 0800 800 566“ (spolu s 112 a 155), česká linka 116 123 se tam nepoužívá. Ceny zůstávají v Kč, platí se na český účet. Odkazy na české organizace v části „Kam dál“ jsou přeložené a označené jako české. Právní stránky jsou orientační překlad, rozhodující je české znění (platí české právo).
- **Rezervace:** formulář posílá `jazyk: "sk"`, server píše e-mail účastníkovi a odpověď slovensky; setkání se konají česky nebo slovensky.

## Písma

Vlastní hostovaná písma v `assets/fonts/` (SIL Open Font License, žádné požadavky na cizí servery, CSP `font-src 'self'`): **Nunito Sans** (text) a **Fraunces** (nadpisy h1, h2 a logo). Jen podmnožiny latin a latin-ext (čeština, slovenština, angličtina), `font-display: swap`. Deklarace `@font-face` jsou na začátku `assets/css/style.css`, hlavní podmnožiny latin se předem načítají přes `<link rel="preload">` v `page()`.

## Cookies a Meta Pixel

- Lišta cookies (`assets/js/cookie.js`, HTML lišty a odkaz „Nastavení cookies“ v patičce vkládá `page()` v `tools/gen.mjs`, příznak `cookiesOn`). Volba se ukládá do `localStorage` (`ocdmentor-cookies`) na 12 měsíců.
- Meta Pixel (ID je v `cookie.js`) se načte **jen po souhlasu**; v HTML stránek není, `<noscript>` varianta se záměrně nepoužívá (běžela by bez souhlasu). Lišta a pixel se nezobrazují v aplikaci, na potvrzení rezervace a konceptech.
- CSP povoluje `connect.facebook.net` (skript) a `www.facebook.com` (obrázky, spojení). Texty lišty a zásad jsou ve slovnících `tools/i18n/{en,sk}/40-cookies.mjs`. Hlídá to `tools/test/cookies.test.mjs`.

## Koncepty a schvalování

Obsahové stránky (Typy OCD, Vtíravé myšlenky, Pro blízké, Mýty, Slovníček, Příběhy, Pro terapeuty) jsou od 23. 10. 2026 zveřejněné: mají drobečky, JSON-LD (Article a BreadcrumbList), OG obrázek, jsou v sitemapě a v menu „O OCD“. Funkce `contentPage` v `tools/gen.mjs` stránku zveřejní sama; **koncept** je stránka s `draft: true`: má `noindex, nofollow`, štítek „Koncept“, není v navigaci ani v sitemapě a je v přehledu `/koncepty` (jen pro kontrolu autorem). Aktuálně je konceptem jen `/skupiny` (čeká na cenu a podrobnosti skupin). Zveřejní se odstraněním `draft: true` u jejího volání `contentPage`, potom `npm run gen`, `npm run og` a `npm run audit`.

Texty typů OCD jsou v `tools/content/faze2.mjs` (zdravotní OCD, kontrolování, vztahové OCD) a v `tools/content/typy2.mjs` (ostatní). Nový typ: záznam v `assets/data/typy-ocd.json` a text ve stejné struktuře v jednom z těchto souborů. Zdroje jsou ověřené odkazy v `SRC` (`faze2.mjs`); do stránky se přidávají parametrem `sources`, a pokud je prázdný, blok „Zdroje“ se nevypíše. Nové zdroje před přidáním ověřte (otevírá se odkaz, souhlasí citované číslo).

Nastavení v `tools/config.json`:

| Klíč | Význam |
|---|---|
| `reviewer` | jméno a titul odborníka; řádek „Odborně zkontroloval“ se zobrazí, jen když je vyplněný |
| `glossaryOnPublicPages` | `false`: vysvětlivky pojmů ze slovníčku jsou jen na obsahových stránkách (Typy OCD, Vtíravé myšlenky, Pro blízké a další). `true` je zapne i na dříve hotových stránkách (Metoda, Pro koho, Jak to probíhá, O mně, články) |
| `showDraftTypes` | zastaralé, všechny typy jsou schválené (`"schvaleno": true` v `typy-ocd.json`) |
| `notFoundImage` | obrázek na stránce 404; prázdné = stávající ilustrace panáčka |

Stránka `/pomoc` je zveřejněná od začátku a v hlavičce každé stránky je odkaz „Potřebuji pomoc hned“.

## SEO

- Každá stránka má unikátní `title` (formát „Téma | ocdmentor.cz“, do 60 znaků), meta description (120–160 znaků), jednu H1, canonical, Open Graph a X karty s vlastním OG obrázkem a strukturovaná data (BreadcrumbList; WebSite a Person na úvodu, Service a FAQPage na Jak to probíhá, Article u článků).
- `sitemap.xml` obsahuje jen indexovatelné stránky. `lastmod` se mění, jen když se změní obsah stránky (ukládá se v `seo/lastmod.json`).
- Stránky s hlavičkou `robots: 'noindex, follow'` v `gen.mjs` (zatím Online kurz, který není v menu) se do sitemapy nedávají.
- CSS a JS mají v URL `?v=<hash>` a cachují se na rok. Po změně souboru a `npm run gen` se hash změní sám.

### Ověření vlastnictví a další nastavení (`tools/config.json`)

| Klíč | Kam to patří |
|---|---|
| `facebookUrl` | adresa Facebook stránky, přidá se do Person jako `sameAs` |
| `verification.google` | kód ze Search Console (meta `google-site-verification`) |
| `verification.seznam` | kód ze Seznam Webmaster (meta `seznam-wmt`) |
| `verification.bing` | kód z Bing Webmaster Tools (meta `msvalidate.01`) |
| `indexnowKey` | klíč IndexNow, stejnojmenný soubor `<klíč>.txt` leží v kořeni webu |

Prázdná hodnota znamená, že se příslušný tag nevypíše. Po vyplnění spusťte `npm run gen`.

### IndexNow (rychlejší indexace v Seznamu a Bingu)

Spouští se **po nasazení** webu: `npm run indexnow`. Odešle všechny URL ze sitemapy na `search.seznam.cz/indexnow` a `api.indexnow.org/indexnow`. Spusťte ho po každém nasazení, které přidalo nebo změnilo stránky. Skript nejdřív ověří, že je klíčový soubor na webu dostupný. `npm run indexnow -- --dry-run` jen vypíše URL.

## Nasazení (Vercel)

Projekt je napojený na Vercel (framework Other, bez build příkazu, výstup je kořen repozitáře). Hlavní adresa je `https://ocdmentor.cz`; `www.ocdmentor.cz` a `mentor-web-delta.vercel.app` se přesměrují na ni (`vercel.json`) a všechny `*.vercel.app` adresy dostanou `X-Robots-Tag: noindex`.

Automatické nasazení z GitHubu u tohoto projektu nefunguje, proto se nasazuje ručně: `vercel --prod --yes`, poté aliasy `vercel alias set <nové-nasazení>.vercel.app ocdmentor.cz` a totéž pro `www.ocdmentor.cz`.

## Před ostrým spuštěním pro vyhledávače

Dokud byla v `vercel.json` globální hlavička `X-Robots-Tag: noindex, nofollow`, vyhledávače web neindexovaly. Ve verzi s touto SEO úpravou už hlavička odstraněná je (zůstává jen pro `*.vercel.app`), takže **nasazení tohoto stavu web pro vyhledávače otevře**. Před tím doplňte zbývající placeholdery (viz níže) a nechte zkontrolovat právní texty.

## Placeholdery

Žlutě označené bloky `placeholder` na webu a hodnoty v `tools/config.json`. Aktuální seznam nevyplněného je ve zprávě k poslednímu SEO průchodu.

## Zásady

V repozitáři nesmí být osobní data, odpovědi z dotazníků v aplikaci ani testovací údaje klientů. Hesla, tokeny a klíče se do kódu neukládají (klíč IndexNow je veřejný z principu).
