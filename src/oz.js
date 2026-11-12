// "Behind the curtain": simulates the external real-time data system (Wizard of Oz).
// It is the only module that reads a tank's hidden consumption. Deterministic: no randomness.

const pad = (n) => String(n).padStart(2, '0');
export const formatTime = (t) => `Day ${Math.floor(t / 24) + 1} ${pad(t % 24)}:00`;
export const litres = (v) => `${Math.round(v).toLocaleString('en-US')} L`;

function log(state, text) {
  state.events.unshift(`${formatTime(state.now)} · ${text}`);
  if (state.events.length > 60) state.events.length = 60;
}

/** Hourly readings arrive. Tanks keep consuming even when their sensor is off. */
export function advanceHours(state, hours) {
  for (let i = 0; i < hours; i += 1) {
    state.now += 1;
    for (const tank of state.tanks) {
      tank.level = Math.max(0, tank.level - tank.hiddenRate / 24);
      if (tank.sensorOn) tank.readings.push({ t: state.now, v: tank.level });
    }
  }
  for (const tank of state.tanks) {
    log(state, tank.sensorOn ? `${tank.id} · ${litres(tank.level)}` : `${tank.id} · no reading (sensor stopped)`);
  }
}

/** A chemical delivery: the tank is filled to capacity. */
export function refill(state, tankId) {
  const tank = state.tanks.find((t) => t.id === tankId);
  tank.level = tank.capacity;
  if (tank.sensorOn) tank.readings.push({ t: state.now, v: tank.level });
  log(state, `Refill · ${tank.id} · ${litres(tank.level)}`);
}

/** Stop or resume the readings of one tank (missing data). */
export function setSensor(state, tankId, on) {
  const tank = state.tanks.find((t) => t.id === tankId);
  tank.sensorOn = on;
  log(state, `${tank.id} · sensor ${on ? 'resumed' : 'stopped'}`);
}

/** Individual well production reported by the real-time system (m³/day). */
export function setProduction(state, wellId, value) {
  const well = state.wells.find((w) => w.id === wellId);
  well.production = Math.max(0, Number(value) || 0);
  log(state, `${well.id} · production ${well.production} m³/day`);
}
