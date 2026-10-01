import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ExternalLink, Eye, Link2, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { InvitationForm, toFormValues } from "@/components/invitations/InvitationForm";
import { toInsert } from "@/routes/admin.invitations.new";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import {
  coupleLabel,
  getInvitation,
  listClients,
  listTemplates,
  publicUrl,
  setStatus,
  updateInvitation,
  type InvitationStatus,
} from "@/lib/invitations";

export const Route = createFileRoute("/admin/invitations/$id")({
  component: EditInvitationPage,
});

function EditInvitationPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const invitation = useQuery({ queryKey: ["invitation", id], queryFn: () => getInvitation(id) });
  const clients = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const templates = useQuery({ queryKey: ["templates"], queryFn: listTemplates });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["invitation", id] });
    queryClient.invalidateQueries({ queryKey: ["invitations"] });
  }

  const saveMutation = useMutation({
    mutationFn: (values: Parameters<typeof toInsert>[0]) => updateInvitation(id, toInsert(values)),
    onSuccess: () => {
      toast.success(t("saved"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (status: InvitationStatus) => setStatus(id, status),
    onSuccess: () => {
      toast.success(t("saved"));
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (invitation.isLoading) {
    return (
      <AdminLayout title={t("editInvitation")}>
        <div className="max-w-4xl space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AdminLayout>
    );
  }

  const row = invitation.data;
  if (!row) {
    return (
      <AdminLayout title={t("editInvitation")}>
        <p className="text-sm text-muted-foreground">{t("unavailableBody")}</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/admin/invitations" })}>
          {t("back")}
        </Button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={coupleLabel(row)}
      description={`/i/${row.slug}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={row.status} />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={async () => {
              await navigator.clipboard.writeText(publicUrl(row.slug));
              toast.success(t("linkCopied"));
            }}
          >
            <Link2 className="size-4" />
            {t("copyLink")}
          </Button>
        </div>
      }
    >
      <div className="max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
          {row.status !== "published" ? (
            <Button
              size="sm"
              className="gap-2"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("published")}
            >
              <Send className="size-4" />
              {row.status === "archived" ? t("restorePublish") : t("publish")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("draft")}
            >
              <Undo2 className="size-4" />
              {t("unpublish")}
            </Button>
          )}
          {row.status !== "archived" ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("archived")}
            >
              <Archive className="size-4" />
              {t("archive")}
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="gap-2">
            <Link to="/admin/invitations/$id/preview" params={{ id: row.id }}>
              <Eye className="size-4" />
              {t("preview")}
            </Link>
          </Button>
          {row.status === "published" ? (
            <Button asChild size="sm" variant="ghost" className="gap-2">
              <a href={`/i/${row.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {t("previewPublic")}
              </a>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost" className="ms-auto">
            <Link to="/admin/invitations">{t("back")}</Link>
          </Button>
        </div>

        <InvitationForm
          key={row.id}
          initial={toFormValues(row)}
          clients={clients.data ?? []}
          templates={templates.data ?? []}
          submitting={saveMutation.isPending}
          onSubmit={(values) => saveMutation.mutateAsync(values)}
        />
      </div>
    </AdminLayout>
  );
}
