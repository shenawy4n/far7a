import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type PublicInvitation = Database["public"]["Functions"]["get_public_invitation"]["Returns"][number];
export type PublicSection =
  Database["public"]["Functions"]["get_public_invitation_sections"]["Returns"][number];

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
    if (!invitation) return { invitation: null, sections: [] as PublicSection[] };

    const { data: sections } = await supabase.rpc("get_public_invitation_sections", {
      _slug: data.slug,
    });

    return { invitation, sections: (sections ?? []) as PublicSection[] };
  });
