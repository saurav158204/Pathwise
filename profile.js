import { ROLES, SKILL_TAXONOMY, categoryOf } from "../taxonomy.js";
import { DEFAULT_WEIGHTS } from "../engine/scoringEngine.js";
import { DEFAULT_OPPORTUNITY_WEIGHTS } from "../engine/opportunityEngine.js";
import { esc } from "../ui.js";

export const emptyCandidate = () => ({
  name: "", email: "", phone: "", location: "",
  targetRoles: [], targetIndustries: [], targetLocations: [],
  education: [], experience: [], internships: [], projects: [], certifications: [],
  achievements: [], domains: [], softSkills: [], skills: [],
  resumeAssetId: null, resumeRawText: "",
});

export const LIST_FIELDS = {
  education: [["degree"], ["field"], ["institution"], ["startYear"], ["endYear"]],
  experience: [["title"], ["company"], ["startDate"], ["endDate"], ["description"], ["skillsUsed"]],
  internships: [["title"], ["company"], ["startDate"], ["endDate"], ["description"], ["skillsUsed"]],
  projects: [["name"], ["description"], ["skillsUsed"]],
  certifications: [["name"], ["issuer"], ["year"]],
};

export function renderProfile(state) {
  const candidate = { ...emptyCandidate(), ...(state.candidate || {}) };
  const settings = state.settings;

  return `
  <div class="card">
    <div class="row-between">
      <div>
        <div class="section-title" style="margin-bottom:2px;">Sync Code</div>
        <div class="faint" style="font-size:12px;">This demo has no real login — this code scopes your data in shared storage. Save it to return to this profile later. Not secure authentication.</div>
      </div>
      <div class="row" style="gap:6px;">
        <input class="mono" style="width:170px;" id="sync-code-input" value="${esc(state.store.profileKey)}" />
        <button class="btn btn-secondary btn-sm" data-action="apply-sync-code">Load</button>
      </div>
    </div>
  </div>

  ${renderResumeUpload(state)}

  <div class="card" style="margin-top:16px;">
    <div class="section-title">Basic Info</div>
    <div class="grid grid-2">
      <div class="field"><label>Name</label><input id="f-name" value="${esc(candidate.name)}" /></div>
      <div class="field"><label>Email</label><input id="f-email" value="${esc(candidate.email)}" /></div>
      <div class="field"><label>Phone</label><input id="f-phone" value="${esc(candidate.phone)}" /></div>
      <div class="field"><label>Location</label><input id="f-location" value="${esc(candidate.location)}" /></div>
    </div>

    <div class="field">
      <label>Target Roles</label>
      <div class="tag-input-list">
        ${ROLES.map((r) => `<button class="tag" data-action="toggle-list" data-key="targetRoles" data-value="${r.id}"
          style="cursor:pointer; ${(candidate.targetRoles || []).includes(r.id) ? "background:var(--accent-soft); color:var(--accent-strong); border-color:var(--accent);" : ""}">${esc(r.name)}</button>`).join("")}
      </div>
    </div>
    <div class="grid grid-2">
      <div class="field">
        <label>Target Industries</label>
        <div class="tag-input-list">
          ${[...new Set(ROLES.flatMap((r) => r.industries))].map((i) => `<button class="tag" data-action="toggle-list" data-key="targetIndustries" data-value="${esc(i)}"
            style="cursor:pointer; ${(candidate.targetIndustries || []).includes(i) ? "background:var(--accent-soft); color:var(--accent-strong); border-color:var(--accent);" : ""}">${esc(i)}</button>`).join("")}
        </div>
      </div>
      <div class="field">
        <label>Target Locations</label>
        <div class="tag-input-list">
          ${[...new Set(ROLES.flatMap((r) => r.geographies))].map((g) => `<button class="tag" data-action="toggle-list" data-key="targetLocations" data-value="${esc(g)}"
            style="cursor:pointer; ${(candidate.targetLocations || []).includes(g) ? "background:var(--accent-soft); color:var(--accent-strong); border-color:var(--accent);" : ""}">${esc(g)}</button>`).join("")}
        </div>
      </div>
    </div>
  </div>

  ${renderListSection("Education", "education", candidate.education, [["degree", "Degree (e.g. B.Tech)"], ["field", "Field"], ["institution", "Institution"], ["startYear", "Start Year"], ["endYear", "End Year"]])}
  ${renderListSection("Experience", "experience", candidate.experience, [["title", "Title"], ["company", "Company"], ["startDate", "Start (YYYY-MM-DD)"], ["endDate", "End (YYYY-MM-DD)"], ["description", "Description"], ["skillsUsed", "Skills used (comma-separated)"]])}
  ${renderListSection("Internships", "internships", candidate.internships, [["title", "Title"], ["company", "Company"], ["startDate", "Start (YYYY-MM-DD)"], ["endDate", "End (YYYY-MM-DD)"], ["description", "Description"], ["skillsUsed", "Skills used (comma-separated)"]])}
  ${renderListSection("Projects", "projects", candidate.projects, [["name", "Project Name"], ["description", "Description"], ["skillsUsed", "Skills used (comma-separated)"]])}
  ${renderListSection("Certifications", "certifications", candidate.certifications, [["name", "Certification Name"], ["issuer", "Issuer"], ["year", "Year"]])}
  ${renderTagListSection("Achievements", "achievements", candidate.achievements)}
  ${renderTagListSection("Soft Skills", "softSkills", candidate.softSkills)}
  ${renderTagListSection("Domains", "domains", candidate.domains)}

  <div class="row" style="margin:18px 0;">
    <button class="btn btn-primary" data-action="save-profile-form">Save Profile</button>
    <span class="faint" style="margin-left:10px; font-size:12px;">Saves basic info + all lists above.</span>
  </div>

  ${renderSkillGraph(candidate)}
  ${renderResumeOptimizer(state)}
  ${renderWeights(settings)}

  <div class="card" style="margin-top:16px; border-color:var(--red-soft);">
    <div class="section-title" style="color:var(--score-critical);">Danger Zone</div>
    <p class="muted" style="font-size:12.5px;">Permanently delete your profile, resume file, applications, and settings from this browser and the shared store.</p>
    <button class="btn btn-danger btn-sm" data-action="delete-profile">Delete My Data</button>
  </div>
  `;
}

