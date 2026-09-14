import { hBarChart, cssVar } from "../charts.js";
import { trendChip, priorityBadge, esc } from "../ui.js";
import { ROLES } from "../taxonomy.js";

export function renderInsights(state) {
  const tab = state.ui.insightsTab || "market";
  return `
  <div class="tabs">
    <button class="tab-btn ${tab === "market" ? "active" : ""}" data-action="insights-tab" data-tab="market">Market Overview</button>
    <button class="tab-btn ${tab === "trends" ? "active" : ""}" data-action="insights-tab" data-tab="trends">Skill Trends</button>
    <button class="tab-btn ${tab === "roi" ? "active" : ""}" data-action="insights-tab" data-tab="roi">Skill Opportunity Impact</button>
  </div>
  ${tab === "market" ? renderMarket(state) : tab === "trends" ? renderTrends(state) : renderRoi(state)}
  <div class="faint" style="font-size:11px; margin-top:18px;">Source: ${esc(state.marketSnapshot.source)} · Generated ${new Date(state.marketSnapshot.generatedAt).toLocaleString()} · Simulated data for demonstration — not live labour-market statistics.</div>
  `;
}

function renderMarket(state) {
  const { marketSnapshot } = state;
  const f = state.ui.marketFilters;
  const cities = marketSnapshot.geoSignals.map((g) => g.city);
  const industries = marketSnapshot.industrySignals.map((i) => i.industry);

  const roleItems = marketSnapshot.roleSignals.slice().sort((a, b) => b.demandIndex - a.demandIndex)
    .filter((r) => f.industry === "all" || ROLES.find((rr) => rr.id === r.roleId)?.industries.includes(f.industry))
    .map((r) => ({ label: r.role, value: r.demandIndex }));

  const geoItems = marketSnapshot.geoSignals.filter((g) => f.city === "all" || g.city === f.city)
    .sort((a, b) => b.demandIndex - a.demandIndex).map((g) => ({ label: g.city, value: g.demandIndex, color: g.city === f.city ? cssVar("--accent") : undefined }));

  return `
  <div class="row" style="margin-bottom:14px; gap:10px; flex-wrap:wrap;">
    <select data-action="market-filter" data-field="city" style="width:auto;">
      <option value="all">All Cities</option>
      ${cities.map((c) => `<option value="${esc(c)}" ${f.city === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
    </select>
    <select data-action="market-filter" data-field="industry" style="width:auto;">
      <option value="all">All Industries</option>
      ${industries.map((i) => `<option value="${esc(i)}" ${f.industry === i ? "selected" : ""}>${esc(i)}</option>`).join("")}
    </select>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <div class="section-title">Role Demand (India)</div>
      ${hBarChart(roleItems, { barHeight: 22, gap: 8 })}
    </div>
    <div class="card">
      <div class="section-title">Geographic Demand</div>
      ${hBarChart(geoItems, { barHeight: 22, gap: 8 })}
    </div>
  </div>
  <div class="card" style="margin-top:16px;">
    <div class="section-title">Industry Trends</div>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      ${marketSnapshot.industrySignals.slice().sort((a, b) => b.healthIndex - a.healthIndex).map((i) => `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:8px 4px; font-weight:600;">${esc(i.industry)}</td>
          <td style="padding:8px 4px;" class="mono">${i.healthIndex} health index</td>
          <td style="padding:8px 4px;"><span class="chip ${i.hiringTrend === "Expanding" ? "chip-strong" : i.hiringTrend === "Contracting" ? "chip-low" : "chip-stable"}">${esc(i.hiringTrend)}</span></td>
        </tr>`).join("")}
    </table>
  </div>
  `;
}

function renderTrends(state) {
  const { marketSnapshot, candidate } = state;
  const held = new Set((candidate?.skills || []).map((s) => s.name));
  const rows = marketSnapshot.skillSignals.slice().sort((a, b) => b.demandIndex - a.demandIndex);
  return `
  <div class="card">
    <div class="section-title">Skill Demand Trends</div>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead><tr class="faint" style="text-align:left;"><th style="padding:6px 4px;">Skill</th><th>Category</th><th>Trend</th><th style="text-align:right;">Demand</th><th style="text-align:right;">You</th></tr></thead>
      <tbody>
      ${rows.map((s) => `
        <tr style="border-top:1px solid var(--border);">
          <td style="padding:7px 4px; font-weight:600;">${esc(s.skill)}</td>
          <td style="padding:7px 4px;" class="faint">${esc(s.category)}</td>
          <td style="padding:7px 4px;">${trendChip(s.trend)}</td>
          <td style="padding:7px 4px; text-align:right;" class="mono">${s.demandIndex}</td>
          <td style="padding:7px 4px; text-align:right;">${held.has(s.skill) ? "✓" : ""}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}

function renderRoi(state) {
  const { roiSkills, candidate } = state;
  if (!candidate) return `<div class="card empty-state">Build your profile to see personalized skill ROI.</div>`;
  return `
  <div class="card">
    <div class="section-title">Skill Opportunity Impact</div>
    <p class="muted" style="font-size:12.5px; margin-top:-4px;">For each skill you don't yet have: how many more roles and companies it would make you competitive for.</p>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead><tr class="faint" style="text-align:left;">
        <th style="padding:6px 4px;">Skill</th><th style="text-align:right;">Current Roles</th><th style="text-align:right;">After</th><th style="text-align:right;">+Roles</th><th style="text-align:right;">+Companies</th><th>Demand</th><th>Priority</th>
      </tr></thead>
      <tbody>
      ${roiSkills.slice(0, 20).map((r) => `
        <tr style="border-top:1px solid var(--border);">
          <td style="padding:7px 4px; font-weight:600;">${esc(r.skill)}</td>
          <td style="padding:7px 4px; text-align:right;" class="mono faint">${r.currentCompatibleRoles}</td>
          <td style="padding:7px 4px; text-align:right;" class="mono">${r.afterRoles}</td>
          <td style="padding:7px 4px; text-align:right; color:var(--score-strong);" class="mono">+${r.rolesUnlocked}</td>
          <td style="padding:7px 4px; text-align:right;" class="mono">+${r.companiesUnlocked}</td>
          <td style="padding:7px 4px;">${trendChip(r.trend)}</td>
          <td style="padding:7px 4px;">${priorityBadge(r.priority)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>`;
}
