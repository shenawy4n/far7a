import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "@/components/admin/EmptyState";

export function ComingSoon({ icon }: { icon: LucideIcon }) {
  const { t } = useI18n();
  return <EmptyState icon={icon} title={t("comingSoon")} description={t("comingSoonBody")} />;
}
