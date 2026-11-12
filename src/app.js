// Screens of the prototype. Reads volume readings and registry data; never a tank's hidden consumption.
import { createInitialState, PRODUCTS, MATERIALS } from './data.js';
import {
  checkAssociation, injectionRate, daysTo20, tankStatus, wellConsumption, productsOnWell,
  ruleConflicts, validateTank, validateWell, MAX_PRODUCTS_PER_WELL, CRITICAL_DAYS, STALE_AFTER_HOURS,
} from './logic.js';
import { advanceHours, refill, setSensor, setProduction, formatTime, litres } from './oz.js';

let state = createInitialState();
const ui = {
  site: 'site-1',
  profile: 'sales',
  tab: 'autonomy',
  wellId: 'Well-2',
  addTankId: '',
  ozOpen: new URLSearchParams(location.search).get('oz') === '1',
  ozTankId: 'C-TK-1',
  tankErrors: {},
  wellErrors: {},
  drafts: { tank: {}, well: {} }, // what was typed, kept when validation fails
  toast: '',
};

const PROFILES = { sales: 'Sales', field: 'Field Technician' };
const TABS = [
  { id: 'autonomy', label: 'Autonomy' },
  { id: 'equipment', label: 'Equipment', salesOnly: true },
  { id: 'associations', label: 'Associations' },
  { id: 'consumption', label: 'Consumption per well' },
  { id: 'guide', label: 'Guide' },
];
const STATUS_LABEL = { ok: 'OK', attention: 'Attention', critical: 'Critical', stale: 'Stale' };

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n1 = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const siteTanks = () => state.tanks.filter((t) => t.siteId === ui.site);
const siteWells = () => state.wells.filter((w) => w.siteId === ui.site);
const tankById = (id) => state.tanks.find((t) => t.id === id);

/** Everything the Autonomy screen shows for one tank, computed from readings only. */
function tankView(tank) {
  const last = tank.readings.at(-1);
  const volume = last.v;
  const rate = injectionRate(tank.readings);
  const days = daysTo20(volume, tank.capacity, rate);
  const status = tankStatus({ volume, capacity: tank.capacity, days, lastReadingAt: last.t, now: state.now, horizon: state.horizon });
  return { tank, volume, rate, days, status, pct: volume / tank.capacity };
}

function rates() {
  return Object.fromEntries(state.tanks.map((t) => [t.id, injectionRate(t.readings)]));
}

function audit(action) {
  state.audit.unshift({ at: formatTime(state.now), profile: PROFILES[ui.profile], action });
}

/* ---------- Screens ---------- */

