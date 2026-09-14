// Candidate Skill Graph builder (spec §2). Deterministic — turns whatever the resume
// parser extracted into skills with non-binary attributes: proficiency, evidence,
// years_experience, recency, project_usage, confidence. No skill is ever just true/false.
import { normalizeSkillName, categoryOf } from "../taxonomy.js";

function yearsOf(entry) {
  const start = entry.startDate ? new Date(entry.startDate) : null;
  const end = entry.current ? new Date() : entry.endDate ? new Date(entry.endDate) : null;
  if (start && end && end > start) return (end - start) / (1000 * 60 * 60 * 24 * 365.25);
  return 0;
}

function isRecent(entry) {
  if (entry.current) return true;
  const end = entry.endDate ? new Date(entry.endDate) : null;
  if (!end) return false;
  return (new Date() - end) / (1000 * 60 * 60 * 24 * 365.25) <= 1.5;
}

export function buildSkillGraph(extracted) {
  const bucket = new Map(); // canonical -> { projectUsage:[], experienceUsage:[], years, recentHit, listed }

  const ensure = (name) => {
    if (!bucket.has(name)) bucket.set(name, { projectUsage: [], experienceUsage: [], years: 0, recentHit: false, listed: false });
    return bucket.get(name);
  };

  for (const raw of extracted.technicalSkills || []) {
    const name = normalizeSkillName(raw);
    if (!name) continue;
    ensure(name).listed = true;
  }
  for (const p of extracted.projects || []) {
    for (const raw of p.skillsUsed || []) {
      const name = normalizeSkillName(raw);
      if (!name) continue;
      const e = ensure(name);
      e.projectUsage.push(p.name || "Untitled project");
      e.recentHit = true; // projects have no reliable dates; treat as current evidence
    }
  }
  for (const entry of [...(extracted.experience || []), ...(extracted.internships || [])]) {
    for (const raw of entry.skillsUsed || []) {
      const name = normalizeSkillName(raw);
      if (!name) continue;
      const e = ensure(name);
      e.experienceUsage.push(entry.title || entry.company || "Experience");
      e.years += yearsOf(entry);
      if (isRecent(entry)) e.recentHit = true;
    }
  }

  const skills = [];
  for (const [name, info] of bucket.entries()) {
    const evidence = [...info.projectUsage.map((p) => `Project: ${p}`), ...info.experienceUsage.map((x) => `Experience: ${x}`)];
    if (info.listed && evidence.length === 0) evidence.push("Listed in resume skills section");
    let proficiency = info.listed ? 40 : 20;
    proficiency += Math.min(30, info.projectUsage.length * 15);
    proficiency += Math.min(20, info.experienceUsage.length * 10);
    proficiency += Math.min(10, info.years * 5);
    proficiency = Math.max(15, Math.min(100, Math.round(proficiency)));

    const evidenceCount = info.projectUsage.length + info.experienceUsage.length;
    let confidence = 0.4 + 0.15 * Math.min(4, evidenceCount);
    if (evidenceCount === 0 && info.listed) confidence = 0.5;
    confidence = Math.round(Math.min(0.95, confidence) * 100) / 100;

    skills.push({
      name, category: categoryOf(name), proficiency,
      yearsExperience: Math.round(info.years * 10) / 10,
      recency: info.recentHit ? 0 : 1,
      projectUsageCount: info.projectUsage.length,
      confidence, evidence,
    });
  }

  return skills.sort((a, b) => b.proficiency - a.proficiency);
}
