// Career What-If Simulator (spec §11). Pure projection over the deterministic scoring
// engine — never presented as an actual outcome, always labeled "projected".
import { ROLES, categoryOf } from "../taxonomy.js";
import { computeAllRoleFits, DEFAULT_WEIGHTS } from "./scoringEngine.js";

export function simulateSkillAdditions(candidate, addedSkills, marketSnapshot, weights = DEFAULT_WEIGHTS, roleIds = null) {
  const before = computeAllRoleFits(candidate, marketSnapshot, weights);
  const existing = new Set((candidate.skills || []).map((s) => s.name));
  const simulated = {
    ...candidate,
    skills: [
      ...(candidate.skills || []),
      ...addedSkills.filter((s) => !existing.has(s.name)).map((s) => ({
        name: s.name, category: categoryOf(s.name), proficiency: s.proficiency ?? 65,
        yearsExperience: 0.5, recency: 0, projectUsageCount: 0, confidence: 0.5,
        evidence: ["Projected — what-if simulation"],
      })),
    ],
  };
  const after = computeAllRoleFits(simulated, marketSnapshot, weights);

  const roles = roleIds?.length ? ROLES.filter((r) => roleIds.includes(r.id)) : ROLES;
  const comparison = roles.map((role) => {
    const b = before.find((f) => f.roleId === role.id);
    const a = after.find((f) => f.roleId === role.id);
    return { roleId: role.id, roleName: role.name, before: b.fit, after: a.fit, delta: a.fit - b.fit, beforeClass: b.classification, afterClass: a.classification };
  }).sort((x, y) => y.delta - x.delta);

  return { comparison, before, after };
}
