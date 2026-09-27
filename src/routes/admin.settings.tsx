import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n, type Lang } from "@/lib/i18n";
import { displayName, useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, lang, setLang } = useI18n();
  const { user } = useSession();

  const roles = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw new Error(error.message);
      return data.map((row) => row.role);
    },
  });

  const options: { value: Lang; label: string }[] = [
    { value: "ar", label: "العربية" },
    { value: "en", label: "English" },
  ];

  return (
    <AdminLayout title={t("settings")}>
      <div className="grid max-w-3xl gap-4">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg">{t("account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{displayName(user)}</p>
            <p dir="ltr" className="text-muted-foreground">
              {user?.email}
            </p>
            <div className="flex gap-2 pt-2">
              {(roles.data ?? []).map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-lg">{t("language")}</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            {options.map((option) => (
              <Button
                key={option.value}
                variant={lang === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setLang(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
