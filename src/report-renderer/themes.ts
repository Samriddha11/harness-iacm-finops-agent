export type ThemeId = "harness" | "dark" | "slate" | "minimal" | "midnight" | "ocean" | "executive" | "forest" | "harness-pro" | "kinetic";

export const THEMES: Record<ThemeId, { label: string; vars: string }> = {
  harness: {
    label: "Harness",
    vars: `
      --bg:#ffffff; --bg2:#f8fafc; --bg3:#f1f5f9; --bg4:#e2e8f0;
      --fg:#0f172a; --fg2:#334155; --fg3:#64748b; --fg4:#94a3b8;
      --accent:#0278D5; --accent2:#0ea5e9; --accent-fg:#ffffff;
      --border:#e2e8f0; --border2:#cbd5e1;
      --card-bg:#f8fafc; --card-border:#e2e8f0;
      --cover-bg:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0c2340 100%);
      --cover-line:#0278D5;
      --success:#059669; --success-bg:#ecfdf5;
      --warning:#d97706; --warning-bg:#fffbeb;
      --danger:#dc2626;  --danger-bg:#fef2f2;
      --info:#2563eb;    --info-bg:#eff6ff;
      --action:#7c3aed;  --action-bg:#f5f3ff;
      --muted:#64748b;   --muted-bg:#f8fafc;
      --heading:#0f172a; --link:#0278D5;
      --code-bg:#f1f5f9; --nav-bg:rgba(255,255,255,0.9);
      --shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04);
      --shadow-lg:0 10px 40px rgba(0,0,0,0.10);
    `,
  },
  dark: {
    label: "Dark",
    vars: `
      --bg:#0a0f1e; --bg2:#111827; --bg3:#1f2937; --bg4:#374151;
      --fg:#f1f5f9; --fg2:#cbd5e1; --fg3:#94a3b8; --fg4:#64748b;
      --accent:#38bdf8; --accent2:#7dd3fc; --accent-fg:#0a0f1e;
      --border:#1f2937; --border2:#374151;
      --card-bg:#111827; --card-border:#1f2937;
      --cover-bg:linear-gradient(135deg,#020617 0%,#0a0f1e 60%,#0c1a3a 100%);
      --cover-line:#38bdf8;
      --success:#34d399; --success-bg:rgba(52,211,153,0.1);
      --warning:#fbbf24; --warning-bg:rgba(251,191,36,0.1);
      --danger:#f87171;  --danger-bg:rgba(248,113,113,0.1);
      --info:#60a5fa;    --info-bg:rgba(96,165,250,0.1);
      --action:#a78bfa;  --action-bg:rgba(167,139,250,0.1);
      --muted:#94a3b8;   --muted-bg:#1f2937;
      --heading:#f8fafc; --link:#38bdf8;
      --code-bg:#1f2937; --nav-bg:rgba(10,15,30,0.92);
      --shadow:0 1px 3px rgba(0,0,0,0.4),0 4px 12px rgba(0,0,0,0.3);
      --shadow-lg:0 10px 40px rgba(0,0,0,0.5);
    `,
  },
  slate: {
    label: "Slate",
    vars: `
      --bg:#f8fafc; --bg2:#f1f5f9; --bg3:#e2e8f0; --bg4:#cbd5e1;
      --fg:#0f172a; --fg2:#1e293b; --fg3:#475569; --fg4:#94a3b8;
      --accent:#4f46e5; --accent2:#6366f1; --accent-fg:#ffffff;
      --border:#e2e8f0; --border2:#cbd5e1;
      --card-bg:#ffffff; --card-border:#e2e8f0;
      --cover-bg:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%);
      --cover-line:#6366f1;
      --success:#059669; --success-bg:#ecfdf5;
      --warning:#d97706; --warning-bg:#fffbeb;
      --danger:#dc2626;  --danger-bg:#fef2f2;
      --info:#4f46e5;    --info-bg:#eef2ff;
      --action:#7c3aed;  --action-bg:#f5f3ff;
      --muted:#64748b;   --muted-bg:#f8fafc;
      --heading:#1e1b4b; --link:#4f46e5;
      --code-bg:#f1f5f9; --nav-bg:rgba(248,250,252,0.92);
      --shadow:0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(79,70,229,0.06);
      --shadow-lg:0 10px 40px rgba(79,70,229,0.12);
    `,
  },
  minimal: {
    label: "Minimal",
    vars: `
      --bg:#ffffff; --bg2:#fafafa; --bg3:#f5f5f5; --bg4:#e5e5e5;
      --fg:#111111; --fg2:#333333; --fg3:#666666; --fg4:#999999;
      --accent:#111111; --accent2:#333333; --accent-fg:#ffffff;
      --border:#e5e5e5; --border2:#cccccc;
      --card-bg:#fafafa; --card-border:#e5e5e5;
      --cover-bg:linear-gradient(135deg,#111111 0%,#222222 100%);
      --cover-line:#ffffff;
      --success:#166534; --success-bg:#f0fdf4;
      --warning:#92400e; --warning-bg:#fffbeb;
      --danger:#991b1b;  --danger-bg:#fef2f2;
      --info:#1e3a5f;    --info-bg:#eff6ff;
      --action:#4a1d96;  --action-bg:#f5f3ff;
      --muted:#666666;   --muted-bg:#fafafa;
      --heading:#111111; --link:#111111;
      --code-bg:#f5f5f5; --nav-bg:rgba(255,255,255,0.95);
      --shadow:0 1px 2px rgba(0,0,0,0.06);
      --shadow-lg:0 4px 16px rgba(0,0,0,0.08);
    `,
  },

  midnight: {
    label: "Midnight",
    vars: `
      --bg:#0d1117; --bg2:#161b22; --bg3:#21262d; --bg4:#30363d;
      --fg:#e6edf3; --fg2:#c9d1d9; --fg3:#8b949e; --fg4:#484f58;
      --accent:#a78bfa; --accent2:#c4b5fd; --accent-fg:#0d1117;
      --border:#21262d; --border2:#30363d;
      --card-bg:#161b22; --card-border:#21262d;
      --cover-bg:linear-gradient(135deg,#0d0221 0%,#1a0a3c 40%,#0d1117 100%);
      --cover-line:#a78bfa;
      --success:#3fb950; --success-bg:rgba(63,185,80,0.1);
      --warning:#e3b341; --warning-bg:rgba(227,179,65,0.1);
      --danger:#f85149;  --danger-bg:rgba(248,81,73,0.1);
      --info:#58a6ff;    --info-bg:rgba(88,166,255,0.1);
      --action:#a78bfa;  --action-bg:rgba(167,139,250,0.15);
      --muted:#8b949e;   --muted-bg:#161b22;
      --heading:#e6edf3; --link:#a78bfa;
      --code-bg:#161b22; --nav-bg:rgba(13,17,23,0.95);
      --shadow:0 0 0 1px rgba(167,139,250,0.1),0 4px 16px rgba(0,0,0,0.5);
      --shadow-lg:0 0 0 1px rgba(167,139,250,0.15),0 16px 48px rgba(0,0,0,0.6);
    `,
  },

  ocean: {
    label: "Ocean",
    vars: `
      --bg:#020d18; --bg2:#071524; --bg3:#0c2340; --bg4:#0f3460;
      --fg:#e0f2fe; --fg2:#bae6fd; --fg3:#7dd3fc; --fg4:#38bdf8;
      --accent:#06b6d4; --accent2:#22d3ee; --accent-fg:#020d18;
      --border:#0c2340; --border2:#0f3460;
      --card-bg:#071524; --card-border:#0c2340;
      --cover-bg:linear-gradient(160deg,#020d18 0%,#0a2540 50%,#062040 100%);
      --cover-line:#06b6d4;
      --success:#34d399; --success-bg:rgba(52,211,153,0.1);
      --warning:#fbbf24; --warning-bg:rgba(251,191,36,0.1);
      --danger:#f87171;  --danger-bg:rgba(248,113,113,0.1);
      --info:#38bdf8;    --info-bg:rgba(56,189,248,0.1);
      --action:#818cf8;  --action-bg:rgba(129,140,248,0.1);
      --muted:#7dd3fc;   --muted-bg:#071524;
      --heading:#e0f2fe; --link:#22d3ee;
      --code-bg:#0c2340; --nav-bg:rgba(2,13,24,0.95);
      --shadow:0 0 0 1px rgba(6,182,212,0.1),0 4px 16px rgba(0,0,0,0.5);
      --shadow-lg:0 0 0 1px rgba(6,182,212,0.15),0 16px 48px rgba(0,0,0,0.6);
    `,
  },

  executive: {
    label: "Executive",
    vars: `
      --bg:#fffdf7; --bg2:#faf8f0; --bg3:#f2ede0; --bg4:#e8e0cc;
      --fg:#1c1008; --fg2:#3d2b0f; --fg3:#6b5230; --fg4:#9c7d52;
      --accent:#b45309; --accent2:#d97706; --accent-fg:#fffdf7;
      --border:#e8e0cc; --border2:#d4c9b0;
      --card-bg:#faf8f0; --card-border:#e8e0cc;
      --cover-bg:linear-gradient(135deg,#1c1008 0%,#2d1a0e 50%,#1a0f06 100%);
      --cover-line:#d97706;
      --success:#166534; --success-bg:#f0fdf4;
      --warning:#92400e; --warning-bg:#fef3c7;
      --danger:#991b1b;  --danger-bg:#fef2f2;
      --info:#1e3a5f;    --info-bg:#eff6ff;
      --action:#5b21b6;  --action-bg:#f5f3ff;
      --muted:#6b5230;   --muted-bg:#faf8f0;
      --heading:#1c1008; --link:#b45309;
      --code-bg:#f2ede0; --nav-bg:rgba(255,253,247,0.96);
      --shadow:0 1px 3px rgba(28,16,8,0.08),0 4px 12px rgba(180,83,9,0.06);
      --shadow-lg:0 10px 40px rgba(28,16,8,0.12),0 2px 6px rgba(180,83,9,0.08);
    `,
  },

  forest: {
    label: "Forest",
    vars: `
      --bg:#030d07; --bg2:#071510; --bg3:#0a2015; --bg4:#0f3020;
      --fg:#d1fae5; --fg2:#a7f3d0; --fg3:#6ee7b7; --fg4:#34d399;
      --accent:#10b981; --accent2:#34d399; --accent-fg:#030d07;
      --border:#0a2015; --border2:#0f3020;
      --card-bg:#071510; --card-border:#0a2015;
      --cover-bg:linear-gradient(160deg,#010804 0%,#052010 50%,#071510 100%);
      --cover-line:#10b981;
      --success:#34d399; --success-bg:rgba(52,211,153,0.1);
      --warning:#fbbf24; --warning-bg:rgba(251,191,36,0.1);
      --danger:#f87171;  --danger-bg:rgba(248,113,113,0.1);
      --info:#60a5fa;    --info-bg:rgba(96,165,250,0.1);
      --action:#a78bfa;  --action-bg:rgba(167,139,250,0.1);
      --muted:#6ee7b7;   --muted-bg:#071510;
      --heading:#d1fae5; --link:#34d399;
      --code-bg:#0a2015; --nav-bg:rgba(3,13,7,0.95);
      --shadow:0 0 0 1px rgba(16,185,129,0.1),0 4px 16px rgba(0,0,0,0.5);
      --shadow-lg:0 0 0 1px rgba(16,185,129,0.15),0 16px 48px rgba(0,0,0,0.6);
    `,
  },

  "harness-pro": {
    label: "Harness Pro",
    vars: `
      --bg:#ffffff; --bg2:#f7f9fc; --bg3:#eef2f7; --bg4:#dce4ef;
      --fg:#0d1f35; --fg2:#1e3551; --fg3:#4a6484; --fg4:#8da4be;
      --accent:#0057b8; --accent2:#0278D5; --accent-fg:#ffffff;
      --border:#dce4ef; --border2:#c5d3e3;
      --card-bg:#f7f9fc; --card-border:#dce4ef;
      --cover-bg:linear-gradient(160deg,#050e1c 0%,#0a1c35 55%,#0d2545 100%);
      --cover-line:#0278D5;
      --success:#0a7b24; --success-bg:#edfbf0;
      --warning:#c45c00; --warning-bg:#fff4ea;
      --danger:#b91c1c;  --danger-bg:#fef2f2;
      --info:#0057b8;    --info-bg:#eef5ff;
      --action:#a35c00;  --action-bg:#fff8ed;
      --muted:#4a6484;   --muted-bg:#f7f9fc;
      --heading:#0d1f35; --link:#0057b8;
      --code-bg:#eef2f7; --nav-bg:rgba(255,255,255,0.97);
      --shadow:0 1px 4px rgba(0,31,61,0.07),0 4px 16px rgba(0,31,61,0.05);
      --shadow-lg:0 8px 32px rgba(0,31,61,0.10);
    `,
  },

  kinetic: {
    label: "Kinetic",
    vars: `
      --bg:#ffffff; --bg2:#f9f9f9; --bg3:#f2f2f2; --bg4:#e5e5e5;
      --fg:#080808; --fg2:#222222; --fg3:#555555; --fg4:#888888;
      --accent:#0047b3; --accent2:#0066cc; --accent-fg:#ffffff;
      --border:#e0e0e0; --border2:#c8c8c8;
      --card-bg:#f9f9f9; --card-border:#e0e0e0;
      --cover-bg:linear-gradient(180deg,#060606 0%,#0a0a0a 100%);
      --cover-line:#0066cc;
      --success:#005c23; --success-bg:#f0faf4;
      --warning:#8b4a00; --warning-bg:#fffbf0;
      --danger:#b30000;  --danger-bg:#fff5f5;
      --info:#003399;    --info-bg:#f0f4ff;
      --action:#8b4a00;  --action-bg:#fff9f0;
      --muted:#555555;   --muted-bg:#f5f5f5;
      --heading:#080808; --link:#0047b3;
      --code-bg:#f2f2f2; --nav-bg:rgba(255,255,255,0.98);
      --shadow:0 1px 2px rgba(0,0,0,0.06),0 2px 8px rgba(0,0,0,0.04);
      --shadow-lg:0 4px 20px rgba(0,0,0,0.08);
      --table-header-bg:#080808; --table-header-fg:#ffffff;
    `,
  },
};

