import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, START_HOUR } from '../src/data.js';
import { advanceHours, refill, setSensor, setProduction } from '../src/oz.js';
import { injectionRate, daysTo20, tankStatus } from '../src/logic.js';

const tank = (s, id) => s.tanks.find((t) => t.id === id);
const lastVolume = (t) => t.readings.at(-1).v;
const near = (a, b) => Math.abs(a - b) < 1e-6;

test('seed matches Figure 1 and the spec values', () => {
  const s = createInitialState();
  assert.equal(s.now, START_HOUR);
  assert.deepEqual(s.tanks.filter((t) => t.siteId === 'site-1').map((t) => t.id), ['C-TK-1', 'C-TK-2', 'C-TK-3', 'C-TK-4']);
  assert.equal(lastVolume(tank(s, 'C-TK-1')), 1600);
  assert.ok(near(injectionRate(tank(s, 'C-TK-1').readings), 120));
  const w1 = s.associations.filter((a) => a.wellId === 'Well-1').map((a) => a.tankId).sort();
  assert.deepEqual(w1, ['C-TK-1', 'C-TK-3']);
});

test('+1 day lowers C-TK-1 by 120 L and keeps its rate at 120', () => {
  const s = createInitialState();
  advanceHours(s, 24);
  const t = tank(s, 'C-TK-1');
  assert.ok(near(lastVolume(t), 1480));
  assert.ok(near(injectionRate(t.readings), 120));
  assert.equal(s.now, START_HOUR + 24);
});

test('a refill fills the tank and does not change the rate', () => {
  const s = createInitialState();
  refill(s, 'C-TK-1');
  assert.equal(lastVolume(tank(s, 'C-TK-1')), 5000);
  advanceHours(s, 24);
  assert.ok(near(injectionRate(tank(s, 'C-TK-1').readings), 120));
});

test('sensor off for 3 hours makes the tank stale; resume clears it', () => {
  const s = createInitialState();
  setSensor(s, 'C-TK-2', false);
  advanceHours(s, 3);
  const t = tank(s, 'C-TK-2');
  const status = (x) => tankStatus({
    volume: lastVolume(x), capacity: x.capacity, days: 30,
    lastReadingAt: x.readings.at(-1).t, now: s.now, horizon: 7,
  });
  assert.equal(status(t), 'stale');
  setSensor(s, 'C-TK-2', true);
  advanceHours(s, 1);
  assert.equal(status(t), 'ok');
  assert.ok(near(lastVolume(t), 2400 - 60 * 4 / 24), 'tank kept consuming while the sensor was off');
});

test('+7 days moves C-TK-1 from attention to critical', () => {
  const s = createInitialState();
  advanceHours(s, 24 * 7);
  const t = tank(s, 'C-TK-1');
  const days = daysTo20(lastVolume(t), t.capacity, injectionRate(t.readings));
  assert.equal(days, 0);
});

test('production change and events are recorded', () => {
  const s = createInitialState();
  setProduction(s, 'Well-1', 200);
  assert.equal(s.wells.find((w) => w.id === 'Well-1').production, 200);
  assert.ok(s.events.length > 0);
});
