// AI Career Copilot (spec §13). Retrieval-grounded: the LLM only ever sees a JSON snapshot
// of THIS candidate's already-computed scores — it is never asked to invent facts or rescore.
export function buildContext({ candidate, allFits, skillGaps, roiSkills, opportunities, applications }) {
  return {
    candidateName: candidate.name || "the candidate",
    targetRoles: candidate.targetRoles || [],
    targetLocations: candidate.targetLocations || [],
    topSkills: (candidate.skills || []).slice(0, 12).map((s) => ({ name: s.name, proficiency: s.proficiency })),
    roleFits: allFits.slice(0, 8).map((f) => ({ role: f.roleName, fit: f.fit, classification: f.classification, gaps: f.gaps.slice(0, 4).map((g) => g.skill) })),
    topSkillGaps: skillGaps.filter((g) => g.priority !== "Already Strong").slice(0, 8).map((g) => ({ skill: g.skill, priority: g.priority })),
    topSkillROI: roiSkills.slice(0, 6).map((r) => ({ skill: r.skill, rolesUnlocked: r.rolesUnlocked, companiesUnlocked: r.companiesUnlocked, priority: r.priority })),
    topOpportunities: opportunities.slice(0, 8).map((o) => ({ company: o.companyName, role: o.roleName, opportunityScore: o.opportunityScore, missingSkills: o.missingSkills.slice(0, 3) })),
    applicationsSummary: {
      total: applications.length,
      byStatus: applications.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {}),
    },
  };
}

const SYSTEM_PREAMBLE = `You are the AI Career Copilot inside a campus placement intelligence platform.
Answer ONLY using the CANDIDATE CONTEXT JSON provided in this message. It already contains
deterministically computed fit scores, gaps, ROI-ranked skills, and ranked opportunities — do not
recompute or contradict those numbers, and do not invent companies, roles, or skills that are not
in the context. If the question asks something the context cannot answer, say so plainly and
suggest what the candidate could add to their profile to get that answer. Be concise, specific,
and reference actual numbers from the context. Never claim a hiring outcome is guaranteed.`;

export async function askCopilot(sample, question, context, history = []) {
  const contextTurn = `${SYSTEM_PREAMBLE}\n\nCANDIDATE CONTEXT JSON:\n${JSON.stringify(context)}`;
  const turns = [{ role: "user", content: contextTurn }];
  for (const h of history) turns.push(h);
  turns.push({ role: "user", content: question });
  return sample(turns, { modelTier: "default", cache: false });
}