export const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--fg);
  font-size: 15px;
  line-height: 1.75;
  -webkit-font-smoothing: antialiased;
}

/* ── Navigation ─────────────────────────────────────────────────────── */
.report-nav {
  position: sticky; top: 0; z-index: 200;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  padding: 0 28px;
  height: 52px;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-brand {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: var(--accent);
  letter-spacing: 0.04em; text-transform: uppercase;
}
.nav-brand .dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent); display: inline-block;
}
.nav-right { display: flex; align-items: center; gap: 10px; }
.nav-label {
  font-size: 12px; color: var(--fg3); font-weight: 500;
}

.theme-select {
  appearance: none; -webkit-appearance: none;
  padding: 6px 28px 6px 12px; border-radius: 8px;
  font-size: 13px; font-weight: 500;
  border: 1px solid var(--border2);
  background: var(--bg2) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E") no-repeat right 10px center;
  color: var(--fg2); cursor: pointer; min-width: 120px;
  transition: border-color 0.15s;
}
.theme-select:hover { border-color: var(--accent); }

.btn-pdf {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 8px;
  font-size: 13px; font-weight: 600;
  background: var(--accent); color: var(--accent-fg);
  border: none; cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.btn-pdf:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-pdf:active { transform: translateY(0); }
.btn-pdf svg { width: 14px; height: 14px; }

/* ── Cover ────────────────────────────────────────────────────────────── */
.cover {
  background: var(--cover-bg);
  padding: 72px 72px 56px;
  position: relative; overflow: hidden; min-height: 340px;
}
.cover::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 4px;
  background: var(--cover-line);
}
.cover::after {
  content: '';
  position: absolute; right: -60px; top: -60px;
  width: 320px; height: 320px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
  pointer-events: none;
}
/* Harness Pro: spaced-letter brand label */
.cover-brand {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.3em;
  color: rgba(255,255,255,0.5); text-transform: uppercase;
  margin-bottom: 6px;
}
.cover-eyebrow {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.2em;
  color: var(--cover-line); text-transform: uppercase;
  margin-bottom: 24px;
}
.cover h1 {
  font-size: 2.8rem; font-weight: 800; color: #ffffff;
  line-height: 1.12; margin-bottom: 10px; letter-spacing: -0.03em;
}
.cover-subtitle {
  font-size: 1.05rem; color: rgba(255,255,255,0.5);
  margin-bottom: 48px; max-width: 520px; font-weight: 400;
  letter-spacing: 0.01em;
}
.cover-divider {
  height: 1px; background: rgba(255,255,255,0.12);
  margin-bottom: 28px;
}
.cover-meta {
  display: flex; flex-wrap: wrap; gap: 32px;
}
.cover-meta-item {
  display: flex; flex-direction: column; gap: 4px;
}
.cover-meta-label {
  font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
  color: rgba(255,255,255,0.3); text-transform: uppercase;
}
.cover-meta-value {
  font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 500;
}

