/**
 * Report theme system.
 *
 * 6 executive-grade themes (3 light, 3 dark) following color theory:
 *   • Single dominant accent per theme (no rainbow)
 *   • Analogous background scale (calm hue progression)
 *   • Cohesive 8-color chart palette with consistent saturation + lightness
 *   • Semantic colors (success/warning/danger) tuned to each theme's mood
 *
 * Theme IDs are kept stable for backward compatibility.
 *
 *   ID            | Mode  | Label     | Mood
 *   ──────────────┼───────┼───────────┼──────────────────────────────────────────
 *   minimal       | light | Slate     | Cool indigo + slate — modern SaaS
 *   harness-pro   | light | Aurora    | Soft mint + teal — calm, premium
 *   kinetic       | light | Sandstone | Warm cream + amber — McKinsey executive
 *   dark          | dark  | Midnight  | Deep navy + blue — boardroom premium
 *   ocean         | dark  | Eclipse   | Charcoal + emerald — sophisticated
 *   black-lime    | dark  | Obsidian  | Zinc black + warm gold — luxury
 */
export type ThemeId =
  | "dark" | "minimal" | "ocean" | "harness-pro" | "kinetic" | "black-lime"
  | "carbon" | "bluestone";

export const THEMES: Record<ThemeId, { label: string; vars: string }> = {

  /* ─────────────────────────────────────────────────────────────────────
     LIGHT — HARNESS (official brand: bright Harness blue + deep navy)
     The Harness primary blue (#1ea1f1) and deep navy ink (#0a1929) are
     taken straight from the brand mark. White surfaces, slate neutrals,
     and bright accent semantics for charts and callouts.
     ───────────────────────────────────────────────────────────────────── */
  minimal: {
    label: "Harness",
    vars: `
      --bg:#ffffff; --bg2:#f6f9fd; --bg3:#eaf1f8; --bg4:#d6e2ee;
      --fg:#0a1929; --fg2:#13283c; --fg3:#4d6280; --fg4:#8a99ad;
      --accent:#1ea1f1; --accent2:#38bdf8; --accent-fg:#ffffff;
      --border:#dde6ef; --border2:#c2cfdc;
      --card-bg:#f6f9fd; --card-border:#dde6ef;
      --cover-bg:linear-gradient(135deg,#0a1929 0%,#0f2942 55%,#143a64 100%);
      --cover-line:#1ea1f1;
      --success:#15803d; --success-bg:#ecfdf5;
      --warning:#d97706; --warning-bg:#fffbeb;
      --danger:#dc2626;  --danger-bg:#fef2f2;
      --info:#1ea1f1;    --info-bg:#eff6ff;
      --action:#7c3aed;  --action-bg:#f5f3ff;
      --muted:#4d6280;   --muted-bg:#f6f9fd;
      --heading:#0a1929; --link:#1ea1f1;
      --code-bg:#eaf1f8; --nav-bg:rgba(255,255,255,0.96);
      --shadow:0 1px 3px rgba(10,25,41,0.06),0 4px 14px rgba(10,25,41,0.05);
      --shadow-lg:0 12px 36px rgba(10,25,41,0.10);

      --svg-surface:#ffffff;  --svg-card:#f6f9fd;
      --chart-text:#0a1929;   --chart-muted:#4d6280;
      --chart-grid:#dde6ef;   --chart-neutral:#8a99ad;
      --chart-success:#15803d; --chart-warning:#d97706; --chart-danger:#dc2626;
      --chart-1:#1ea1f1;  /* Harness blue — primary  */
      --chart-2:#dc2626;  /* alert red               */
      --chart-3:#0c4a6e;  /* deep navy               */
      --chart-4:#f59e0b;  /* amber                   */
      --chart-5:#15803d;  /* forest green            */
      --chart-6:#0891b2;  /* cyan                    */
      --chart-7:#7c3aed;  /* violet                  */
      --chart-8:#be123c;  /* deep rose               */
    `,
  },

  /* ─────────────────────────────────────────────────────────────────────
     LIGHT — AURORA (soft mint + teal, calm)
     ───────────────────────────────────────────────────────────────────── */
  "harness-pro": {
    label: "Aurora",
    vars: `
      --bg:#fbfdfc; --bg2:#f1f7f5; --bg3:#e6f0ec; --bg4:#cfe3dc;
      --fg:#0c2723; --fg2:#15433b; --fg3:#3d6b62; --fg4:#7ea298;
      --accent:#0d9488; --accent2:#14b8a6; --accent-fg:#ffffff;
      --border:#dbeae5; --border2:#bcd5cd;
      --card-bg:#f1f7f5; --card-border:#dbeae5;
      --cover-bg:linear-gradient(140deg,#042f2e 0%,#064e3b 50%,#065f5b 100%);
      --cover-line:#2dd4bf;
      --success:#047857; --success-bg:#ecfdf5;
      --warning:#b45309; --warning-bg:#fffbeb;
      --danger:#be123c;  --danger-bg:#fef2f2;
      --info:#0d9488;    --info-bg:#f0fdfa;
      --action:#7c3aed;  --action-bg:#f5f3ff;
      --muted:#5b7d75;   --muted-bg:#f1f7f5;
      --heading:#0c2723; --link:#0d9488;
      --code-bg:#e6f0ec; --nav-bg:rgba(251,253,252,0.96);
      --shadow:0 1px 2px rgba(6,78,59,0.06),0 4px 14px rgba(6,78,59,0.05);
      --shadow-lg:0 12px 36px rgba(6,78,59,0.10);

      --svg-surface:#ffffff;  --svg-card:#f1f7f5;
      --chart-text:#0c2723;   --chart-muted:#5b7d75;
      --chart-grid:#dbeae5;   --chart-neutral:#94a3b8;
      --chart-success:#047857; --chart-warning:#b45309; --chart-danger:#be123c;
      --chart-1:#0d9488;  /* teal     */
      --chart-2:#0284c7;  /* sky      */
      --chart-3:#65a30d;  /* lime     */
      --chart-4:#6366f1;  /* indigo   */
      --chart-5:#db2777;  /* pink     */
      --chart-6:#ea580c;  /* orange   */
      --chart-7:#a855f7;  /* purple   */
      --chart-8:#0e7490;  /* cyan-700 */
    `,
  },

  /* ─────────────────────────────────────────────────────────────────────
     LIGHT — SANDSTONE (warm cream + amber, executive)
     ───────────────────────────────────────────────────────────────────── */
  kinetic: {
    label: "Sandstone",
    vars: `
      --bg:#fdfaf6; --bg2:#f7f1e8; --bg3:#ede2d0; --bg4:#dac6a8;
      --fg:#2c1f12; --fg2:#4a3520; --fg3:#7a5d3f; --fg4:#a8896a;
      --accent:#b45309; --accent2:#d97706; --accent-fg:#fdfaf6;
      --border:#ede2d0; --border2:#d6c3a3;
      --card-bg:#f7f1e8; --card-border:#ede2d0;
      --cover-bg:linear-gradient(135deg,#1c1208 0%,#2c1f12 55%,#3d2a18 100%);
      --cover-line:#d97706;
      --success:#15803d; --success-bg:#f0fdf4;
      --warning:#b45309; --warning-bg:#fffbeb;
      --danger:#b91c1c;  --danger-bg:#fef2f2;
      --info:#1e40af;    --info-bg:#eff6ff;
      --action:#9d174d;  --action-bg:#fdf2f8;
      --muted:#7a5d3f;   --muted-bg:#f7f1e8;
      --heading:#2c1f12; --link:#b45309;
      --code-bg:#ede2d0; --nav-bg:rgba(253,250,246,0.96);
      --shadow:0 1px 3px rgba(60,38,18,0.07),0 4px 14px rgba(60,38,18,0.05);
      --shadow-lg:0 12px 36px rgba(60,38,18,0.10);

      --svg-surface:#fdfaf6;  --svg-card:#f7f1e8;
      --chart-text:#2c1f12;   --chart-muted:#7a5d3f;
      --chart-grid:#ede2d0;   --chart-neutral:#a89178;
      --chart-success:#15803d; --chart-warning:#b45309; --chart-danger:#b91c1c;
      --chart-1:#b45309;  /* amber-700 — primary  */
      --chart-2:#1e40af;  /* sapphire — cool counter */
      --chart-3:#15803d;  /* forest                */
      --chart-4:#9d174d;  /* rose                  */
      --chart-5:#4c1d95;  /* plum                  */
      --chart-6:#0e7490;  /* deep teal             */
      --chart-7:#92400e;  /* copper                */
      --chart-8:#166534;  /* deep green            */
    `,
  },

  /* ─────────────────────────────────────────────────────────────────────
     DARK — MIDNIGHT (deep navy + cool blue accent)
     ───────────────────────────────────────────────────────────────────── */
  dark: {
    label: "Midnight",
    vars: `
      --bg:#0a0f1c; --bg2:#111827; --bg3:#1e293b; --bg4:#334155;
      --fg:#e2e8f0; --fg2:#cbd5e1; --fg3:#94a3b8; --fg4:#64748b;
      --accent:#60a5fa; --accent2:#93c5fd; --accent-fg:#0a0f1c;
      --border:#1e293b; --border2:#334155;
      --card-bg:#111827; --card-border:#1e293b;
      --cover-bg:linear-gradient(140deg,#020617 0%,#0a0f1c 55%,#0f1e3d 100%);
      --cover-line:#60a5fa;
      --success:#34d399; --success-bg:rgba(52,211,153,0.10);
      --warning:#fbbf24; --warning-bg:rgba(251,191,36,0.10);
      --danger:#f87171;  --danger-bg:rgba(248,113,113,0.10);
      --info:#60a5fa;    --info-bg:rgba(96,165,250,0.10);
      --action:#a78bfa;  --action-bg:rgba(167,139,250,0.10);
      --muted:#94a3b8;   --muted-bg:#1e293b;
      --heading:#f1f5f9; --link:#60a5fa;
      --code-bg:#1e293b; --nav-bg:rgba(10,15,28,0.94);
      --shadow:0 1px 3px rgba(0,0,0,0.4),0 4px 14px rgba(0,0,0,0.3);
      --shadow-lg:0 12px 40px rgba(0,0,0,0.5);

      --svg-surface:#111827;  --svg-card:#1e293b;
      --chart-text:#e2e8f0;   --chart-muted:#94a3b8;
      --chart-grid:rgba(148,163,184,0.18); --chart-neutral:#64748b;
      --chart-success:#34d399; --chart-warning:#fbbf24; --chart-danger:#f87171;
      --chart-1:#60a5fa;  /* blue    */
      --chart-2:#34d399;  /* emerald */
      --chart-3:#fbbf24;  /* amber   */
      --chart-4:#a78bfa;  /* violet  */
      --chart-5:#22d3ee;  /* cyan    */
      --chart-6:#f472b6;  /* pink    */
      --chart-7:#818cf8;  /* indigo  */
      --chart-8:#fde047;  /* yellow  */
    `,
  },

  /* ─────────────────────────────────────────────────────────────────────
     DARK — ECLIPSE (charcoal + emerald)
     ───────────────────────────────────────────────────────────────────── */
  ocean: {
    label: "Eclipse",
    vars: `
      --bg:#0d1117; --bg2:#161b22; --bg3:#21262d; --bg4:#30363d;
      --fg:#e6edf3; --fg2:#c9d1d9; --fg3:#8b949e; --fg4:#6e7681;
      --accent:#34d399; --accent2:#6ee7b7; --accent-fg:#0d1117;
      --border:#21262d; --border2:#30363d;
      --card-bg:#161b22; --card-border:#21262d;
      --cover-bg:linear-gradient(140deg,#020a06 0%,#0d1117 55%,#052e1a 100%);
      --cover-line:#34d399;
      --success:#34d399; --success-bg:rgba(52,211,153,0.10);
      --warning:#fbbf24; --warning-bg:rgba(251,191,36,0.10);
      --danger:#f87171;  --danger-bg:rgba(248,113,113,0.10);
      --info:#38bdf8;    --info-bg:rgba(56,189,248,0.10);
      --action:#c084fc;  --action-bg:rgba(192,132,252,0.10);
      --muted:#8b949e;   --muted-bg:#161b22;
      --heading:#f0f6fc; --link:#6ee7b7;
      --code-bg:#161b22; --nav-bg:rgba(13,17,23,0.94);
      --shadow:0 0 0 1px rgba(255,255,255,0.04),0 4px 14px rgba(0,0,0,0.5);
      --shadow-lg:0 0 0 1px rgba(255,255,255,0.05),0 14px 40px rgba(0,0,0,0.6);

      --svg-surface:#161b22;  --svg-card:#21262d;
      --chart-text:#e6edf3;   --chart-muted:#8b949e;
      --chart-grid:rgba(139,148,158,0.18); --chart-neutral:#6e7681;
      --chart-success:#34d399; --chart-warning:#fbbf24; --chart-danger:#f87171;
      --chart-1:#34d399;  /* emerald */
      --chart-2:#38bdf8;  /* sky     */
      --chart-3:#818cf8;  /* indigo  */
      --chart-4:#fbbf24;  /* amber   */
      --chart-5:#2dd4bf;  /* teal    */
      --chart-6:#f472b6;  /* pink    */
      --chart-7:#c084fc;  /* violet  */
      --chart-8:#a3e635;  /* lime    */
    `,
  },

  /* ─────────────────────────────────────────────────────────────────────
     DARK — OBSIDIAN (zinc black + warm gold)
     ───────────────────────────────────────────────────────────────────── */
  "black-lime": {
    label: "Obsidian",
    vars: `
      --bg:#0a0a0b; --bg2:#18181b; --bg3:#27272a; --bg4:#3f3f46;
      --fg:#fafafa; --fg2:#e4e4e7; --fg3:#a1a1aa; --fg4:#71717a;
      --accent:#f59e0b; --accent2:#fbbf24; --accent-fg:#0a0a0b;
      --border:#27272a; --border2:#3f3f46;
      --card-bg:#18181b; --card-border:#27272a;
      --cover-bg:linear-gradient(140deg,#000000 0%,#0a0a0b 55%,#1c1306 100%);
      --cover-line:#f59e0b;
      --success:#34d399; --success-bg:rgba(52,211,153,0.10);
      --warning:#fbbf24; --warning-bg:rgba(251,191,36,0.10);
      --danger:#f87171;  --danger-bg:rgba(248,113,113,0.10);
      --info:#60a5fa;    --info-bg:rgba(96,165,250,0.10);
      --action:#f59e0b;  --action-bg:rgba(245,158,11,0.10);
      --muted:#a1a1aa;   --muted-bg:#18181b;
      --heading:#fafafa; --link:#fbbf24;
      --code-bg:#18181b; --nav-bg:rgba(10,10,11,0.94);
      --shadow:0 0 0 1px rgba(255,255,255,0.04),0 4px 16px rgba(0,0,0,0.6);
      --shadow-lg:0 0 0 1px rgba(245,158,11,0.10),0 16px 48px rgba(0,0,0,0.7);

      --svg-surface:#18181b;  --svg-card:#27272a;
      --chart-text:#fafafa;   --chart-muted:#a1a1aa;
      --chart-grid:rgba(161,161,170,0.18); --chart-neutral:#71717a;
      --chart-success:#34d399; --chart-warning:#fde047; --chart-danger:#f87171;
      --chart-1:#f59e0b;  /* amber/gold — primary */
      --chart-2:#60a5fa;  /* blue                  */
      --chart-3:#34d399;  /* emerald               */
      --chart-4:#f472b6;  /* pink                  */
      --chart-5:#c084fc;  /* lavender              */
      --chart-6:#2dd4bf;  /* teal                  */
      --chart-7:#fb923c;  /* orange                */
      --chart-8:#a3e635;  /* lime                  */
    `,
  },

  /* ─────────────────────────────────────────────────────────────────────
     DARK — CARBON (deep stone + restrained crimson)
     For serious enterprise, financial services, premium / luxury feel.
     Inspired by Tesla, Patek Philippe, premium business publications.
     ───────────────────────────────────────────────────────────────────── */
  carbon: {
    label: "Carbon",
    vars: `
      --bg:#0a0908; --bg2:#1a1614; --bg3:#2a2422; --bg4:#3d3530;
      --fg:#fafaf9; --fg2:#e7e5e4; --fg3:#a8a29e; --fg4:#78716c;
      --accent:#ef4444; --accent2:#f87171; --accent-fg:#0a0908;
      --border:#2a2422; --border2:#3d3530;
      --card-bg:#1a1614; --card-border:#2a2422;
      --cover-bg:linear-gradient(140deg,#000000 0%,#0a0908 50%,#250a0a 100%);
      --cover-line:#ef4444;
      --success:#34d399; --success-bg:rgba(52,211,153,0.10);
      --warning:#fbbf24; --warning-bg:rgba(251,191,36,0.10);
      --danger:#fb7185;  --danger-bg:rgba(251,113,133,0.10);
      --info:#60a5fa;    --info-bg:rgba(96,165,250,0.10);
      --action:#f87171;  --action-bg:rgba(248,113,113,0.10);
      --muted:#a8a29e;   --muted-bg:#1a1614;
      --heading:#fafaf9; --link:#f87171;
      --code-bg:#1a1614; --nav-bg:rgba(10,9,8,0.94);
      --shadow:0 0 0 1px rgba(255,255,255,0.04),0 4px 16px rgba(0,0,0,0.7);
      --shadow-lg:0 0 0 1px rgba(239,68,68,0.10),0 16px 48px rgba(0,0,0,0.8);

      --svg-surface:#1a1614;  --svg-card:#2a2422;
      --chart-text:#fafaf9;   --chart-muted:#a8a29e;
      --chart-grid:rgba(168,162,158,0.18); --chart-neutral:#78716c;
      --chart-success:#34d399; --chart-warning:#fbbf24; --chart-danger:#fb7185;
      --chart-1:#ef4444;  /* crimson — primary */
      --chart-2:#60a5fa;  /* blue              */
      --chart-3:#34d399;  /* emerald           */
      --chart-4:#fbbf24;  /* amber             */
      --chart-5:#c084fc;  /* lavender          */
      --chart-6:#2dd4bf;  /* teal              */
      --chart-7:#fb923c;  /* orange            */
      --chart-8:#a3e635;  /* lime              */
    `,
  },

  /* ─────────────────────────────────────────────────────────────────────
     LIGHT — BLUESTONE (formal navy + cool slate)
     For very formal customers — financial services, legal, government,
     traditional enterprise. Inspired by McKinsey, Goldman, JPM.
     ───────────────────────────────────────────────────────────────────── */
  bluestone: {
    label: "Bluestone",
    vars: `
      --bg:#ffffff; --bg2:#f8fafc; --bg3:#eef2f7; --bg4:#dbe3ed;
      --fg:#0f172a; --fg2:#1e293b; --fg3:#475569; --fg4:#94a3b8;
      --accent:#1e3a8a; --accent2:#1e40af; --accent-fg:#ffffff;
      --border:#dbe3ed; --border2:#bcc8d8;
      --card-bg:#f8fafc; --card-border:#dbe3ed;
      --cover-bg:linear-gradient(135deg,#0a1429 0%,#0f172a 45%,#1e3a8a 100%);
      --cover-line:#1e40af;
      --success:#047857; --success-bg:#ecfdf5;
      --warning:#b45309; --warning-bg:#fffbeb;
      --danger:#b91c1c;  --danger-bg:#fef2f2;
      --info:#1e40af;    --info-bg:#eff6ff;
      --action:#5b21b6;  --action-bg:#f5f3ff;
      --muted:#475569;   --muted-bg:#f8fafc;
      --heading:#0f172a; --link:#1e3a8a;
      --code-bg:#eef2f7; --nav-bg:rgba(255,255,255,0.96);
      --shadow:0 1px 3px rgba(15,23,42,0.07),0 4px 14px rgba(15,23,42,0.05);
      --shadow-lg:0 12px 36px rgba(15,23,42,0.10);

      --svg-surface:#ffffff;  --svg-card:#f8fafc;
      --chart-text:#0f172a;   --chart-muted:#475569;
      --chart-grid:#dbe3ed;   --chart-neutral:#94a3b8;
      --chart-success:#047857; --chart-warning:#b45309; --chart-danger:#b91c1c;
      --chart-1:#1e40af;  /* navy        — primary       */
      --chart-2:#475569;  /* steel gray  — supporting    */
      --chart-3:#0e7490;  /* deep cyan                   */
      --chart-4:#b45309;  /* amber       — single warm   */
      --chart-5:#15803d;  /* forest green                */
      --chart-6:#6b21a8;  /* deep purple                 */
      --chart-7:#0f766e;  /* teal                        */
      --chart-8:#be123c;  /* deep rose                   */
    `,
  },
};

