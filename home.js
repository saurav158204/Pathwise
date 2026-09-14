import { radialScore } from "../charts.js";
import { classChip, esc, formatINR } from "../ui.js";
import { careerReadinessScore } from "../engine/scoringEngine.js";

export function renderHome(state) {
  const { candidate, allFits, opportunities, roiSkills } = state;
  if (!candidate) return emptyHome();

  const readiness = careerReadinessScore(allFits);
  const top = allFits[0];
  const bestOpps = opportunities.slice(0, 3);
  const prioritySkills = roiSkills.slice(0, 4);
  const marketAlert = buildMarketAlert(roiSkills);

  return `
  <div class="grid grid-2" style="grid-template-columns: 1.1fr 1fr;">
    <div class="card row" style="gap:20px;">
      ${radialScore(readiness, { size: 108, label: "Readiness" })}
      <div>
        <div class="section-title">Career Readiness</div>
        <div style="font-size:15px;">Based on your top 3 role fits, weighted by current market demand.</div>
        <div class="row" style="margin-top:10px; gap:8px;">
          <button class="btn btn-secondary btn-sm" data-action="nav" data-route="career">View Career Breakdown →</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="section-title">Top Role</div>
      ${top ? `
        <div class="row-between">
          <div>
            <div style="font-size:19px; font-weight:700;">${esc(top.roleName)}</div>
            <div class="muted" style="font-size:12.5px;">${formatINR(top.salaryRangeINR[0])} – ${formatINR(top.salaryRangeINR[1])} · ${esc(top.marketLabel)} demand</div>
          </div>
          <div class="num" style="font-size:26px; font-weight:700; color:var(--accent);">${top.fit}%</div>
        </div>
        <div style="margin-top:8px;">${classChip(top.classification)}</div>
      ` : `<div class="muted">No roles scored yet.</div>`}
    </div>
  </div>

  <div class="grid grid-3" style="margin-top:16px;">
    <div class="card">
      <div class="section-title">Best Opportunities</div>
      ${bestOpps.length ? bestOpps.map((o) => `
        <div class="list-item">
          <div>
            <div style="font-weight:700; font-size:13.5px;">${esc(o.companyName)}</div>
            <div class="faint" style="font-size:12px;">${esc(o.roleName)}</div>
          </div>
          <div class="num" style="font-weight:700;">${o.opportunityScore}</div>
        </div>
      `).join("") : `<div class="muted">Set target roles in Career to see matches.</div>`}
      <button class="btn btn-ghost btn-sm" style="margin-top:6px;" data-action="nav" data-route="opportunities">See all opportunities →</button>
    </div>

    <div class="card">
      <div class="section-title">Skills To Prioritize</div>
      ${prioritySkills.length ? `
        <div class="stack">
          ${prioritySkills.map((s) => `
            <div class="row-between">
              <span style="font-weight:600; font-size:13.5px;">${esc(s.skill)}</span>
              <span class="chip ${s.priority === "Very High" || s.priority === "High" ? "chip-declining" : "chip-stable"}">${esc(s.priority)}</span>
            </div>
          `).join("")}
        </div>
      ` : `<div class="muted">No gaps detected yet.</div>`}
      <button class="btn btn-ghost btn-sm" style="margin-top:6px;" data-action="nav" data-route="career">View skill gaps →</button>
    </div>

    <div class="card">
      <div class="section-title">Market Alert</div>
      <div style="font-size:13.5px; line-height:1.5;">${marketAlert}</div>
      <button class="btn btn-ghost btn-sm" style="margin-top:10px;" data-action="nav" data-route="insights">Open Market Intelligence →</button>
    </div>
  </div>
  `;
}

function buildMarketAlert(roiSkills) {
  const hot = roiSkills.find((s) => s.trend === "Rising" || s.trend === "Emerging");
  if (!hot) return "Market signals are stable across your target skill set right now.";
  return `${hot.trend} demand for <strong>${esc(hot.skill)}</strong> — acquiring it could unlock ${hot.rolesUnlocked} more role${hot.rolesUnlocked === 1 ? "" : "s"} and ${hot.companiesUnlocked} companies at your current profile.`;
}

function emptyHome() {
  return `
  <div class="card empty-state" style="max-width:520px; margin:40px auto;">
    <div class="display" style="font-size:22px; margin-bottom:6px;">Let's build your profile</div>
    <p class="muted">Upload your resume (or try a sample candidate) to get your first career readiness score, role matches, and skill priorities.</p>
    <div class="row" style="justify-content:center; gap:10px; margin-top:14px;">
      <button class="btn btn-primary" data-action="nav" data-route="profile">Upload Resume</button>
      <button class="btn btn-secondary" data-action="load-sample">Try a Sample Candidate</button>
    </div>
  </div>`;
}
