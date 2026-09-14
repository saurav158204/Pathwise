import { Store } from "./store.js";
import { getMarketSnapshot } from "./providers/marketProvider.js";
import { ROLES, normalizeSkillName, categoryOf } from "./taxonomy.js";
import { computeAllRoleFits, DEFAULT_WEIGHTS } from "./engine/scoringEngine.js";
import { computeSkillGaps, computeSkillROI } from "./engine/skillGapEngine.js";
import { computeOpportunities, DEFAULT_OPPORTUNITY_WEIGHTS } from "./engine/opportunityEngine.js";
import { simulateSkillAdditions } from "./engine/whatIf.js";
import { computeAtsBreakdown, generateFallbackSuggestions } from "./engine/resumeOptimizer.js";
import { extractTextFromFile, structureResumeText } from "./resumeParser.js";
import { buildContext, askCopilot } from "./copilot.js";
import { renderHome } from "./screens/home.js";
import { renderCareer } from "./screens/career.js";
import { renderOpportunities } from "./screens/opportunities.js";
import { renderInsights } from "./screens/insights.js";
import { renderProfile, emptyCandidate, LIST_FIELDS } from "./screens/profile.js";
import { renderFitModal } from "./screens/modal.js";
import { esc } from "./ui.js";
import { SAMPLE_CANDIDATE } from "./sampleCandidate.js";

const state = {
  route: "home",
  store: null,
  candidate: null,
  settings: { weights: { ...DEFAULT_WEIGHTS }, oppWeights: { ...DEFAULT_OPPORTUNITY_WEIGHTS } },
  marketSnapshot: getMarketSnapshot(),
  allFits: [], skillGaps: [], roiSkills: [], opportunities: [], applications: [],
  whatIf: { selected: [], result: null },
  ui: {
    resumeStatus: { state: "idle", message: "" },
    oppTab: "ranked", oppFilters: { industry: "all", classification: "all" },
    insightsTab: "market", marketFilters: { city: "all", industry: "all" },
    resumeOptimize: { roleId: ROLES[0].id, breakdown: null, suggestions: null, loading: false },
    modal: null, bannerDismissed: false,
    copilotOpen: false, copilotHistory: [], copilotLoading: false,
  },
};

const NAV = [
  { id: "home", label: "Home", icon: iconHome() },
  { id: "opportunities", label: "Opportunities", icon: iconBriefcase() },
  { id: "career", label: "Career", icon: iconChart() },
  { id: "insights", label: "Insights", icon: iconCompass() },
  { id: "profile", label: "Profile", icon: iconUser() },
];

function recompute() {
  if (!state.candidate) { state.allFits = []; state.skillGaps = []; state.roiSkills = []; state.opportunities = []; return; }
  const { weights, oppWeights } = state.settings;
  state.allFits = computeAllRoleFits(state.candidate, state.marketSnapshot, weights);
  state.skillGaps = computeSkillGaps(state.candidate, state.candidate.targetRoles, state.marketSnapshot);
  state.roiSkills = computeSkillROI(state.candidate, state.marketSnapshot, weights);
  state.opportunities = computeOpportunities(state.candidate, state.marketSnapshot, weights, oppWeights);
}

function screenFor(route) {
  return { home: renderHome, career: renderCareer, opportunities: renderOpportunities, insights: renderInsights, profile: renderProfile }[route] || renderHome;
}

function render() {
  document.querySelectorAll(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.route === state.route));
  const banner = document.getElementById("mock-banner");
  if (banner) banner.hidden = state.ui.bannerDismissed;
  const titleMap = { home: ["Home", "Your career, decided"], opportunities: ["Opportunities", "Ranked roles and companies, with the reasoning shown"], career: ["Career", "Where you stand, and what closes the gap"], insights: ["Market Intelligence", "Demand signals behind every score"], profile: ["Profile", "Your resume, skills, and settings"] };
  const [title, sub] = titleMap[state.route];
  document.getElementById("page-title").textContent = title;
  document.getElementById("page-sub").textContent = sub;
  document.getElementById("main-content").innerHTML = screenFor(state.route)(state);

  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = state.ui.modal?.type === "fit" ? renderFitModal(state.ui.modal.fit, state.ui.modal.companyName) : "";

  renderCopilot();
}

