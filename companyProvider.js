// CompanyDataProvider — mock implementation behind a stable interface.
// Real hiring-activity feeds would implement the same shape: getCompanies().
const SOURCE = "Mock Provider (demo hiring-activity dataset)";
const NOW = new Date().toISOString();

const COMPANIES = [
  { id: "c-nimbus", name: "Nimbus Cloudworks", industry: "SaaS", hqCity: "Bengaluru", sizeBand: "501-2000", hiringTrend: "Expanding", layoffSignal: false,
    openRoles: [
      { roleId: "backend-engineer", count: 6, requiredSkills: ["Python", "REST", "PostgreSQL"], preferredSkills: ["Docker", "AWS"] },
      { roleId: "cloud-engineer", count: 3, requiredSkills: ["AWS", "Linux"], preferredSkills: ["Kubernetes", "Terraform"] },
    ] },
  { id: "c-ledgerly", name: "Ledgerly Fintech", industry: "Fintech", hqCity: "Mumbai", sizeBand: "201-500", hiringTrend: "Expanding", layoffSignal: false,
    openRoles: [
      { roleId: "backend-engineer", count: 4, requiredSkills: ["Python", "PostgreSQL", "REST"], preferredSkills: ["Redis", "System Design"] },
      { roleId: "data-engineer", count: 2, requiredSkills: ["Python", "SQL", "ETL"], preferredSkills: ["Apache Kafka", "AWS"] },
    ] },
  { id: "c-shopstream", name: "ShopStream Retail Tech", industry: "E-commerce", hqCity: "Bengaluru", sizeBand: "2000+", hiringTrend: "Stable", layoffSignal: false,
    openRoles: [
      { roleId: "fullstack-engineer", count: 5, requiredSkills: ["JavaScript", "React", "Node.js"], preferredSkills: ["TypeScript", "AWS"] },
      { roleId: "frontend-engineer", count: 3, requiredSkills: ["JavaScript", "React"], preferredSkills: ["Next.js", "TypeScript"] },
      { roleId: "qa-engineer", count: 2, requiredSkills: ["REST"], preferredSkills: ["Postman", "CI/CD"] },
    ] },
  { id: "c-vitalcare", name: "VitalCare Health", industry: "Healthtech", hqCity: "Hyderabad", sizeBand: "501-2000", hiringTrend: "Expanding", layoffSignal: false,
    openRoles: [
      { roleId: "ml-engineer", count: 2, requiredSkills: ["Python", "Machine Learning"], preferredSkills: ["TensorFlow", "PyTorch"] },
      { roleId: "backend-engineer", count: 3, requiredSkills: ["Python", "REST"], preferredSkills: ["PostgreSQL", "Docker"] },
    ] },
  { id: "c-syncore", name: "Syncore Systems", industry: "SaaS", hqCity: "Pune", sizeBand: "51-200", hiringTrend: "Contracting", layoffSignal: true,
    openRoles: [
      { roleId: "devops-engineer", count: 1, requiredSkills: ["Linux", "Docker"], preferredSkills: ["Kubernetes", "CI/CD"] },
    ] },
  { id: "c-quanta", name: "Quanta AI Labs", industry: "SaaS", hqCity: "Bengaluru", sizeBand: "51-200", hiringTrend: "Expanding", layoffSignal: false,
    openRoles: [
      { roleId: "ai-engineer", count: 4, requiredSkills: ["Python", "LLMs"], preferredSkills: ["Generative AI", "NLP", "PyTorch"] },
      { roleId: "ml-engineer", count: 2, requiredSkills: ["Python", "Machine Learning"], preferredSkills: ["Deep Learning", "MLOps"] },
    ] },
  { id: "c-routewise", name: "RouteWise Logistics", industry: "Logistics", hqCity: "Chennai", sizeBand: "501-2000", hiringTrend: "Stable", layoffSignal: false,
    openRoles: [
      { roleId: "data-engineer", count: 2, requiredSkills: ["Python", "SQL"], preferredSkills: ["Apache Spark", "ETL"] },
      { roleId: "automation-engineer", count: 2, requiredSkills: ["Python", "CI/CD"], preferredSkills: ["Ansible", "Jenkins"] },
    ] },
  { id: "c-brightlearn", name: "BrightLearn EdTech", industry: "EdTech", hqCity: "Gurugram", sizeBand: "201-500", hiringTrend: "Stable", layoffSignal: false,
    openRoles: [
      { roleId: "frontend-engineer", count: 2, requiredSkills: ["JavaScript", "React"], preferredSkills: ["TypeScript"] },
      { roleId: "product-analyst", count: 1, requiredSkills: ["SQL", "Excel"], preferredSkills: ["Power BI"] },
    ] },
  { id: "c-fortiguard", name: "FortiGuard Security", industry: "Cybersecurity", hqCity: "Bengaluru", sizeBand: "201-500", hiringTrend: "Expanding", layoffSignal: false,
    openRoles: [
      { roleId: "cybersecurity-engineer", count: 3, requiredSkills: ["Linux", "Cybersecurity"], preferredSkills: ["AWS", "System Design"] },
    ] },
  { id: "c-pixelforge", name: "PixelForge Games", industry: "Gaming", hqCity: "Pune", sizeBand: "51-200", hiringTrend: "Contracting", layoffSignal: true,
    openRoles: [
      { roleId: "fullstack-engineer", count: 1, requiredSkills: ["JavaScript", "Node.js"], preferredSkills: ["React"] },
      { roleId: "qa-engineer", count: 1, requiredSkills: ["REST"], preferredSkills: ["Python"] },
    ] },
  { id: "c-databridge", name: "DataBridge Analytics", industry: "SaaS", hqCity: "Hyderabad", sizeBand: "201-500", hiringTrend: "Expanding", layoffSignal: false,
    openRoles: [
      { roleId: "data-analyst", count: 4, requiredSkills: ["SQL", "Excel"], preferredSkills: ["Python", "Power BI", "Tableau"] },
      { roleId: "data-engineer", count: 2, requiredSkills: ["Python", "SQL", "ETL"], preferredSkills: ["Apache Spark"] },
    ] },
  { id: "c-northgate", name: "Northgate Cloud Services", industry: "SaaS", hqCity: "Remote", sizeBand: "2000+", hiringTrend: "Expanding", layoffSignal: false,
    openRoles: [
      { roleId: "devops-engineer", count: 5, requiredSkills: ["Linux", "Docker", "CI/CD"], preferredSkills: ["Kubernetes", "Terraform", "AWS"] },
      { roleId: "cloud-engineer", count: 4, requiredSkills: ["AWS", "Linux"], preferredSkills: ["Azure", "Kubernetes"] },
    ] },
  { id: "c-mintpay", name: "MintPay Financial", industry: "Fintech", hqCity: "Mumbai", sizeBand: "501-2000", hiringTrend: "Stable", layoffSignal: false,
    openRoles: [
      { roleId: "backend-engineer", count: 3, requiredSkills: ["Java", "REST"], preferredSkills: ["PostgreSQL", "Docker"] },
      { roleId: "cybersecurity-engineer", count: 1, requiredSkills: ["Linux", "Cybersecurity"], preferredSkills: ["AWS"] },
    ] },
  { id: "c-legacybank", name: "LegacyBank Technologies", industry: "Fintech", hqCity: "Chennai", sizeBand: "2000+", hiringTrend: "Contracting", layoffSignal: true,
    openRoles: [
      { roleId: "qa-engineer", count: 2, requiredSkills: ["REST"], preferredSkills: ["Postman"] },
    ] },
];

export function getCompanies() {
  return COMPANIES.map((c) => ({ ...c, source: SOURCE, timestamp: NOW, confidence: 0.68 }));
}

export function getCompanyById(id) {
  return getCompanies().find((c) => c.id === id) || null;
}