export const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300..900&family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--fg);
  font-size: 14px;
  line-height: 1.68;
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.003em;
}

/* ─────────────────────────────────────────────────────────────────────────
   SIDEBAR THEMING — derives from each theme's accent.

   The sidebar background is always dark (either by default for dark themes,
   or via the per-theme overrides in server.ts for light themes). So the
   sidebar's active/brand colours are designed to *pop* against a dark
   surface — using --accent2 (the lighter shade of each theme's accent)
   gives good contrast across every theme.

   Bluestone is a special case: its --accent and --accent2 are both deep
   navy, which gets lost on the dark navy sidebar. A targeted override
   below substitutes a brighter blue just for that theme.
   ───────────────────────────────────────────────────────────────────── */
:root {
  /* Surfaces */
  --sidebar-bg:               #0a0a0a;
  --sidebar-border:           rgba(255,255,255,0.07);
  --sidebar-input-bg:         rgba(255,255,255,0.06);

  /* Type */
  --sidebar-title-color:      rgba(255,255,255,0.92);
  --sidebar-meta-color:       rgba(255,255,255,0.62);
  --sidebar-nav-color:        rgba(255,255,255,0.5);
  --sidebar-nav-hover:        rgba(255,255,255,0.92);
  --sidebar-dim:              rgba(255,255,255,0.32);

  /* Accent — drives active nav, brand dot, progress fill, PDF button */
  --sidebar-active-color:     var(--accent2);
  --sidebar-brand-color:      var(--accent2);
  --sidebar-active-bg:        color-mix(in srgb, var(--accent2) 12%, transparent);
}