function renderCopilot() {
  const root = document.getElementById("copilot-root");
  if (!state.store?.sample) { root.innerHTML = ""; return; }
  if (!state.ui.copilotOpen) {
    root.innerHTML = `<button class="copilot-fab" data-action="toggle-copilot" title="Ask Career Copilot">${iconSpark()}</button>`;
    return;
  }
  const prompts = ["Which companies should I prioritize?", "What skills should I learn next?", "What happens if I learn AWS?", "How should I improve my resume?"];
  root.innerHTML = `
  <div class="copilot-panel">
    <div class="copilot-head">
      <div class="row" style="gap:8px;"><span style="color:var(--accent);">${iconSpark()}</span><strong style="font-size:13.5px;">Career Copilot</strong></div>
      <button class="btn btn-ghost btn-sm" data-action="toggle-copilot">✕</button>
    </div>
    <div class="copilot-body" id="copilot-body">
      ${state.ui.copilotHistory.length === 0 ? `
        <div class="faint" style="font-size:12.5px;">Ask me anything about your fit, gaps, or opportunities — I only use your saved profile data.</div>
        <div class="row" style="flex-wrap:wrap; gap:6px; margin-top:8px;">${prompts.map((p) => `<button class="suggest-chip" data-action="copilot-suggest" data-text="${esc(p)}">${esc(p)}</button>`).join("")}</div>
      ` : state.ui.copilotHistory.map((m) => `<div class="bubble ${m.role === "user" ? "user" : "ai"}">${esc(m.content)}</div>`).join("")}
      ${state.ui.copilotLoading ? `<div class="bubble ai"><span class="spinner"></span> Thinking…</div>` : ""}
    </div>
    <div class="copilot-foot">
      <input id="copilot-input" placeholder="${state.candidate ? "Ask about your career…" : "Build a profile first"}" ${state.candidate ? "" : "disabled"} />
      <button class="btn btn-primary btn-sm" data-action="copilot-send" ${state.candidate ? "" : "disabled"}>Send</button>
    </div>
  </div>`;
  const body = document.getElementById("copilot-body");
  if (body) body.scrollTop = body.scrollHeight;
}

// ---------- form <-> candidate sync ----------
function val(id) { return document.getElementById(id)?.value ?? ""; }

function readListFromDom(key) {
  const nodes = document.querySelectorAll(`[data-list="${key}"]`);
  const byIdx = new Map();
  nodes.forEach((el) => {
    const idx = Number(el.dataset.idx);
    if (!byIdx.has(idx)) byIdx.set(idx, {});
    const field = el.dataset.field;
    byIdx.get(idx)[field] = el.type === "checkbox" ? el.checked : el.value;
  });
  return [...byIdx.keys()].sort((a, b) => a - b).map((idx) => {
    const row = byIdx.get(idx);
    if (row.skillsUsed !== undefined) row.skillsUsed = row.skillsUsed.split(",").map((s) => normalizeSkillName(s.trim())).filter(Boolean);
    return row;
  });
}

function syncFormIntoCandidate() {
  if (!state.candidate) state.candidate = emptyCandidate();
  const c = state.candidate;
  if (document.getElementById("f-name")) {
    c.name = val("f-name"); c.email = val("f-email"); c.phone = val("f-phone"); c.location = val("f-location");
  }
  for (const key of Object.keys(LIST_FIELDS)) {
    if (document.querySelector(`[data-section="${key}"]`)) c[key] = readListFromDom(key);
  }
}

async function persistCandidate() {
  state.candidate = await state.store.saveCandidate(state.candidate);
  recompute();
}

// ---------- resume upload ----------
const MAX_RESUME_BYTES = 8 * 1024 * 1024;

