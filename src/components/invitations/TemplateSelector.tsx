import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Template } from "@/lib/invitations";

export function TemplateSelector({
  templates,
  value,
  onChange,
}: {
  templates: Template[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "rounded-xl border p-4 text-start transition-colors",
          value === null ? "border-primary bg-accent" : "border-border hover:bg-muted",
        )}
      >
        <p className="text-sm font-medium">{t("noTemplate")}</p>
      </button>
      {templates
        .filter((tpl) => tpl.is_active)
        .map((tpl) => {
          const selected = value === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onChange(tpl.id)}
              className={cn(
                "rounded-xl border p-4 text-start transition-colors",
                selected ? "border-primary bg-accent" : "border-border hover:bg-muted",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg font-semibold">{tpl.name}</p>
                {selected ? <Check className="mt-1 size-4 text-primary" /> : null}
              </div>
              {tpl.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{tpl.description}</p>
              ) : null}
            </button>
          );
        })}
    </div>
  );
}
