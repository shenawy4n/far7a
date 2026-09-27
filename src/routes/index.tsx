import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import { LanguageToggle } from "@/components/admin/LanguageToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "فرحة Far7a — دعوات إلكترونية أنيقة" },
      {
        name: "description",
        content:
          "منصة فرحة لإنشاء وإدارة الدعوات الإلكترونية للأعراس والمناسبات، مع رابط مشاركة خاص لكل دعوة.",
      },
      { property: "og:title", content: "فرحة Far7a — دعوات إلكترونية أنيقة" },
      {
        property: "og:description",
        content: "أنشئ دعوات إلكترونية أنيقة لمناسباتك وشاركها برابط واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const { session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <span className="font-display text-2xl font-semibold">{t("brand")}</span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild variant="outline" size="sm">
            <Link to={session ? "/admin" : "/login"}>
              {session ? t("goToAdmin") : t("signIn")}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-gold" />
          Far7a · فرحة
        </span>
        <h1 className="mt-8 font-display text-5xl font-semibold leading-tight text-balance-tight sm:text-6xl">
          {t("tagline")}
        </h1>
        <div className="rule-gold mx-auto mt-8 h-px w-40" />
        <p className="mx-auto mt-8 max-w-xl text-muted-foreground">
          أنشئ دعوة، اختر القالب، ثم انشرها لتحصل على رابط مشاركة خاص بكل مناسبة.
        </p>
        <div className="mt-10 flex justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to={session ? "/admin" : "/login"}>
              {session ? t("goToAdmin") : t("adminLogin")}
              <ArrowLeft className="size-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