function renderResumeUpload(state) {
  const st = state.ui.resumeStatus;
  return `
  <div class="card">
    <div class="row-between">
      <div>
        <div class="section-title" style="margin-bottom:2px;">Resume</div>
        <div class="faint" style="font-size:12px;">PDF, DOCX, or TXT. Parsed on-device; only extracted text and PDFs are stored.</div>
      </div>
      <div class="row" style="gap:8px;">
        <input type="file" id="resume-file-input" accept=".pdf,.docx,.txt" style="display:none;" />
        <button class="btn btn-secondary btn-sm" data-action="pick-resume-file">${state.candidate?.resumeRawText ? "Replace Resume" : "Upload Resume"}</button>
        ${!state.candidate ? `<button class="btn btn-ghost btn-sm" data-action="load-sample">Try Sample</button>` : ""}
      </div>
    </div>
    ${st.state === "parsing" ? `<div class="row" style="margin-top:10px; gap:8px;"><span class="spinner"></span><span class="muted" style="font-size:12.5px;">${esc(st.message || "Parsing resume…")}</span></div>` : ""}
    ${st.state === "error" ? `<div class="banner" style="margin-top:10px; margin-bottom:0;">${esc(st.message)}</div>` : ""}
    ${st.state === "done" ? `<div class="row" style="margin-top:10px; gap:8px; color:var(--score-strong); font-size:12.5px;">✓ ${esc(st.message)}</div>` : ""}
  </div>`;
}

