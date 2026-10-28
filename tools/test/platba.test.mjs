import test from 'node:test';
import assert from 'node:assert/strict';
import { ibanJePlatny, ibanPoSkupinach, rozlozUcet, spdRetezec, textProSpd, variabilniSymbol, vytvorIban } from '../../api/_lib/platba.js';

// Příklady účtů z dokumentace (ne skutečné účty prodejce).
test('IBAN se spočítá z čísla účtu, i s předčíslím', () => {
  assert.equal(vytvorIban(rozlozUcet('19-2000145399/0800')), 'CZ6508000000192000145399');
  assert.equal(vytvorIban(rozlozUcet('2970297/0100')), 'CZ3301000000000002970297'); // příklad z oficiální specifikace QR Platby
  assert.equal(vytvorIban(rozlozUcet('1265098001/5500')), 'CZ5855000000001265098001');
});

test('kontrola IBAN (modulo 97)', () => {
  assert.ok(ibanJePlatny('CZ6508000000192000145399'));
  assert.ok(ibanJePlatny('cz65 0800 0000 1920 0014 5399'));
  assert.ok(!ibanJePlatny('CZ6608000000192000145399'));
  assert.ok(!ibanJePlatny('CZ650800000019200014539'));
  assert.equal(ibanPoSkupinach('CZ6508000000192000145399'), 'CZ65 0800 0000 1920 0014 5399');
});

test('číslo účtu: špatný tvar nebo kontrolní součet je chyba', () => {
  assert.throws(() => rozlozUcet('2970297/100'), /tvar/);
  assert.throws(() => rozlozUcet('abc'), /tvar/);
  assert.throws(() => rozlozUcet('2970298/0100'), /kontrolním součtem/);
});

test('variabilní symbol: RRMMDD + 4 náhodné číslice, první nenulová, 10 číslic', () => {
  const vs = variabilniSymbol(new Date('2026-11-05T10:00:00Z'), () => 4321);
  assert.equal(vs, '2611054321');
  for (let i = 0; i < 500; i++) {
    const v = variabilniSymbol(new Date('2026-11-05T10:00:00Z'));
    assert.match(v, /^261105[1-9]\d{3}$/);
  }
  // datum se bere z Prahy
  assert.equal(variabilniSymbol(new Date('2026-12-31T23:30:00Z'), () => 1000), '2701011000');
});

test('text do SPD: bez diakritiky, velká písmena, bez nepovolených znaků a hvězdičky', () => {
  assert.equal(textProSpd('Bc. Václav Kodeš', 35), 'BC. VACLAV KODES');
  assert.equal(textProSpd('Seminář', 60), 'SEMINAR');
  assert.equal(textProSpd('A*B', 60), 'A B');
  assert.equal(textProSpd('x'.repeat(100), 35).length, 35);
});

// Nezávislý kontrolor podle standardu QR Platba 1.2 (tabulka 1 a 2, kapitola 5).
function zkontrolujPodleStandardu(spd) {
  assert.ok(spd.startsWith('SPD*1.0*'), 'hlavička SPD*1.0*');
  assert.ok(!spd.endsWith('*'), 'poslední atribut bez koncové hvězdičky (jako v příkladech standardu)');
  const atributy = spd.slice('SPD*1.0*'.length).split('*');
  const klice = atributy.map((a) => a.slice(0, a.indexOf(':')));
  assert.equal(new Set(klice).size, klice.length, 'klíče se neopakují');
  const m = Object.fromEntries(atributy.map((a) => [a.slice(0, a.indexOf(':')), a.slice(a.indexOf(':') + 1)]));
  for (const [k, v] of Object.entries(m)) {
    assert.match(k, /^[A-Z-]+$/, `klíč ${k} jen z A-Z a pomlčky`);
    assert.ok(v.length > 0 && v === v.trim(), `hodnota ${k} není prázdná ani obklopená mezerami`);
    assert.ok(/^[0-9A-Z $%+\-./:]*$/.test(v), `hodnota ${k} jen ze znaků pro alfanumerický QR`);
  }
  assert.ok(m.ACC && m.ACC.length <= 46 && ibanJePlatny(m.ACC), 'ACC je platný IBAN do 46 znaků');
  assert.match(m.AM, /^\d{1,9}\.\d{2}$|^\d{1,7}\.\d{1,2}$/, 'AM s tečkou a max. 2 desetinnými místy');
  assert.ok(m.AM.length <= 10, 'AM max. 10 znaků');
  assert.equal(m.CC, 'CZK');
  assert.match(m['X-VS'], /^\d{1,10}$/);
  if (m.RN) assert.ok(m.RN.length <= 35);
  if (m.MSG) assert.ok(m.MSG.length <= 60);
  return m;
}

test('řetězec QR Platby odpovídá standardu a zadání', () => {
  const spd = spdRetezec({ iban: 'CZ6508000000192000145399', castka: 3590, vs: '2611054321', prijemce: 'Bc. Václav Kodeš', zprava: 'SEMINAR' });
  assert.equal(spd, 'SPD*1.0*ACC:CZ6508000000192000145399*AM:3590.00*CC:CZK*X-VS:2611054321*RN:BC. VACLAV KODES*MSG:SEMINAR');
  const m = zkontrolujPodleStandardu(spd);
  assert.equal(m.MSG, 'SEMINAR');
  assert.ok(!/OCD/.test(spd), 'zpráva pro příjemce nikdy neobsahuje OCD');
});

test('spdRetezec odmítne neplatný IBAN, VS a částku', () => {
  assert.throws(() => spdRetezec({ iban: 'CZ00', castka: 1, vs: '1', prijemce: 'A', zprava: 'B' }), /IBAN/);
  assert.throws(() => spdRetezec({ iban: 'CZ6508000000192000145399', castka: 1, vs: '12345678901', prijemce: 'A', zprava: 'B' }), /Variabilní/);
  assert.throws(() => spdRetezec({ iban: 'CZ6508000000192000145399', castka: 0, vs: '1', prijemce: 'A', zprava: 'B' }), /Částka/);
});