/* Bluestone: accent2 is still deep navy → swap in a brighter blue
   that contrasts properly against the dark navy sidebar background. */
:root[data-theme="bluestone"] {
  --sidebar-active-color:     #60a5fa;
  --sidebar-brand-color:      #60a5fa;
  --sidebar-active-bg:        rgba(96,165,250,0.14);
}

/* Harness: use the brand sky blue against the deep navy sidebar background
   so the active state pops with the official brand identity. */
:root[data-theme="minimal"] {
  --sidebar-active-color:     #38bdf8;
  --sidebar-brand-color:      #38bdf8;
  --sidebar-active-bg:        rgba(56,189,248,0.16);
}

/* Aurora: accent2 teal-500 is OK but a slightly lighter teal pops more. */
:root[data-theme="harness-pro"] {
  --sidebar-active-color:     #2dd4bf;
  --sidebar-brand-color:      #2dd4bf;
  --sidebar-active-bg:        rgba(45,212,191,0.14);
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

/* ── Cover (hero first page) ─────────────────────────────────────────────
   Designed to fill exactly one A4 page in print, render as a strong hero
   on screen, and capture cleanly as a static image for PPT export. */
.cover {
  background: var(--cover-bg);
  padding: 56px 64px 44px;
  position: relative;
  overflow: hidden;
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  isolation: isolate;
}

/* Top accent line */
.cover::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--cover-line);
  z-index: 3;
}

