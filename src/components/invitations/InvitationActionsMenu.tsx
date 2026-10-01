import { Link } from "@tanstack/react-router";
import { Copy, Eye, ExternalLink, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { publicUrl, type Invitation } from "@/lib/invitations";

/** Shared row actions for any invitation list (invitations page, client details). */
export function InvitationActionsMenu({
  row,
  onDuplicate,
  onDelete,
}: {
  row: Pick<Invitation, "id" | "slug" | "status">;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const { t } = useI18n();
  return (
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
        <DropdownMenuItem asChild>
          <Link to="/admin/invitations/$id/preview" params={{ id: row.id }}>
            <Eye className="size-4" />
            {t("preview")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={row.status !== "published"}>
          <a href={`/i/${row.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            {t("view")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await navigator.clipboard.writeText(publicUrl(row.slug));
            toast.success(t("linkCopied"));
          }}
        >
          <Link2 className="size-4" />
          {t("copyLink")}
        </DropdownMenuItem>
        {onDuplicate ? (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="size-4" />
            {t("duplicate")}
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            {t("delete")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
