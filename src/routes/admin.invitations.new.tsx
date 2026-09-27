import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { InvitationForm, type InvitationFormValues } from "@/components/invitations/InvitationForm";
import { ClientForm, type ClientFormValues } from "@/components/invitations/ClientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import {
  createClient,
  createInvitation,
  listClients,
  listTemplates,
  type InvitationInsert,
} from "@/lib/invitations";

export const Route = createFileRoute("/admin/invitations/new")({
  component: NewInvitationPage,
});

export function toInsert(values: InvitationFormValues): Omit<InvitationInsert, "slug"> {
  const nullable = (value: string) => (value.trim() === "" ? null : value.trim());
  return {
    client_id: values.client_id,
    template_id: values.template_id,
    title: nullable(values.title),
    event_type: values.event_type,
    groom_name: nullable(values.groom_name),
    bride_name: nullable(values.bride_name),
    groom_family: nullable(values.groom_family),
    bride_family: nullable(values.bride_family),
    event_date: nullable(values.event_date),
    event_time: nullable(values.event_time),
    venue_name: nullable(values.venue_name),
    venue_address: nullable(values.venue_address),
    maps_url: nullable(values.maps_url),
    transportation_info: nullable(values.transportation_info),
    parking_info: nullable(values.parking_info),
    additional_notes: nullable(values.additional_notes),
  };
}

function NewInvitationPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [clientDialog, setClientDialog] = useState(false);

  const clients = useQuery({ queryKey: ["clients"], queryFn: listClients });
  const templates = useQuery({ queryKey: ["templates"], queryFn: listTemplates });

  const createMutation = useMutation({
    mutationFn: (values: InvitationFormValues) =>
      createInvitation({ ...toInsert(values), status: "draft" }),
    onSuccess: (invitation) => {
      toast.success(t("saved"));
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      navigate({ to: "/admin/invitations/$id", params: { id: invitation.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clientMutation = useMutation({
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
      setClientDialog(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AdminLayout title={t("createInvitation")} description={t("slugHint")}>
      <div className="max-w-4xl">
        <InvitationForm
          clients={clients.data ?? []}
          templates={templates.data ?? []}
          submitting={createMutation.isPending}
          onSubmit={(values) => createMutation.mutateAsync(values)}
          onCreateClient={() => setClientDialog(true)}
        />
      </div>

      <Dialog open={clientDialog} onOpenChange={setClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newClient")}</DialogTitle>
          </DialogHeader>
          <ClientForm
            submitting={clientMutation.isPending}
            onSubmit={(values) => clientMutation.mutateAsync(values)}
            onCancel={() => setClientDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