/* Decorative radial glow in top-right corner */
.cover::after {
  content: '';
  position: absolute;
  right: -180px; top: -180px;
  width: 560px; height: 560px;
  border-radius: 50%;
  background: radial-gradient(circle,
    color-mix(in srgb, var(--cover-line) 22%, transparent) 0%,
    transparent 65%);
  pointer-events: none;
  z-index: 0;
}

/* Subtle dot grid texture across the whole cover */
.cover-grid-overlay {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 28px 28px;
  background-position: 0 0;
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
  mask-image: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 90%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 90%);
}

/* Children sit above all decoration layers */
.cover > *:not(.cover-grid-overlay) {
  position: relative;
  z-index: 2;
}

/* ── Top bar: brand mark + classification stamp ──────────────────────── */
.cover-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 64px;
}
.cover-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cover-brand-mark {
  width: 26px; height: 26px; display: block;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--cover-line) 35%, transparent));
}
.cover-brand-mark .harness-mark polygon { fill: var(--cover-line); }
.cover-brand-text {
  font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.28em;
  color: rgba(255,255,255,0.92);
  text-transform: uppercase;
}
.cover-brand-sep {
  font-size: 11.5px;
  color: rgba(255,255,255,0.38);
  font-weight: 400;
  margin: 0 1px;
}
.cover-brand-product {
  font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.28em;
  color: var(--cover-line);
  text-transform: uppercase;
}
.cover-stamp {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(255,255,255,0.72);
  text-transform: uppercase;
  padding: 6px 12px 5px;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 3px;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
}

