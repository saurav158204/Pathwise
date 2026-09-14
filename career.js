import { ROLES } from "../taxonomy.js";
import { hBarChart, radialScore, cssVar } from "../charts.js";
import { classChip, priorityBadge, esc } from "../ui.js";
import { careerReadinessScore } from "../engine/scoringEngine.js";

export function renderCareer(state) {
  const { candidate, allFits, skillGaps, whatIf } = state;
  if (!candidate) return `<div class="card empty-state">Build your profile first — go to <b>Profile</b> to upload a resume.</div>`;

  const readiness = careerReadinessScore(allFits);
  const barItems = allFits.slice(0, 10).map((f) => ({ label: f.roleName, value: f.fit, color: cssVar(f.fit >= 82 ? "--score-strong" : f.fit >= 62 ? "--accent" : f.fit >= 42 ? "--score-warn" : "--score-critical") }));

  const targetSet = new Set(candidate.targetRoles || []);
  const missingSkillsPool = [...new Set(skillGaps.filter((g) => g.priority !== "Already Strong").map((g) => g.skill))];
  const selectedWhatIf = new Set(whatIf.selected);

  return `
  <div class="grid grid-2" style="grid-template-columns: 1fr 1.3fr; align-items:start;">
    <div class="card row" style="gap:20px;">
      ${radialScore(readiness, { size: 108, label: "Readiness" })}
      <div>
        <div class="section-title">Current Career Readiness</div>
        <div class="muted" style="font-size:13px;">Average of your top 3 role fits.</div>
      </div>
    </div>
    <div class="card">
      <div class="section-title">Best-fit Roles</div>
      ${hBarChart(barItems, { valueSuffix: "%" })}
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="row-between">
      <div class="section-title" style="margin:0;">Target Roles</div>
      <span class="faint" style="font-size:11.5px;">Used to focus skill-gap and what-if analysis</span>
    </div>
    <div class="tag-input-list">
      ${ROLES.map((r) => `
        <button class="tag" data-action="toggle-target-role" data-role-id="${r.id}"
          style="cursor:pointer; ${targetSet.has(r.id) ? "background:var(--accent-soft); color:var(--accent-strong); border-color:var(--accent);" : ""}">
          ${esc(r.name)}
        </button>
      `).join("")}
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="row-between">
      <div class="section-title" style="margin:0;">Skill Gaps</div>
      <span class="faint" style="font-size:11.5px;">${targetSet.size ? "Weighted to your target roles" : "Weighted to your top 3 current fits"}</span>
    </div>
    <table style="width:100%; border-collapse:collapse; font-size:13px;">
      ${skillGaps.slice(0, 12).map((g) => `
        <tr style="border-bottom:1px solid var(--border);">
          <td style="padding:8px 4px; font-weight:600;">${esc(g.skill)}</td>
          <td style="padding:8px 4px;" class="faint">${esc(g.category)}</td>
          <td style="padding:8px 4px;">${priorityBadge(g.priority)}</td>
          <td style="padding:8px 4px; text-align:right;" class="mono faint">${g.proficiency}% held</td>
        </tr>
      `).join("")}
    </table>
  </div>

  <div class="card" style="margin-top:16px;">
    <div class="section-title">Career Projection — What-If Simulator</div>
    <p class="muted" style="font-size:12.5px; margin-top:-4px;">Pick skills to simulate learning. Projections are estimates, not guaranteed outcomes.</p>
    <div class="tag-input-list">
      ${missingSkillsPool.slice(0, 24).map((s) => `
        <button class="tag" data-action="toggle-whatif-skill" data-skill="${esc(s)}"
          style="cursor:pointer; ${selectedWhatIf.has(s) ? "background:var(--accent-soft); color:var(--accent-strong); border-color:var(--accent);" : ""}">
          ${selectedWhatIf.has(s) ? "✓ " : ""}${esc(s)}
        </button>
      `).join("")}
    </div>
    <button class="btn btn-primary btn-sm" style="margin-top:12px;" data-action="run-whatif" ${selectedWhatIf.size ? "" : "disabled"}>Simulate</button>
    ${whatIf.result ? `
      <div style="margin-top:16px;">
        <div class="faint" style="font-size:11.5px; margin-bottom:8px;">Current → Projected</div>
        ${whatIf.result.comparison.slice(0, 8).map((c) => `
          <div class="row-between" style="padding:6px 0; border-bottom:1px solid var(--border);">
            <span style="font-weight:600; font-size:13px;">${esc(c.roleName)}</span>
            <span class="mono">
              <span class="faint">${c.before}%</span> → <strong style="color:${c.delta > 0 ? "var(--score-strong)" : "var(--text)"}">${c.after}%</strong>
              ${c.delta > 0 ? `<span style="color:var(--score-strong);">(+${c.delta})</span>` : ""}
            </span>
          </div>
        `).join("")}
      </div>
    ` : ""}
  </div>
  `;
}
