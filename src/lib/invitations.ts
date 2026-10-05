import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type InvitationInsert = Database["public"]["Tables"]["invitations"]["Insert"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Template = Database["public"]["Tables"]["templates"]["Row"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];
export type EventType = Database["public"]["Enums"]["event_type"];

export const EVENT_TYPES: EventType[] = ["wedding", "engagement", "birthday", "graduation", "other"];
export const STATUSES: InvitationStatus[] = ["draft", "published", "archived"];

export type InvitationWithRelations = Invitation & {
  clients: Pick<Client, "id" | "full_name"> | null;
  templates: Pick<Template, "id" | "name" | "slug" | "settings"> | null;
};

const SELECT_WITH_RELATIONS =
  "*, clients ( id, full_name ), templates ( id, name, slug, settings )";

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export async function listInvitations() {
  return unwrap(
    await supabase
      .from("invitations")
      .select(SELECT_WITH_RELATIONS)
      .order("created_at", { ascending: false }),
  ) as InvitationWithRelations[];
}

export async function getInvitation(id: string) {
  return unwrap(
    await supabase.from("invitations").select(SELECT_WITH_RELATIONS).eq("id", id).maybeSingle(),
  ) as InvitationWithRelations | null;
}

export async function listClients() {
  return unwrap(
    await supabase.from("clients").select("*").order("created_at", { ascending: false }),
  ) as Client[];
}

export async function listTemplates() {
  return unwrap(
    await supabase.from("templates").select("*").order("name", { ascending: true }),
  ) as Template[];
}

export async function createClient(input: {
  full_name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}) {
  return unwrap(await supabase.from("clients").insert(input).select("*").single()) as Client;
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getClient(id: string) {
  return unwrap(await supabase.from("clients").select("*").eq("id", id).maybeSingle()) as Client | null;
}

export async function updateClient(
  id: string,
  patch: { full_name: string; phone: string | null; email: string | null; notes: string | null },
) {
  return unwrap(
    await supabase.from("clients").update(patch).eq("id", id).select("*").single(),
  ) as Client;
}

export async function listInvitationsByClient(clientId: string) {
  return unwrap(
    await supabase
      .from("invitations")
      .select(SELECT_WITH_RELATIONS)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ) as InvitationWithRelations[];
}

export async function listVisibleSections(invitationId: string) {
  return unwrap(
    await supabase
      .from("invitation_sections")
      .select("section_type, title, content, sort_order, settings")
      .eq("invitation_id", invitationId)
      .eq("is_visible", true)
      .order("sort_order"),
  );
}

/**
 * Project an admin invitation row onto the public data contract, so the admin
 * preview feeds the exact same renderer as /i/:slug (no client/admin fields).
 */
export function toPublicShape(row: InvitationWithRelations) {
  return {
    slug: row.slug,
    title: row.title,
    event_type: row.event_type,
    groom_name: row.groom_name,
    bride_name: row.bride_name,
    groom_family: row.groom_family,
    bride_family: row.bride_family,
    event_date: row.event_date,
    event_time: row.event_time,
    venue_name: row.venue_name,
    venue_address: row.venue_address,
    maps_url: row.maps_url,
    transportation_info: row.transportation_info,
    parking_info: row.parking_info,
    additional_notes: row.additional_notes,
    cover_image_url: row.cover_image_url,
    template_slug: row.templates?.slug ?? null,
  };
}

export async function listMedia(invitationId: string) {
  return unwrap(
    await supabase
      .from("media")
      .select("file_url, file_type, sort_order")
      .eq("invitation_id", invitationId)
      .order("sort_order"),
  );
}

/** Same theme payload shape the public RPC returns: template defaults + invitation overrides. */
export function toThemePayload(row: InvitationWithRelations) {
  const settings = (row.templates?.settings ?? {}) as Record<string, Json>;
  return { layout: settings["layout"] ?? null, theme: settings["theme"] ?? {}, overrides: row.theme_overrides };
}

export function slugBase(groom?: string | null, bride?: string | null, title?: string | null) {
  const parts = [groom, bride].filter(Boolean).join("-");
  return (parts || title || "invitation").toString();
}

export async function generateSlug(base: string) {
  const { data, error } = await supabase.rpc("generate_invitation_slug", { _base: base });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function createInvitation(input: Omit<InvitationInsert, "slug"> & { slug?: string }) {
  const slug = input.slug || (await generateSlug(slugBase(input.groom_name, input.bride_name, input.title)));
  return unwrap(
    await supabase.from("invitations").insert({ ...input, slug }).select("*").single(),
  ) as Invitation;
}

export async function updateInvitation(id: string, patch: Partial<InvitationInsert>) {
  return unwrap(
    await supabase.from("invitations").update(patch).eq("id", id).select("*").single(),
  ) as Invitation;
}

export async function setStatus(id: string, status: InvitationStatus) {
  const patch: Partial<InvitationInsert> = { status };
  if (status !== "published") patch.published_at = null;
  return updateInvitation(id, patch);
}

export async function deleteInvitation(id: string) {
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateInvitation(id: string) {
  const source = unwrap(
    await supabase.from("invitations").select("*").eq("id", id).single(),
  ) as Invitation;

  const { id: _id, created_at, updated_at, published_at, slug, ...rest } = source;
  void _id;
  void created_at;
  void updated_at;
  void published_at;

  const nextSlug = await generateSlug(slug);
  return unwrap(
    await supabase
      .from("invitations")
      .insert({ ...rest, slug: nextSlug, status: "draft", published_at: null })
      .select("*")
      .single(),
  ) as Invitation;
}

export function publicUrl(slug: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/i/${slug}`;
}

export function coupleLabel(invitation: Pick<Invitation, "groom_name" | "bride_name" | "title">) {
  const names = [invitation.groom_name, invitation.bride_name].filter(Boolean).join(" & ");
  return names || invitation.title || "—";
}
