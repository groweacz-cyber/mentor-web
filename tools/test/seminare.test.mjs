import test from 'node:test';
import assert from 'node:assert/strict';
import { nactiData, pripravProgramy, stavBehu, splatnost, terminyBehu, zkontrolujData, pridejDny, dnesPraha, dlouhyCz, MIN_ODSTUP_MIN } from '../../api/_lib/seminare.js';

const data = () => nactiData();
const klon = (o) => JSON.parse(JSON.stringify(o));
const program = (d, id) => d.programy.find((p) => p.id === id);
const pripraveny = (id) => pripravProgramy(data()).find((p) => p.id === id);

test('program pro lidi s OCD: termíny prvního programu zůstaly beze změny (24. a 31. 12. se přeskočí)', () => {
  const p = pripraveny('pro-lidi-s-ocd');
  assert.equal(p.pocetSetkani, 5);
  assert.equal(p.cena, 3590);
  assert.deepEqual(p.behy[0].terminy, ['2026-12-03', '2026-12-10', '2026-12-17', '2027-01-07', '2027-01-14']);
  assert.deepEqual(p.behy[1].terminy, ['2027-01-21', '2027-01-28', '2027-02-04', '2027-02-11', '2027-02-18']);
});

test('program pro blízké: tři úterní termíny v obou bězích, cena 2 190 Kč', () => {
  const p = pripraveny('pro-blizke');
  assert.equal(p.pocetSetkani, 3);
  assert.equal(p.cena, 2190);
  assert.equal(p.delkaMinut, 60);
  assert.deepEqual(p.behy[0].terminy, ['2026-12-01', '2026-12-08', '2026-12-15']);
  assert.deepEqual(p.behy[1].terminy, ['2027-01-12', '2027-01-19', '2027-01-26']);
  assert.deepEqual(p.behy.map((b) => b.stav), ['otevreno', 'otevreno']);
});

test('všechny termíny jsou ve správný den a čas a žádný nespadá na vynechané datum', () => {
  const d = data();
  const dny = { 'pro-lidi-s-ocd': /^čtvrtek /, 'pro-blizke': /^úterý / };
  for (const p of pripravProgramy(d)) {
    for (const beh of p.behy) {
      assert.equal(beh.cas, '18:00');
      assert.equal(beh.terminy.length, p.pocetSetkani);
      for (const t of beh.terminy) {
        assert.match(dlouhyCz(t), dny[p.id]);
        assert.ok(!d.vynechaneDatumy.includes(t));
      }
    }
  }
});

test('data v repozitáři projdou kontrolou a obsahují přesně dva programy', () => {
  assert.equal(zkontrolujData(data()), true);
  assert.deepEqual(data().programy.map((p) => p.id), ['pro-lidi-s-ocd', 'pro-blizke']);
  assert.deepEqual(data().vynechaneDatumy, ['2026-12-24', '2026-12-31']);
});

test('id běhů jsou jedinečné napříč programy a stav je platný', () => {
  let d = klon(data());
  program(d, 'pro-blizke').behy[0].id = 'beh-1';
  assert.throws(() => zkontrolujData(d), /id se opakuje/);
  d = klon(data());
  program(d, 'pro-blizke').id = 'pro-lidi-s-ocd';
  assert.throws(() => zkontrolujData(d), /id se opakuje/);
  d = klon(data());
  program(d, 'pro-lidi-s-ocd').behy[0].stav = 'zavreno';
  assert.throws(() => zkontrolujData(d), /stav musí být/);
});

test('první termín na vynechaném datu způsobí chybu (v kterémkoli programu)', () => {
  let d = klon(data());
  program(d, 'pro-lidi-s-ocd').behy[1].prvniDatum = '2026-12-24';
  assert.throws(() => zkontrolujData(d), /vynechané datum/);
  d = klon(data());
  program(d, 'pro-blizke').behy[1].prvniDatum = '2026-12-29'; // úterý, ale 31. 12. (čtvrtek) není, 29. není vynechané
  assert.equal(zkontrolujData(d), true);
  d = klon(data());
  d.vynechaneDatumy.push('2026-12-08'); // uprostřed prvního běhu druhého programu
  assert.equal(zkontrolujData(d), true, 'vynechané datum uprostřed běhu se přeskočí, nikoli selže');
  assert.deepEqual(pripravProgramy(d)[1].behy[0].terminy, ['2026-12-01', '2026-12-15', '2026-12-22']);
});

test('první datum musí být ve zvolený den týdne programu', () => {
  let d = klon(data());
  program(d, 'pro-blizke').behy[1].prvniDatum = '2027-01-13'; // středa
  assert.throws(() => zkontrolujData(d), /není úterý/);
  d = klon(data());
  program(d, 'pro-lidi-s-ocd').behy[1].prvniDatum = '2027-01-22';
  assert.throws(() => zkontrolujData(d), /není čtvrtek/);
});

