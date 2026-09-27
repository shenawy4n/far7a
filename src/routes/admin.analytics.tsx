import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t } = useI18n();
  return (
    <AdminLayout title={t("analytics")}>
      <ComingSoon icon={BarChart3} />
    </AdminLayout>
  );
}
