// Deterministic Career Fit Engine. No LLM involvement here by design (spec §4/§21):
// every score below is derived from measurable signals and is fully explainable.
import { ROLES, educationSatisfies } from "../taxonomy.js";
import { getRoleSignal } from "../providers/marketProvider.js";

export const DEFAULT_WEIGHTS = Object.freeze({
  skill: 0.32,
  experience: 0.14,
  project: 0.16,
  education: 0.08,
  certification: 0.05,
  marketDemand: 0.15,
  growth: 0.10,
});

export const CLASSIFICATION_THRESHOLDS = Object.freeze({ strong: 82, target: 62, reach: 42 });

function skillMap(candidate) {
  const m = new Map();
  for (const s of candidate.skills || []) m.set(s.name, s);
  return m;
}

function weightedSkillMatch(candidateSkillMap, requiredSkills, preferredSkills) {
  let earned = 0, possible = 0;
  const matched = [], missingRequired = [], missingPreferred = [];
  for (const skill of requiredSkills) {
    possible += 2;
    const cs = candidateSkillMap.get(skill);
    if (cs) { earned += 2 * (cs.proficiency / 100); matched.push({ skill, weight: 2, proficiency: cs.proficiency }); }
    else missingRequired.push(skill);
  }
  for (const skill of preferredSkills) {
    possible += 1;
    const cs = candidateSkillMap.get(skill);
    if (cs) { earned += 1 * (cs.proficiency / 100); matched.push({ skill, weight: 1, proficiency: cs.proficiency }); }
    else missingPreferred.push(skill);
  }
  const ratio = possible === 0 ? 1 : earned / possible;
  return { ratio, matched, missingRequired, missingPreferred };
}

function totalExperienceYears(candidate) {
  const spans = [...(candidate.experience || []), ...(candidate.internships || [])];
  let years = 0;
  for (const s of spans) {
    const start = s.startDate ? new Date(s.startDate) : null;
    const end = s.current ? new Date() : s.endDate ? new Date(s.endDate) : null;
    if (start && end && end > start) years += (end - start) / (1000 * 60 * 60 * 24 * 365.25);
  }
  return years;
}

function projectSkillCoverage(candidate, requiredSkills, preferredSkills) {
  const used = new Set((candidate.projects || []).flatMap((p) => p.skillsUsed || []));
  let earned = 0, possible = 0;
  for (const s of requiredSkills) { possible += 2; if (used.has(s)) earned += 2; }
  for (const s of preferredSkills) { possible += 1; if (used.has(s)) earned += 1; }
  return possible === 0 ? 1 : earned / possible;
}

function certificationCoverage(candidate, requiredSkills, preferredSkills) {
  const certs = candidate.certifications || [];
  if (certs.length === 0) return 0.4; // neutral baseline — absence of certs isn't disqualifying
  const skills = [...requiredSkills, ...preferredSkills];
  if (skills.length === 0) return 0.6;
  const hits = skills.filter((s) => certs.some((c) => (c.name || "").toLowerCase().includes(s.toLowerCase())));
  return Math.min(1, 0.4 + 0.6 * (hits.length / skills.length));
}

export function computeRoleFit(candidate, role, marketSnapshot, weights = DEFAULT_WEIGHTS) {
  const csMap = skillMap(candidate);
  const { ratio: skillRatio, matched, missingRequired, missingPreferred } = weightedSkillMatch(csMap, role.requiredSkills, role.preferredSkills);
  const years = totalExperienceYears(candidate);
  const experienceMatch = role.minYearsExperience === 0
    ? ((candidate.experience?.length || candidate.internships?.length) ? 1 : 0.7)
    : Math.min(1, years / role.minYearsExperience);
  const projectMatch = projectSkillCoverage(candidate, role.requiredSkills, role.preferredSkills);
  const educationMatch = educationSatisfies(candidate.education, role.educationLevel);
  const certificationMatch = certificationCoverage(candidate, role.requiredSkills, role.preferredSkills);
  const roleSignal = getRoleSignal(role.id) || { demandIndex: role.baseDemandIndex, growthRatePct: role.baseGrowthRatePct };
  const marketDemand = roleSignal.demandIndex / 100;
  const growthSignal = Math.min(1, roleSignal.growthRatePct / 20);

  const components = {
    skillMatch: Math.round(skillRatio * 100),
    experienceMatch: Math.round(experienceMatch * 100),
    projectMatch: Math.round(projectMatch * 100),
    educationMatch: Math.round(educationMatch * 100),
    certificationMatch: Math.round(certificationMatch * 100),
    marketDemand: Math.round(marketDemand * 100),
    growthSignal: Math.round(growthSignal * 100),
  };

  const fitRaw = weights.skill * skillRatio + weights.experience * experienceMatch + weights.project * projectMatch
    + weights.education * educationMatch + weights.certification * certificationMatch
    + weights.marketDemand * marketDemand + weights.growth * growthSignal;
  const fit = Math.max(0, Math.min(100, Math.round(fitRaw * 100)));

  const strongSignals = matched
    .sort((a, b) => b.weight - a.weight || b.proficiency - a.proficiency)
    .slice(0, 5)
    .map((m) => m.skill);
  if (projectMatch >= 0.6) strongSignals.push(`Relevant project experience (${Math.round(projectMatch * 100)}% skill coverage)`);

  const gaps = [
    ...missingRequired.map((skill) => ({ skill, importance: "required" })),
    ...missingPreferred.map((skill) => ({ skill, importance: "preferred" })),
  ];

  return {
    roleId: role.id, roleName: role.name, fit, components,
    strongSignals, gaps,
    classification: classifyOpportunity(fit),
    marketLabel: components.marketDemand >= 70 ? "High" : components.marketDemand >= 45 ? "Moderate" : "Low",
    salaryRangeINR: role.salaryRangeINR,
    weightsUsed: weights,
  };
}

export function classifyOpportunity(fit) {
  if (fit >= CLASSIFICATION_THRESHOLDS.strong) return "Strong Match";
  if (fit >= CLASSIFICATION_THRESHOLDS.target) return "Target";
  if (fit >= CLASSIFICATION_THRESHOLDS.reach) return "Reach";
  return "Low Fit";
}

export function computeAllRoleFits(candidate, marketSnapshot, weights = DEFAULT_WEIGHTS, roles = ROLES) {
  return roles.map((role) => computeRoleFit(candidate, role, marketSnapshot, weights)).sort((a, b) => b.fit - a.fit);
}

export function careerReadinessScore(allFits) {
  if (!allFits.length) return 0;
  const top3 = allFits.slice(0, 3);
  return Math.round(top3.reduce((sum, f) => sum + f.fit, 0) / top3.length);
}