function renderListSection(title, key, items = [], fields) {
  return `
  <div class="card" style="margin-top:16px;" data-section="${key}">
    <div class="row-between"><div class="section-title" style="margin:0;">${title}</div><button class="btn btn-ghost btn-sm" data-action="add-row" data-list="${key}">+ Add</button></div>
    <div id="list-${key}">
      ${items.map((item, idx) => renderRow(key, idx, item, fields)).join("") || `<div class="faint" style="font-size:12.5px; padding:8px 0;">None yet.</div>`}
    </div>
  </div>`;
}

function renderRow(key, idx, item, fields) {
  return `
  <div class="row" data-row="${key}" data-idx="${idx}" style="gap:8px; padding:10px 0; border-bottom:1px solid var(--border); align-items:flex-start; flex-wrap:wrap;">
    ${fields.map(([field, ph]) => {
      const val = field === "skillsUsed" ? (item[field] || []).join(", ") : (item[field] ?? "");
      const long = field === "description";
      return `<div style="flex:${long ? "2 1 220px" : "1 1 120px"};">
        ${long
          ? `<textarea data-list="${key}" data-idx="${idx}" data-field="${field}" placeholder="${esc(ph)}" style="min-height:44px;">${esc(val)}</textarea>`
          : `<input data-list="${key}" data-idx="${idx}" data-field="${field}" placeholder="${esc(ph)}" value="${esc(val)}" />`}
      </div>`;
    }).join("")}
    ${key === "experience" || key === "internships" ? `<label style="display:flex; align-items:center; gap:5px; font-size:11.5px; font-weight:500; margin-top:8px;"><input type="checkbox" data-list="${key}" data-idx="${idx}" data-field="current" ${item.current ? "checked" : ""} style="width:auto;" /> Current</label>` : ""}
    <button class="btn btn-ghost btn-sm" data-action="remove-row" data-list="${key}" data-idx="${idx}" style="align-self:flex-start;">✕</button>
  </div>`;
}

function renderTagListSection(title, key, items = []) {
  return `
  <div class="card" style="margin-top:16px;">
    <div class="section-title">${title}</div>
    <div class="tag-input-list" id="taglist-${key}">
      ${items.map((v, i) => `<span class="tag">${esc(v)}<button data-action="remove-tag" data-key="${key}" data-idx="${i}">✕</button></span>`).join("")}
    </div>
    <div class="row" style="margin-top:8px; gap:6px;">
      <input id="taginput-${key}" placeholder="Add and press Enter…" data-action="tag-input" data-key="${key}" />
    </div>
  </div>`;
}

function renderSkillGraph(candidate) {
  const skills = candidate.skills || [];
  const byCategory = {};
  for (const s of skills) (byCategory[s.category] = byCategory[s.category] || []).push(s);

  return `
  <div class="card" style="margin-top:16px;">
    <div class="section-title">Candidate Skill Graph</div>
    <p class="muted" style="font-size:12.5px; margin-top:-4px;">Proficiency is estimated from where each skill appears — projects, experience, or just listed — not treated as a binary yes/no.</p>
    <div class="skill-tree">
      ${Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length).map(([cat, list]) => `
        <div>
          <div class="skill-cat-title">${esc(cat)} (${list.length})</div>
          ${list.sort((a, b) => b.proficiency - a.proficiency).map((s) => `
            <div class="skill-row">
              <span class="skill-name">${esc(s.name)}</span>
              <input type="range" min="5" max="100" value="${s.proficiency}" data-action="set-proficiency" data-skill="${esc(s.name)}" title="Proficiency: ${s.proficiency}%" />
              <span class="skill-pct">${s.proficiency}%</span>
              <button class="btn btn-ghost btn-sm" data-action="remove-skill" data-skill="${esc(s.name)}">✕</button>
            </div>
          `).join("")}
        </div>
      `).join("") || `<div class="faint">No skills yet — upload a resume or add one below.</div>`}
    </div>
    <div class="row" style="margin-top:12px; gap:6px;">
      <input id="add-skill-input" list="skill-options" placeholder="Add a skill (e.g. Docker)" />
      <datalist id="skill-options">${Object.values(SKILL_TAXONOMY).flat().map((s) => `<option value="${esc(s)}"></option>`).join("")}</datalist>
      <button class="btn btn-secondary btn-sm" data-action="add-skill">Add</button>
    </div>
  </div>`;
}

