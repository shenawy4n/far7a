import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Archive, FileText, Mail, Plus, Send, Users } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  coupleLabel,
  listClients,
  listInvitations,
  type InvitationWithRelations,
} from "@/lib/invitations";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const invitations = useQuery({ queryKey: ["invitations"], queryFn: listInvitations });
  const clients = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const rows = invitations.data ?? [];
  const published = rows.filter((r) => r.status === "published").length;
  const drafts = rows.filter((r) => r.status === "draft").length;
  const archived = rows.filter((r) => r.status === "archived").length;

  const columns: Column<InvitationWithRelations>[] = [
    { key: "couple", header: t("couple"), cell: (row) => coupleLabel(row) },
    { key: "type", header: t("eventType"), cell: (row) => t(row.event_type) },
    { key: "date", header: t("date"), cell: (row) => row.event_date ?? "—" },
    { key: "status", header: t("status"), cell: (row) => <StatusBadge status={row.status} /> },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/invitations/$id" params={{ id: row.id }}>
            {t("edit")}
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout
      title={t("dashboard")}
      description={t("tagline")}
      actions={
        <Button asChild size="sm" className="gap-2">
          <Link to="/admin/invitations/new">
            <Plus className="size-4" />
            {t("newInvitation")}
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label={t("totalInvitations")} value={rows.length} icon={Mail} loading={invitations.isLoading} />
        <StatCard label={t("published")} value={published} icon={Send} loading={invitations.isLoading} />
        <StatCard label={t("drafts")} value={drafts} icon={FileText} loading={invitations.isLoading} />
        <StatCard label={t("archived")} value={archived} icon={Archive} loading={invitations.isLoading} />
        <StatCard
          label={t("totalClients")}
          value={clients.data?.length ?? 0}
          icon={Users}
          loading={clients.isLoading}
        />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{t("recentInvitations")}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/invitations">{t("invitations")}</Link>
          </Button>
        </div>
        <DataTable
          columns={columns}
          rows={rows.slice(0, 5)}
          getRowId={(row) => row.id}
          loading={invitations.isLoading}
          emptyLabel={t("emptyInvitations")}
        />
      </section>
    </AdminLayout>
  );
}
