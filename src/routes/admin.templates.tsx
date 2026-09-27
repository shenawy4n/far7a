import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutTemplate } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { listTemplates } from "@/lib/invitations";

export const Route = createFileRoute("/admin/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: listTemplates });

  return (
    <AdminLayout title={t("templates")}>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={LayoutTemplate} title={t("templates")} description={t("comingSoonBody")} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((tpl) => (
              <Card key={tpl.id} className="shadow-none">
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <CardTitle className="font-display text-lg">{tpl.name}</CardTitle>
                  <Badge variant="outline">{tpl.is_active ? t("published") : t("draft")}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tpl.description ? (
                    <p className="text-sm text-muted-foreground">{tpl.description}</p>
                  ) : null}
                  <p dir="ltr" className="text-xs text-muted-foreground">
                    {tpl.slug}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {t("comingSoon")}: {t("comingSoonBody")}
          </p>
        </>
      )}
    </AdminLayout>
  );
}
