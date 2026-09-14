// Resume Optimization (spec §14). ATS-style breakdown is fully deterministic;
// improvement suggestions are grounded in the resume text + computed gaps, never invented.
import { computeRoleFit, DEFAULT_WEIGHTS } from "./scoringEngine.js";

const SECTION_PATTERNS = {
  Education: /education/i, Experience: /experience|employment/i,
  Projects: /projects?/i, Skills: /skills/i, Certifications: /certifications?/i,
};

export function computeAtsBreakdown(candidate, resumeRawText, role, marketSnapshot, weights = DEFAULT_WEIGHTS) {
  const fit = computeRoleFit(candidate, role, marketSnapshot, weights);
  const text = (resumeRawText || "").toLowerCase();
  const roleSkills = [...role.requiredSkills, ...role.preferredSkills];
  const keywordHits = roleSkills.filter((s) => text.includes(s.toLowerCase()));
  const keywordCoverage = roleSkills.length ? Math.round((keywordHits.length / roleSkills.length) * 100) : 100;

  const sectionsFound = Object.entries(SECTION_PATTERNS).filter(([, re]) => re.test(resumeRawText || ""));
  const hasContact = /@/.test(resumeRawText || "") || /\+?\d[\d\s-]{7,}/.test(resumeRawText || "");
  const lengthOk = (resumeRawText || "").length > 400 && (resumeRawText || "").length < 20000;
  const structure = Math.round(((sectionsFound.length / Object.keys(SECTION_PATTERNS).length) * 70) + (hasContact ? 15 : 0) + (lengthOk ? 15 : 0));

  const atsScore = Math.round(
    0.30 * fit.components.skillMatch + 0.20 * fit.components.projectMatch + 0.15 * fit.components.experienceMatch +
    0.20 * keywordCoverage + 0.15 * structure
  );

  return {
    atsScore: Math.max(0, Math.min(100, atsScore)),
    skillAlignment: fit.components.skillMatch, projectRelevance: fit.components.projectMatch,
    experienceRelevance: fit.components.experienceMatch, keywordCoverage, structure,
    missingKeywords: roleSkills.filter((s) => !text.includes(s.toLowerCase())),
    sectionsFound: sectionsFound.map(([name]) => name),
    sectionsMissing: Object.keys(SECTION_PATTERNS).filter((name) => !sectionsFound.some(([n]) => n === name)),
    hasContact, fit,
  };
}

export function generateFallbackSuggestions(breakdown, role) {
  const suggestions = [];
  if (breakdown.missingKeywords.length) {
    suggestions.push(`Work "${breakdown.missingKeywords.slice(0, 4).join('", "')}" into your resume where genuinely applicable — ${role.name} postings weight these keywords heavily.`);
  }
  if (breakdown.sectionsMissing.includes("Projects")) suggestions.push("Add a dedicated Projects section — project evidence is one of the strongest signals for this role.");
  if (breakdown.sectionsMissing.includes("Certifications")) suggestions.push("List any relevant certifications explicitly under their own heading so ATS parsers pick them up.");
  if (!breakdown.hasContact) suggestions.push("Make sure your email or phone number is clearly present near the top of the resume.");
  if (breakdown.structure < 60) suggestions.push("Use clear section headings (Education, Experience, Projects, Skills) so both ATS systems and reviewers can scan quickly.");
  if (breakdown.projectRelevance < 50) suggestions.push(`Reframe existing project descriptions to foreground the skills ${role.name} roles ask for: ${role.requiredSkills.slice(0, 3).join(", ")}.`);
  if (suggestions.length === 0) suggestions.push("Your resume already covers the core signals for this role well — focus on quantifying impact in existing bullet points.");
  return suggestions;
}
