import { classChip, esc } from "../ui.js";

export function renderOpportunities(state) {
  const { candidate } = state;
  if (!candidate) return `<div class="card empty-state">Build your profile first — go to <b>Profile</b> to upload a resume.</div>`;

  const tab = state.ui.oppTab || "ranked";
  return `
  <div class="tabs">
    <button class="tab-btn ${tab === "ranked" ? "active" : ""}" data-action="opp-tab" data-tab="ranked">Ranked Opportunities</button>
    <button class="tab-btn ${tab === "applications" ? "active" : ""}" data-action="opp-tab" data-tab="applications">My Applications</button>
  </div>
  ${tab === "ranked" ? renderRanked(state) : renderApplications(state)}
  `;
}

function renderRanked(state) {
  const { opportunities } = state;
  const industries = [...new Set(opportunities.map((o) => o.industry))].sort();
  const f = state.ui.oppFilters;

  const filtered = opportunities.filter((o) =>
    (f.industry === "all" || o.industry === f.industry) &&
    (f.classification === "all" || o.classification === f.classification)
  );

  return `
  <div class="row" style="margin-bottom:14px; gap:10px; flex-wrap:wrap;">
    <select data-action="opp-filter" data-field="industry" style="width:auto;">
      <option value="all">All Industries</option>
      ${industries.map((i) => `<option value="${esc(i)}" ${f.industry === i ? "selected" : ""}>${esc(i)}</option>`).join("")}
    </select>
    <select data-action="opp-filter" data-field="classification" style="width:auto;">
      <option value="all">All Classifications</option>
      ${["Strong Match", "Target", "Reach", "Low Fit"].map((c) => `<option value="${esc(c)}" ${f.classification === c ? "selected" : ""}>${esc(c)}</option>`).join("")}
    </select>
    <span class="faint" style="margin-left:auto; font-size:12px; align-self:center;">${filtered.length} opportunities · not guaranteed outcomes</span>
  </div>
  <div class="stack" style="gap:14px;">
    ${filtered.slice(0, 40).map((o, idx) => renderOppCard(o, idx)).join("") || `<div class="empty-state card">No opportunities match these filters.</div>`}
  </div>
  `;
}

function renderOppCard(o, idx) {
  return `
  <div class="opportunity-card">
    <div class="row-between">
      <div>
        <div style="font-weight:700; font-size:15.5px;">${idx + 1}. ${esc(o.companyName)} — ${esc(o.roleName)}</div>
        <div class="faint" style="font-size:12px; margin-top:2px;">${esc(o.industry)} · ${esc(o.hqCity)} · ${o.openPositions} open position${o.openPositions === 1 ? "" : "s"} · ${classChip(o.classification)}</div>
      </div>
      <div class="opp-score" title="Opportunity Score">${o.opportunityScore}</div>
    </div>
    <div class="grid" style="grid-template-columns:repeat(4,1fr); gap:8px; margin-top:12px; font-size:12px;">
      <div><div class="faint">Candidate Fit</div><div class="mono" style="font-weight:700;">${o.candidateFit}</div></div>
      <div><div class="faint">Skill Match</div><div class="mono" style="font-weight:700;">${o.skillMatch}</div></div>
      <div><div class="faint">Market Demand</div><div class="mono" style="font-weight:700;">${o.marketDemand}</div></div>
      <div><div class="faint">Hiring Signal</div><div class="mono" style="font-weight:700;">${o.hiringSignal}</div></div>
    </div>
    <div class="row-between" style="align-items:flex-start; margin-top:10px;">
      <div style="flex:1; min-width:200px;">
        <ul class="why-list">${o.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
        ${o.missingSkills.length ? `<ul class="miss-list">${o.missingSkills.slice(0, 5).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="row" style="gap:6px; flex-wrap:wrap; justify-content:flex-end;">
        <button class="btn btn-secondary btn-sm" data-action="analyze-fit" data-role-id="${o.roleId}" data-company-id="${o.companyId}">Analyze Fit</button>
        <button class="btn btn-secondary btn-sm" data-action="save-opportunity" data-company-id="${o.companyId}" data-role-id="${o.roleId}">Save</button>
        <button class="btn btn-primary btn-sm" data-action="apply-opportunity" data-company-id="${o.companyId}" data-role-id="${o.roleId}">Apply</button>
      </div>
    </div>
  </div>`;
}

const STATUSES = ["Saved", "Applied", "Assessment", "Interview", "Offer", "Rejected", "Withdrawn"];

function renderApplications(state) {
  const apps = state.applications;
  const total = apps.length;
  const interviews = apps.filter((a) => ["Interview", "Offer"].includes(a.status)).length;
  const offers = apps.filter((a) => a.status === "Offer").length;
  const conversion = total ? Math.round((offers / total) * 100) : 0;

  return `
  <div class="grid grid-3" style="margin-bottom:16px;">
    <div class="card"><div class="section-title">Applications</div><div class="num" style="font-size:26px; font-weight:700;">${total}</div></div>
    <div class="card"><div class="section-title">Interviews</div><div class="num" style="font-size:26px; font-weight:700;">${interviews}</div></div>
    <div class="card"><div class="section-title">Conversion Rate</div><div class="num" style="font-size:26px; font-weight:700;">${conversion}%</div><div class="faint" style="font-size:11.5px;">${offers} offer${offers === 1 ? "" : "s"} / ${total} applications</div></div>
  </div>
  <div class="card">
    ${apps.length === 0 ? `<div class="empty-state">No applications yet. Save or apply to opportunities to track them here.</div>` : `
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      <thead><tr class="faint" style="text-align:left;">
        <th style="padding:6px 4px;">Company</th><th style="padding:6px 4px;">Role</th><th style="padding:6px 4px;">Status</th><th style="padding:6px 4px;">Date</th><th style="padding:6px 4px;">Notes</th><th></th>
      </tr></thead>
      <tbody>
      ${apps.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).map((a) => `
        <tr style="border-top:1px solid var(--border);">
          <td style="padding:8px 4px; font-weight:600;">${esc(a.company)}</td>
          <td style="padding:8px 4px;">${esc(a.role)}</td>
          <td style="padding:8px 4px;">
            <select data-action="update-app-status" data-id="${a.id}" style="width:auto; padding:4px 8px; font-size:12px;">
              ${STATUSES.map((s) => `<option value="${s}" ${a.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </td>
          <td style="padding:8px 4px;" class="faint">${a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : "—"}</td>
          <td style="padding:8px 4px; max-width:220px;" class="faint">
            <input data-action="update-app-notes" data-id="${a.id}" value="${esc(a.notes || "")}" placeholder="Notes…" style="font-size:12px; padding:4px 8px;" />
          </td>
          <td style="padding:8px 4px;"><button class="btn btn-ghost btn-sm" data-action="delete-app" data-id="${a.id}">Remove</button></td>
        </tr>
      `).join("")}
      </tbody>
    </table>`}
  </div>
  `;
}
