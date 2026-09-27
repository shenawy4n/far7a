import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { InvitationStatus } from "@/lib/invitations";

const STYLES: Record<InvitationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/15 text-success",
  archived: "bg-warning/20 text-warning-foreground",
};

export function StatusBadge({ status }: { status: InvitationStatus }) {
  const { t } = useI18n();
  const label = status === "draft" ? t("draft") : status === "published" ? t("published") : t("archived");
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", STYLES[status])}>
      {label}
    </Badge>
  );
}
