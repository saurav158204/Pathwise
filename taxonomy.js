// Canonical skill taxonomy + synonym normalization + role taxonomy.
// SkillTaxonomyProvider: extensible — add entries to SKILL_TAXONOMY / SKILL_SYNONYMS / ROLES.

export const SKILL_TAXONOMY = {
  "Programming Languages": ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "C#", "Go", "Rust", "Kotlin", "Swift", "PHP", "Ruby", "R", "Dart", "SQL"],
  "Frameworks": ["React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Flutter", "React Native", ".NET"],
  "Libraries": ["Pandas", "NumPy", "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "OpenCV", "Redux", "jQuery", "D3.js"],
  "Databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle DB", "Cassandra", "DynamoDB", "Elasticsearch", "Firebase"],
  "Cloud": ["AWS", "Azure", "Google Cloud Platform", "Vercel", "Heroku", "Cloudflare"],
  "DevOps": ["Docker", "Kubernetes", "GitHub Actions", "Jenkins", "Terraform", "Ansible", "CI/CD", "Linux", "Nginx"],
  "AI/ML": ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "LLMs", "Generative AI", "MLOps", "Data Science"],
  "Data": ["Data Structures", "Algorithms", "System Design", "REST", "GraphQL", "gRPC", "Apache Kafka", "Apache Spark", "ETL", "Power BI", "Tableau", "Excel"],
  "Tools": ["Git", "Jira", "Figma", "Postman", "VS Code"],
  "Domains": ["Fintech", "Healthtech", "E-commerce", "EdTech", "SaaS", "Cybersecurity", "Gaming", "Logistics"],
};

export const FLAT_SKILLS = Object.values(SKILL_TAXONOMY).flat();

export const SKILL_CATEGORY_OF = Object.fromEntries(
  Object.entries(SKILL_TAXONOMY).flatMap(([cat, skills]) => skills.map((s) => [s, cat]))
);

// alias (lowercase, punctuation-loose) -> canonical name
const RAW_SYNONYMS = {
  "js": "JavaScript", "ecmascript": "JavaScript",
  "ts": "TypeScript",
  "node": "Node.js", "nodejs": "Node.js",
  "reactjs": "React", "react.js": "React",
  "vuejs": "Vue", "vue.js": "Vue",
  "angularjs": "Angular",
  "nextjs": "Next.js",
  "postgres": "PostgreSQL", "postgressql": "PostgreSQL", "psql": "PostgreSQL",
  "mongo": "MongoDB",
  "gcp": "Google Cloud Platform", "google cloud": "Google Cloud Platform",
  "k8s": "Kubernetes",
  "ci/cd pipelines": "CI/CD", "cicd": "CI/CD",
  "ml": "Machine Learning",
  "dl": "Deep Learning",
  "cv": "Computer Vision",
  "tf": "TensorFlow",
  "sklearn": "Scikit-learn",
  "dsa": "Data Structures", "data structures and algorithms": "Data Structures",
  "restful apis": "REST", "rest api": "REST", "rest apis": "REST",
  "githubactions": "GitHub Actions",
  "dotnet": ".NET", "asp.net core": "ASP.NET",
  "c sharp": "C#",
  "golang": "Go",
  "genai": "Generative AI",
  "nlp": "NLP",
  "power bi": "Power BI", "powerbi": "Power BI",
};

export function normalizeSkillName(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  const key = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (RAW_SYNONYMS[key]) return RAW_SYNONYMS[key];
  const exact = FLAT_SKILLS.find((s) => s.toLowerCase() === key);
  if (exact) return exact;
  const noPunct = key.replace(/[.\-_]/g, "");
  const fuzzy = FLAT_SKILLS.find((s) => s.toLowerCase().replace(/[.\-_]/g, "") === noPunct);
  if (fuzzy) return fuzzy;
  return trimmed; // unknown skill: keep as-is, category "Other"
}

export function categoryOf(canonicalSkill) {
  return SKILL_CATEGORY_OF[canonicalSkill] || "Other";
}

