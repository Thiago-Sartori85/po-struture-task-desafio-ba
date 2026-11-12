// Business rules and formulas. Pure functions: no DOM, no simulation state.
// Traceability: BR = business rule, FR = functional requirement (see docs/specification).

export const MAX_PRODUCTS_PER_WELL = 3; // BR-04
export const INCOMPATIBLE_PRODUCTS = [['A', 'C']]; // BR-05
export const REORDER_LIMIT = 0.2; // BR-07: autonomy is counted until 20% of capacity
export const CRITICAL_DAYS = 3; // proposed parameter
export const DEFAULT_HORIZON_DAYS = 7; // proposed parameter, editable on screen
export const STALE_AFTER_HOURS = 2; // proposed parameter (NFR-05)
export const RATE_WINDOW_DAYS = 7;

const tankById = (state, id) => state.tanks.find((t) => t.id === id);

/** Distinct products currently injected into a well. */
export function productsOnWell(state, wellId) {
  const products = state.associations
    .filter((a) => a.wellId === wellId)
    .map((a) => tankById(state, a.tankId)?.product)
    .filter(Boolean);
  return [...new Set(products)];
}

/** BR-04, BR-05 and duplicate check before saving a tank–well association (FR-05). */
export function checkAssociation(state, wellId, tankId) {
  const tank = tankById(state, tankId);
  if (state.associations.some((a) => a.wellId === wellId && a.tankId === tankId)) {
    return { ok: false, rule: 'DUPLICATE', message: 'This tank is already associated to this well.' };
  }
  const current = productsOnWell(state, wellId);
  for (const [p, q] of INCOMPATIBLE_PRODUCTS) {
    const clash = (tank.product === p && current.includes(q)) || (tank.product === q && current.includes(p));
    if (clash) {
      return {
        ok: false,
        rule: 'BR-05',
        message: `Blocked: products ${p} and ${q} cannot be applied to the same well (BR-05).`,
      };
    }
  }
  if (!current.includes(tank.product) && current.length >= MAX_PRODUCTS_PER_WELL) {
    return {
      ok: false,
      rule: 'BR-04',
      message: `Blocked: a well cannot receive more than ${MAX_PRODUCTS_PER_WELL} chemical products (BR-04).`,
    };
  }
  return { ok: true, rule: null, message: '' };
}

/** Wells that break BR-04 or BR-05 (e.g., Well-1 in Figure 1). */
export function ruleConflicts(state, wellId) {
  const products = productsOnWell(state, wellId);
  const conflicts = [];
  for (const [p, q] of INCOMPATIBLE_PRODUCTS) {
    if (products.includes(p) && products.includes(q)) conflicts.push('BR-05');
  }
  if (products.length > MAX_PRODUCTS_PER_WELL) conflicts.push('BR-04');
  return conflicts;
}

/**
 * FR-07 – injection rate in L/day from volume readings [{ t: hour, v: litres }].
 * Uses the last RATE_WINDOW_DAYS; any increase between readings is a refill and is excluded.
 */
export function injectionRate(readings, windowDays = RATE_WINDOW_DAYS) {
  if (readings.length < 2) return 0;
  const lastT = readings.at(-1).t;
  const recent = readings.filter((r) => r.t >= lastT - windowDays * 24);
  const days = (lastT - recent[0].t) / 24;
  if (days <= 0) return 0;
  let drop = 0;
  for (let i = 1; i < recent.length; i += 1) {
    drop += Math.max(0, recent[i - 1].v - recent[i].v);
  }
  return drop / days;
}

/** FR-09 – days until the tank reaches 20% of capacity. null = no forecast (no consumption measured). */
export function daysTo20(volume, capacity, rate) {
  const usable = volume - REORDER_LIMIT * capacity;
  if (usable <= 0) return 0;
  if (!(rate > 0)) return null;
  return usable / rate;
}

/** Status shown on the Autonomy screen. Order matters: stale, critical, attention, ok. */
export function tankStatus({ volume, capacity, days, lastReadingAt, now, horizon = DEFAULT_HORIZON_DAYS }) {
  if (now - lastReadingAt > STALE_AFTER_HOURS) return 'stale';
  if (volume <= REORDER_LIMIT * capacity) return 'critical';
  if (days === null) return 'ok';
  if (days <= CRITICAL_DAYS) return 'critical';
  if (days <= horizon) return 'attention';
  return 'ok';
}

/**
 * FR-08 – estimated consumption of a well (assumption A1): each tank's rate is split
 * among the wells it feeds in proportion to their production.
 * rates: { [tankId]: L/day }
 */
export function wellConsumption(state, wellId, rates) {
  const byProduct = {};
  let total = 0;
  const well = state.wells.find((w) => w.id === wellId);
  for (const a of state.associations.filter((x) => x.wellId === wellId)) {
    const tank = tankById(state, a.tankId);
    const fed = state.associations
      .filter((x) => x.tankId === a.tankId)
      .map((x) => state.wells.find((w) => w.id === x.wellId));
    const totalProduction = fed.reduce((sum, w) => sum + w.production, 0);
    const share = totalProduction > 0 ? well.production / totalProduction : 0;
    const value = (rates[a.tankId] ?? 0) * share;
    byProduct[tank.product] = (byProduct[tank.product] ?? 0) + value;
    total += value;
  }
  return { total, byProduct };
}

const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

/** Registration validation for a tank (FR-02). Returns { field: message }, empty when valid. */
export function validateTank(input, existingIds) {
  const errors = {};
  const id = (input.id ?? '').trim();
  if (!id) errors.id = 'Tank ID is required.';
  else if (existingIds.includes(id)) errors.id = 'This ID already exists on this site.';
  if (!input.product) errors.product = 'Choose a product.';
  const capacity = num(input.capacity);
  const volume = num(input.volume);
  if (!(capacity > 0)) errors.capacity = 'Capacity must be greater than 0.';
  if (Number.isNaN(volume) || volume < 0) errors.volume = 'Volume must be 0 or more.';
  else if (capacity > 0 && volume > capacity) errors.volume = 'Volume cannot exceed capacity.';
  if (!(input.material ?? '').trim()) errors.material = 'Construction material is required.';
  if (!(input.pump ?? '').trim()) errors.pump = 'Pump is required.';
  return errors;
}

/** Registration validation for a well (FR-03). */
export function validateWell(input, existingIds) {
  const errors = {};
  const id = (input.id ?? '').trim();
  if (!id) errors.id = 'Well ID is required.';
  else if (existingIds.includes(id)) errors.id = 'This ID already exists on this site.';
  const production = num(input.production);
  if (Number.isNaN(production) || production < 0) errors.production = 'Production must be 0 or more.';
  return errors;
}