/* ── Page layout ──────────────────────────────────────────────────────── */
.report-body {
  max-width: 920px; margin: 0 auto; padding: 56px 40px 80px;
}

/* ── Typography ───────────────────────────────────────────────────────── */
h1 {
  font-size: 1.85rem; font-weight: 800; color: var(--heading);
  margin: 2.8rem 0 0.8rem; letter-spacing: -0.02em;
  padding-bottom: 12px; border-bottom: 2px solid var(--accent);
}
h1:first-child { margin-top: 0; }
h2 {
  font-size: 1.2rem; font-weight: 700; color: var(--accent);
  margin: 2.2rem 0 0.6rem;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
h3 {
  font-size: 1rem; font-weight: 700; color: var(--heading);
  margin: 1.8rem 0 0.5rem;
}
h4 { font-size: 0.95rem; font-weight: 600; color: var(--fg2); margin: 1.4rem 0 0.4rem; }

p  { margin-bottom: 1rem; color: var(--fg2); }
strong { color: var(--fg); font-weight: 700; }
em { font-style: italic; }

ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
li { margin-bottom: 0.35rem; color: var(--fg2); }
li > strong { color: var(--fg); }

hr { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }

a { color: var(--link); text-decoration: none; border-bottom: 1px solid transparent; }
a:hover { border-bottom-color: var(--link); }

code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.82em; background: var(--code-bg);
  padding: 2px 6px; border-radius: 4px; color: var(--fg);
  border: 1px solid var(--border);
}
pre {
  background: var(--code-bg); border: 1px solid var(--border);
  border-radius: 10px; padding: 18px 20px;
  overflow-x: auto; margin-bottom: 1.2rem;
}
pre code { background: none; border: none; padding: 0; font-size: 0.875rem; }

