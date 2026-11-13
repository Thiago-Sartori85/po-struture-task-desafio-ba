# Wizard of Oz Prototype – Design Spec

**Date:** 2026-11-12 · **Status:** for review · **Source:** Business Analyst challenge (Desafio BA) and the project specification in `docs/specification/Specification.pdf`

## 1. Intent

| | |
| --- | --- |
| **Outcome** | A simple, visual HTML prototype of the four lo-fi screens that the evaluator opens in a browser and sees working. |
| **Audience** | The challenge evaluator, alone or during a presentation. |
| **Success** | In a few minutes, with nothing to install, the evaluator sees the autonomy forecast react to data and the business rules (max 3 products, A + C blocked, Sales-only registry) enforced. |
| **Technique** | Wizard of Oz: there is no real backend. A hidden "Behind the curtain" panel plays the external real-time data system; the product logic on the screens is real. |

Decisions agreed during design:

- Values are **fictional demonstration data**, labelled on every screen. Tank, pump, well and product names come from Figure 1 of the challenge.
- The Oz panel is **hidden by default** and opens with a keyboard shortcut or a documented URL parameter.
- Stack: **plain HTML, CSS and JavaScript, no build, no dependencies**, deployed on Vercel.
- UI and documents in **English**, consistent with the specification.

## 2. Screens and behaviour

One page. Header: app name, **site selector**, **profile selector** (Sales / Field Technician). Fixed banner: *"Prototype · Demonstration data (fictional values) · Names from Figure 1 of the challenge"*.

| Screen | Behaviour | Traces to |
| --- | --- | --- |
| **1. Autonomy** | Tanks of the selected site sorted by days to 20%, lowest first: product, volume, level bar, injection rate, days to 20%, status badge. Reorder horizon (days) editable. | US-04, US-05, FR-07, FR-09, FR-10 |
| **2. Equipment** | Register a tank (ID, product, capacity, material, pump) or a well (ID, production). New items appear immediately. Tab visible only to Sales. | US-01, US-02, FR-02, FR-03, BR-01 |
| **3. Associations** | Pick a well, see its tanks, add or remove a tank. Blocks product A + C on one well and a 4th product, showing the rule and disabling the button. Every change is written to an audit log (user profile, simulated time, action). | US-03, FR-05, BR-02–05, NFR-04 |
| **4. Consumption per well** | Per well: products, production, estimated consumption per product and total, rule check. Well-1 starts with the A + C conflict shown in Figure 1. | US-06, FR-08 |

**Status rules** (thresholds are proposed parameters, labelled as such on screen):

| Status | Condition, checked in this order |
| --- | --- |
| Stale | No reading in the last 2 simulated hours; forecast hidden (NFR-05) |
| Critical | Volume at or below 20% of capacity, or days to 20% ≤ 3 |
| Attention | Days to 20% ≤ reorder horizon (default 7) |
| OK | Otherwise |

## 3. Behind the curtain (Wizard of Oz panel)

Opens with **Shift + O** or `index.html?oz=1`; closes with the same shortcut or a close button. Title: *"Behind the curtain · simulating the real-time data system"*.

| Control | Simulates | Effect on the screens |
| --- | --- | --- |
| Advance time: +1 h, +1 day, +7 days | Hourly readings arriving | Volumes fall; days to 20% and statuses update |
| Refill tank (select tank) | A chemical delivery | Volume returns to capacity; the jump is detected as a refill and excluded from the injection rate (A3) |
| Stop sensor / Resume (select tank) | Missing data | Tank turns Stale while stopped; readings resume on Resume |
| Well production (per well, number input) | Production change | Consumption split per well recalculated (A1) |
| Reset demo | — | Back to the initial state |

An **event log** lists what the simulated data system sent, e.g. `Day 8 07:00 · C-TK-2 · 2,380 L`.

**Key rule:** the panel holds a hidden daily consumption per tank, but **the screens never read it**. They compute the injection rate only from volume readings, as the real system would. The simulation is deterministic: no randomness, so the same clicks always give the same result.

## 4. Demonstration data and formulas