/* ── Hero block: eyebrow + title + subtitle + customer name ──────────── */
.cover-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 720px;
}
.cover-eyebrow {
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.34em;
  color: var(--cover-line);
  text-transform: uppercase;
  margin-bottom: 22px;
}
.cover h1, .cover-title {
  font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2.2rem, 4.4vw, 3.2rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.035em;
  color: #ffffff;
  margin-bottom: 14px;
  max-width: 720px;
}
.cover-subtitle {
  font-size: clamp(0.95rem, 1.3vw, 1.15rem);
  font-weight: 400;
  color: rgba(255,255,255,0.68);
  letter-spacing: 0.005em;
  line-height: 1.5;
  max-width: 580px;
  margin-bottom: 36px;
}
.cover-accent-rule {
  width: 44px;
  height: 3px;
  background: var(--cover-line);
  border-radius: 2px;
  margin-bottom: 26px;
}
.cover-customer-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cover-prepared-label {
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.34em;
  color: rgba(255,255,255,0.42);
  text-transform: uppercase;
}
.cover-customer-name {
  font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2.6rem, 6.5vw, 4.6rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #ffffff;
  line-height: 0.96;
  text-transform: uppercase;
}

/* ── Hero stats grid ─────────────────────────────────────────────────── */
.cover-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin: 56px 0 36px;
}
.cover-stat-tile {
  border-top: 2px solid;
  padding: 16px 4px 0;
  position: relative;
}
.cover-stat-tile[data-tile="1"] { border-top-color: var(--cover-line); }
.cover-stat-tile[data-tile="2"] { border-top-color: rgba(255,255,255,0.55); }
.cover-stat-tile[data-tile="3"] { border-top-color: var(--cover-line); }
.cover-stat-tile[data-tile="4"] { border-top-color: rgba(255,255,255,0.55); }
.cover-stat-value {
  font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #ffffff;
  line-height: 1;
  margin-bottom: 10px;
  font-feature-settings: 'tnum' 1;
  font-variant-numeric: tabular-nums;
}
.cover-stat-label {
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(255,255,255,0.62);
  text-transform: uppercase;
}

/* ── Footer band: meta items in a clean row ──────────────────────────── */
.cover-footer {
  display: flex;
  gap: 56px;
  padding-top: 22px;
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.14);
}
.cover-footer-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.cover-footer-label {
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: rgba(255,255,255,0.42);
  text-transform: uppercase;
}
.cover-footer-value {
  font-size: 12.5px;
  font-weight: 500;
  color: rgba(255,255,255,0.88);
  letter-spacing: 0.005em;
}