function autonomyScreen() {
  const views = siteTanks().map(tankView).sort((a, b) => {
    if ((a.status === 'stale') !== (b.status === 'stale')) return a.status === 'stale' ? -1 : 1;
    return (a.days ?? Infinity) - (b.days ?? Infinity);
  });
  const count = (s) => views.filter((v) => v.status === s).length;
  const rows = views.map((v) => {
    const stale = v.status === 'stale';
    const days = stale ? '<span class="muted">hidden</span>' : v.days === null ? '<span class="muted">collecting readings</span>' : n1(v.days);
    return `<tr class="row-${v.status}">
      <td><strong>${esc(v.tank.id)}</strong><div class="small muted">${esc(v.tank.pump)}</div></td>
      <td>${esc(v.tank.product)}</td>
      <td><div class="level"><div class="bar ${v.pct <= 0.2 ? 'low' : ''}"><span style="width:${Math.min(100, v.pct * 100)}%"></span></div><small>${Math.round(v.pct * 100)}%</small></div></td>
      <td class="num">${litres(v.volume)} <span class="muted small">/ ${litres(v.tank.capacity)}</span></td>
      <td class="num">${stale ? '<span class="muted">—</span>' : n1(v.rate)}</td>
      <td class="num">${days}</td>
      <td><span class="badge ${v.status}">${STATUS_LABEL[v.status]}</span></td>
    </tr>`;
  }).join('');
  return `
    <h2>Tank autonomy</h2>
    <p class="lead">Days until each tank reaches 20% of its capacity, calculated from the hourly volume readings. Most urgent first.</p>
    <div class="kpis">
      <div class="kpi"><div class="value">${count('critical')}</div><div class="label">Critical (≤ ${CRITICAL_DAYS} days or ≤ 20%)</div></div>
      <div class="kpi"><div class="value">${count('attention')}</div><div class="label">Attention (within the reorder horizon)</div></div>
      <div class="kpi"><div class="value">${count('stale')}</div><div class="label">Stale (no reading for &gt; ${STALE_AFTER_HOURS} h)</div></div>
      <div class="kpi"><div class="value">${views.length}</div><div class="label">Tanks on this site</div></div>
    </div>
    <div class="card">
      <div class="toolbar">
        <h3>Tanks · sorted by days to 20%</h3>
        <label>Reorder horizon (days, proposed)
          <input type="number" min="1" max="60" step="1" value="${state.horizon}" data-change="horizon" aria-label="Reorder horizon in days">
        </label>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Tank</th><th>Product</th><th>Level</th><th class="num">Volume</th><th class="num">Injection rate (L/day)</th><th class="num">Days to 20%</th><th>Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" class="muted">No tanks registered on this site.</td></tr>'}</tbody>
      </table></div>
      <p class="small muted">Dashed line on the level bar = 20% reorder limit (BR-07). Stale = no recent reading, so the forecast is hidden instead of shown wrong (NFR-05).</p>
    </div>`;
}

function field(form, name, label, control, errors) {
  const err = errors[name];
  return `<div class="field"><label for="${form}-${name}">${label}</label>${control.replace('<input', `<input id="${form}-${name}" name="${name}"${err ? ' aria-invalid="true"' : ''}`).replace('<select', `<select id="${form}-${name}" name="${name}"${err ? ' aria-invalid="true"' : ''}`)}${err ? `<span class="error">${esc(err)}</span>` : ''}</div>`;
}

function equipmentScreen() {
  const te = ui.tankErrors;
  const we = ui.wellErrors;
  const tanks = siteTanks().map((t) => `<tr><td>${esc(t.id)}</td><td>${esc(t.product)}</td><td class="num">${litres(t.capacity)}</td><td>${esc(t.material)}</td><td>${esc(t.pump)}</td></tr>`).join('');
  const wells = siteWells().map((w) => `<tr><td>${esc(w.id)}</td><td class="num">${w.production}</td></tr>`).join('');
  return `
    <h2>Equipment registry</h2>
    <p class="lead">Only Sales can register equipment (BR-01). New items are available at once on the other screens.</p>
    ${ui.toast ? `<div class="notice toast">${esc(ui.toast)}</div>` : ''}
    <div class="grid-2">
      <form class="card" data-form="tank" novalidate>
        <h3>New tank</h3>
        <div class="form-grid">
          ${field('tank', 'id', 'Tank ID', '<input type="text" placeholder="e.g. C-TK-5">', te)}
          ${field('tank', 'product', 'Chemical product', `<select><option value="">Choose…</option>${PRODUCTS.map((p) => `<option>${p}</option>`).join('')}</select>`, te)}
          ${field('tank', 'capacity', 'Capacity (L)', '<input type="number" min="1" step="1">', te)}
          ${field('tank', 'volume', 'Current volume (L)', '<input type="number" min="0" step="1">', te)}
          ${field('tank', 'material', 'Construction material', `<select><option value="">Choose…</option>${MATERIALS.map((m) => `<option>${m}</option>`).join('')}</select>`, te)}
          ${field('tank', 'pump', 'Pump', '<input type="text" placeholder="e.g. Pump-5">', te)}
        </div>
        <button class="btn primary" type="submit">Save tank</button>
      </form>
      <form class="card" data-form="well" novalidate>
        <h3>New well</h3>
        ${field('well', 'id', 'Well ID', '<input type="text" placeholder="e.g. Well-5">', we)}
        ${field('well', 'production', 'Production (m³/day, from the real-time system)', '<input type="number" min="0" step="1">', we)}
        <button class="btn primary" type="submit">Save well</button>
      </form>
    </div>
    <div class="grid-2">
      <div class="card"><h3>Tanks on this site</h3><div class="table-wrap"><table>
        <thead><tr><th>ID</th><th>Product</th><th class="num">Capacity</th><th>Material</th><th>Pump</th></tr></thead><tbody>${tanks}</tbody></table></div></div>
      <div class="card"><h3>Wells on this site</h3><div class="table-wrap"><table>
        <thead><tr><th>ID</th><th class="num">Production (m³/day)</th></tr></thead><tbody>${wells}</tbody></table></div></div>
    </div>`;
}

