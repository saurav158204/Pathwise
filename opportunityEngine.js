// Career Opportunity Ranking (spec §6, §12). Combines candidate<->role fit with
// company hiring signals into one reproducible score, always with a "why" trail.
import { ROLES } from "../taxonomy.js";
import { computeRoleFit, DEFAULT_WEIGHTS } from "./scoringEngine.js";
import { getCompanies } from "../providers/companyProvider.js";

export const DEFAULT_OPPORTUNITY_WEIGHTS = Object.freeze({
  candidateFit: 0.40, marketDemand: 0.15, hiringSignal: 0.20, skillGap: 0.10, growth: 0.10, location: 0.05,
});

function hiringSignalScore(company) {
  let base = company.hiringTrend === "Expanding" ? 90 : company.hiringTrend === "Stable" ? 60 : 25;
  if (company.layoffSignal) base -= 20;
  return Math.max(5, Math.min(100, base));
}

function skillGapScore(fit, requiredCount) {
  if (requiredCount === 0) return 100;
  const missingRequired = fit.gaps.filter((g) => g.importance === "required").length;
  return Math.round(100 * (1 - missingRequired / requiredCount));
}

function locationScore(candidate, company) {
  const prefs = candidate.targetLocations || [];
  if (prefs.length === 0) return 80;
  if (company.hqCity === "Remote" || prefs.includes(company.hqCity)) return 100;
  return 40;
}

function whyBullets(fit, company, roleReq) {
  const bullets = [];
  if (fit.components.skillMatch >= 70) bullets.push(`Strong skill match (${fit.components.skillMatch}%)`);
  if (fit.strongSignals.length) bullets.push(`Relevant skills: ${fit.strongSignals.slice(0, 3).join(", ")}`);
  if (fit.components.marketDemand >= 65) bullets.push("High current market demand for this role");
  if (company.hiringTrend === "Expanding") bullets.push(`${company.name} is actively expanding hiring`);
  if (fit.components.projectMatch >= 60) bullets.push("Backed by relevant project experience");
  if (company.layoffSignal) bullets.push("Note: recent layoff signal reported at this company");
  return bullets;
}

export function computeOpportunities(candidate, marketSnapshot, weights = DEFAULT_WEIGHTS, oppWeights = DEFAULT_OPPORTUNITY_WEIGHTS) {
  const companies = getCompanies();
  const rows = [];
  for (const company of companies) {
    for (const openRole of company.openRoles) {
      const roleDef = ROLES.find((r) => r.id === openRole.roleId);
      if (!roleDef) continue;
      const fit = computeRoleFit(candidate, roleDef, marketSnapshot, weights);
      const hiring = hiringSignalScore(company);
      const gapScore = skillGapScore(fit, roleDef.requiredSkills.length);
      const location = locationScore(candidate, company);
      const opportunityScore = Math.round(
        oppWeights.candidateFit * fit.fit +
        oppWeights.marketDemand * fit.components.marketDemand +
        oppWeights.hiringSignal * hiring +
        oppWeights.skillGap * gapScore +
        oppWeights.growth * fit.components.growthSignal +
        oppWeights.location * location
      );
      rows.push({
        companyId: company.id, companyName: company.name, industry: company.industry, hqCity: company.hqCity,
        roleId: roleDef.id, roleName: roleDef.name, openPositions: openRole.count,
        opportunityScore: Math.max(0, Math.min(100, opportunityScore)),
        candidateFit: fit.fit, skillMatch: fit.components.skillMatch, marketDemand: fit.components.marketDemand,
        hiringSignal: hiring, hiringTrend: company.hiringTrend, layoffSignal: company.layoffSignal,
        missingSkills: fit.gaps.map((g) => g.skill), classification: fit.classification,
        why: whyBullets(fit, company, roleDef), source: company.source, timestamp: company.timestamp,
      });
    }
  }
  return rows.sort((a, b) => b.opportunityScore - a.opportunityScore);
}