Units: volume in litres (L), production in m³/day. All values fictional.

**Site 1 – Figure 1**

| Tank | Product | Pump | Capacity | Initial volume | Hidden consumption | Initial result |
| --- | --- | --- | --- | --- | --- | --- |
| C-TK-1 | A | Pump-1 | 5,000 L | 1,600 L | 120 L/day | 5.0 days · Attention |
| C-TK-2 | B | Pump-2 | 3,000 L | 2,400 L | 60 L/day | 30.0 days · OK |
| C-TK-3 | C | Pump-3 | 4,000 L | 1,000 L | 90 L/day | 2.2 days · Critical |
| C-TK-4 | D | Pump-4 | 2,000 L | 1,500 L | 40 L/day | 27.5 days · OK |

| Well | Production | Initial associations |
| --- | --- | --- |
| Well-1 | 120 m³/day | C-TK-1 (A), C-TK-3 (C) – rule conflict |
| Well-2 | 80 m³/day | C-TK-2 (B), C-TK-3 (C), C-TK-4 (D, flowline) |
| Well-3 | 60 m³/day | C-TK-1 (A) |
| Well-4 | 100 m³/day | C-TK-1 (A), C-TK-2 (B), C-TK-4 (D, flowline) |

**Site 2 – filter demonstration:** tank TK-201 (product B, 2,000 L capacity, 1,200 L, 30 L/day) feeding Well-201 (50 m³/day).

Construction materials are shown as fictional labels. The simulated clock starts at Day 8, 00:00, with 7 days (168 hourly readings) of history generated from the hidden consumption so the injection rate exists from the first view.

**Formulas** (same as section 7.4 of the specification):

- Injection rate (L/day) = total volume drop over the last 7 days of readings ÷ days covered, where any reading-to-reading increase counts as a refill and is excluded.
- Well consumption (L/day) = Σ over the tanks feeding the well of: tank injection rate × (well production ÷ total production of the wells that tank feeds).
- Days to 20% = (current volume − 0.20 × capacity) ÷ injection rate; 0 when already at or below 20%; not shown when the rate is 0 or the tank is Stale.

**Validation on registration and association:** required fields; capacity > 0; 0 ≤ volume ≤ capacity; production ≥ 0; ID unique within the site; a tank cannot be associated twice with the same well. Errors appear inline next to the field.

## 5. Architecture

| File | Responsibility |
| --- | --- |
| `index.html` | Page shell, banner, header, tab containers, Oz panel container |
| `style.css` | Visual style |
| `src/data.js` | Seed data and history generation |
| `src/logic.js` | Pure functions: rules, formulas, status. No DOM access |
| `src/oz.js` | Simulation: clock, readings, refill, sensor, production, reset |
| `src/app.js` | Rendering, profile and site switching, forms, audit log |
| `tests/logic.test.js` | Unit tests with `node --test` |
| `tests/smoke.spec.js` | Browser smoke test with Playwright (dev only) |

ES modules loaded directly by the browser. State lives in memory only; reloading the page resets the demo.

## 6. Testing

- **Unit (`node --test`):** BR-04, BR-05, duplicate association, injection rate with and without refill, consumption split, days to 20% (normal, at 20%, zero rate), status thresholds and order, stale detection, validation rules.
- **Smoke (Playwright):** loads the page, opens the four tabs, confirms the Field Technician cannot see Equipment, tries A + C on Well-2 and sees it blocked, advances time in the Oz panel and sees C-TK-1 change status.

## 7. Repository and delivery

```
index.html · style.css · src/ · tests/
docs/specification/   Specification.pdf, prototype PNGs, roadmap PNG
docs/spec/ · docs/plan/
README.md
```

README: challenge context, approach, links (Vercel prototype, Miro project route board, specification PDF), a 5-step demo script using the Oz panel, repository structure, how to run tests. Deployed on Vercel from `main` (static, no build); every push publishes a new version.

## 8. Out of scope

Real backend or API, persistence across reloads, login and real authentication, registering sites and products, mobile-specific layout beyond a readable responsive page, editing or deleting registered equipment, ERP or logistics integration.