function associationsScreen() {
  const wells = siteWells();
  if (!wells.some((w) => w.id === ui.wellId)) ui.wellId = wells[0]?.id ?? '';
  if (!ui.wellId) return '<h2>Associations</h2><p class="lead">Register a well first.</p>';
  const links = state.associations.filter((a) => a.wellId === ui.wellId);
  const products = productsOnWell(state, ui.wellId);
  const conflicts = ruleConflicts(state, ui.wellId);
  const candidates = siteTanks().filter((t) => !links.some((a) => a.tankId === t.id));
  if (!candidates.some((t) => t.id === ui.addTankId)) ui.addTankId = candidates[0]?.id ?? '';
  const check = ui.addTankId ? checkAssociation(state, ui.wellId, ui.addTankId) : null;
  const current = links.map((a) => {
    const t = tankById(a.tankId);
    return `<li><span><strong>${esc(t.id)}</strong> · Product ${esc(t.product)}${a.flowline ? ' <span class="chip">flowline</span>' : ''}</span>
      <button class="btn small" data-action="unlink" data-tank="${esc(t.id)}">Remove</button></li>`;
  }).join('');
  const log = state.audit.map((e) => `<li><strong>${esc(e.at)}</strong> · ${esc(e.profile)} · ${esc(e.action)}</li>`).join('');
  return `
    <h2>Tank–well associations</h2>
    <p class="lead">Sales and Field Technicians can link tanks to wells (BR-02). The system blocks combinations that break the business rules before saving.</p>
    <div class="grid-2">
      <div class="card">
        <div class="field"><label for="well-pick">Well</label>
          <select id="well-pick" data-change="well">${wells.map((w) => `<option ${w.id === ui.wellId ? 'selected' : ''}>${esc(w.id)}</option>`).join('')}</select></div>
        <h3>Tanks on this well · ${products.length} of ${MAX_PRODUCTS_PER_WELL} products</h3>
        <ul class="list">${current || '<li class="muted">No tank associated.</li>'}</ul>
        ${conflicts.length ? `<div class="notice blocked">This well already breaks ${conflicts.join(', ')} (as shown in Figure 1). Remove one of the products to fix it.</div>` : ''}
      </div>
      <div class="card">
        <h3>Add tank</h3>
        ${candidates.length ? `
          <div class="field"><label for="tank-pick">Tank</label>
            <select id="tank-pick" data-change="add-tank">${candidates.map((t) => `<option value="${esc(t.id)}" ${t.id === ui.addTankId ? 'selected' : ''}>${esc(t.id)} · Product ${esc(t.product)}</option>`).join('')}</select></div>
          <div class="notice ${check.ok ? 'allowed' : 'blocked'}">${check.ok ? 'Allowed: no business rule is broken.' : esc(check.message)}</div>
          <button class="btn primary" data-action="link" ${check.ok ? '' : 'disabled'}>Associate</button>`
          : '<p class="muted">Every tank of this site is already linked to this well.</p>'}
      </div>
    </div>
    <div class="card"><h3>Audit trail (NFR-04)</h3><ul class="list log">${log || '<li class="muted">No change yet.</li>'}</ul></div>`;
}

