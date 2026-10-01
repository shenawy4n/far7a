import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { ClientForm, type ClientFormValues } from "@/components/invitations/ClientForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { createClient, deleteClient, listClients, updateClient, type Client } from "@/lib/invitations";

export const Route = createFileRoute("/admin/clients/")({
  component: ClientsPage,
});

export function clientPatch(values: ClientFormValues) {
  return {
    full_name: values.full_name.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    notes: values.notes.trim() || null,
  };
}

export function clientToForm(client: Client): ClientFormValues {
  return {
    full_name: client.full_name,
    phone: client.phone ?? "",
    email: client.email ?? "",
    notes: client.notes ?? "",
  };
}

function ClientsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);

  const saveMutation = useMutation({
    mutationFn: (values: ClientFormValues) =>
      editing ? updateClient(editing.id, clientPatch(values)) : createClient(clientPatch(values)),
    onSuccess: () => {
      toast.success(t("saved"));
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDialog(false);
      setEditing(null);
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

  function openCreate() {
    setEditing(null);
    setDialog(true);
  }

  const columns: Column<Client>[] = [
    {
      key: "name",
      header: t("fullName"),
      cell: (row) => (
        <Link to="/admin/clients/$id" params={{ id: row.id }} className="font-medium hover:underline">
          {row.full_name}
        </Link>
      ),
    },
    { key: "phone", header: t("phone"), cell: (row) => <span dir="ltr">{row.phone ?? "—"}</span> },
    { key: "email", header: t("email"), cell: (row) => <span dir="ltr">{row.email ?? "—"}</span> },
    { key: "notes", header: t("notes"), cell: (row) => row.notes ?? "—" },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("editClient")}
            onClick={() => {
              setEditing(row);
              setDialog(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t("delete")} onClick={() => setPendingDelete(row)}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout
      title={t("clients")}
      actions={
        <Button size="sm" className="gap-2" onClick={openCreate}>
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
          action={<Button onClick={openCreate}>{t("addClient")}</Button>}
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

      <Dialog
        open={dialog}
        onOpenChange={(open) => {
          setDialog(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("editClient") : t("newClient")}</DialogTitle>
          </DialogHeader>
          <ClientForm
            key={editing?.id ?? "new"}
            initial={editing ? clientToForm(editing) : undefined}
            submitting={saveMutation.isPending}
            onSubmit={(values) => saveMutation.mutateAsync(values)}
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
