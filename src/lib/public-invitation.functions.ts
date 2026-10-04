import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";

export type PublicInvitation = Database["public"]["Functions"]["get_public_invitation"]["Returns"][number];
export type PublicSection =
  Database["public"]["Functions"]["get_public_invitation_sections"]["Returns"][number];

export type PublicMedia =
  Database["public"]["Functions"]["get_public_invitation_media"]["Returns"][number];
export type PublicTheme = { layout?: Json; theme?: Json; overrides?: Json } | null;

/**
 * Public, anonymous read of a PUBLISHED invitation only.
 * Backed by security-definer database functions that expose a safe column set —
 * no client records, no admin data, no unpublished rows.
 */
export const getPublicInvitation = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1).max(200) }).parse(data))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data: rows, error } = await supabase.rpc("get_public_invitation", { _slug: data.slug });
    if (error) throw new Error(error.message);
    const invitation = (rows ?? [])[0] ?? null;
    if (!invitation) {
      return { invitation: null, sections: [] as PublicSection[], theme: null, media: [] as PublicMedia[] };
    }

    const [sections, theme, media] = await Promise.all([
      supabase.rpc("get_public_invitation_sections", { _slug: data.slug }),
      supabase.rpc("get_public_invitation_theme", { _slug: data.slug }),
      supabase.rpc("get_public_invitation_media", { _slug: data.slug }),
    ]);

    return {
      invitation,
      sections: (sections.data ?? []) as PublicSection[],
      theme: (theme.data ?? null) as PublicTheme,
      media: (media.data ?? []) as PublicMedia[],
    };
  });