function consumptionScreen() {
  const r = rates();
  const rows = siteWells().map((w) => {
    const links = state.associations.filter((a) => a.wellId === w.id);
    const productChips = links.map((a) => {
      const t = tankById(a.tankId);
      return `<span class="chip">${esc(t.product)}${a.flowline ? ' (flowline)' : ''}</span>`;
    }).join('') || '<span class="muted">—</span>';
    const c = wellConsumption(state, w.id, r);
    const split = Object.entries(c.byProduct).map(([p, v]) => `${esc(p)}: ${n1(v)}`).join(' · ') || '—';
    const perM3 = w.production > 0 ? n1(c.total / w.production) : '—';
    const conflicts = ruleConflicts(state, w.id);
    return `<tr>
      <td><strong>${esc(w.id)}</strong></td><td>${productChips}</td>
      <td class="num">${w.production}</td><td>${split}</td>
      <td class="num"><strong>${n1(c.total)}</strong></td><td class="num">${perM3}</td>
      <td>${conflicts.length ? `<span class="badge critical">Conflict ${conflicts.join(', ')}</span>` : '<span class="badge ok">OK</span>'}</td>
    </tr>`;
  }).join('');
  return `
    <h2>Estimated consumption per well</h2>
    <p class="lead">Each tank's injection rate is split among the wells it feeds in proportion to their production (assumption A1 – to be validated with field data).</p>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Well</th><th>Products</th><th class="num">Production (m³/day)</th><th>Consumption by product (L/day)</th><th class="num">Total (L/day)</th><th class="num">Chemical per m³ (L/m³)</th><th>Rule check</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
      <p class="small muted">Product D is injected on the flowline of Wells 2 and 4 in Figure 1; whether it counts toward the 3-product limit is an open question for the client.</p>
    </div>`;
}

