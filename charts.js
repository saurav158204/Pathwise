// Minimal SVG chart helpers. Return HTML strings; theme colors come from CSS custom properties
// resolved at render time so charts stay correct in both light and dark themes.

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function hBarChart(items, { width = 480, barHeight = 26, gap = 10, max = 100, valueSuffix = "" } = {}) {
  const labelW = 140;
  const chartW = width - labelW - 46;
  const height = items.length * (barHeight + gap);
  const track = cssVar("--border");
  const rows = items.map((it, i) => {
    const y = i * (barHeight + gap);
    const w = Math.max(2, (Math.min(it.value, max) / max) * chartW);
    const color = it.color || cssVar("--accent");
    return `
      <text x="0" y="${y + barHeight / 2 + 4}" class="chart-label">${escapeXml(it.label)}</text>
      <rect x="${labelW}" y="${y}" width="${chartW}" height="${barHeight}" rx="6" fill="${track}" opacity="0.5"></rect>
      <rect x="${labelW}" y="${y}" width="${w}" height="${barHeight}" rx="6" fill="${color}"></rect>
      <text x="${labelW + chartW + 10}" y="${y + barHeight / 2 + 4}" class="chart-value">${it.value}${valueSuffix}</text>
    `;
  }).join("");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" class="svg-chart">${rows}</svg>`;
}

export function sparkline(points, { width = 220, height = 48, color } = {}) {
  const c = color || cssVar("--accent");
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1 || 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * (height - 6) - 3).toFixed(1)}`).join(" ");
  const last = coords.split(" ").pop().split(",");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" class="svg-spark">
    <polyline points="${coords}" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
    <circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${c}"></circle>
  </svg>`;
}

export function radialScore(value, { size = 120, stroke = 10, label = "" } = {}) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, value)) / 100);
  const track = cssVar("--border");
  const color = value >= 80 ? cssVar("--score-strong") : value >= 60 ? cssVar("--accent") : value >= 40 ? cssVar("--score-warn") : cssVar("--score-critical");
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="svg-radial">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"></circle>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 ${c} ${c})"></circle>
    <text x="${c}" y="${c - 2}" text-anchor="middle" class="radial-value">${Math.round(value)}</text>
    <text x="${c}" y="${c + 18}" text-anchor="middle" class="radial-label">${escapeXml(label)}</text>
  </svg>`;
}

export function escapeXml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[m]));
}
