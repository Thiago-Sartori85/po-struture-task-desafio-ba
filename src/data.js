// Demonstration data. ALL VALUES ARE FICTIONAL.
// Names (tanks, pumps, wells, products and the tank–well links of Site 1) come from Figure 1 of the challenge.

export const START_HOUR = 168; // Day 8, 00:00 – after 7 days (168 hourly readings) of history
export const PRODUCTS = ['A', 'B', 'C', 'D'];
export const MATERIALS = ['Carbon steel', 'Stainless steel', 'HDPE', 'Fiberglass']; // fictional labels

const SITES = [
  { id: 'site-1', name: 'Site 1' },
  { id: 'site-2', name: 'Site 2' },
];

// hiddenRate = what the tank really consumes (L/day). Only the Oz simulation reads it.
const TANKS = [
  { id: 'C-TK-1', siteId: 'site-1', product: 'A', pump: 'Pump-1', capacity: 5000, volume: 1600, hiddenRate: 120, material: 'Carbon steel' },
  { id: 'C-TK-2', siteId: 'site-1', product: 'B', pump: 'Pump-2', capacity: 3000, volume: 2400, hiddenRate: 60, material: 'Stainless steel' },
  { id: 'C-TK-3', siteId: 'site-1', product: 'C', pump: 'Pump-3', capacity: 4000, volume: 1000, hiddenRate: 90, material: 'HDPE' },
  { id: 'C-TK-4', siteId: 'site-1', product: 'D', pump: 'Pump-4', capacity: 2000, volume: 1500, hiddenRate: 40, material: 'Fiberglass' },
  { id: 'TK-201', siteId: 'site-2', product: 'B', pump: 'Pump-201', capacity: 2000, volume: 1200, hiddenRate: 30, material: 'HDPE' },
];

const WELLS = [
  { id: 'Well-1', siteId: 'site-1', production: 120 },
  { id: 'Well-2', siteId: 'site-1', production: 80 },
  { id: 'Well-3', siteId: 'site-1', production: 60 },
  { id: 'Well-4', siteId: 'site-1', production: 100 },
  { id: 'Well-201', siteId: 'site-2', production: 50 },
];

// Figure 1: A -> Wells 1, 3, 4 · B -> Wells 2, 4 · C -> Wells 1, 2 · D -> Wells 2, 4 (on the flowline)
const ASSOCIATIONS = [
  { tankId: 'C-TK-1', wellId: 'Well-1' },
  { tankId: 'C-TK-1', wellId: 'Well-3' },
  { tankId: 'C-TK-1', wellId: 'Well-4' },
  { tankId: 'C-TK-2', wellId: 'Well-2' },
  { tankId: 'C-TK-2', wellId: 'Well-4' },
  { tankId: 'C-TK-3', wellId: 'Well-1' },
  { tankId: 'C-TK-3', wellId: 'Well-2' },
  { tankId: 'C-TK-4', wellId: 'Well-2', flowline: true },
  { tankId: 'C-TK-4', wellId: 'Well-4', flowline: true },
  { tankId: 'TK-201', wellId: 'Well-201' },
];

/** Hourly readings for the 7 days before START_HOUR, ending at the tank's initial volume. */
function history(volume, hiddenRate) {
  return Array.from({ length: START_HOUR + 1 }, (_, t) => ({
    t,
    v: volume + (hiddenRate * (START_HOUR - t)) / 24,
  }));
}

export function createInitialState() {
  return {
    now: START_HOUR,
    horizon: 7,
    sites: SITES.map((s) => ({ ...s })),
    tanks: TANKS.map(({ volume, ...t }) => ({
      ...t,
      level: volume, // true level, known only to the simulation
      sensorOn: true,
      readings: history(volume, t.hiddenRate),
    })),
    wells: WELLS.map((w) => ({ ...w })),
    associations: ASSOCIATIONS.map((a) => ({ flowline: false, ...a })),
    audit: [],
    events: [],
  };
}
