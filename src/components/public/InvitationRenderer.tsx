import {
  CONTENT_WIDTH,
  SECTION_SPACING,
  orderSections,
  resolveTheme,
  themeToStyle,
  type LayoutVariant,
  type RenderMedia,
  type RenderSection,
  type ThemePayload,
} from "@/lib/template-engine";
import type { PublicInvitation } from "@/lib/public-invitation.functions";
import { SectionRenderer } from "./sections";

/**
 * Template registry: templates.slug → layout variant used when the template's
 * settings don't declare one. Adding a template = a `templates` row (settings
 * carry layout/theme/sections) and, only for a new visual layout, a variant here.
 */
const TEMPLATE_LAYOUTS: Record<string, LayoutVariant> = {
  "classic-gold": "classic",
  "modern-minimal": "minimal",
};
const DEFAULT_LAYOUT: LayoutVariant = "classic";

export function resolveTemplate(slug: string | null | undefined): LayoutVariant {
  return TEMPLATE_LAYOUTS[slug ?? ""] ?? DEFAULT_LAYOUT;
}

export type InvitationRendererProps = {
  invitation: PublicInvitation;
  sections: RenderSection[];
  theme?: ThemePayload;
  media?: RenderMedia[];
};

/**
 * The single invitation renderer used by both the public page and the admin preview.
 * Invitation → Template → Theme → Ordered sections → Section components.
 */
export function InvitationRenderer({ invitation, sections, theme, media = [] }: InvitationRendererProps) {
  const fallback = resolveTemplate(invitation.template_slug);
  // A missing template (no slug) always renders the default layout.
  const resolved = resolveTheme(invitation.template_slug ? (theme ?? null) : null, fallback);
  const variant = resolved.layout;
  const ordered = orderSections(sections);

  return (
    <div
      data-invitation
      className="min-h-screen bg-background text-foreground"
      dir="rtl"
      style={themeToStyle(resolved.theme)}
    >
      <div
        className={`mx-auto w-full ${CONTENT_WIDTH[resolved.theme.layout.contentWidth]} ${
          variant === "minimal" ? "px-6 pb-16 pt-16" : "px-5 pb-16 pt-12"
        }`}
      >
        <div className={SECTION_SPACING[resolved.theme.layout.sectionSpacing]}>
          {ordered.map((section) => (
            <SectionRenderer
              key={section.section_type}
              invitation={invitation}
              section={section}
              media={media}
              variant={variant}
            />
          ))}
        </div>

        {variant === "minimal" ? (
          <footer className="mt-14 text-start text-xs text-muted-foreground">فرحة</footer>
        ) : (
          <footer className="mt-12 text-center">
            <div className="rule-gold mx-auto h-px w-20" />
            <p className="mt-4 font-display text-lg text-muted-foreground">فرحة</p>
          </footer>
        )}
      </div>
    </div>
  );
}