function guideScreen() {
  return `<div class="guide">
    <h2>How this prototype works</h2>
    <p class="lead">A Wizard of Oz prototype: the screens and business rules are real, but the external real-time data system is simulated by a hidden operator panel, "Behind the curtain".</p>

    <div class="card"><h3>Demo in 5 steps</h3><ol>
      <li><strong>Autonomy:</strong> C-TK-3 is Critical (≈ 2.2 days) and C-TK-1 needs attention (5.0 days).</li>
      <li><strong>Associations:</strong> choose Well-2 and try to add C-TK-1 (product A). It is blocked: Well-2 already has product C (BR-05).</li>
      <li><strong>Profile → Field Technician:</strong> the Equipment tab disappears (BR-01); associations still work (BR-02).</li>
      <li><strong>Shift + O</strong> opens Behind the curtain. Press <em>+7 days</em> and watch the statuses change; refill C-TK-3 and it goes back to OK.</li>
      <li><strong>Stop sensor</strong> on a tank and advance 3 hours: it turns Stale and its forecast is hidden.</li>
    </ol></div>

    <div class="card"><h3>Business rules enforced</h3><div class="table-wrap"><table>
      <thead><tr><th>Rule</th><th>What it says</th><th>Where you see it</th></tr></thead><tbody>
      <tr><td>BR-01</td><td>Only Sales registers equipment</td><td>Equipment tab hidden for Field Technician</td></tr>
      <tr><td>BR-02</td><td>Sales and Field Technicians associate tanks to wells</td><td>Associations screen, both profiles</td></tr>
      <tr><td>BR-03</td><td>A tank feeds many wells; a well receives many products</td><td>Associations, Consumption per well</td></tr>
      <tr><td>BR-04</td><td>Maximum 3 chemical products per well</td><td>Associate button disabled, rule message</td></tr>
      <tr><td>BR-05</td><td>Products A and C never on the same well</td><td>Blocked association; Well-1 conflict flagged</td></tr>
      <tr><td>BR-06</td><td>Equipment belongs to one site; many sites supported</td><td>Site selector filters every screen</td></tr>
      <tr><td>BR-07</td><td>Autonomy counted until 20% of capacity</td><td>Days to 20%, dashed line on the level bar</td></tr>
      <tr><td>BR-08</td><td>Each tank stores one product and has one pump (from Figure 1)</td><td>Tank registry</td></tr>
    </tbody></table></div></div>

    <div class="card"><h3>Fields and columns</h3><div class="table-wrap"><table>
      <thead><tr><th>Field</th><th>Meaning</th></tr></thead><tbody>
      <tr><td>Site</td><td>Production site; filters tanks, wells and associations</td></tr>
      <tr><td>Profile</td><td>User role: Sales or Field Technician (simulated login)</td></tr>
      <tr><td>Simulated time</td><td>Clock of the simulation (Day / hour), moved only by Behind the curtain</td></tr>
      <tr><td>Tank ID · Pump</td><td>Identifier of the chemical tank and its dedicated injection pump</td></tr>
      <tr><td>Product</td><td>Chemical stored in the tank (A, B, C or D)</td></tr>
      <tr><td>Capacity (L)</td><td>Maximum volume of the tank</td></tr>
      <tr><td>Volume (L) · Level</td><td>Last hourly reading from the real-time system, and its share of capacity</td></tr>
      <tr><td>Construction material</td><td>Basic characteristic of the tank (fictional list)</td></tr>
      <tr><td>Injection rate (L/day)</td><td>Average daily volume drop over the last 7 days, refills excluded (FR-07)</td></tr>
      <tr><td>Days to 20%</td><td>Autonomy: days until the tank reaches the reorder limit (FR-09)</td></tr>
      <tr><td>Reorder horizon</td><td>Days ahead Sales wants to be warned (proposed, default 7)</td></tr>
      <tr><td>Production (m³/day)</td><td>Individual well production from the real-time system</td></tr>
      <tr><td>Consumption by product / Total</td><td>Estimated chemical each well receives per day (FR-08, assumption A1)</td></tr>
      <tr><td>Chemical per m³</td><td>Total consumption ÷ production: chemical needed per unit produced (suggested KPI)</td></tr>
      <tr><td>Rule check</td><td>Flags wells that already break BR-04 or BR-05</td></tr>
      <tr><td>Audit trail</td><td>Who changed an association, when and what (NFR-04)</td></tr>
    </tbody></table></div></div>

    <div class="card"><h3>Status legend</h3><table><tbody>
      <tr><td><span class="badge stale">Stale</span></td><td>No reading for more than ${STALE_AFTER_HOURS} hours: forecast hidden (NFR-05)</td></tr>
      <tr><td><span class="badge critical">Critical</span></td><td>At or below 20% of capacity, or ≤ ${CRITICAL_DAYS} days to 20%</td></tr>
      <tr><td><span class="badge attention">Attention</span></td><td>Days to 20% within the reorder horizon</td></tr>
      <tr><td><span class="badge ok">OK</span></td><td>Beyond the horizon</td></tr>
    </tbody></table><p class="small muted">The 3-day, 7-day and 2-hour thresholds are proposed parameters to agree with the client.</p></div>

    <div class="card"><h3>Formulas</h3><ul>
      <li><code>Injection rate = volume drop over the last 7 days ÷ days covered</code> (increases = refills, excluded)</li>
      <li><code>Days to 20% = (volume − 0.20 × capacity) ÷ injection rate</code></li>
      <li><code>Well consumption = Σ tank rate × (well production ÷ production of all wells fed by that tank)</code></li>
    </ul></div>

    <div class="card"><h3>Behind the curtain (Shift + O, or ?oz=1)</h3><div class="table-wrap"><table>
      <thead><tr><th>Control</th><th>What it simulates</th></tr></thead><tbody>
      <tr><td>+1 hour · +1 day · +7 days</td><td>Hourly readings of tank volume arriving from the real-time system</td></tr>
      <tr><td>Refill</td><td>A chemical delivery: the tank is filled to capacity</td></tr>
      <tr><td>Stop / Resume sensor</td><td>Missing data from one tank; the tank keeps consuming meanwhile</td></tr>
      <tr><td>Real consumption (hidden)</td><td>What the tank truly consumes; the screens never read it, they measure it from readings</td></tr>
      <tr><td>Well production</td><td>Production reported for each well; changes the consumption split</td></tr>
      <tr><td>Reset demo</td><td>Back to the initial state (reloading the page does the same)</td></tr>
    </tbody></table></div></div>

    <div class="card"><h3>Real vs simulated</h3><ul>
      <li><strong>Real:</strong> business rules, formulas, statuses, permissions by profile, validation, audit trail.</li>
      <li><strong>Simulated:</strong> the real-time data system, login, and all numbers (fictional). Data lives only in this browser tab.</li>
    </ul></div>
  </div>`;
}

