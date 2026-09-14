// A hand-built sample candidate for demoing the platform without uploading a real resume.
// Clearly labeled as a sample everywhere it's used — never presented as the viewer's own data.
export function SAMPLE_CANDIDATE() {
  return {
    name: "Ananya Rao", email: "ananya.rao@example.com", phone: "+91 98765 43210", location: "Bengaluru",
    targetRoles: ["backend-engineer", "cloud-engineer"], targetIndustries: ["SaaS", "Fintech"], targetLocations: ["Bengaluru", "Remote"],
    education: [{ degree: "B.Tech", field: "Computer Science", institution: "PES University", startYear: "2021", endYear: "2025" }],
    experience: [],
    internships: [{
      title: "Backend Engineering Intern", company: "Ledgerly Fintech", startDate: "2024-05-01", endDate: "2024-07-31", current: false,
      description: "Built REST APIs for a ledger reconciliation service in Python/FastAPI, backed by PostgreSQL; added structured logging.",
      skillsUsed: ["Python", "FastAPI", "REST", "PostgreSQL"],
    }],
    projects: [
      { name: "Campus Marketplace API", description: "Backend for a peer-to-peer campus marketplace: auth, listings, search, order flow.", skillsUsed: ["Python", "Django", "PostgreSQL", "REST", "Docker"] },
      { name: "Log Analytics Pipeline", description: "Ingested app logs into a queryable store and built a small dashboard.", skillsUsed: ["Python", "Elasticsearch", "Docker"] },
      { name: "Personal Portfolio + Blog", description: "Static site with a small Node.js contact-form service.", skillsUsed: ["JavaScript", "Node.js", "Git"] },
    ],
    certifications: [{ name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", year: "2024" }],
    achievements: ["Runner-up, college hackathon 2024", "Open-source contributor to a small FastAPI plugin"],
    domains: ["Fintech", "SaaS"],
    softSkills: ["Communication", "Teamwork", "Problem Solving"],
    skills: [
      { name: "Python", category: "Programming Languages", proficiency: 82, yearsExperience: 1.2, recency: 0, projectUsageCount: 2, confidence: 0.9, evidence: ["Internship: Backend Engineering Intern", "Project: Campus Marketplace API", "Project: Log Analytics Pipeline"] },
      { name: "REST", category: "Data", proficiency: 78, yearsExperience: 1.2, recency: 0, projectUsageCount: 1, confidence: 0.85, evidence: ["Internship: Backend Engineering Intern", "Project: Campus Marketplace API"] },
      { name: "PostgreSQL", category: "Databases", proficiency: 70, yearsExperience: 1.2, recency: 0, projectUsageCount: 1, confidence: 0.8, evidence: ["Internship: Backend Engineering Intern", "Project: Campus Marketplace API"] },
      { name: "FastAPI", category: "Frameworks", proficiency: 65, yearsExperience: 0.25, recency: 0, projectUsageCount: 0, confidence: 0.7, evidence: ["Internship: Backend Engineering Intern"] },
      { name: "Django", category: "Frameworks", proficiency: 55, yearsExperience: 0, recency: 0, projectUsageCount: 1, confidence: 0.6, evidence: ["Project: Campus Marketplace API"] },
      { name: "Docker", category: "DevOps", proficiency: 45, yearsExperience: 0, recency: 0, projectUsageCount: 2, confidence: 0.6, evidence: ["Project: Campus Marketplace API", "Project: Log Analytics Pipeline"] },
      { name: "JavaScript", category: "Programming Languages", proficiency: 40, yearsExperience: 0, recency: 0, projectUsageCount: 1, confidence: 0.55, evidence: ["Project: Personal Portfolio + Blog"] },
      { name: "Node.js", category: "Frameworks", proficiency: 35, yearsExperience: 0, recency: 0, projectUsageCount: 1, confidence: 0.5, evidence: ["Project: Personal Portfolio + Blog"] },
      { name: "Git", category: "Tools", proficiency: 60, yearsExperience: 0, recency: 0, projectUsageCount: 1, confidence: 0.6, evidence: ["Project: Personal Portfolio + Blog"] },
      { name: "Elasticsearch", category: "Databases", proficiency: 30, yearsExperience: 0, recency: 1, projectUsageCount: 1, confidence: 0.45, evidence: ["Project: Log Analytics Pipeline"] },
      { name: "Data Structures", category: "Data", proficiency: 60, yearsExperience: 0, recency: 0, projectUsageCount: 0, confidence: 0.5, evidence: ["Listed in resume skills section"] },
    ],
    resumeAssetId: null,
    resumeRawText: "Ananya Rao — Bengaluru — ananya.rao@example.com\n\nEducation\nB.Tech Computer Science, PES University, 2021-2025\n\nInternships\nBackend Engineering Intern, Ledgerly Fintech (May-Jul 2024): Built REST APIs for a ledger reconciliation service in Python/FastAPI, backed by PostgreSQL; added structured logging.\n\nProjects\nCampus Marketplace API: Backend for a peer-to-peer campus marketplace: auth, listings, search, order flow. Python, Django, PostgreSQL, REST, Docker.\nLog Analytics Pipeline: Ingested app logs into a queryable store and built a small dashboard. Python, Elasticsearch, Docker.\nPersonal Portfolio + Blog: Static site with a small Node.js contact-form service. JavaScript, Node.js, Git.\n\nCertifications\nAWS Cloud Practitioner, Amazon Web Services, 2024\n\nSkills\nPython, REST, PostgreSQL, FastAPI, Django, Docker, JavaScript, Node.js, Git, Elasticsearch, Data Structures\n\nAchievements\nRunner-up, college hackathon 2024. Open-source contributor to a small FastAPI plugin.",
  };
}
