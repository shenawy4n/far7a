import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { InvitationRenderer } from "@/components/public/InvitationRenderer";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { getInvitation, listMedia, listVisibleSections, toPublicShape, toThemePayload } from "@/lib/invitations";
import type { PublicInvitation, PublicSection } from "@/lib/public-invitation.functions";

// Lives under /admin (auth-gated layout); data is read with the admin's session, so RLS
// (is_admin) is the gate. Not reachable anonymously.
export const Route = createFileRoute("/admin/invitations/$id_/preview")({
  head: () => ({
    meta: [{ title: "معاينة الدعوة — فرحة" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: PreviewPage,
});

function PreviewPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const invitation = useQuery({ queryKey: ["invitation", id], queryFn: () => getInvitation(id) });
  const sections = useQuery({
    queryKey: ["invitation-sections", id],
    queryFn: () => listVisibleSections(id),
  });
  const media = useQuery({ queryKey: ["invitation-media", id], queryFn: () => listMedia(id) });

  const row = invitation.data;
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-accent px-4 py-2 text-sm text-accent-foreground">
        <span className="font-medium">{t("adminPreview")}</span>
        {row ? <StatusBadge status={row.status} /> : null}
        <Button asChild size="sm" variant="ghost" className="ms-auto gap-2">
          <Link to="/admin/invitations/$id" params={{ id }}>
            <ArrowRight className="size-4 ltr:rotate-180" />
            {t("back")}
          </Link>
        </Button>
      </div>
      {invitation.isLoading ? (
        <div className="mx-auto max-w-lg space-y-4 p-6">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : row ? (
        <InvitationRenderer
          invitation={toPublicShape(row) as PublicInvitation}
          sections={(sections.data ?? []) as PublicSection[]}
          theme={toThemePayload(row)}
          media={media.data ?? []}
        />
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">{t("notFound")}</p>
      )}
    </div>
  );
}