/* ── Print: cover fills exactly one A4 page (no blank-page spillover) ── */
@media print {
  .cover {
    /* Floor at content-area-minus-safety so the cover always fills a full
       page, but cap at the actual printable area + clip overflow so we
       never spill 1-2px onto a blank second page. */
    min-height: calc(297mm - 30mm) !important;
    max-height: calc(297mm - 24mm) !important;
    height: auto !important;
    overflow: hidden !important;
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .cover-grid-overlay { opacity: 0.45 !important; }
  .cover::after { animation: none !important; }
}

/* ── Reduced motion ──────────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .cover { animation: none !important; }
}

/* ── Page layout ──────────────────────────────────────────────────────── */
.report-body {
  max-width: 860px; margin: 0 auto; padding: 36px 40px 60px;
}

/* ── Typography ───────────────────────────────────────────────────────── */
h1, h2, h3, h4 {
  font-family: 'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif;
}
h1 {
  font-size: 1.5rem; font-weight: 800; color: var(--heading);
  margin: 2rem 0 0.55rem; letter-spacing: -0.03em;
  padding-bottom: 10px; border-bottom: 2px solid var(--accent);
  line-height: 1.18;
}
h1:first-child { margin-top: 0; }
h2 {
  font-size: 1rem; font-weight: 700; color: var(--accent);
  margin: 1.7rem 0 0.4rem;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--border);
  letter-spacing: -0.02em;
}
h3 {
  font-size: 0.9rem; font-weight: 700; color: var(--heading);
  margin: 1.3rem 0 0.3rem; letter-spacing: -0.015em;
}
h4 { font-size: 0.84rem; font-weight: 600; color: var(--fg2); margin: 1rem 0 0.25rem; }

p  { margin-bottom: 0.75rem; color: var(--fg2); font-size: 13.5px; line-height: 1.65; }
strong { color: var(--fg); font-weight: 700; }
em { font-style: italic; }

ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
li { margin-bottom: 0.35rem; color: var(--fg2); }
li > strong { color: var(--fg); }

hr { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }

a { color: var(--link); text-decoration: none; border-bottom: 1px solid transparent; }
a:hover { border-bottom-color: var(--link); }