async function handleResumeFile(file) {
  if (file.size > MAX_RESUME_BYTES) {
    state.ui.resumeStatus = { state: "error", message: "File is too large (max 8 MB). Try a smaller PDF/DOCX export of your resume." };
    render();
    return;
  }
  if (!/\.(pdf|docx|txt)$/i.test(file.name || "")) {
    state.ui.resumeStatus = { state: "error", message: "Unsupported file type. Upload a PDF, DOCX, or TXT resume." };
    render();
    return;
  }
  state.ui.resumeStatus = { state: "parsing", message: "Reading file…" };
  render();
  try {
    const rawText = await extractTextFromFile(file);
    if (rawText.length < 40) throw new Error("Could not read meaningful text from this file. Try a text-based PDF or DOCX.");
    state.ui.resumeStatus = { state: "parsing", message: state.store.sample ? "Understanding resume with AI…" : "Extracting resume with keyword parser…" };
    render();
    const { extracted, skills, usedAi } = await structureResumeText(rawText, state.store.sample);

    let resumeAssetId = state.candidate?.resumeAssetId || null;
    if ((file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) && state.store.assets) {
      const res = await state.store.uploadResume(file).catch(() => null);
      if (res) resumeAssetId = res.id;
    }

    const prevSkills = state.candidate?.skills || [];
    const mergedSkills = [...skills];
    for (const old of prevSkills) if (!mergedSkills.some((s) => s.name === old.name)) mergedSkills.push(old);

    state.candidate = {
      ...emptyCandidate(), ...(state.candidate || {}),
      name: extracted.name || state.candidate?.name || "", email: extracted.email || state.candidate?.email || "",
      phone: extracted.phone || state.candidate?.phone || "", location: extracted.location || state.candidate?.location || "",
      education: extracted.education.length ? extracted.education : state.candidate?.education || [],
      experience: extracted.experience.length ? extracted.experience : state.candidate?.experience || [],
      internships: extracted.internships.length ? extracted.internships : state.candidate?.internships || [],
      projects: extracted.projects.length ? extracted.projects : state.candidate?.projects || [],
      certifications: extracted.certifications.length ? extracted.certifications : state.candidate?.certifications || [],
      achievements: extracted.achievements.length ? extracted.achievements : state.candidate?.achievements || [],
      domains: extracted.domains.length ? extracted.domains : state.candidate?.domains || [],
      softSkills: extracted.softSkills.length ? extracted.softSkills : state.candidate?.softSkills || [],
      skills: mergedSkills, resumeRawText: rawText.slice(0, 50000), resumeAssetId,
      targetRoles: state.candidate?.targetRoles || [], targetIndustries: state.candidate?.targetIndustries || [], targetLocations: state.candidate?.targetLocations || [],
    };
    await persistCandidate();
    state.ui.resumeStatus = { state: "done", message: `Resume parsed${usedAi ? " with AI" : " with keyword matcher"} — review the fields below and edit anything that's wrong.` };
  } catch (err) {
    state.ui.resumeStatus = { state: "error", message: err.message || "Could not parse this resume." };
  }
  render();
}

async function loadSampleCandidate() {
  state.candidate = await state.store.saveCandidate(SAMPLE_CANDIDATE());
  state.ui.resumeStatus = { state: "done", message: "Loaded a sample candidate — edit freely." };
  recompute();
  render();
}

// ---------- event wiring ----------
function init() {
  document.getElementById("app").innerHTML = shellHtml();
  document.body.addEventListener("click", onClick);
  document.body.addEventListener("change", onChange);
  document.body.addEventListener("input", onInput);
  document.body.addEventListener("keydown", onKeydown);

  (async () => {
    state.store = await new Store().init();
    state.candidate = await state.store.getCandidate();
    const savedSettings = await state.store.getSettings();
    if (savedSettings) state.settings = savedSettings;
    state.applications = await state.store.listApplications();
    if (state.candidate) recompute();
    render();
  })();
}

