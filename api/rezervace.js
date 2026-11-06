// Serverová funkce rezervace semináře (Vercel, region fra1 = EU). POST /api/rezervace, JSON.
// Nic neukládá. Do logů jde jen variabilní symbol a kódy chyb, žádné osobní údaje.
import { nactiData, pripravProgramy, splatnost, stavBehu } from './_lib/seminare.js';
import { spdRetezec, variabilniSymbol } from './_lib/platba.js';
import { ZPRAVA_PRO_PRIJEMCE, textyProgramu } from './_lib/texty.js';
import { validujRezervaci } from './_lib/validace.js';
import { limitPrekrocen, otisk } from './_lib/limit.js';
import { emailMajitel, emailUcastnik, vytvorOdesilac } from './_lib/mail.js';
import { nactiKonfiguraci } from './_lib/konfigurace.js';

const MAX_TELO = 4096;
let cache;
const programyZData = () => {
  if (!cache) {
    const data = nactiData();
    const programy = pripravProgramy(data);
    for (const p of programy) textyProgramu(p.id);
    cache = { data, programy };
  }
  return cache;
};

function odpovez(res, stav, telo, hlavicky = {}) {
  res.statusCode = stav;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  for (const [k, v] of Object.entries(hlavicky)) res.setHeader(k, v);
  res.end(JSON.stringify(telo));
}

const ipZPozadavku = (req) =>
  String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '')
    .split(',')[0]
    .trim();

// Továrna kvůli testům: prostředí, odesílání a „teď“ lze nahradit. Vercel volá výchozí export s (req, res).
export function vytvorHandler({ env = () => process.env, odesilac = vytvorOdesilac, ted = () => new Date() } = {}) {
  return async function handler(req, res) {
    const ted0 = ted();
    let konf;
    try {
      konf = nactiKonfiguraci(env());
    } catch (e) {
      console.error('rezervace: chybná konfigurace', { kod: e.kod, promenna: e.promenna });
      return odpovez(res, 500, { ok: false, kod: 'konfigurace' });
    }

    if (req.method !== 'POST') return odpovez(res, 405, { ok: false, kod: 'metoda' }, { Allow: 'POST' });
    const origin = req.headers.origin;
    if (origin && !konf.povoleneOrigin.includes(origin)) return odpovez(res, 403, { ok: false, kod: 'puvod' });
    if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return odpovez(res, 415, { ok: false, kod: 'typ-obsahu' });
    if (Number(req.headers['content-length'] || 0) > MAX_TELO) return odpovez(res, 413, { ok: false, kod: 'velke-telo' });

    // Rate limit: na IP a celkově na jednu instanci (ochrana před zahlcením e-maily).
    const ted0ms = ted0.getTime();
    if (limitPrekrocen(`ip:${otisk(ipZPozadavku(req))}`, { max: 5, oknoMs: 15 * 60 * 1000, ted: ted0ms }) || limitPrekrocen('vse', { max: 60, oknoMs: 60 * 60 * 1000, ted: ted0ms })) {
      return odpovez(res, 429, { ok: false, kod: 'prilis-mnoho-pokusu' }, { 'Retry-After': '900' });
    }

    let telo = req.body;
    if (typeof telo === 'string') {
      try { telo = JSON.parse(telo); } catch { telo = null; }
    }

    let cast;
    try {
      cast = programyZData();
    } catch (e) {
      console.error('rezervace: chybná data termínů', { kod: 'data-terminu' });
      return odpovez(res, 500, { ok: false, kod: 'data-terminu' });
    }
    const { data, programy } = cast;

    const v = validujRezervaci(telo, programy.map((p) => ({ id: p.id, behy: p.behy.map((b) => b.id) })));
    if (!v.ok) return odpovez(res, 400, { ok: false, kod: v.kod, chyby: v.chyby });

    const program = programy.find((p) => p.id === v.hodnoty.program);
    const beh = program.behy.find((b) => b.id === v.hodnoty.beh);
    const jaz = v.hodnoty.jazyk;
    const programTexty = textyProgramu(program.id);
    if (stavBehu(beh, data, ted0) !== 'otevreno') return odpovez(res, 409, { ok: false, kod: 'beh-neni-otevreny' });

    // Cena, termíny a stav se berou jen ze serverových dat, nikdy od klienta.
    const vs = variabilniSymbol(ted0);
    const rez = {
      vs,
      castka: program.cena,
      programId: program.id,
      programTexty,
      ucet: konf.ucet,
      iban: konf.iban,
      behId: beh.id,
      behNazev: beh.nazev,
      terminy: beh.terminy,
      cas: beh.cas,
      delkaMinut: program.delkaMinut,
      splatnost: splatnost(data, ted0),
    };
    const spd = spdRetezec({ iban: rez.iban, castka: rez.castka, vs, prijemce: konf.majitel, zprava: ZPRAVA_PRO_PRIJEMCE });
    const odesli = await odesilac(konf);
    const spolecne = { od: konf.mailFrom, odJmeno: konf.majitel };

    if (konf.posilatUcastnikovi) {
      try {
        await odesli({ ...spolecne, komu: v.hodnoty.email, komuJmeno: `${v.hodnoty.jmeno} ${v.hodnoty.prijmeni}`, replyTo: konf.notifyEmail, zprava: emailUcastnik({ rez, konf, odkazPodminky: `${konf.web}${jaz === 'en' ? '/en/terms' : jaz === 'sk' ? '/sk/obchodne-podmienky' : '/obchodni-podminky'}`, spd, jazyk: jaz }) });
      } catch (e) {
        console.error('rezervace: e-mail účastníkovi se nepodařilo odeslat', { vs, kod: e.kod });
        return odpovez(res, 502, { ok: false, kod: 'email-selhal' });
      }
    }
    try {
      const objednano = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', dateStyle: 'medium', timeStyle: 'short' }).format(ted0);
      await odesli({ ...spolecne, komu: konf.notifyEmail, replyTo: v.hodnoty.email, zprava: emailMajitel({ rez, osoba: v.hodnoty, konf, objednano, ucastnikOdeslan: konf.posilatUcastnikovi, jazyk: jaz }) });
    } catch (e) {
      // Účastník má platební údaje, rezervace platí. Majitel se o ní dozví z banky nebo z logu (VS).
      console.error('rezervace: upozornění majiteli se nepodařilo odeslat', { vs, kod: e.kod });
    }

    console.log('rezervace přijata', { vs });
    return odpovez(res, 200, {
      ok: true,
      emailOdeslan: konf.posilatUcastnikovi,
      vs,
      castka: rez.castka,
      mena: 'CZK',
      ucet: rez.ucet,
      iban: rez.iban,
      majitel: konf.majitel,
      splatnost: rez.splatnost,
      program: { id: program.id, popis: jaz === 'en' ? programTexty.en.popis : jaz === 'sk' ? programTexty.sk.popis : programTexty.popis },
      beh: { id: beh.id, nazev: jaz === 'en' ? `Run ${beh.nazev.replace(/\D+/g, '')}` : jaz === 'sk' ? `Beh ${beh.nazev.replace(/\D+/g, '')}` : beh.nazev },
      terminy: rez.terminy.map((datum) => ({ datum, cas: rez.cas })),
      delkaMinut: rez.delkaMinut,
      spd,
    });
  };
}

export default vytvorHandler();
