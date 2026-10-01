import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ClientForm } from "@/components/invitations/ClientForm";
import { InvitationActionsMenu } from "@/components/invitations/InvitationActionsMenu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import {
  coupleLabel,
  getClient,
  listInvitationsByClient,
  updateClient,
  type InvitationWithRelations,
} from "@/lib/invitations";
import { clientPatch, clientToForm } from "@/routes/admin.clients.index";

export const Route = createFileRoute("/admin/clients/$id")({
  component: ClientDetailsPage,
});

function Field({ label, value, ltr }: { label: string; value: string | null; ltr?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm" dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </p>
    </div>
  );
}

function ClientDetailsPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const client = useQuery({ queryKey: ["client", id], queryFn: () => getClient(id) });
  const invitations = useQuery({
    queryKey: ["invitations", "by-client", id],
    queryFn: () => listInvitationsByClient(id),
  });

  const saveMutation = useMutation({
    mutationFn: (values: Parameters<typeof clientPatch>[0]) => updateClient(id, clientPatch(values)),
    onSuccess: () => {
      toast.success(t("saved"));
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditing(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<InvitationWithRelations>[] = [
    { key: "couple", header: t("couple"), cell: (row) => <span className="font-medium">{coupleLabel(row)}</span> },
    { key: "status", header: t("status"), cell: (row) => <StatusBadge status={row.status} /> },
    { key: "date", header: t("date"), cell: (row) => row.event_date ?? "—" },
    { key: "template", header: t("template"), cell: (row) => row.templates?.name ?? "—" },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      cell: (row) => <InvitationActionsMenu row={row} />,
    },
  ];

  const row = client.data;

  return (
    <AdminLayout
      title={row?.full_name ?? t("clientDetails")}
      description={t("clientDetails")}
      actions={
        <div className="flex gap-2">
          {row ? (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              {t("editClient")}
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin/clients">{t("back")}</Link>
          </Button>
        </div>
      }
    >
      {client.isLoading ? (
        <Skeleton className="h-32 w-full max-w-4xl" />
      ) : !row ? (
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
      ) : (
        <div className="max-w-4xl space-y-8">
          <div className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
            <Field label={t("fullName")} value={row.full_name} />
            <Field label={t("phone")} value={row.phone} ltr />
            <Field label={t("email")} value={row.email} ltr />
            <Field label={t("createdAt")} value={new Date(row.created_at).toISOString().slice(0, 10)} />
            <div className="sm:col-span-2">
              <Field label={t("notes")} value={row.notes} />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold">{t("relatedInvitations")}</h2>
            <DataTable
              columns={columns}
              rows={invitations.data ?? []}
              getRowId={(r) => r.id}
              loading={invitations.isLoading}
              emptyLabel={t("noRelatedInvitations")}
            />
          </div>

          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("editClient")}</DialogTitle>
              </DialogHeader>
              <ClientForm
                key={row.updated_at}
                initial={clientToForm(row)}
                submitting={saveMutation.isPending}
                onSubmit={(values) => saveMutation.mutateAsync(values)}
                onCancel={() => setEditing(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </AdminLayout>
  );
}
