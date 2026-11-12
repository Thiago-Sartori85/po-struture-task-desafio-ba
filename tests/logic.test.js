import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAssociation, injectionRate, daysTo20, tankStatus,
  wellConsumption, validateTank, validateWell,
} from '../src/logic.js';

const tank = (id, product, siteId = 's1') => ({ id, product, siteId });
const baseState = () => ({
  tanks: [tank('TA', 'A'), tank('TA2', 'A'), tank('TB', 'B'), tank('TC', 'C'), tank('TD', 'D')],
  wells: [{ id: 'W1', siteId: 's1', production: 100 }, { id: 'W2', siteId: 's1', production: 50 }],
  associations: [],
});
const link = (s, tankId, wellId) => s.associations.push({ tankId, wellId });

test('BR-05: product C is blocked on a well that has product A', () => {
  const s = baseState(); link(s, 'TA', 'W1');
  const r = checkAssociation(s, 'W1', 'TC');
  assert.equal(r.ok, false);
  assert.equal(r.rule, 'BR-05');
});

test('BR-05: product A is blocked on a well that has product C', () => {
  const s = baseState(); link(s, 'TC', 'W1');
  const r = checkAssociation(s, 'W1', 'TA');
  assert.equal(r.ok, false);
  assert.equal(r.rule, 'BR-05');
});

test('BR-04: a 4th distinct product is blocked', () => {
  const s = baseState(); link(s, 'TA', 'W1'); link(s, 'TB', 'W1'); link(s, 'TD', 'W1');
  const extra = { id: 'TE', product: 'E', siteId: 's1' }; s.tanks.push(extra);
  const r = checkAssociation(s, 'W1', 'TE');
  assert.equal(r.ok, false);
  assert.equal(r.rule, 'BR-04');
});

test('BR-04: a second tank of a product already on the well is allowed', () => {
  const s = baseState(); link(s, 'TA', 'W1'); link(s, 'TB', 'W1'); link(s, 'TD', 'W1');
  assert.equal(checkAssociation(s, 'W1', 'TA2').ok, true);
});

test('the same tank cannot be associated twice to one well', () => {
  const s = baseState(); link(s, 'TB', 'W1');
  const r = checkAssociation(s, 'W1', 'TB');
  assert.equal(r.ok, false);
  assert.equal(r.rule, 'DUPLICATE');
});

test('a valid association is allowed', () => {
  assert.deepEqual(checkAssociation(baseState(), 'W1', 'TB'), { ok: true, rule: null, message: '' });
});

const linear = (start, perDay, hours, t0 = 0) =>
  Array.from({ length: hours + 1 }, (_, i) => ({ t: t0 + i, v: start - (perDay * i) / 24 }));

test('injection rate equals the daily drop of volume', () => {
  assert.ok(Math.abs(injectionRate(linear(2440, 120, 168)) - 120) < 1e-9);
});

test('a refill is excluded from the injection rate', () => {
  const r = linear(1000, 120, 48);
  const last = r.at(-1);
  r.push({ t: last.t, v: 5000 });
  for (let i = 1; i <= 24; i += 1) r.push({ t: last.t + i, v: 5000 - (120 * i) / 24 });
  assert.ok(Math.abs(injectionRate(r) - 120) < 1e-9);
});

test('injection rate only uses the last 7 days', () => {
  const old = linear(9000, 500, 47);
  const recent = linear(3000, 100, 168, 48);
  assert.ok(Math.abs(injectionRate([...old, ...recent]) - 100) < 1e-9);
});

test('injection rate is 0 with fewer than two readings', () => {
  assert.equal(injectionRate([{ t: 0, v: 100 }]), 0);
  assert.equal(injectionRate([]), 0);
});

test('days to 20%: normal, at the limit and with zero rate', () => {
  assert.equal(daysTo20(1600, 5000, 120), 5);
  assert.equal(daysTo20(1000, 5000, 120), 0);
  assert.equal(daysTo20(800, 5000, 120), 0);
  assert.equal(daysTo20(1600, 5000, 0), null);
});

test('seed results: C-TK-3 is critical, C-TK-1 attention, C-TK-2 ok', () => {
  const base = { lastReadingAt: 168, now: 168, horizon: 7 };
  const d3 = daysTo20(1000, 4000, 90);
  assert.ok(Math.abs(d3 - 2.2222) < 1e-3);
  assert.equal(tankStatus({ ...base, volume: 1000, capacity: 4000, days: d3 }), 'critical');
  assert.equal(tankStatus({ ...base, volume: 1600, capacity: 5000, days: 5 }), 'attention');
  assert.equal(tankStatus({ ...base, volume: 2400, capacity: 3000, days: 30 }), 'ok');
});

test('status: stale wins over critical; below 20% is critical; no rate is ok', () => {
  assert.equal(tankStatus({ volume: 500, capacity: 4000, days: 0, lastReadingAt: 100, now: 103, horizon: 7 }), 'stale');
  assert.equal(tankStatus({ volume: 500, capacity: 4000, days: 0, lastReadingAt: 103, now: 103, horizon: 7 }), 'critical');
  assert.equal(tankStatus({ volume: 3000, capacity: 4000, days: null, lastReadingAt: 103, now: 103, horizon: 7 }), 'ok');
  assert.equal(tankStatus({ volume: 3000, capacity: 4000, days: 8, lastReadingAt: 101, now: 103, horizon: 7 }), 'ok');
});

test('well consumption splits each tank rate by production', () => {
  const s = baseState(); link(s, 'TA', 'W1'); link(s, 'TA', 'W2'); link(s, 'TB', 'W1');
  const c = wellConsumption(s, 'W1', { TA: 90, TB: 30 });
  assert.equal(c.byProduct.A, 60);
  assert.equal(c.byProduct.B, 30);
  assert.equal(c.total, 90);
  assert.equal(wellConsumption(s, 'W2', { TA: 90, TB: 30 }).total, 30);
});

test('validation of a tank', () => {
  const ok = { id: 'X1', product: 'A', capacity: '1000', volume: '500', material: 'HDPE', pump: 'P1' };
  assert.deepEqual(validateTank(ok, []), {});
  assert.ok(validateTank({ ...ok, id: '' }, []).id);
  assert.ok(validateTank(ok, ['X1']).id);
  assert.ok(validateTank({ ...ok, capacity: '0' }, []).capacity);
  assert.ok(validateTank({ ...ok, volume: '1500' }, []).volume);
  assert.ok(validateTank({ ...ok, volume: '-1' }, []).volume);
});

test('validation of a well', () => {
  assert.deepEqual(validateWell({ id: 'W9', production: '0' }, []), {});
  assert.ok(validateWell({ id: 'W9', production: '-5' }, []).production);
  assert.ok(validateWell({ id: 'W9', production: '10' }, ['W9']).id);
});