function onClick(e) {
  if (e.target.id === "modal-backdrop") { state.ui.modal = null; render(); return; }
  const navBtn = e.target.closest("[data-route]");
  if (navBtn) { state.route = navBtn.dataset.route; render(); return; }
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const a = btn.dataset;

  switch (a.action) {
    case "load-sample": loadSampleCandidate(); break;
    case "pick-resume-file": document.getElementById("resume-file-input").click(); break;
    case "toggle-target-role": {
      syncFormIntoCandidate();
      const set = new Set(state.candidate.targetRoles || []);
      set.has(a.roleId) ? set.delete(a.roleId) : set.add(a.roleId);
      state.candidate.targetRoles = [...set];
      persistCandidate().then(render);
      break;
    }
    case "toggle-whatif-skill": {
      const i = state.whatIf.selected.indexOf(a.skill);
      i >= 0 ? state.whatIf.selected.splice(i, 1) : state.whatIf.selected.push(a.skill);
      render();
      break;
    }
    case "run-whatif": {
      const roleIds = state.candidate.targetRoles?.length ? state.candidate.targetRoles : state.allFits.slice(0, 5).map((f) => f.roleId);
      state.whatIf.result = simulateSkillAdditions(state.candidate, state.whatIf.selected.map((name) => ({ name, proficiency: 65 })), state.marketSnapshot, state.settings.weights, roleIds);
      render();
      break;
    }
    case "opp-tab": state.ui.oppTab = a.tab; render(); break;
    case "insights-tab": state.ui.insightsTab = a.tab; render(); break;
    case "save-opportunity": addApplicationFromOpportunity(a.companyId, a.roleId, "Saved"); break;
    case "apply-opportunity": addApplicationFromOpportunity(a.companyId, a.roleId, "Applied"); break;
    case "analyze-fit": {
      const fit = state.allFits.find((f) => f.roleId === a.roleId) || computeAllRoleFits(state.candidate, state.marketSnapshot, state.settings.weights, ROLES.filter((r) => r.id === a.roleId))[0];
      const opp = state.opportunities.find((o) => o.roleId === a.roleId && o.companyId === a.companyId);
      state.ui.modal = { type: "fit", fit, companyName: opp?.companyName };
      render();
      break;
    }
    case "close-modal": state.ui.modal = null; render(); break;
    case "delete-app": state.store.deleteApplication(a.id).then(async () => { state.applications = await state.store.listApplications(); render(); }); break;
    case "apply-sync-code": {
      const code = document.getElementById("sync-code-input").value.trim().replace(/[^A-Za-z0-9_\-.~:@+]/g, "").slice(0, 80);
      if (!code) break;
      state.store.setProfileKey(code);
      (async () => {
        state.candidate = await state.store.getCandidate();
        const s = await state.store.getSettings();
        if (s) state.settings = s;
        state.applications = await state.store.listApplications();
        recompute(); render();
      })();
      break;
    }
    case "toggle-list": {
      syncFormIntoCandidate();
      const set = new Set(state.candidate[a.key] || []);
      set.has(a.value) ? set.delete(a.value) : set.add(a.value);
      state.candidate[a.key] = [...set];
      persistCandidate().then(render);
      break;
    }
    case "add-row": {
      syncFormIntoCandidate();
      state.candidate[a.list] = [...(state.candidate[a.list] || []), {}];
      render();
      break;
    }
    case "remove-row": {
      syncFormIntoCandidate();
      state.candidate[a.list] = state.candidate[a.list].filter((_, i) => i !== Number(a.idx));
      render();
      break;
    }
    case "remove-tag": {
      syncFormIntoCandidate();
      state.candidate[a.key] = state.candidate[a.key].filter((_, i) => i !== Number(a.idx));
      persistCandidate().then(render);
      break;
    }
    case "save-profile-form": {
      syncFormIntoCandidate();
      persistCandidate().then(() => { state.ui.resumeStatus = { state: "done", message: "Profile saved." }; render(); });
      break;
    }
    case "remove-skill": {
      syncFormIntoCandidate();
      state.candidate.skills = state.candidate.skills.filter((s) => s.name !== a.skill);
      persistCandidate().then(render);
      break;
    }
    case "add-skill": {
      const input = document.getElementById("add-skill-input");
      const name = normalizeSkillName(input.value.trim());
      if (!name) break;
      syncFormIntoCandidate();
      if (!state.candidate.skills.some((s) => s.name === name)) {
        state.candidate.skills.push({ name, category: categoryOf(name), proficiency: 50, yearsExperience: 0, recency: 0, projectUsageCount: 0, confidence: 0.5, evidence: ["Manually added"] });
      }
      persistCandidate().then(render);
      break;
    }
    case "reset-weights": {
      state.settings = { weights: { ...DEFAULT_WEIGHTS }, oppWeights: { ...DEFAULT_OPPORTUNITY_WEIGHTS } };
      state.store.saveSettings(state.settings); recompute(); render();
      break;
    }
    case "run-resume-optimize": runResumeOptimize(); break;
    case "download-optimize-report": downloadOptimizeReport(); break;
    case "delete-profile": {
      if (!confirm("Delete your profile, resume, and applications? This cannot be undone.")) break;
      (async () => {
        await state.store.deleteCandidate();
        if (state.candidate?.resumeAssetId) await state.store.deleteResumeAsset(state.candidate.resumeAssetId);
        for (const app of state.applications) await state.store.deleteApplication(app.id);
        state.candidate = null; state.applications = []; state.ui.resumeStatus = { state: "idle", message: "" };
        recompute(); state.route = "home"; render();
      })();
      break;
    }
    case "dismiss-banner": state.ui.bannerDismissed = true; render(); break;
    case "toggle-copilot": state.ui.copilotOpen = !state.ui.copilotOpen; render(); break;
    case "copilot-suggest": document.getElementById("copilot-input").value = a.text; sendCopilot(); break;
    case "copilot-send": sendCopilot(); break;
  }
}

