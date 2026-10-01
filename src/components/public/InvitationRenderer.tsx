import type { ComponentType } from "react";
import { ClassicGoldTemplate } from "./templates/ClassicGold";
import { ModernMinimalTemplate } from "./templates/ModernMinimal";
import type { TemplateProps } from "./templates/shared";

/**
 * Template registry: templates.slug → renderer component.
 * Adding a template = add a component + one entry here (and a row in `templates`).
 */
const TEMPLATES: Record<string, ComponentType<TemplateProps>> = {
  "classic-gold": ClassicGoldTemplate,
  "modern-minimal": ModernMinimalTemplate,
};

const DEFAULT_TEMPLATE = "classic-gold";

export function resolveTemplate(slug: string | null | undefined) {
  return TEMPLATES[slug ?? ""] ?? TEMPLATES[DEFAULT_TEMPLATE] ?? ClassicGoldTemplate;
}

/** The single invitation renderer used by both the public page and the admin preview. */
export function InvitationRenderer({ invitation, sections }: TemplateProps) {
  const Template = resolveTemplate(invitation.template_slug);
  return <Template invitation={invitation} sections={sections} />;
}