function ozPanel() {
  const tanks = siteTanks();
  if (!tanks.some((t) => t.id === ui.ozTankId)) ui.ozTankId = tanks[0]?.id ?? '';
  const t = tankById(ui.ozTankId);
  const wells = siteWells().map((w) => `<div class="row"><label style="width:90px">${esc(w.id)}</label>
    <input type="number" min="0" step="1" value="${w.production}" data-change="production" data-well="${esc(w.id)}" aria-label="${esc(w.id)} production"> m³/day</div>`).join('');
  const events = state.events.map((e) => `<li>${esc(e)}</li>`).join('');
  return `
    <button class="btn small close" data-action="toggle-oz" aria-label="Close">Close</button>
    <span class="tag">Wizard of Oz</span>
    <h2>Behind the curtain</h2>
    <p class="small">Simulating the real-time data system. The screens only see what is "sent" from here.</p>
    <section><h3>Time · ${formatTime(state.now)}</h3>
      <div class="row">
        <button class="btn oz-btn" data-action="advance" data-hours="1">+1 hour</button>
        <button class="btn oz-btn" data-action="advance" data-hours="24">+1 day</button>
        <button class="btn oz-btn" data-action="advance" data-hours="168">+7 days</button>
      </div></section>
    <section><h3>Tank</h3>
      ${t ? `<div class="row"><select data-change="oz-tank" aria-label="Tank">${tanks.map((x) => `<option value="${esc(x.id)}" ${x.id === t.id ? 'selected' : ''}>${esc(x.id)}</option>`).join('')}</select></div>
      <div class="row">
        <button class="btn oz-btn" data-action="refill">Refill to capacity</button>
        <button class="btn oz-btn" data-action="sensor">${t.sensorOn ? 'Stop sensor' : 'Resume sensor'}</button>
      </div>
      <p class="small" style="margin:4px 0">Real consumption (hidden from the screens)</p>
      <div class="row"><input type="number" min="0" step="1" value="${t.hiddenRate}" data-change="hidden-rate" aria-label="Real consumption in litres per day"> L/day</div>
      <p class="small muted">True level: ${litres(t.level)} · sensor ${t.sensorOn ? 'on' : 'off'}</p>` : '<p class="muted">No tank on this site.</p>'}
    </section>
    <section><h3>Well production</h3>${wells}</section>
    <section><h3>Event log</h3><ul class="list log">${events || '<li class="muted">Nothing sent yet.</li>'}</ul></section>
    <button class="btn" data-action="reset">Reset demo</button>`;
}

/* ---------- Rendering ---------- */

