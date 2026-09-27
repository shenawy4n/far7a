import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { EVENT_TYPES, type Client, type EventType, type InvitationWithRelations, type Template } from "@/lib/invitations";
import { TemplateSelector } from "@/components/invitations/TemplateSelector";

export type InvitationFormValues = {
  client_id: string | null;
  template_id: string | null;
  title: string;
  event_type: EventType;
  groom_name: string;
  bride_name: string;
  groom_family: string;
  bride_family: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  maps_url: string;
  transportation_info: string;
  parking_info: string;
  additional_notes: string;
};

export const EMPTY_INVITATION: InvitationFormValues = {
  client_id: null,
  template_id: null,
  title: "",
  event_type: "wedding",
  groom_name: "",
  bride_name: "",
  groom_family: "",
  bride_family: "",
  event_date: "",
  event_time: "",
  venue_name: "",
  venue_address: "",
  maps_url: "",
  transportation_info: "",
  parking_info: "",
  additional_notes: "",
};

export function toFormValues(invitation: InvitationWithRelations): InvitationFormValues {
  return {
    client_id: invitation.client_id,
    template_id: invitation.template_id,
    title: invitation.title ?? "",
    event_type: invitation.event_type,
    groom_name: invitation.groom_name ?? "",
    bride_name: invitation.bride_name ?? "",
    groom_family: invitation.groom_family ?? "",
    bride_family: invitation.bride_family ?? "",
    event_date: invitation.event_date ?? "",
    event_time: (invitation.event_time ?? "").slice(0, 5),
    venue_name: invitation.venue_name ?? "",
    venue_address: invitation.venue_address ?? "",
    maps_url: invitation.maps_url ?? "",
    transportation_info: invitation.transportation_info ?? "",
    parking_info: invitation.parking_info ?? "",
    additional_notes: invitation.additional_notes ?? "",
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function InvitationForm({
  initial = EMPTY_INVITATION,
  clients,
  templates,
  submitting,
  onSubmit,
  onCreateClient,
  footerExtra,
}: {
  initial?: InvitationFormValues;
  clients: Client[];
  templates: Template[];
  submitting?: boolean;
  onSubmit: (values: InvitationFormValues) => void | Promise<void>;
  onCreateClient?: () => void;
  footerExtra?: ReactNode;
}) {
  const { t } = useI18n();
  const [values, setValues] = useState<InvitationFormValues>(initial);

  function set<K extends keyof InvitationFormValues>(key: K, value: InvitationFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit(values);
      }}
    >
      <Section title={t("client")}>
        <div className="space-y-2">
          <Label>{t("selectClient")}</Label>
          <Select
            value={values.client_id ?? "none"}
            onValueChange={(v) => set("client_id", v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectClient")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onCreateClient ? (
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={onCreateClient}>
              {t("newClient")}
            </Button>
          </div>
        ) : null}
      </Section>

      <Section title={t("couple")}>
        <div className="space-y-2">
          <Label htmlFor="groom">{t("groomName")}</Label>
          <Input id="groom" value={values.groom_name} onChange={(e) => set("groom_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bride">{t("brideName")}</Label>
          <Input id="bride" value={values.bride_name} onChange={(e) => set("bride_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="groom-family">{t("groomFamily")}</Label>
          <Input
            id="groom-family"
            value={values.groom_family}
            onChange={(e) => set("groom_family", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bride-family">{t("brideFamily")}</Label>
          <Input
            id="bride-family"
            value={values.bride_family}
            onChange={(e) => set("bride_family", e.target.value)}
          />
        </div>
      </Section>

      <Section title={t("event")}>
        <div className="space-y-2">
          <Label htmlFor="title">{t("invitationTitle")}</Label>
          <Input id="title" value={values.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("eventType")}</Label>
          <Select value={values.event_type} onValueChange={(v) => set("event_type", v as EventType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {t(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">{t("date")}</Label>
          <Input
            id="date"
            type="date"
            value={values.event_date}
            onChange={(e) => set("event_date", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">{t("time")}</Label>
          <Input
            id="time"
            type="time"
            value={values.event_time}
            onChange={(e) => set("event_time", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">{t("venueName")}</Label>
          <Input id="venue" value={values.venue_name} onChange={(e) => set("venue_name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">{t("venueAddress")}</Label>
          <Input
            id="address"
            value={values.venue_address}
            onChange={(e) => set("venue_address", e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="maps">{t("mapsUrl")}</Label>
          <Input
            id="maps"
            type="url"
            inputMode="url"
            dir="ltr"
            value={values.maps_url}
            onChange={(e) => set("maps_url", e.target.value)}
          />
        </div>
      </Section>

      <Section title={t("logistics")}>
        <div className="space-y-2">
          <Label htmlFor="transport">{t("transportation")}</Label>
          <Textarea
            id="transport"
            value={values.transportation_info}
            onChange={(e) => set("transportation_info", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parking">{t("parking")}</Label>
          <Textarea
            id="parking"
            value={values.parking_info}
            onChange={(e) => set("parking_info", e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">{t("additionalNotes")}</Label>
          <Textarea
            id="notes"
            value={values.additional_notes}
            onChange={(e) => set("additional_notes", e.target.value)}
          />
        </div>
      </Section>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="font-display text-lg">{t("selectTemplate")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateSelector
            templates={templates}
            value={values.template_id}
            onChange={(id) => set("template_id", id)}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {footerExtra}
        <Button type="submit" disabled={submitting}>
          {t("saveDraft")}
        </Button>
      </div>
      <p className="text-end text-xs text-muted-foreground">{t("slugHint")}</p>
    </form>
  );
}
