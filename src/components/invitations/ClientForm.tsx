import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

export type ClientFormValues = {
  full_name: string;
  phone: string;
  email: string;
  notes: string;
};

const EMPTY: ClientFormValues = { full_name: "", phone: "", email: "", notes: "" };

export function ClientForm({
  onSubmit,
  submitting,
  onCancel,
}: {
  onSubmit: (values: ClientFormValues) => void | Promise<void>;
  submitting?: boolean;
  onCancel?: () => void;
}) {
  const { t } = useI18n();
  const [values, setValues] = useState<ClientFormValues>(EMPTY);

  function set<K extends keyof ClientFormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!values.full_name.trim()) return;
        await onSubmit(values);
        setValues(EMPTY);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client-name">{t("fullName")}</Label>
          <Input
            id="client-name"
            required
            value={values.full_name}
            onChange={(e) => set("full_name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-phone">{t("phone")}</Label>
          <Input id="client-phone" value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="client-email">{t("email")}</Label>
          <Input
            id="client-email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="client-notes">{t("notes")}</Label>
          <Textarea id="client-notes" value={values.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {t("save")}
        </Button>
      </div>
    </form>
  );
}
