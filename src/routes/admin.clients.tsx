import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ClientForm, type ClientFormValues } from "@/components/invitations/ClientForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { createClient, deleteClient, listClients, type Client } from "@/lib/invitations";

export const Route = createFileRoute("/admin/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const [dialog, setDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);

  const createMutation = useMutation({
    mutationFn: (values: ClientFormValues) =>
      createClient({
        full_name: values.full_name.trim(),
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        notes: values.notes.trim() || null,
      }),
    onSuccess: () => {
      toast.success(t("saved"));
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialog(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success(t("deleted"));
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const columns: Column<Client>[] = [
    { key: "name", header: t("fullName"), cell: (row) => row.full_name },
    {
      key: "phone",
      header: t("phone"),
      cell: (row) => (
        <span dir="ltr">{row.phone ?? "—"}</span>
      ),
    },
    { key: "email", header: t("email"), cell: (row) => <span dir="ltr">{row.email ?? "—"}</span> },
    { key: "notes", header: t("notes"), cell: (row) => row.notes ?? "—" },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <Button variant="ghost" size="icon" onClick={() => setPendingDelete(row)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout
      title={t("clients")}
      actions={
        <Button size="sm" className="gap-2" onClick={() => setDialog(true)}>
          <Plus className="size-4" />
          {t("addClient")}
        </Button>
      }
    >
      {!isLoading && (data ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("emptyClients")}
          description={t("emptyClientsBody")}
          action={<Button onClick={() => setDialog(true)}>{t("addClient")}</Button>}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data ?? []}
          getRowId={(row) => row.id}
          loading={isLoading}
          emptyLabel={t("emptyClients")}
        />
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newClient")}</DialogTitle>
          </DialogHeader>
          <ClientForm
            submitting={createMutation.isPending}
            onSubmit={(values) => createMutation.mutateAsync(values)}
            onCancel={() => setDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeMutation.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </AdminLayout>
  );
}