/* ── Metric cards ─────────────────────────────────────────────────────── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px; margin: 24px 0;
}
.metric-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 18px 16px 14px;
  border-top: 3px solid var(--border2);
  box-shadow: var(--shadow);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
.metric-card.positive { border-top-color: var(--success); }
.metric-card.negative,
.metric-card.critical  { border-top-color: var(--danger); }
.metric-card.risk      { border-top-color: var(--warning); }
.metric-card.warning   { border-top-color: var(--warning); }
.metric-card.info      { border-top-color: var(--info); }
.metric-card.action    { border-top-color: var(--action); }
.metric-card.neutral   { border-top-color: var(--fg4); }

.metric-label {
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.07em;
  text-transform: uppercase; color: var(--fg3); margin-bottom: 10px;
}
.metric-value {
  font-size: 1.8rem; font-weight: 800; color: var(--fg);
  line-height: 1; letter-spacing: -0.02em;
}
.metric-trend {
  font-size: 11.5px; color: var(--fg3); margin-top: 8px;
  font-weight: 500;
}
.metric-card.positive .metric-trend { color: var(--success); }
.metric-card.critical .metric-trend,
.metric-card.negative .metric-trend { color: var(--danger); }
.metric-card.risk .metric-trend,
.metric-card.warning .metric-trend  { color: var(--warning); }

/* ── Callout blocks ───────────────────────────────────────────────────── */
.callout {
  border-radius: 10px; padding: 16px 18px 16px 54px;
  margin: 20px 0; border-left: 4px solid var(--accent);
  background: var(--bg2);
  box-shadow: var(--shadow);
  position: relative;
}
.callout::before {
  content: 'i';
  position: absolute; left: 16px; top: 14px;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; font-style: italic;
  line-height: 24px; text-align: center;
}
.callout.critical { border-left-color: var(--danger);  background: var(--danger-bg); }
.callout.critical::before { content: '!'; background: var(--danger); }

