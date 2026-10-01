import { MapPin } from "lucide-react";
import { formatDate, formatTime, type TemplateProps } from "./shared";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-4 border-t border-border py-4 text-start">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="whitespace-pre-line text-sm leading-relaxed">{value}</p>
    </div>
  );
}

/** Template "modern-minimal": clean typographic layout, no ornaments. */
export function ModernMinimalTemplate({ invitation, sections }: TemplateProps) {
  const date = formatDate(invitation.event_date);
  const time = formatTime(invitation.event_time);
  const names = [invitation.groom_name, invitation.bride_name].filter(Boolean);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto w-full max-w-lg px-6 pb-16 pt-16">
        <header className="text-start">
          <p className="text-xs font-medium tracking-[0.25em] text-primary">دعوة</p>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.1] text-foreground">
            {names.length ? names.join(" و ") : (invitation.title ?? "")}
          </h1>
          {invitation.groom_family || invitation.bride_family ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {[invitation.groom_family, invitation.bride_family].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {date ? (
            <p className="mt-8 inline-block rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
              {[date, time].filter(Boolean).join(" — ")}
            </p>
          ) : null}
        </header>

        <section className="mt-12">
          {invitation.venue_name ? (
            <Row
              label="المكان"
              value={[invitation.venue_name, invitation.venue_address].filter(Boolean).join("\n")}
            />
          ) : null}
          {!date && time ? <Row label="الوقت" value={time} /> : null}
          {invitation.transportation_info ? (
            <Row label="المواصلات" value={invitation.transportation_info} />
          ) : null}
          {invitation.parking_info ? <Row label="مواقف السيارات" value={invitation.parking_info} /> : null}
          {invitation.additional_notes ? <Row label="ملاحظات" value={invitation.additional_notes} /> : null}
          {sections.map((section) => (
            <Row
              key={`${section.section_type}-${section.sort_order}`}
              label={section.title ?? ""}
              value={section.content ?? ""}
            />
          ))}
        </section>

        {invitation.maps_url ? (
          <a
            href={invitation.maps_url}
            target="_blank"
            rel="noreferrer"
            className="mt-10 flex w-full items-center justify-center gap-2 border border-foreground px-6 py-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            <MapPin className="size-4" />
            الاتجاهات على الخريطة
          </a>
        ) : null}

        <footer className="mt-14 text-start text-xs text-muted-foreground">فرحة</footer>
      </div>
    </div>
  );
}
