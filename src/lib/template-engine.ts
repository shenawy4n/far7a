import type { CSSProperties } from "react";
import type { Json } from "@/integrations/supabase/types";

/**
 * Template engine model.
 * templates.settings = { layout, theme, sections }  (template defaults)
 * invitations["theme"]_overrides = Partial<Theme>       (per-invitation overrides)
 * Renderer = deep-merge(defaults, template theme, overrides) → CSS variables.
 */

export const SECTION_TYPES = [
  "hero",
  "couple",
  "event",
  "venue",
  "transportation",
  "gallery",
  "notes",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const LAYOUTS = ["classic", "minimal"] as const;
export type LayoutVariant = (typeof LAYOUTS)[number];

export type ThemeColors = Partial<
  Record<"primary" | "secondary" | "background" | "text" | "accent", string>
>;
export type FontKey = "display" | "sans" | "serif";
export type Theme = {
  colors: ThemeColors;
  typography: { heading: FontKey; body: FontKey };
  layout: { contentWidth: "narrow" | "medium" | "wide"; sectionSpacing: "compact" | "normal" | "relaxed" };
};
export type ThemeOverrides = {
  colors?: ThemeColors;
  typography?: Partial<Theme["typography"]>;
  layout?: Partial<Theme["layout"]>;
};

export type SectionConfig = { type: SectionType; visible: boolean };
export type TemplateConfig = { layout: LayoutVariant; theme: Theme; sections: SectionConfig[] };

/** Section data handed to the renderer (matches the public RPC shape). */
export type RenderSection = {
  section_type: string;
  title: string | null;
  content: string | null;
  sort_order: number;
  settings: Json;
};
export type RenderMedia = { file_url: string; file_type: string | null; sort_order: number };
/** Theme payload as returned by get_public_invitation_theme (or built for admin preview). */
export type ThemePayload = { layout?: Json; theme?: Json; overrides?: Json } | null;

export const DEFAULT_THEME: Theme = {
  colors: {},
  typography: { heading: "display", body: "sans" },
  layout: { contentWidth: "narrow", sectionSpacing: "normal" },
};

export const DEFAULT_SECTIONS: SectionConfig[] = SECTION_TYPES.map((type) => ({ type, visible: true }));

const FONT_STACKS: Record<FontKey, string> = {
  display: '"Cormorant Garamond", "Cairo", ui-serif, Georgia, serif',
  sans: '"Cairo", "Inter", ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
};

export const CONTENT_WIDTH: Record<Theme["layout"]["contentWidth"], string> = {
  narrow: "max-w-lg",
  medium: "max-w-2xl",
  wide: "max-w-4xl",
};
export const SECTION_SPACING: Record<Theme["layout"]["sectionSpacing"], string> = {
  compact: "space-y-4",
  normal: "space-y-8",
  relaxed: "space-y-12",
};

const COLOR_VARS: Record<keyof ThemeColors, string> = {
  primary: "--primary",
  secondary: "--secondary",
  background: "--background",
  text: "--foreground",
  accent: "--gold",
};

// Only plain color literals may reach CSS variables (no url(), no expressions).
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|(oklch|oklab|rgb|rgba|hsl|hsla)\([0-9.,%\s/-]+\))$/i;

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function pick<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function mergeTheme(base: Theme, raw: unknown): Theme {
  const o = obj(raw);
  const colors = { ...base.colors };
  for (const [k, v] of Object.entries(obj(o["colors"]))) {
    if (k in COLOR_VARS && typeof v === "string" && SAFE_COLOR.test(v.trim())) {
      colors[k as keyof ThemeColors] = v.trim();
    }
  }
  const ty = obj(o["typography"]);
  const ly = obj(o["layout"]);
  const fonts = ["display", "sans", "serif"] as const;
  return {
    colors,
    typography: {
      heading: pick(ty["heading"], fonts, base.typography.heading),
      body: pick(ty["body"], fonts, base.typography.body),
    },
    layout: {
      contentWidth: pick(ly["contentWidth"], ["narrow", "medium", "wide"] as const, base.layout.contentWidth),
      sectionSpacing: pick(
        ly["sectionSpacing"],
        ["compact", "normal", "relaxed"] as const,
        base.layout.sectionSpacing,
      ),
    },
  };
}

/** Parse templates.settings into a full config with safe defaults. */
export function parseTemplateConfig(settings: unknown, fallbackLayout: LayoutVariant = "classic"): TemplateConfig {
  const s = obj(settings);
  const sections = Array.isArray(s["sections"])
    ? (s["sections"] as unknown[])
        .map((x) => obj(x))
        .filter((x) => SECTION_TYPES.includes(x["type"] as SectionType))
        .map((x) => ({ type: x["type"] as SectionType, visible: x["visible"] !== false }))
    : DEFAULT_SECTIONS;
  return {
    layout: pick(s["layout"], LAYOUTS, fallbackLayout),
    theme: mergeTheme(DEFAULT_THEME, s["theme"]),
    sections: sections.length ? sections : DEFAULT_SECTIONS,
  };
}

/** Template defaults → invitation overrides → final theme. */
export function resolveTheme(payload: ThemePayload, fallbackLayout: LayoutVariant) {
  const p = payload ?? {};
  const layout = pick(p.layout, LAYOUTS, fallbackLayout);
  const theme = mergeTheme(mergeTheme(DEFAULT_THEME, p.theme), p.overrides);
  return { layout, theme };
}

export function themeToStyle(theme: Theme): CSSProperties {
  const style: Record<string, string> = {
    "--inv-font-heading": FONT_STACKS[theme.typography.heading],
    fontFamily: FONT_STACKS[theme.typography.body],
  };
  for (const [k, v] of Object.entries(theme.colors)) {
    if (v) style[COLOR_VARS[k as keyof ThemeColors]] = v;
  }
  return style as CSSProperties;
}

/** Ordered sections to render; falls back to the default order when none are stored. */
export function orderSections(sections: RenderSection[]): RenderSection[] {
  const known = sections.filter((s) => SECTION_TYPES.includes(s.section_type as SectionType));
  if (known.length === 0) {
    return DEFAULT_SECTIONS.map((s, i) => ({
      section_type: s.type,
      title: null,
      content: null,
      sort_order: (i + 1) * 10,
      settings: {},
    }));
  }
  return [...known].sort((a, b) => a.sort_order - b.sort_order);
}