.callout.risk     { border-left-color: var(--warning); background: var(--warning-bg); }
.callout.risk::before { content: '!'; background: var(--warning); }

.callout.warning  { border-left-color: var(--warning); background: var(--warning-bg); }
.callout.warning::before { content: '!'; background: var(--warning); }

.callout.success  { border-left-color: var(--success); background: var(--success-bg); }
.callout.success::before { content: "✓"; background: var(--success); }

.callout.info     { border-left-color: var(--info);    background: var(--info-bg); }
.callout.info::before { content: 'i'; background: var(--info); font-style: italic; }

.callout.action   { border-left-color: var(--action);  background: var(--action-bg); }
.callout.action::before { content: "→"; background: var(--action); }

.callout.quote    { border-left-color: var(--fg4);     background: var(--muted-bg); }
.callout.quote::before { content: '"'; background: var(--fg4); }

.callout-badge {
  display: inline-block;
  font-size: 9px; font-weight: 800; letter-spacing: 0.14em;
  text-transform: uppercase; margin-bottom: 6px;
  color: var(--accent);
}
.callout.critical .callout-badge  { color: var(--danger); }
.callout.risk .callout-badge,
.callout.warning .callout-badge   { color: var(--warning); }
.callout.success .callout-badge   { color: var(--success); }
.callout.info .callout-badge      { color: var(--info); }
.callout.action .callout-badge    { color: var(--action); }

