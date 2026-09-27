import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Link2, Mail, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import {
  coupleLabel,
  deleteInvitation,
  duplicateInvitation,
  EVENT_TYPES,
  listInvitations,
  publicUrl,
  STATUSES,
  type InvitationWithRelations,
} from "@/lib/invitations";

export const Route = createFileRoute("/admin/invitations/")({
  component: InvitationsPage,
});

function InvitationsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["invitations"], queryFn: listInvitations });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [pendingDelete, setPendingDelete] = useState<InvitationWithRelations | null>(null);

  const removeMutation = useMutation({
    mutationFn: deleteInvitation,
    onSuccess: () => {
      toast.success(t("deleted"));
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateInvitation,
    onSuccess: () => {
      toast.success(t("duplicated"));
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((row) => {
      if (status !== "all" && row.status !== status) return false;
      if (type !== "all" && row.event_type !== type) return false;
      if (!term) return true;
      return [row.groom_name, row.bride_name, row.title, row.slug, row.clients?.full_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [data, search, status, type]);

  async function copyLink(slug: string) {
    await navigator.clipboard.writeText(publicUrl(slug));
    toast.success(t("linkCopied"));
  }

  const columns: Column<InvitationWithRelations>[] = [
    {
      key: "couple",
      header: t("couple"),
      cell: (row) => (
        <div className="min-w-40">
          <p className="font-medium">{coupleLabel(row)}</p>
          <p dir="ltr" className="text-xs text-muted-foreground">
            /i/{row.slug}
          </p>
        </div>
      ),
    },
    { key: "type", header: t("eventType"), cell: (row) => t(row.event_type) },
    { key: "date", header: t("date"), cell: (row) => row.event_date ?? "—" },
    { key: "status", header: t("status"), cell: (row) => <StatusBadge status={row.status} /> },
    { key: "template", header: t("template"), cell: (row) => row.templates?.name ?? "—" },
    {
      key: "created",
      header: t("createdAt"),
      cell: (row) => new Date(row.created_at).toISOString().slice(0, 10),
    },
    {
      key: "actions",
      header: t("actions"),
      className: "text-end",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/admin/invitations/$id" params={{ id: row.id }}>
                <Pencil className="size-4" />
                {t("edit")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={row.status !== "published"}>
              <a href={`/i/${row.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                {t("view")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyLink(row.slug)}>
              <Link2 className="size-4" />
              {t("copyLink")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateMutation.mutate(row.id)}>
              <Copy className="size-4" />
              {t("duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setPendingDelete(row)}>
              <Trash2 className="size-4" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout
      title={t("invitations")}
      actions={
        <Button asChild size="sm" className="gap-2">
          <Link to="/admin/invitations/new">
            <Plus className="size-4" />
            {t("newInvitation")}
          </Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="w-full sm:max-w-xs"
          placeholder={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("status")}: {t("all")}</SelectItem>
            {STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {value === "draft" ? t("draft") : value === "published" ? t("published") : t("archived")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t("eventType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("eventType")}: {t("all")}</SelectItem>
            {EVENT_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isLoading && (data ?? []).length === 0 ? (
        <EmptyState
          icon={Mail}
          title={t("emptyInvitations")}
          description={t("emptyInvitationsBody")}
          action={
            <Button asChild>
              <Link to="/admin/invitations/new">{t("newInvitation")}</Link>
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          loading={isLoading}
          emptyLabel={t("emptyInvitations")}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        description={`${t("deleteConfirmBody")} ${pendingDelete ? coupleLabel(pendingDelete) : ""}`}
        onConfirm={() => {
          if (pendingDelete) removeMutation.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </AdminLayout>
  );
}
