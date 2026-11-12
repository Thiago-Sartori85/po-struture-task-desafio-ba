# Wizard of Oz Prototype – Implementation Plan

**Goal:** Build the four-screen HTML prototype with a hidden "Behind the curtain" panel, as defined in the spec.

**Approach:** Plain ES modules, no build. Business logic in pure functions (tested with `node --test`); simulation in its own module; rendering in `app.js`.

**Stack:** HTML, CSS, JavaScript (ES modules), Node built-in test runner, Playwright for one smoke test (dev only).

**Spec:** `docs/spec/2026-11-12-wizard-of-oz-prototype-design.md`

## Global constraints

- No runtime dependencies, no build step; the page works from any static server (Vercel).
- Fixed banner: `Prototype · Demonstration data (fictional values) · Names from Figure 1 of the challenge`.
- Names from Figure 1: C-TK-1..4, Pump-1..4, Well-1..4, products A–D. Seed values exactly as in spec section 4.
- Status order: Stale → Critical (≤ 20% or ≤ 3 days) → Attention (≤ horizon, default 7) → OK. Stale after 2 simulated hours without a reading.
- Screens never read a tank's hidden consumption.

## Review focus

1. Adding product C to a well that already has A (and A to a well with C) is blocked in both directions.
2. A second tank of a product the well already has does not count as a 4th product.
3. A refill never lowers or inflates the injection rate.
4. A tank with rate 0 (e.g., newly registered) shows no forecast instead of dividing by zero.
5. Typing a capital "O" in a form field does not open the Oz panel.

---

### Task 1: Business logic (`src/logic.js`, `tests/logic.test.js`)

Functions:
- `checkAssociation(state, wellId, tankId) -> { ok, rule, message }` — duplicate, BR-04 (max 3 distinct products), BR-05 (A + C).
- `injectionRate(readings, windowDays = 7) -> number` (L/day; increases excluded).
- `daysTo20(volume, capacity, rate) -> number | null`.
- `tankStatus({ volume, capacity, days, lastReadingAt, now, horizon }) -> 'stale' | 'critical' | 'attention' | 'ok'`.
- `wellConsumption(state, wellId, rates) -> { total, byProduct }`.
- `validateTank(input, existingIds)`, `validateWell(input, existingIds) -> { field: message }`.

- [ ] Write tests for every Review focus item 1–4 plus seed results (C-TK-1 = 5.0 days Attention, C-TK-3 ≈ 2.2 Critical).
- [ ] Implement; `npm test` passes.
- [ ] Commit.

### Task 2: Seed data and simulation (`src/data.js`, `src/oz.js`, `tests/oz.test.js`)

- `createInitialState()` — sites, tanks with 168 hourly readings, wells, Figure 1 associations, clock at hour 168 (Day 8 00:00).
- `advanceHours(state, h)`, `refill(state, tankId)`, `setSensor(state, tankId, on)`, `setProduction(state, wellId, value)`; each appends to `state.events`.

- [ ] Tests: +1 day lowers C-TK-1 by 120 L and keeps rate 120; refill then +1 day keeps rate 120; sensor off for 3 h → Stale.
- [ ] Implement; tests pass. Commit.

### Task 3: Screens (`index.html`, `style.css`, `src/app.js`)

- [ ] Header, banner, site and profile selectors, four tabs as in the spec table.
- [ ] Oz drawer: Shift + O (ignored inside inputs) and `?oz=1`.
- [ ] Guide tab: business rules (BR-01..08) as enforced, meaning of every field and column, what each Oz control simulates, status legend, formulas.
- [ ] Manual check in the browser. Commit.

### Task 4: Smoke test and delivery (`tests/smoke.mjs`, `README.md`, `docs/specification/`)

- [ ] Smoke: four tabs render, Field Technician has no Equipment tab, A + C on Well-2 blocked, +7 days changes C-TK-1 status.
- [ ] Copy Specification.pdf and PNGs to `docs/specification/`.
- [ ] README: context, approach, links (Vercel, Miro, PDF), business rules, field and function guide, 5-step demo, structure, how to test.
- [ ] Commit and push; deploy on Vercel from `main` (static, no build).
