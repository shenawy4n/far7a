import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
    >
      <Languages className="size-4" />
      <span className="text-xs font-medium">{lang === "ar" ? "EN" : "ع"}</span>
    </Button>
  );
}