function onChange(e) {
  const el = e.target.closest("[data-action]");
  if (el?.dataset.action === "opp-filter") { state.ui.oppFilters[el.dataset.field] = el.value; render(); return; }
  if (el?.dataset.action === "market-filter") { state.ui.marketFilters[el.dataset.field] = el.value; render(); return; }
  if (el?.dataset.action === "update-app-status") { state.store.updateApplication(el.dataset.id, { status: el.value }).then(async () => { state.applications = await state.store.listApplications(); render(); }); return; }
  if (el?.dataset.action === "update-app-notes") { state.store.updateApplication(el.dataset.id, { notes: el.value }); return; }
  if (el?.dataset.action === "set-proficiency") {
    syncFormIntoCandidate();
    const s = state.candidate.skills.find((s) => s.name === el.dataset.skill);
    if (s) { s.proficiency = Number(el.value); persistCandidate().then(render); }
    return;
  }
  if (el?.dataset.action === "set-weight") {
    state.settings[el.dataset.group][el.dataset.key] = Number(el.value);
    state.store.saveSettings(state.settings); recompute(); render();
    return;
  }
  if (e.target.id === "resume-file-input" && e.target.files[0]) handleResumeFile(e.target.files[0]);
  if (e.target.id === "optimize-role-select") state.ui.resumeOptimize.roleId = e.target.value;
}

function onInput(e) {
  if (e.target.dataset.action === "set-proficiency") {
    const pct = e.target.closest(".skill-row")?.querySelector(".skill-pct");
    if (pct) pct.textContent = `${e.target.value}%`;
  }
  if (e.target.dataset.action === "set-weight") {
    const label = e.target.closest(".field")?.querySelector("label span");
    if (label) label.textContent = Number(e.target.value).toFixed(2);
  }
}

function onKeydown(e) {
  if (e.target.dataset.action === "tag-input" && e.key === "Enter") {
    e.preventDefault();
    const key = e.target.dataset.key;
    const value = e.target.value.trim();
    if (!value) return;
    syncFormIntoCandidate();
    state.candidate[key] = [...(state.candidate[key] || []), value];
    persistCandidate().then(render);
  }
  if (e.target.id === "copilot-input" && e.key === "Enter") sendCopilot();
}

function addApplicationFromOpportunity(companyId, roleId, status) {
  const opp = state.opportunities.find((o) => o.companyId === companyId && o.roleId === roleId);
  if (!opp) return;
  state.store.addApplication({ company: opp.companyName, role: opp.roleName, appliedDate: status === "Applied" ? new Date().toISOString() : null, status, jobUrl: "", notes: "" })
    .then(async () => { state.applications = await state.store.listApplications(); render(); });
}

async function runResumeOptimize() {
  const role = ROLES.find((r) => r.id === state.ui.resumeOptimize.roleId);
  state.ui.resumeOptimize.loading = true; render();
  const breakdown = computeAtsBreakdown(state.candidate, state.candidate.resumeRawText, role, state.marketSnapshot, state.settings.weights);
  let suggestions;
  if (state.store.sample) {
    try {
      const prompt = `You are a resume coach. Using ONLY the resume text and role gaps below, write 4-6 short, specific, actionable bullet suggestions to improve this resume for the "${role.name}" role. Do NOT invent experience, technologies, or metrics not already present. If a gap can't be fixed by rewriting (e.g. missing a skill entirely), suggest adding a project or line item about it only if plausible, otherwise suggest learning it.\n\nMISSING KEYWORDS: ${breakdown.missingKeywords.join(", ") || "none"}\nMISSING SECTIONS: ${breakdown.sectionsMissing.join(", ") || "none"}\n\nRESUME TEXT:\n"""${state.candidate.resumeRawText.slice(0, 8000)}"""\n\nReply with ONLY a JSON array of strings.`;
      suggestions = await state.store.sample.json(prompt, { modelTier: "default", cache: false });
      if (!Array.isArray(suggestions) || !suggestions.length) throw new Error("empty");
    } catch { suggestions = generateFallbackSuggestions(breakdown, role); }
  } else {
    suggestions = generateFallbackSuggestions(breakdown, role);
  }
  state.ui.resumeOptimize = { roleId: role.id, breakdown, suggestions, loading: false };
  render();
}

