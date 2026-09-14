// Personalized Skill Gap Engine + Skill ROI / Opportunity-Unlocking Engine (spec §9, §10).
// Pure deterministic math over the candidate graph, role taxonomy, and market snapshot —
// "most valuable" is never just "biggest gap": it factors roles-unlocked and market demand too.
import { ROLES, categoryOf } from "../taxonomy.js";
import { computeAllRoleFits, CLASSIFICATION_THRESHOLDS, DEFAULT_WEIGHTS } from "./scoringEngine.js";
import { getSkillSignal } from "../providers/marketProvider.js";
import { getCompanies } from "../providers/companyProvider.js";

function candidateSkillSet(candidate) {
  return new Map((candidate.skills || []).map((s) => [s.name, s]));
}

export function computeSkillGaps(candidate, targetRoleIds, marketSnapshot) {
  const roles = targetRoleIds?.length ? ROLES.filter((r) => targetRoleIds.includes(r.id)) : [];
  const effectiveRoles = roles.length ? roles : computeAllRoleFits(candidate, marketSnapshot).slice(0, 3).map((f) => ROLES.find((r) => r.id === f.roleId));
  const importance = new Map(); // skill -> { requiredIn: Set(roleId), preferredIn: Set(roleId) }
  for (const role of effectiveRoles) {
    for (const s of role.requiredSkills) {
      if (!importance.has(s)) importance.set(s, { requiredIn: new Set(), preferredIn: new Set() });
      importance.get(s).requiredIn.add(role.id);
    }
    for (const s of role.preferredSkills) {
      if (!importance.has(s)) importance.set(s, { requiredIn: new Set(), preferredIn: new Set() });
      importance.get(s).preferredIn.add(role.id);
    }
  }

  const csMap = candidateSkillSet(candidate);
  const rows = [];
  for (const [skill, info] of importance.entries()) {
    const cs = csMap.get(skill);
    const proficiency = cs ? cs.proficiency : 0;
    const deficit = 1 - proficiency / 100;
    if (cs && proficiency >= 85) {
      rows.push({ skill, category: categoryOf(skill), priority: "Already Strong", proficiency, gapScore: 0, roleCoverage: info.requiredIn.size + info.preferredIn.size });
      continue;
    }
    const signal = getSkillSignal(skill);
    const marketDemand = (signal?.demandIndex ?? 50) / 100;
    const importanceWeight = info.requiredIn.size > 0 ? 1 : 0.6;
    const roleReach = (info.requiredIn.size + info.preferredIn.size) / effectiveRoles.length;
    const gapScore = importanceWeight * (0.4 + 0.6 * marketDemand) * deficit * (0.5 + 0.5 * Math.min(1, roleReach));
    let priority;
    if (gapScore >= 0.5) priority = "Critical Gap";
    else if (gapScore >= 0.32) priority = "High Priority";
    else if (gapScore >= 0.16) priority = "Medium Priority";
    else priority = "Low Priority";
    rows.push({ skill, category: categoryOf(skill), priority, proficiency, gapScore: Math.round(gapScore * 100) / 100, roleCoverage: info.requiredIn.size + info.preferredIn.size, trend: signal?.trend || "Stable" });
  }

  const order = { "Critical Gap": 0, "High Priority": 1, "Medium Priority": 2, "Low Priority": 3, "Already Strong": 4 };
  return rows.sort((a, b) => order[a.priority] - order[b.priority] || b.gapScore - a.gapScore);
}

export function computeSkillROI(candidate, marketSnapshot, weights = DEFAULT_WEIGHTS) {
  const currentFits = computeAllRoleFits(candidate, marketSnapshot, weights);
  const currentCompatible = currentFits.filter((f) => f.fit >= CLASSIFICATION_THRESHOLDS.target).length;
  const csMap = candidateSkillSet(candidate);
  const allRoleSkills = new Set(ROLES.flatMap((r) => [...r.requiredSkills, ...r.preferredSkills]));
  const missing = [...allRoleSkills].filter((s) => !csMap.has(s));
  const companies = getCompanies();

  const results = missing.map((skill) => {
    const simulated = {
      ...candidate,
      skills: [...(candidate.skills || []), { name: skill, category: categoryOf(skill), proficiency: 65, yearsExperience: 0.5, recency: 0, projectUsageCount: 0, confidence: 0.5, evidence: ["Simulated — skill not yet acquired"] }],
    };
    const afterFits = computeAllRoleFits(simulated, marketSnapshot, weights);
    const afterCompatible = afterFits.filter((f) => f.fit >= CLASSIFICATION_THRESHOLDS.target).length;
    const rolesUnlocked = Math.max(0, afterCompatible - currentCompatible);
    const companiesUnlocked = companies.filter((c) => c.openRoles.some((r) => r.requiredSkills.includes(skill) || r.preferredSkills.includes(skill))).length;
    const signal = getSkillSignal(skill);
    const marketDemandIndex = signal?.demandIndex ?? 50;
    const priorityScore = rolesUnlocked * 3 + companiesUnlocked * 0.4 + marketDemandIndex / 15 + (signal?.trend === "Rising" || signal?.trend === "Emerging" ? 2 : 0);
    let priority;
    if (priorityScore >= 9) priority = "Very High";
    else if (priorityScore >= 5.5) priority = "High";
    else if (priorityScore >= 3) priority = "Medium";
    else priority = "Low";
    return {
      skill, category: categoryOf(skill),
      currentCompatibleRoles: currentCompatible, afterRoles: afterCompatible, rolesUnlocked,
      companiesUnlocked, marketDemand: marketDemandIndex >= 70 ? "High" : marketDemandIndex >= 45 ? "Moderate" : "Low",
      trend: signal?.trend || "Stable", priority, priorityScore: Math.round(priorityScore * 10) / 10,
    };
  });

  return results.sort((a, b) => b.priorityScore - a.priorityScore);
}
