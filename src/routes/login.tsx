import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { signInWithPassword, signUpWithPassword, useSession } from "@/lib/auth";
import { LanguageToggle } from "@/components/admin/LanguageToggle";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "دخول لوحة التحكم — فرحة" },
      { name: "description", content: "تسجيل دخول فريق إدارة منصة فرحة للدعوات الإلكترونية." },
      { property: "og:title", content: "دخول لوحة التحكم — فرحة" },
      { property: "og:description", content: "منطقة مخصّصة لفريق الإدارة." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { session, loading } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/admin", replace: true });
  }, [loading, session, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) {
          toast.error(error.message);
          return;
        }
        navigate({ to: "/admin", replace: true });
      } else {
        const { data, error } = await signUpWithPassword(email.trim(), password, fullName.trim());
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          navigate({ to: "/admin", replace: true });
        } else {
          setConfirmSent(true);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-6">
        <Link to="/" className="font-display text-2xl font-semibold">
          {t("brand")}
        </Link>
        <LanguageToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <Card className="w-full max-w-md shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">{t("adminLogin")}</CardTitle>
            <CardDescription>{t("loginSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {confirmSent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  أرسلنا رسالة تأكيد إلى {email}. افتح الرابط في الرسالة لتأكيد الحساب ثم سجّل الدخول.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setConfirmSent(false);
                    setMode("signin");
                  }}
                >
                  {t("signIn")}
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" ? (
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("fullName")}</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    dir="ltr"
                    required
                    minLength={6}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {mode === "signin" ? t("signIn") : t("createAccount")}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? t("noAccount") : t("haveAccount")}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