.callout-body p { margin-bottom: 0; font-size: 14px; }
.callout-body p + p { margin-top: 0.5rem; }

/* ── Tables ───────────────────────────────────────────────────────────── */
.table-wrap {
  overflow-x: auto; margin: 20px 0;
  border: 1px solid var(--border); border-radius: 10px;
  box-shadow: var(--shadow);
}
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
thead { background: var(--accent); }
thead th {
  padding: 11px 14px; text-align: left;
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
  color: var(--accent-fg); text-transform: uppercase; white-space: nowrap;
}
tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; }
tbody tr:last-child { border-bottom: none; }
tbody tr:nth-child(even) { background: var(--bg2); }
tbody tr:hover { background: var(--bg3); }
td { padding: 10px 14px; vertical-align: top; color: var(--fg2); }
td:first-child { font-weight: 500; color: var(--fg); }

/* Status badges in tables */
.status-yes  { color: var(--success); font-weight: 600; }
.status-no   { color: var(--danger);  font-weight: 600; }
.status-warn { color: var(--warning); font-weight: 600; }
.badge-p1 {
  display: inline-block; padding: 1px 7px; border-radius: 4px;
  background: var(--danger); color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
}
.badge-p2 {
  display: inline-block; padding: 1px 7px; border-radius: 4px;
  background: var(--warning); color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
}
.badge-p3 {
  display: inline-block; padding: 1px 7px; border-radius: 4px;
  background: var(--fg4); color: #fff;
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
}

