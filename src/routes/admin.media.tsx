import { createFileRoute } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/media")({
  component: MediaPage,
});

function MediaPage() {
  const { t } = useI18n();
  return (
    <AdminLayout title={t("media")}>
      <ComingSoon icon={Images} />
    </AdminLayout>
  );
}
