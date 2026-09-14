import { classChip, esc, formatINR } from "../ui.js";

export function renderFitModal(fit, companyName) {
  return `
  <div class="modal-backdrop" id="modal-backdrop">
    <div class="modal">
      <div class="row-between">
        <div>
          <div style="font-size:12px;" class="faint">${companyName ? esc(companyName) + " · " : ""}Career Fit Explanation</div>
          <div class="display" style="font-size:22px;">${esc(fit.roleName)}</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="close-modal">✕</button>
      </div>
      <div class="row" style="gap:16px; margin:14px 0;">
        <div class="num" style="font-size:40px; font-weight:700; color:var(--accent);">${fit.fit}</div>
        <div>${classChip(fit.classification)}<div class="faint" style="font-size:11.5px; margin-top:4px;">${esc(fit.marketLabel)} market demand · ${formatINR(fit.salaryRangeINR[0])}–${formatINR(fit.salaryRangeINR[1])}</div></div>
      </div>
      <div class="grid grid-3" style="gap:10px; margin-bottom:14px;">
        ${Object.entries(fit.components).map(([k, v]) => `
          <div class="card-flat" style="padding:10px 12px;">
            <div class="faint" style="font-size:10.5px; text-transform:uppercase;">${labelFor(k)}</div>
            <div class="mono" style="font-weight:700; font-size:16px;">${v}</div>
          </div>`).join("")}
      </div>
      <div class="grid grid-2">
        <div>
          <div class="section-title">Strong Signals</div>
          <ul class="why-list">${fit.strongSignals.length ? fit.strongSignals.map((s) => `<li>${esc(s)}</li>`).join("") : "<li>No strong signals yet</li>"}</ul>
        </div>
        <div>
          <div class="section-title">Gaps</div>
          ${fit.gaps.length ? `<ul class="miss-list">${fit.gaps.map((g) => `<li>${esc(g.skill)}${g.importance === "required" ? "" : " (preferred)"}</li>`).join("")}</ul>` : `<div class="faint" style="font-size:12.5px;">No notable gaps.</div>`}
        </div>
      </div>
      <hr class="sep" />
      <div class="faint" style="font-size:11.5px;">Recommendation: ${recommendationLine(fit.classification)} — this reflects current signals, not a guaranteed hiring outcome.</div>
    </div>
  </div>`;
}

function recommendationLine(classification) {
  return { "Strong Match": "Strong target — you're competitive today.", "Target": "Realistic target with a few gaps to close.",
    "Reach": "Reach — meaningful preparation needed first.", "Low Fit": "Low fit right now — consider it a longer-term goal." }[classification];
}

function labelFor(k) {
  return { skillMatch: "Skill Match", experienceMatch: "Experience", projectMatch: "Projects", educationMatch: "Education",
    certificationMatch: "Certifications", marketDemand: "Market Demand", growthSignal: "Growth" }[k] || k;
}
