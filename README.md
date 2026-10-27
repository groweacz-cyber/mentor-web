# OCD mentor – ocdmentor.cz

Statický web v češtině: HTML, CSS a minimum JavaScriptu. Bez databáze, bez cookies a bez analytiky. Stránky se generují Node skriptem a výsledek se commituje do repozitáře.

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
- **Ceník, tři kroky a FAQ stránky Jak to probíhá:** `assets/data/jak-to-probiha.json`. FAQ se do strukturovaných dat (FAQPage) dostane samo; odpověď obsahující nedoplněný `[placeholder]` se do nich zatím nedává.
- **Smyčka OCD, kvíz a principy:** `assets/js/smycka-faze.js`, `assets/js/kviz-data.js`, `assets/js/principy.js`. Generátor z nich vytvoří statické HTML, aby byl obsah ve zdrojovém kódu stránky; JavaScript ho pak nahradí interaktivní verzí.
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
- Stránky s hlavičkou `robots: 'noindex, follow'` v `gen.mjs` (zatím Online semináře a Online kurz, dokud obsahují placeholdery) se do sitemapy nedávají.
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

V repozitáři nesmí být osobní data, odpovědi z dotazníků ani testovací údaje klientů. Hesla, tokeny a klíče se do kódu neukládají (klíč IndexNow je veřejný z principu).