// Role taxonomy — extensible array. Each role is a self-contained record;
// add new roles by appending here, no other code changes required.
export const ROLES = [
  {
    id: "backend-engineer", name: "Backend Engineer",
    requiredSkills: ["Python", "REST", "PostgreSQL", "Data Structures"],
    preferredSkills: ["Docker", "AWS", "Redis", "System Design", "Kubernetes"],
    minYearsExperience: 0, educationLevel: "bachelors-cs-related",
    baseDemandIndex: 82, baseGrowthRatePct: 9,
    salaryRangeINR: [600000, 1800000],
    industries: ["SaaS", "Fintech", "E-commerce"], geographies: ["Bengaluru", "Hyderabad", "Pune", "Remote"],
  },
  {
    id: "frontend-engineer", name: "Frontend Engineer",
    requiredSkills: ["JavaScript", "React", "REST"],
    preferredSkills: ["TypeScript", "Next.js", "Redux", "System Design"],
    minYearsExperience: 0, educationLevel: "bachelors-any",
    baseDemandIndex: 74, baseGrowthRatePct: 5,
    salaryRangeINR: [550000, 1600000],
    industries: ["SaaS", "E-commerce", "EdTech"], geographies: ["Bengaluru", "Pune", "Remote"],
  },
  {
    id: "fullstack-engineer", name: "Full Stack Engineer",
    requiredSkills: ["JavaScript", "React", "Node.js", "REST"],
    preferredSkills: ["TypeScript", "PostgreSQL", "AWS", "Docker"],
    minYearsExperience: 0, educationLevel: "bachelors-any",
    baseDemandIndex: 80, baseGrowthRatePct: 7,
    salaryRangeINR: [600000, 2000000],
    industries: ["SaaS", "Fintech", "Gaming"], geographies: ["Bengaluru", "Hyderabad", "Remote"],
  },
  {
    id: "mobile-engineer", name: "Mobile Engineer",
    requiredSkills: ["Flutter", "REST"],
    preferredSkills: ["React Native", "Kotlin", "Swift", "Firebase"],
    minYearsExperience: 0, educationLevel: "bachelors-any",
    baseDemandIndex: 60, baseGrowthRatePct: 3,
    salaryRangeINR: [550000, 1600000],
    industries: ["E-commerce", "Fintech", "Gaming"], geographies: ["Bengaluru", "Mumbai", "Remote"],
  },
  {
    id: "data-analyst", name: "Data Analyst",
    requiredSkills: ["SQL", "Excel"],
    preferredSkills: ["Python", "Power BI", "Tableau", "Pandas"],
    minYearsExperience: 0, educationLevel: "bachelors-any",
    baseDemandIndex: 68, baseGrowthRatePct: 6,
    salaryRangeINR: [450000, 1300000],
    industries: ["Fintech", "E-commerce", "SaaS"], geographies: ["Bengaluru", "Gurugram", "Mumbai", "Remote"],
  },
  {
    id: "data-engineer", name: "Data Engineer",
    requiredSkills: ["Python", "SQL", "ETL"],
    preferredSkills: ["Apache Spark", "Apache Kafka", "AWS", "PostgreSQL", "Docker"],
    minYearsExperience: 1, educationLevel: "bachelors-cs-related",
    baseDemandIndex: 78, baseGrowthRatePct: 12,
    salaryRangeINR: [700000, 2200000],
    industries: ["Fintech", "SaaS", "Logistics"], geographies: ["Bengaluru", "Hyderabad", "Remote"],
  },
  {
    id: "ml-engineer", name: "ML Engineer",
    requiredSkills: ["Python", "Machine Learning", "Scikit-learn"],
    preferredSkills: ["TensorFlow", "PyTorch", "Deep Learning", "MLOps", "AWS"],
    minYearsExperience: 1, educationLevel: "bachelors-cs-related",
    baseDemandIndex: 76, baseGrowthRatePct: 14,
    salaryRangeINR: [800000, 2500000],
    industries: ["SaaS", "Healthtech", "Fintech"], geographies: ["Bengaluru", "Hyderabad", "Remote"],
  },
  {
    id: "ai-engineer", name: "AI Engineer",
    requiredSkills: ["Python", "LLMs", "Machine Learning"],
    preferredSkills: ["Generative AI", "NLP", "PyTorch", "MLOps"],
    minYearsExperience: 1, educationLevel: "bachelors-cs-related",
    baseDemandIndex: 88, baseGrowthRatePct: 22,
    salaryRangeINR: [900000, 3000000],
    industries: ["SaaS", "Fintech", "Healthtech"], geographies: ["Bengaluru", "Remote"],
  },
  {
    id: "devops-engineer", name: "DevOps Engineer",
    requiredSkills: ["Linux", "Docker", "CI/CD"],
    preferredSkills: ["Kubernetes", "AWS", "Terraform", "Ansible", "GitHub Actions"],
    minYearsExperience: 1, educationLevel: "bachelors-any",
    baseDemandIndex: 79, baseGrowthRatePct: 11,
    salaryRangeINR: [700000, 2100000],
    industries: ["SaaS", "Fintech", "E-commerce"], geographies: ["Bengaluru", "Pune", "Remote"],
  },
  {
    id: "cloud-engineer", name: "Cloud Engineer",
    requiredSkills: ["AWS", "Linux"],
    preferredSkills: ["Docker", "Kubernetes", "Terraform", "Azure", "Google Cloud Platform"],
    minYearsExperience: 1, educationLevel: "bachelors-any",
    baseDemandIndex: 81, baseGrowthRatePct: 15,
    salaryRangeINR: [750000, 2300000],
    industries: ["SaaS", "Fintech", "Logistics"], geographies: ["Bengaluru", "Hyderabad", "Remote"],
  },
  {
    id: "cybersecurity-engineer", name: "Cybersecurity Engineer",
    requiredSkills: ["Linux", "Cybersecurity"],
    preferredSkills: ["AWS", "System Design", "Docker"],
    minYearsExperience: 1, educationLevel: "bachelors-cs-related",
    baseDemandIndex: 70, baseGrowthRatePct: 13,
    salaryRangeINR: [700000, 2200000],
    industries: ["Fintech", "Healthtech", "SaaS"], geographies: ["Bengaluru", "Mumbai", "Remote"],
  },
  {
    id: "product-analyst", name: "Product Analyst",
    requiredSkills: ["SQL", "Excel"],
    preferredSkills: ["Python", "Power BI", "Tableau"],
    minYearsExperience: 0, educationLevel: "bachelors-any",
    baseDemandIndex: 62, baseGrowthRatePct: 5,
    salaryRangeINR: [500000, 1400000],
    industries: ["SaaS", "E-commerce"], geographies: ["Bengaluru", "Gurugram", "Remote"],
  },
  {
    id: "qa-engineer", name: "QA Engineer",
    requiredSkills: ["REST"],
    preferredSkills: ["Python", "CI/CD", "Postman", "Data Structures"],
    minYearsExperience: 0, educationLevel: "bachelors-any",
    baseDemandIndex: 55, baseGrowthRatePct: 2,
    salaryRangeINR: [450000, 1200000],
    industries: ["SaaS", "E-commerce", "Gaming"], geographies: ["Bengaluru", "Pune", "Remote"],
  },
  {
    id: "automation-engineer", name: "Automation Engineer",
    requiredSkills: ["Python", "CI/CD"],
    preferredSkills: ["Docker", "Jenkins", "GitHub Actions", "Ansible"],
    minYearsExperience: 1, educationLevel: "bachelors-any",
    baseDemandIndex: 58, baseGrowthRatePct: 4,
    salaryRangeINR: [500000, 1500000],
    industries: ["Logistics", "E-commerce", "SaaS"], geographies: ["Pune", "Bengaluru", "Remote"],
  },
];

export function educationSatisfies(candidateEducation, requirement) {
  if (!candidateEducation || candidateEducation.length === 0) return requirement === "bachelors-any" ? 0.4 : 0.3;
  const hasBachelorsPlus = candidateEducation.some((e) => /b\.?tech|b\.?e\.?|bachelor|b\.?sc|m\.?tech|master|mca|bca/i.test(e.degree || ""));
  const csRelated = candidateEducation.some((e) => /computer|information technology|software|electronics|data science|artificial intelligence/i.test(`${e.degree || ""} ${e.field || ""}`));
  if (requirement === "bachelors-cs-related") return csRelated ? 1 : hasBachelorsPlus ? 0.6 : 0.3;
  return hasBachelorsPlus ? 1 : 0.5;
}
