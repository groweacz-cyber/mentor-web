import test from 'node:test';
import assert from 'node:assert/strict';
import { nactiData, pripravBehy, stavBehu, splatnost, terminyBehu, zkontrolujData, pridejDny, dnesPraha, dlouhyCz } from '../../api/_lib/seminare.js';

const data = () => nactiData();
const klon = (o) => JSON.parse(JSON.stringify(o));

test('běh 1 má přesně zadané termíny (24. a 31. 12. se přeskočí)', () => {
  const d = data();
  const [beh1, beh2] = pripravBehy(d);
  assert.deepEqual(beh1.terminy, ['2026-12-03', '2026-12-10', '2026-12-17', '2027-01-07', '2027-01-14']);
  assert.deepEqual(beh2.terminy, ['2027-01-21', '2027-01-28', '2027-02-04', '2027-02-11', '2027-02-18']);
});

test('všechny termíny jsou čtvrtky v 18:00 a žádný nespadá na vynechané datum', () => {
  const d = data();
  for (const beh of pripravBehy(d)) {
    assert.equal(beh.cas, '18:00');
    for (const t of beh.terminy) {
      assert.match(dlouhyCz(t), /^čtvrtek /);
      assert.ok(!d.vynechaneDatumy.includes(t));
    }
  }
});

test('data v repozitáři projdou kontrolou', () => {
  assert.equal(zkontrolujData(data()), true);
});

test('překrývající se běhy způsobí chybu', () => {
  const d = klon(data());
  d.behy[1].prvniDatum = '2027-01-14'; // běh 1 končí 14. 1. 2027
  assert.throws(() => zkontrolujData(d), /překrývají/);
  d.behy[1].prvniDatum = '2026-12-10'; // uprostřed běhu 1
  assert.throws(() => zkontrolujData(d), /překrývají/);
});

test('první termín na vynechaném datu způsobí chybu', () => {
  const d = klon(data());
  d.behy[1].prvniDatum = '2026-12-24';
  assert.throws(() => zkontrolujData(d), /vynechané datum/);
});

test('první datum musí být ve zvolený den týdne, id musí být jedinečné, stav platný', () => {
  let d = klon(data());
  d.behy[1].prvniDatum = '2027-01-22';
  assert.throws(() => zkontrolujData(d), /není čtvrtek/);
  d = klon(data());
  d.behy[1].id = 'beh-1';
  assert.throws(() => zkontrolujData(d), /id se opakuje/);
  d = klon(data());
  d.behy[0].stav = 'zavreno';
  assert.throws(() => zkontrolujData(d), /stav musí být/);
});

test('vynechané datum uprostřed posune další termíny o týden', () => {
  const t = terminyBehu({ prvniDatum: '2026-12-17' }, ['2026-12-24', '2026-12-31'], 3);
  assert.deepEqual(t, ['2026-12-17', '2027-01-07', '2027-01-14']);
});

test('běh je 4 dny před prvním termínem uzavřený, dřív otevřený', () => {
  const d = data();
  const beh1 = d.behy[0]; // první termín 3. 12. 2026, uzavřeno od 29. 11. 2026
  assert.equal(pridejDny('2026-12-03', -4), '2026-11-29');
  assert.equal(stavBehu(beh1, d, new Date('2026-11-28T22:59:00Z')), 'otevreno'); // 28. 11. 23:59 v Praze
  assert.equal(stavBehu(beh1, d, new Date('2026-11-28T23:00:00Z')), 'uzavreno'); // 29. 11. 00:00 v Praze
  assert.equal(stavBehu(beh1, d, new Date('2026-12-03T10:00:00Z')), 'uzavreno');
});

test('obsazený a připravovaný běh má přednost před otevřeným', () => {
  const d = data();
  assert.equal(stavBehu({ ...d.behy[0], stav: 'obsazeno' }, d, new Date('2026-10-01T10:00:00Z')), 'obsazeno');
  assert.equal(stavBehu({ ...d.behy[0], stav: 'pripravujeme' }, d, new Date('2026-10-01T10:00:00Z')), 'pripravujeme');
});

test('den se počítá podle Prahy, ne podle UTC', () => {
  assert.equal(dnesPraha(new Date('2026-12-31T23:30:00Z')), '2027-01-01');
  assert.equal(splatnost(data(), new Date('2026-11-01T10:00:00Z')), '2026-11-04');
});