code {
  font-family: 'DM Mono', 'JetBrains Mono', 'Fira Code', monospace;
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

/* ── Inline SVG charts ────────────────────────────────────────────────── */
figure {
  margin: 20px 0 28px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
  display: block;
  padding: 14px;
  background: var(--svg-surface, #ffffff);
}
figure svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 720px;
  margin: 0 auto;
  border-radius: 8px;
}
figure svg text { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }

/* svg-bg class hook (used by newer chart generators) */
.svg-bg { fill: var(--svg-surface, #ffffff); }

/* Slightly stronger framing for figures inside dark themes */
html[data-theme="dark"] figure,
html[data-theme="ocean"] figure,
html[data-theme="black-lime"] figure {
  border-color: rgba(255,255,255,0.06);
  box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 8px 28px rgba(0,0,0,0.45);
}

/* ─────────────────────────────────────────────────────────────────────
   CHART RECOLORING — map hardcoded SVG hex codes to theme variables.

   The chart generator scripts (scripts/generate-*-charts.mjs) emit
   SVGs with a fixed palette. Inlined SVGs inherit CSS, so attribute
   selectors below recolor each known palette colour to the active
   theme's chart variables. CSS specificity beats SVG presentation
   attributes, so this works without regenerating the SVGs.
   ───────────────────────────────────────────────────────────────────── */

/* Surfaces */
figure svg [fill="#ffffff"], figure svg [fill="#FFFFFF"] { fill: var(--svg-surface); }
figure svg [stroke="#ffffff"], figure svg [stroke="#FFFFFF"] { stroke: var(--svg-surface); }
figure svg [fill="#f8fafc"], figure svg [fill="#F8FAFC"] { fill: var(--svg-card); }

/* Text */
figure svg [fill="#0d1f35"] { fill: var(--chart-text); }
figure svg [fill="#1e293b"] { fill: var(--chart-text); }
figure svg [fill="#64748b"] { fill: var(--chart-muted); }

/* Grid + neutral gray */
figure svg [fill="#e2e8f0"] { fill: var(--chart-grid); }
figure svg [stroke="#e2e8f0"] { stroke: var(--chart-grid); }
figure svg [fill="#94a3b8"] { fill: var(--chart-neutral); }
figure svg [stroke="#94a3b8"] { stroke: var(--chart-neutral); }

/* Categorical palette — primary accent (blue) → chart-1 */
figure svg [fill="#0278D5"], figure svg [fill="#0278d5"] { fill: var(--chart-1); }
figure svg [stroke="#0278D5"], figure svg [stroke="#0278d5"] { stroke: var(--chart-1); }

/* sky → chart-2 */
figure svg [fill="#38bdf8"] { fill: var(--chart-2); }
figure svg [stroke="#38bdf8"] { stroke: var(--chart-2); }

/* teal → chart-3 */
figure svg [fill="#0891b2"] { fill: var(--chart-3); }
figure svg [stroke="#0891b2"] { stroke: var(--chart-3); }

/* violet → chart-4 */
figure svg [fill="#7c3aed"] { fill: var(--chart-4); }
figure svg [stroke="#7c3aed"] { stroke: var(--chart-4); }

/* indigo → chart-5 */
figure svg [fill="#4f46e5"] { fill: var(--chart-5); }
figure svg [stroke="#4f46e5"] { stroke: var(--chart-5); }

/* info blue (P3 priority badge, info-flagged dots) → --info
   Stays a cool/info colour on every theme so P1/P2/P3 priorities
   read as danger / warning / info rather than collapsing into
   whatever the theme's primary accent happens to be. */
figure svg [fill="#1e40af"] { fill: var(--info); }
figure svg [stroke="#1e40af"] { stroke: var(--info); }

/* Semantic colors */
figure svg [fill="#059669"] { fill: var(--chart-success); }
figure svg [stroke="#059669"] { stroke: var(--chart-success); }
figure svg [fill="#10b981"] { fill: var(--chart-success); }
figure svg [stroke="#10b981"] { stroke: var(--chart-success); }
figure svg [fill="#dc2626"] { fill: var(--chart-danger); }
figure svg [stroke="#dc2626"] { stroke: var(--chart-danger); }
figure svg [fill="#d97706"] { fill: var(--chart-warning); }
figure svg [stroke="#d97706"] { stroke: var(--chart-warning); }

/* The radar centre badge is a navy disc with white text — keep readable on
   all themes by ensuring the disc is the heading colour and text inverts.
   The "out of 100" muted label inverts via --svg-surface and uses a
   higher opacity so it reads clearly as a secondary number on every
   theme (especially the dark themes where it was previously washed out). */
figure svg circle[fill="#0d1f35"] { fill: var(--chart-text); }
figure svg [fill="rgba(255,255,255,0.55)"] { fill: var(--svg-surface); fill-opacity: 0.85; }

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

/* Status badges */
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
  @page { size: A4; margin: 12mm 12mm; }

  /* Hide screen-only chrome */
  .report-nav { display: none !important; }

  /* Body text: better line flow + smaller default size */
  body {
    font-size: 11.5px;
    orphans: 3;       /* keep ≥3 lines together at top of next page    */
    widows: 3;        /* keep ≥3 lines together at bottom of prev page */
  }

  /* Trim the trailing padding/margin that pushes past the last page
     boundary and creates a final blank page. */
  .report-body { padding-bottom: 0 !important; margin-bottom: 0 !important; }
  .report-body > *:last-child { margin-bottom: 0 !important; }
  hr:last-of-type { display: none; }

  /* Page-break behaviour: keep block elements together so we don't
     produce mid-card / mid-chart breaks that leave large white gaps. */
  h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
  .metric-card,
  .callout,
  .table-wrap,
  figure { break-inside: avoid; page-break-inside: avoid; }
  tr { break-inside: avoid; }

  /* Force colours through */
  .cover, .callout, .metric-card, .table-wrap, figure {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Better grid fit on A4 */
  .metrics-grid { grid-template-columns: repeat(3, 1fr); }

  /* Slightly smaller headings for print density */
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.05rem; }
}

/* ─────────────────────────────────────────────────────────────────────
   SANDSTONE (kinetic) — editorial overrides
   Uses theme variables so a future palette swap stays consistent.
   ───────────────────────────────────────────────────────────────────── */
body[data-theme="kinetic"] {
  font-family: 'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.005em;
}
body[data-theme="kinetic"] .cover { padding: 56px 64px 48px; }
body[data-theme="kinetic"] .cover-brand {
  font-size: 9px; letter-spacing: 0.35em; color: rgba(255,255,255,0.42);
  margin-bottom: 4px;
}
body[data-theme="kinetic"] .cover-eyebrow {
  font-size: 9px; letter-spacing: 0.3em; color: rgba(255,255,255,0.4);
  margin-bottom: 32px;
}
body[data-theme="kinetic"] .cover h1 {
  font-size: 3rem; font-weight: 900; letter-spacing: -0.04em;
  line-height: 1.05; color: #ffffff; margin-bottom: 8px;
}
body[data-theme="kinetic"] .cover-subtitle {
  font-size: 0.95rem; color: rgba(255,255,255,0.55);
  margin-bottom: 52px; letter-spacing: 0.01em;
}
body[data-theme="kinetic"] .cover-meta-label {
  font-size: 8px; letter-spacing: 0.25em; color: rgba(255,255,255,0.32);
}
body[data-theme="kinetic"] .cover-meta-value {
  font-size: 12.5px; color: rgba(255,255,255,0.78); font-weight: 400;
}

body[data-theme="kinetic"] h1 {
  font-size: 1.7rem; font-weight: 900; letter-spacing: -0.03em;
  border-bottom: 2px solid var(--heading);
}
body[data-theme="kinetic"] h2 {
  font-size: 0.75rem; font-weight: 800; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--accent);
  border-bottom: 1px solid var(--border);
}
body[data-theme="kinetic"] h3 {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--fg3);
}

body[data-theme="kinetic"] .metric-label {
  font-size: 8px; letter-spacing: 0.22em; font-weight: 700;
  text-transform: uppercase; color: var(--fg3);
}
body[data-theme="kinetic"] .metric-value {
  font-size: 2rem; font-weight: 900; letter-spacing: -0.03em; color: var(--heading);
}
body[data-theme="kinetic"] .metric-trend {
  font-size: 10px; letter-spacing: 0.04em; color: var(--fg3);
}
body[data-theme="kinetic"] .metric-card {
  border-radius: 0; border: 1px solid var(--border);
  border-top: 3px solid var(--accent); background: var(--card-bg);
}

body[data-theme="kinetic"] .callout {
  border-radius: 0; border-left: 3px solid var(--accent);
  background: var(--bg2); padding: 14px 16px 14px 52px;
}
body[data-theme="kinetic"] .callout::before {
  width: 22px; height: 22px; font-size: 11px; font-weight: 900;
  border-radius: 0; left: 14px; top: 13px;
}
body[data-theme="kinetic"] .callout-badge {
  font-size: 8px; letter-spacing: 0.22em; font-weight: 800;
}