function render() {
  const visibleTabs = TABS.filter((t) => !t.salesOnly || ui.profile === 'sales');
  if (!visibleTabs.some((t) => t.id === ui.tab)) ui.tab = 'autonomy';
  $('site-select').innerHTML = state.sites.map((s) => `<option value="${s.id}" ${s.id === ui.site ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  $('profile-select').value = ui.profile;
  $('clock').textContent = `Simulated time · ${formatTime(state.now)}`;
  $('tabs').innerHTML = visibleTabs.map((t) => `<button role="tab" data-action="tab" data-tab="${t.id}" aria-selected="${t.id === ui.tab}">${t.label}</button>`).join('');
  const screens = { autonomy: autonomyScreen, equipment: equipmentScreen, associations: associationsScreen, consumption: consumptionScreen, guide: guideScreen };
  $('main').innerHTML = screens[ui.tab]();
  document.querySelectorAll('form[data-form]').forEach((form) => {
    for (const [name, value] of Object.entries(ui.drafts[form.dataset.form])) {
      if (form.elements[name]) form.elements[name].value = value;
    }
  });
  const oz = $('oz');
  oz.hidden = !ui.ozOpen;
  document.body.classList.toggle('oz-open', ui.ozOpen);
  if (ui.ozOpen) oz.innerHTML = ozPanel();
}

/* ---------- Events ---------- */

const actions = {
  tab: (el) => { ui.tab = el.dataset.tab; ui.toast = ''; },
  'toggle-oz': () => { ui.ozOpen = !ui.ozOpen; },
  advance: (el) => advanceHours(state, Number(el.dataset.hours)),
  refill: () => refill(state, ui.ozTankId),
  sensor: () => { const t = tankById(ui.ozTankId); setSensor(state, t.id, !t.sensorOn); },
  reset: () => { state = createInitialState(); ui.toast = ''; ui.wellId = 'Well-2'; },
  link: () => {
    const check = checkAssociation(state, ui.wellId, ui.addTankId);
    if (!check.ok) return;
    state.associations.push({ tankId: ui.addTankId, wellId: ui.wellId, flowline: false });
    audit(`linked ${ui.addTankId} to ${ui.wellId}`);
    ui.addTankId = '';
  },
  unlink: (el) => {
    state.associations = state.associations.filter((a) => !(a.wellId === ui.wellId && a.tankId === el.dataset.tank));
    audit(`removed ${el.dataset.tank} from ${ui.wellId}`);
  },
};

const changes = {
  site: (el) => { ui.site = el.value; ui.toast = ''; },
  profile: (el) => { ui.profile = el.value; },
  horizon: (el) => { const v = Number(el.value); if (v >= 1) state.horizon = v; },
  well: (el) => { ui.wellId = el.value; ui.addTankId = ''; },
  'add-tank': (el) => { ui.addTankId = el.value; },
  'oz-tank': (el) => { ui.ozTankId = el.value; },
  'hidden-rate': (el) => { const t = tankById(ui.ozTankId); t.hiddenRate = Math.max(0, Number(el.value) || 0); },
  production: (el) => setProduction(state, el.dataset.well, el.value),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  e.preventDefault();
  actions[el.dataset.action](el);
  render();
});

document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  changes[el.dataset.change](el);
  render();
});

document.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  ui.drafts[form.dataset.form] = data;
  if (form.dataset.form === 'tank') {
    const ids = siteTanks().map((t) => t.id);
    ui.tankErrors = validateTank(data, ids);
    if (Object.keys(ui.tankErrors).length) { ui.toast = ''; render(); return; }
    const volume = Number(data.volume);
    state.tanks.push({
      id: data.id.trim(), siteId: ui.site, product: data.product, pump: data.pump.trim(),
      capacity: Number(data.capacity), material: data.material, hiddenRate: 0,
      level: volume, sensorOn: true, readings: [{ t: state.now, v: volume }],
    });
    ui.toast = `Tank ${data.id.trim()} saved. Its injection rate appears once readings show consumption (set it in Behind the curtain).`;
  } else {
    const ids = siteWells().map((w) => w.id);
    ui.wellErrors = validateWell(data, ids);
    if (Object.keys(ui.wellErrors).length) { ui.toast = ''; render(); return; }
    state.wells.push({ id: data.id.trim(), siteId: ui.site, production: Number(data.production) });
    ui.toast = `Well ${data.id.trim()} saved.`;
  }
  ui.drafts[form.dataset.form] = {};
  render();
});

document.addEventListener('keydown', (e) => {
  const typing = e.target.closest('input, select, textarea');
  if (!typing && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
    ui.ozOpen = !ui.ozOpen;
    render();
  }
});

render();