/* ── Print ────────────────────────────────────────────────────────────── */
@media print {
  @page { size: A4; margin: 14mm 12mm; }
  .report-nav { display: none !important; }
  .cover {
    page-break-after: always;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .callout, .metric-card, .table-wrap {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .metric-card { break-inside: avoid; }
  h1, h2, h3 { break-after: avoid; }
  tr { break-inside: avoid; }
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }
  body { font-size: 11.5px; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.05rem; }
}

/* ── Kinetic theme overrides ──────────────────────────────────────────── */
body[data-theme="kinetic"] {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  letter-spacing: -0.005em;
}

/* Kinetic cover — editorial, high-contrast */
body[data-theme="kinetic"] .cover {
  padding: 56px 64px 48px;
}
body[data-theme="kinetic"] .cover-brand {
  font-size: 9px; letter-spacing: 0.35em; color: rgba(255,255,255,0.4);
  margin-bottom: 4px;
}
body[data-theme="kinetic"] .cover-eyebrow {
  font-size: 9px; letter-spacing: 0.3em; color: rgba(255,255,255,0.35);
  margin-bottom: 32px;
}
body[data-theme="kinetic"] .cover h1 {
  font-size: 3rem; font-weight: 900; letter-spacing: -0.04em;
  line-height: 1.05; color: #ffffff; margin-bottom: 8px;
}
body[data-theme="kinetic"] .cover-subtitle {
  font-size: 0.95rem; color: rgba(255,255,255,0.45);
  margin-bottom: 52px; letter-spacing: 0.01em;
}
body[data-theme="kinetic"] .cover-meta-label {
  font-size: 8px; letter-spacing: 0.25em; color: rgba(255,255,255,0.25);
}
body[data-theme="kinetic"] .cover-meta-value {
  font-size: 12.5px; color: rgba(255,255,255,0.7); font-weight: 400;
}

/* Kinetic headings */
body[data-theme="kinetic"] h1 {
  font-size: 1.7rem; font-weight: 900; letter-spacing: -0.03em;
  border-bottom: 2px solid #080808;
}
body[data-theme="kinetic"] h2 {
  font-size: 0.75rem; font-weight: 700; letter-spacing: 0.18em;
  text-transform: uppercase; color: #080808;
  border-bottom: 1px solid #e0e0e0;
}
body[data-theme="kinetic"] h3 {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em;
  text-transform: uppercase; color: #555555;
}

/* Kinetic metric cards — spaced-letter labels */
body[data-theme="kinetic"] .metric-label {
  font-size: 8px; letter-spacing: 0.22em; font-weight: 700;
  text-transform: uppercase; color: #555555;
}
body[data-theme="kinetic"] .metric-value {
  font-size: 2rem; font-weight: 900; letter-spacing: -0.03em; color: #080808;
}
body[data-theme="kinetic"] .metric-trend {
  font-size: 10px; letter-spacing: 0.04em; color: #888888;
}
body[data-theme="kinetic"] .metric-card {
  border-radius: 0; border: 1px solid #e0e0e0;
  border-top: 3px solid #080808; background: #ffffff;
}
body[data-theme="kinetic"] .metric-card.positive { border-top-color: var(--success); }
body[data-theme="kinetic"] .metric-card.critical { border-top-color: var(--danger); }
body[data-theme="kinetic"] .metric-card.risk,
body[data-theme="kinetic"] .metric-card.warning  { border-top-color: var(--warning); }
body[data-theme="kinetic"] .metric-card.info     { border-top-color: var(--info); }

/* Kinetic callouts — editorial style with spaced badge */
body[data-theme="kinetic"] .callout {
  border-radius: 0; border-left: 3px solid #080808;
  background: #f9f9f9; padding: 14px 16px 14px 52px;
}
body[data-theme="kinetic"] .callout::before {
  width: 22px; height: 22px; font-size: 11px; font-weight: 900;
  border-radius: 0; left: 14px; top: 13px;
}
body[data-theme="kinetic"] .callout-badge {
  font-size: 8px; letter-spacing: 0.22em; font-weight: 800;
}
body[data-theme="kinetic"] .callout.critical {
  border-left-color: var(--danger); background: var(--danger-bg);
}
body[data-theme="kinetic"] .callout.critical::before { background: var(--danger); }
body[data-theme="kinetic"] .callout.success {
  border-left-color: var(--success); background: var(--success-bg);
}
body[data-theme="kinetic"] .callout.success::before { background: var(--success); }
body[data-theme="kinetic"] .callout.info {
  border-left-color: var(--info); background: var(--info-bg);
}
body[data-theme="kinetic"] .callout.info::before { background: var(--info); }
body[data-theme="kinetic"] .callout.action,
body[data-theme="kinetic"] .callout.warning {
  border-left-color: var(--action); background: var(--action-bg);
}
body[data-theme="kinetic"] .callout.action::before,
body[data-theme="kinetic"] .callout.warning::before { background: var(--action); }

/* Kinetic tables — spaced-cap column headers, sharp edges */
body[data-theme="kinetic"] .table-wrap {
  border-radius: 0; border: 1px solid #080808; border-top: 2px solid #080808;
}
body[data-theme="kinetic"] thead { background: #080808; }
body[data-theme="kinetic"] thead th {
  letter-spacing: 0.18em; font-size: 8px; font-weight: 700;
  padding: 10px 12px;
}
body[data-theme="kinetic"] tbody tr:nth-child(even) { background: #f9f9f9; }
body[data-theme="kinetic"] td { font-size: 13px; color: #222222; }
body[data-theme="kinetic"] td:first-child { font-weight: 600; }

/* Kinetic nav */
body[data-theme="kinetic"] .report-nav {
  border-bottom: 2px solid #080808;
}
body[data-theme="kinetic"] .nav-brand {
  font-size: 9px; letter-spacing: 0.3em; color: #080808;
}

/* Kinetic body text */
body[data-theme="kinetic"] p { color: #222222; font-size: 14.5px; line-height: 1.7; }

/* Kinetic hr — strong rule */
body[data-theme="kinetic"] hr {
  border-top: 2px solid #080808; margin: 2rem 0;
}

/* Kinetic page footer watermark */
body[data-theme="kinetic"] .report-body::after {
  content: "H A R N E S S  /  I A C M  /  C O N F I D E N T I A L";
  display: block; font-size: 8px; letter-spacing: 0.2em;
  color: #cccccc; text-align: center; margin-top: 4rem;
  padding-top: 1.5rem; border-top: 1px solid #e0e0e0;
}

@media print {
  body[data-theme="kinetic"] .metrics-grid { grid-template-columns: repeat(4, 1fr); }
  body[data-theme="kinetic"] .metric-card { border-radius: 0; }
  body[data-theme="kinetic"] .table-wrap { border-radius: 0; }
}
`;

export function buildThemeStyleTag(themeId: ThemeId): string {
  const theme = THEMES[themeId] ?? THEMES.harness;
  return `<style>:root{${theme.vars}}\n${BASE_CSS}</style>`;
}