body[data-theme="kinetic"] .table-wrap {
  border-radius: 0; border: 1px solid var(--heading);
  border-top: 2px solid var(--heading);
}
body[data-theme="kinetic"] thead { background: var(--heading); }
body[data-theme="kinetic"] thead th {
  letter-spacing: 0.18em; font-size: 8px; font-weight: 700;
  padding: 10px 12px; color: var(--bg);
}
body[data-theme="kinetic"] tbody tr:nth-child(even) { background: var(--bg2); }
body[data-theme="kinetic"] td { font-size: 13px; color: var(--fg2); }
body[data-theme="kinetic"] td:first-child { font-weight: 600; color: var(--fg); }

body[data-theme="kinetic"] .report-nav { border-bottom: 2px solid var(--heading); }
body[data-theme="kinetic"] .nav-brand {
  font-size: 9px; letter-spacing: 0.3em; color: var(--heading);
}
body[data-theme="kinetic"] p { color: var(--fg2); font-size: 14.5px; line-height: 1.7; }
body[data-theme="kinetic"] hr { border-top: 2px solid var(--heading); margin: 2rem 0; }

body[data-theme="kinetic"] figure {
  border-radius: 0; border: 1px solid var(--border);
}

@media print {
  body[data-theme="kinetic"] .metrics-grid { grid-template-columns: repeat(4, 1fr); }
  body[data-theme="kinetic"] .metric-card,
  body[data-theme="kinetic"] .table-wrap,
  body[data-theme="kinetic"] figure { border-radius: 0; }
}
`;

/**
 * Emit *all* theme variable blocks scoped to their `data-theme` attribute,
 * so the front-end can switch themes instantly by setting the attribute
 * on `<html>` — no full page reload required. The active theme is also
 * emitted as the unscoped `:root{}` fallback so the very first paint is
 * correct even before JavaScript runs.
 */
export function buildThemeStyleTag(activeThemeId: ThemeId): string {
  const active = THEMES[activeThemeId] ?? THEMES.dark;
  const fallback = `:root{${active.vars}}`;
  const scoped = (Object.keys(THEMES) as ThemeId[])
    .map((id) => `:root[data-theme="${id}"]{${THEMES[id]!.vars}}`)
    .join("\n");
  return `<style>${fallback}\n${scoped}\n${BASE_CSS}\n${DYNAMIC_CSS}</style>`;
}

/* ─────────────────────────────────────────────────────────────────────────
   DYNAMIC_CSS — animations, transitions, scroll-reveals, hover effects
   that bring the report to life. All effects gracefully degrade in print.
   ───────────────────────────────────────────────────────────────────── */
export const DYNAMIC_CSS = `
/* ── Smooth theme transitions ────────────────────────────────────────── */
body, .sidebar, .main-content, .cover, .nav-link, .sb-doc-title,
.sb-doc-meta, .sb-progress-fill, .sb-icon-btn,
.callout, .metric-card, .table-wrap, table, thead, tbody tr, td, th,
figure, h1, h2, h3, code, pre {
  transition:
    background-color 0.30s cubic-bezier(0.22,1,0.36,1),
    color 0.30s cubic-bezier(0.22,1,0.36,1),
    border-color 0.30s cubic-bezier(0.22,1,0.36,1),
    box-shadow 0.30s cubic-bezier(0.22,1,0.36,1);
}

/* ── Scroll-reveal: fade-in + lift ───────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity 0.7s cubic-bezier(0.22,1,0.36,1),
    transform 0.7s cubic-bezier(0.22,1,0.36,1);
  will-change: opacity, transform;
}
.reveal.in {
  opacity: 1;
  transform: translateY(0);
}
/* Stagger children of metrics-grid for a cascade effect */
.metrics-grid .reveal:nth-child(2) { transition-delay: 0.06s; }
.metrics-grid .reveal:nth-child(3) { transition-delay: 0.12s; }
.metrics-grid .reveal:nth-child(4) { transition-delay: 0.18s; }
.metrics-grid .reveal:nth-child(5) { transition-delay: 0.24s; }
.metrics-grid .reveal:nth-child(6) { transition-delay: 0.30s; }

/* ── Figure (chart) hover lift ───────────────────────────────────────── */
figure {
  transition:
    transform 0.25s cubic-bezier(0.22,1,0.36,1),
    box-shadow 0.30s cubic-bezier(0.22,1,0.36,1),
    border-color 0.30s cubic-bezier(0.22,1,0.36,1);
}
figure:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

/* ── Sidebar active icon: soft pulse glow ────────────────────────────── */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 10px color-mix(in srgb, var(--sidebar-active-color, var(--accent)) 32%, transparent);
  }
  50% {
    box-shadow: 0 0 18px color-mix(in srgb, var(--sidebar-active-color, var(--accent)) 60%, transparent);
  }
}
.sb-icon-btn.active {
  animation: pulseGlow 2.6s ease-in-out infinite;
}

/* ── Cover gradient: very subtle slow drift (cool but never distracting) ── */
@keyframes coverDrift {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
.cover {
  background-size: 180% 180%;
  animation: coverDrift 22s ease-in-out infinite;
}

/* ── Numeric counter: smooth font feature for tabular figures ─────────── */
figure svg text[data-final] {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

/* ── Print: all motion off, all reveals visible ──────────────────────── */
@media print {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
  .reveal { opacity: 1 !important; transform: none !important; }
  .cover { animation: none !important; background-size: 100% 100% !important; }
  figure:hover { transform: none !important; }
  .sb-icon-btn.active { animation: none !important; }
}

/* ── Reduced motion: respect user preference ─────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1 !important; transform: none !important; }
}
`;
