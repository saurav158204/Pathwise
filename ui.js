// Small shared render helpers used across screens.
export { escapeXml as esc } from "./charts.js";
import { escapeXml as esc } from "./charts.js";

export function classChip(classification) {
  const map = { "Strong Match": "chip-strong", "Target": "chip-target", "Reach": "chip-reach", "Low Fit": "chip-low" };
  return `<span class="chip ${map[classification] || "chip-reach"}">${classification}</span>`;
}

export function trendChip(trend) {
  const map = { Rising: ["chip-rising", "↑"], Emerging: ["chip-emerging", "✦"], Stable: ["chip-stable", "→"], Declining: ["chip-declining", "↓"] };
  const [cls, arrow] = map[trend] || ["chip-stable", "→"];
  return `<span class="chip ${cls}">${arrow} ${trend}</span>`;
}

export function priorityBadge(priority) {
  const map = {
    "Critical Gap": "badge-critical", "Very High": "badge-critical",
    "High Priority": "badge-high", "High": "badge-high",
    "Medium Priority": "badge-medium", "Medium": "badge-medium",
    "Low Priority": "badge-low", "Low": "badge-low",
    "Already Strong": "badge-strong",
  };
  return `<span class="${map[priority] || "badge-medium"}">${priority}</span>`;
}

export function formatINR(n) {
  if (n == null) return "—";
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function initials(name) {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export { esc as escapeHtml };
