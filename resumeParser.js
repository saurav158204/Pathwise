// ResumeParser (spec §1, §20-21). Text extraction is purely mechanical (PDF.js / mammoth.js).
// Structuring the text into a candidate profile uses the `sample` LLM capability when granted,
// with a fully deterministic regex/keyword fallback when it is not — either path is instructed
// (or, for the fallback, constructed) to use ONLY what's literally in the text. No invention.
import { FLAT_SKILLS, normalizeSkillName } from "./taxonomy.js";
import { buildSkillGraph } from "./engine/skillGraph.js";

const PDFJS_VERSION = "2.16.105";
let pdfjsReady = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function ensurePdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (!pdfjsReady) {
    pdfjsReady = loadScript(`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`).then(() => {
      const blob = new Blob([`importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js');`], { type: "application/javascript" });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
      return window.pdfjsLib;
    });
  }
  return pdfjsReady;
}

async function ensureMammoth() {
  if (window.mammoth) return window.mammoth;
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.12.3/mammoth.browser.min.js");
  return window.mammoth;
}

export async function extractTextFromFile(file) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdfjsLib = await ensurePdfJs();
    const buf = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(" ") + "\n";
    }
    return text.trim();
  }
  if (name.endsWith(".docx")) {
    const mammoth = await ensureMammoth();
    const buf = await file.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    return (value || "").trim();
  }
  if (name.endsWith(".txt")) return (await file.text()).trim();
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT resume.");
}

const EMPTY_EXTRACTION = {
  name: "", email: "", phone: "", location: "",
  education: [], experience: [], internships: [], projects: [],
  technicalSkills: [], certifications: [], achievements: [], domains: [], softSkills: [],
};

function validateExtraction(obj) {
  const out = { ...EMPTY_EXTRACTION };
  for (const key of Object.keys(EMPTY_EXTRACTION)) {
    if (Array.isArray(EMPTY_EXTRACTION[key])) out[key] = Array.isArray(obj?.[key]) ? obj[key] : [];
    else out[key] = typeof obj?.[key] === "string" ? obj[key] : "";
  }
  return out;
}

const EXTRACTION_PROMPT = (text) => `You extract structured candidate data from a resume for a career-intelligence tool.
STRICT RULES:
- Use ONLY information literally present in the RESUME TEXT below.
- NEVER invent names, companies, dates, metrics, or skills that are not in the text.
- If a field cannot be determined, use an empty string or empty array.
- "technicalSkills" must be a flat array of technology/tool/language/framework names only (no soft skills, no sentences).
- "skillsUsed" inside experience/internships/projects entries must list only technologies explicitly mentioned in that entry's own description.

Reply with ONLY a JSON object of this exact shape:
{
 "name": string, "email": string, "phone": string, "location": string,
 "education": [{"degree": string, "field": string, "institution": string, "startYear": string, "endYear": string}],
 "experience": [{"title": string, "company": string, "startDate": string, "endDate": string, "current": boolean, "description": string, "skillsUsed": string[]}],
 "internships": [{"title": string, "company": string, "startDate": string, "endDate": string, "description": string, "skillsUsed": string[]}],
 "projects": [{"name": string, "description": string, "skillsUsed": string[]}],
 "technicalSkills": string[],
 "certifications": [{"name": string, "issuer": string, "year": string}],
 "achievements": string[],
 "domains": string[],
 "softSkills": string[]
}

RESUME TEXT:
"""
${text.slice(0, 11000)}
"""`;

async function aiStructure(sample, rawText) {
  const data = await sample.json(EXTRACTION_PROMPT(rawText), { modelTier: "default", cache: false });
  return validateExtraction(data);
}

// Deterministic fallback: keyword/section heuristics only, zero invention by construction.
function heuristicStructure(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const email = (rawText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [""])[0];
  const phone = (rawText.match(/(\+?\d[\d\s-]{8,}\d)/) || [""])[0];
  const name = lines.find((l) => l.length > 2 && l.length < 60 && !/@/.test(l) && !/\d{3}/.test(l)) || "";

  const headerRe = {
    education: /^education/i, experience: /^(experience|employment|work experience)/i,
    internships: /^internships?/i, projects: /^projects?/i, skills: /^(technical )?skills/i,
    certifications: /^certifications?/i, achievements: /^(achievements|awards)/i,
  };
  const sections = {};
  let current = "other";
  for (const line of lines) {
    const hit = Object.entries(headerRe).find(([, re]) => re.test(line));
    if (hit) { current = hit[0]; sections[current] = sections[current] || []; continue; }
    (sections[current] = sections[current] || []).push(line);
  }

  const skillRegexFind = (text) => {
    const found = new Set();
    for (const skill of FLAT_SKILLS) {
      const re = new RegExp(`(?<![\\w])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w])`, "i");
      if (re.test(text)) found.add(skill);
    }
    return [...found];
  };

  const technicalSkills = sections.skills
    ? sections.skills.join(" ").split(/[,•|\n]/).map((s) => normalizeSkillName(s.trim())).filter(Boolean)
    : skillRegexFind(rawText);

  const toBlockEntries = (linesArr, kind) => {
    if (!linesArr?.length) return [];
    const blocks = [];
    let block = [];
    for (const l of linesArr) {
      if (l.length < 90 && block.length && /^[A-Z0-9]/.test(l) && block.length > 2) { blocks.push(block); block = [l]; }
      else block.push(l);
    }
    if (block.length) blocks.push(block);
    return blocks.slice(0, 8).map((b) => {
      const text = b.join(" ");
      return kind === "project"
        ? { name: b[0].slice(0, 80), description: text, skillsUsed: skillRegexFind(text) }
        : { title: b[0].slice(0, 80), company: "", startDate: "", endDate: "", current: false, description: text, skillsUsed: skillRegexFind(text) };
    });
  };

  return validateExtraction({
    name, email, phone, location: "",
    education: (sections.education || []).map((l) => ({ degree: l, field: "", institution: "", startYear: "", endYear: "" })),
    experience: toBlockEntries(sections.experience, "experience"),
    internships: toBlockEntries(sections.internships, "experience"),
    projects: toBlockEntries(sections.projects, "project"),
    technicalSkills, certifications: (sections.certifications || []).map((l) => ({ name: l, issuer: "", year: "" })),
    achievements: sections.achievements || [], domains: [], softSkills: [],
  });
}

export async function structureResumeText(rawText, sample) {
  let extracted; let usedAi = false;
  if (sample) {
    try { extracted = await aiStructure(sample, rawText); usedAi = true; }
    catch { extracted = heuristicStructure(rawText); }
  } else {
    extracted = heuristicStructure(rawText);
  }
  const skills = buildSkillGraph(extracted);
  return { extracted, skills, usedAi };
}