test('setkání napříč programy se nesmějí překrývat ani být blíž než 90 minut', () => {
  assert.equal(MIN_ODSTUP_MIN, 90);
  // Oba programy ve čtvrtek 18:00: 3. 12. 2026 se překrývá.
  let d = klon(data());
  Object.assign(program(d, 'pro-blizke'), { den: 'čtvrtek' });
  program(d, 'pro-blizke').behy[0].prvniDatum = '2026-12-03';
  assert.throws(() => zkontrolujData(d), /překrývá/);
  // Stejný den, druhý program začíná v 19:30 (60 min setkání končí v 19:00, mezera jen 30 min): blíž než 90 minut.
  d = klon(data());
  Object.assign(program(d, 'pro-blizke'), { den: 'čtvrtek', cas: '19:30' });
  program(d, 'pro-blizke').behy[0].prvniDatum = '2026-12-03';
  assert.throws(() => zkontrolujData(d), /blíž než 90 minut/);
  // Mezera přesně 90 minut (druhý program od 20:30) je v pořádku.
  d = klon(data());
  Object.assign(program(d, 'pro-blizke'), { den: 'čtvrtek', cas: '20:30' });
  program(d, 'pro-blizke').behy.forEach((b, i) => { b.prvniDatum = i === 0 ? '2026-12-03' : '2027-01-21'; });
  assert.equal(zkontrolujData(d), true);
  // Dva běhy téhož programu, které se prolínají.
  d = klon(data());
  program(d, 'pro-lidi-s-ocd').behy[1].prvniDatum = '2027-01-14';
  assert.throws(() => zkontrolujData(d), /překrývá/);
});

test('chybná hlášení jmenují program, běh a oba termíny', () => {
  const d = klon(data());
  Object.assign(program(d, 'pro-blizke'), { den: 'čtvrtek' });
  program(d, 'pro-blizke').behy[0].prvniDatum = '2026-12-03';
  assert.throws(() => zkontrolujData(d), (e) => /Program „pro-blizke“, běh „blizke-beh-1“/.test(e.message) && /čtvrtek 3\. 12\. 2026 v 18:00/.test(e.message));
});

test('vynechané datum uprostřed posune další termíny o týden', () => {
  const t = terminyBehu({ prvniDatum: '2026-12-17' }, ['2026-12-24', '2026-12-31'], 3);
  assert.deepEqual(t, ['2026-12-17', '2027-01-07', '2027-01-14']);
});

test('běh je 4 dny před prvním termínem uzavřený, dřív otevřený (oba programy)', () => {
  const d = data();
  const [ocd, blizke] = pripravProgramy(d);
  const beh1 = ocd.behy[0]; // první termín 3. 12. 2026, uzavřeno od 29. 11. 2026
  assert.equal(pridejDny('2026-12-03', -4), '2026-11-29');
  assert.equal(stavBehu(beh1, d, new Date('2026-11-28T22:59:00Z')), 'otevreno'); // 28. 11. 23:59 v Praze
  assert.equal(stavBehu(beh1, d, new Date('2026-11-28T23:00:00Z')), 'uzavreno'); // 29. 11. 00:00 v Praze
  const b1 = blizke.behy[0]; // první termín 1. 12. 2026, uzavřeno od 27. 11. 2026
  assert.equal(stavBehu(b1, d, new Date('2026-11-26T22:59:00Z')), 'otevreno');
  assert.equal(stavBehu(b1, d, new Date('2026-11-26T23:00:00Z')), 'uzavreno');
  assert.equal(stavBehu(b1, d, new Date('2026-12-01T10:00:00Z')), 'uzavreno');
});

test('obsazený a připravovaný běh má přednost před otevřeným', () => {
  const d = data();
  const beh = pripravProgramy(d)[1].behy[0];
  assert.equal(stavBehu({ ...beh, stav: 'obsazeno' }, d, new Date('2026-10-01T10:00:00Z')), 'obsazeno');
  assert.equal(stavBehu({ ...beh, stav: 'pripravujeme' }, d, new Date('2026-10-01T10:00:00Z')), 'pripravujeme');
});

test('den se počítá podle Prahy, ne podle UTC', () => {
  assert.equal(dnesPraha(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
  assert.equal(splatnost(data(), new Date('2026-11-01T10:00:00Z')), '2026-11-04');
});

test('program bez textů nebo s chybějícími poli je odmítnut', () => {
  let d = klon(data());
  delete program(d, 'pro-blizke').cena;
  assert.throws(() => zkontrolujData(d), /cena musí být/);
  d = klon(data());
  program(d, 'pro-blizke').cas = '25:00';
  assert.throws(() => zkontrolujData(d), /cas musí mít tvar/);
  d = klon(data());
  program(d, 'pro-blizke').den = 'úterku';
  assert.throws(() => zkontrolujData(d), /není název dne/);
  d = klon(data());
  d.programy = [];
  assert.throws(() => zkontrolujData(d), /programy musí být/);
});