async function downloadOptimizeReport() {
  if (!state.store.downloads) return;
  const { breakdown, suggestions, roleId } = state.ui.resumeOptimize;
  const role = ROLES.find((r) => r.id === roleId);
  const report = `# Resume Optimization Report — ${role.name}\n\nATS Score: ${breakdown.atsScore}/100\nSkill Alignment: ${breakdown.skillAlignment}\nProject Relevance: ${breakdown.projectRelevance}\nExperience Relevance: ${breakdown.experienceRelevance}\nKeyword Coverage: ${breakdown.keywordCoverage}\nStructure: ${breakdown.structure}\n\nMissing keywords: ${breakdown.missingKeywords.join(", ") || "none"}\n\n## Suggestions\n${suggestions.map((s) => `- ${s}`).join("\n")}\n`;
  try { await state.store.downloads.save({ filename: `resume-optimization-${role.id}.md`, data: report }); } catch { /* viewer declined */ }
}

async function sendCopilot() {
  const input = document.getElementById("copilot-input");
  const question = input?.value.trim();
  if (!question || !state.store.sample) return;
  input.value = "";
  state.ui.copilotHistory.push({ role: "user", content: question });
  state.ui.copilotLoading = true;
  render();
  try {
    const context = buildContext({ candidate: state.candidate, allFits: state.allFits, skillGaps: state.skillGaps, roiSkills: state.roiSkills, opportunities: state.opportunities, applications: state.applications });
    const { text } = await askCopilot(state.store.sample, question, context, state.ui.copilotHistory.slice(0, -1));
    state.ui.copilotHistory.push({ role: "assistant", content: text });
  } catch (err) {
    state.ui.copilotHistory.push({ role: "assistant", content: err.code === "not_granted" ? "I need your permission to use Claude for this — try again and allow the prompt." : "I couldn't get an answer just now. Try again in a moment." });
  }
  state.ui.copilotLoading = false;
  render();
}

function shellHtml() {
  return `
  <nav class="rail">
    <div class="rail-brand"><span class="dot"></span> Pathwise</div>
    <div id="nav-list">${NAV.map((n) => `<button class="nav-item" data-route="${n.id}">${n.icon}${n.label}</button>`).join("")}</div>
    <div class="rail-footer">Demo build · simulated market &amp; company data</div>
  </nav>
  <main class="main">
    <div id="mock-banner" class="banner">
      <span>⚠</span>
      <span><strong>Demo build.</strong> Market demand, hiring signals, and company data are simulated for demonstration — not live employment statistics. Career fit and gap scores are computed deterministically from your profile; nothing here is a guaranteed outcome.</span>
      <button class="btn btn-ghost btn-sm" style="margin-left:auto;" data-action="dismiss-banner">✕</button>
    </div>
    <div class="topbar">
      <div><h1 class="page-title" id="page-title"></h1><div class="page-sub" id="page-sub"></div></div>
    </div>
    <div id="main-content"></div>
  </main>
  <nav class="bottom-tabs" id="nav-list-mobile">${NAV.map((n) => `<button class="nav-item" data-route="${n.id}">${n.icon}<span>${n.label}</span></button>`).join("")}</nav>
  <div id="modal-root"></div>
  <div id="copilot-root"></div>
  `;
}

function iconHome() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>`; }
function iconBriefcase() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`; }
function iconChart() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>`; }
function iconCompass() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M15 9l-3 6-3-6 6 0-3-3z"/></svg>`; }
function iconUser() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>`; }
function iconSpark() { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>`; }

// Nav clicks: rail + mobile bottom tabs share the same handler via body delegation.
document.addEventListener("DOMContentLoaded", init);
