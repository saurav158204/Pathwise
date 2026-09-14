// MarketDataProvider — mock implementation behind a stable interface.
// Every signal is timestamped with source/region/time_period/confidence, per spec.
// Swap this file for a real provider (job boards, labour-market APIs) without touching callers.
import { ROLES, FLAT_SKILLS, categoryOf } from "../taxonomy.js";

const NOW = new Date().toISOString();
const SOURCE = "Mock Provider (demo employment dataset)";
const REGION = "India";

// Deterministic pseudo-random so scores are reproducible across sessions/runs.
function seedRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const RISING = new Set(["Python", "AWS", "Docker", "Kubernetes", "LLMs", "Generative AI", "Machine Learning", "TypeScript", "React", "Terraform", "MLOps", "Data Structures", "System Design", "PostgreSQL", "Apache Kafka", "NLP", "Deep Learning", "Next.js", "Go", "Cybersecurity"]);
const DECLINING = new Set(["PHP", "jQuery", "Oracle DB", "ASP.NET", "C"]);
const EMERGING = new Set(["Generative AI", "LLMs", "MLOps"]);

function trendFor(skill) {
  if (EMERGING.has(skill)) return "Emerging";
  if (RISING.has(skill)) return "Rising";
  if (DECLINING.has(skill)) return "Declining";
  return "Stable";
}

let _cache = null;

export function getMarketSnapshot() {
  if (_cache) return _cache;

  const skillSignals = FLAT_SKILLS.map((skill) => {
    const base = 40 + (hashStr(skill) % 55);
    const trend = trendFor(skill);
    const demandIndex = trend === "Rising" || trend === "Emerging" ? Math.min(99, base + 15) : trend === "Declining" ? Math.max(10, base - 25) : base;
    return {
      skill, category: categoryOf(skill), trend, demandIndex,
      source: SOURCE, timestamp: NOW, region: REGION, time_period: "trailing-90-days",
      confidence: trend === "Emerging" ? 0.55 : 0.75,
    };
  });

  const roleSignals = ROLES.map((role) => {
    const jitter = (hashStr(role.id) % 10) - 5;
    return {
      roleId: role.id, role: role.name,
      demandIndex: Math.max(5, Math.min(99, role.baseDemandIndex + jitter)),
      growthRatePct: role.baseGrowthRatePct,
      avgSalaryINR: Math.round((role.salaryRangeINR[0] + role.salaryRangeINR[1]) / 2),
      source: SOURCE, timestamp: NOW, region: REGION, time_period: "trailing-90-days", confidence: 0.7,
    };
  });

  const industries = ["SaaS", "Fintech", "E-commerce", "Healthtech", "EdTech", "Logistics", "Gaming", "Cybersecurity"];
  const industrySignals = industries.map((industry) => ({
    industry,
    healthIndex: 50 + (hashStr(industry) % 45),
    hiringTrend: hashStr(industry) % 3 === 0 ? "Contracting" : hashStr(industry) % 3 === 1 ? "Stable" : "Expanding",
    source: SOURCE, timestamp: NOW, region: REGION, time_period: "trailing-90-days", confidence: 0.65,
  }));

  const cities = ["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Gurugram", "Chennai", "Remote"];
  const geoSignals = cities.map((city) => ({
    city, demandIndex: 45 + (hashStr(city) % 50),
    source: SOURCE, timestamp: NOW, region: REGION, time_period: "trailing-90-days", confidence: 0.6,
  }));

  _cache = { skillSignals, roleSignals, industrySignals, geoSignals, generatedAt: NOW, source: SOURCE };
  return _cache;
}

export function getSkillSignal(skillCanonical) {
  return getMarketSnapshot().skillSignals.find((s) => s.skill === skillCanonical) || null;
}

export function getRoleSignal(roleId) {
  return getMarketSnapshot().roleSignals.find((r) => r.roleId === roleId) || null;
}
