import { createFileRoute } from "@tanstack/react-router";
import { CalendarHeart } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/rsvp")({
  component: RsvpPage,
});

function RsvpPage() {
  const { t } = useI18n();
  return (
    <AdminLayout title={t("rsvp")}>
      <ComingSoon icon={CalendarHeart} />
    </AdminLayout>
  );
}