function renderWeights(settings) {
  const w = settings.weights;
  const ow = settings.oppWeights;
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  const rowsFor = (obj, prefix) => Object.entries(obj).map(([k, v]) => `
    <div class="field">
      <label>${labelFor(k)} <span class="mono faint">${v.toFixed(2)}</span></label>
      <input type="range" min="0" max="0.5" step="0.01" value="${v}" data-action="set-weight" data-group="${prefix}" data-key="${k}" />
    </div>`).join("");

  return `
  <div class="card" style="margin-top:16px;">
    <div class="row-between"><div class="section-title" style="margin:0;">Scoring Weights</div><button class="btn btn-ghost btn-sm" data-action="reset-weights">Reset to Recommended</button></div>
    <p class="muted" style="font-size:12.5px;">Career Fit weights (sum: <span class="mono">${sum.toFixed(2)}</span> — need not equal 1, scores clamp at 100).</p>
    <div class="grid grid-3">${rowsFor(w, "weights")}</div>
    <hr class="sep" />
    <p class="muted" style="font-size:12.5px;">Opportunity Ranking weights</p>
    <div class="grid grid-3">${rowsFor(ow, "oppWeights")}</div>
  </div>`;
}

function labelFor(k) {
  return { skill: "Skill Match", experience: "Experience", project: "Projects", education: "Education", certification: "Certifications",
    marketDemand: "Market Demand", growth: "Growth Signal", candidateFit: "Candidate Fit", hiringSignal: "Hiring Signal", skillGap: "Skill Gap", location: "Location" }[k] || k;
}

function renderResumeOptimizer(state) {
  const candidate = state.candidate;
  if (!candidate?.resumeRawText) return "";
  const opt = state.ui.resumeOptimize;
  return `
  <div class="card" style="margin-top:16px;">
    <div class="section-title">Resume Optimization</div>
    <div class="row" style="gap:8px; margin-bottom:10px;">
      <select id="optimize-role-select" style="width:auto;">
        ${ROLES.map((r) => `<option value="${r.id}" ${opt.roleId === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}
      </select>
      <button class="btn btn-primary btn-sm" data-action="run-resume-optimize">${opt.loading ? '<span class="spinner"></span> Analyzing…' : "Analyze"}</button>
      ${opt.breakdown ? `<button class="btn btn-secondary btn-sm" data-action="download-optimize-report">Download Report</button>` : ""}
    </div>
    ${opt.breakdown ? `
      <div class="grid" style="grid-template-columns:repeat(5,1fr); gap:8px; margin-bottom:12px; font-size:12px;">
        <div><div class="faint">ATS Score</div><div class="mono" style="font-weight:700; font-size:16px;">${opt.breakdown.atsScore}</div></div>
        <div><div class="faint">Skill Alignment</div><div class="mono" style="font-weight:700;">${opt.breakdown.skillAlignment}</div></div>
        <div><div class="faint">Project Relevance</div><div class="mono" style="font-weight:700;">${opt.breakdown.projectRelevance}</div></div>
        <div><div class="faint">Keyword Coverage</div><div class="mono" style="font-weight:700;">${opt.breakdown.keywordCoverage}</div></div>
        <div><div class="faint">Structure</div><div class="mono" style="font-weight:700;">${opt.breakdown.structure}</div></div>
      </div>
      <div class="section-title" style="font-size:11px;">Suggestions</div>
      <ul style="margin:6px 0 0; padding-left:18px; font-size:13px; line-height:1.6;">
        ${opt.suggestions.map((s) => `<li>${esc(s)}</li>`).join("")}
      </ul>
    ` : ""}
  </div>`;
}
