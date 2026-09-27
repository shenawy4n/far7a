import { CalendarDays, Clock, Car, MapPin, ParkingCircle, StickyNote } from "lucide-react";
import type { PublicInvitation, PublicSection } from "@/lib/public-invitation.functions";

function formatDate(date: string | null) {
  if (!date) return null;
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  } catch {
    return date;
  }
}

function formatTime(time: string | null) {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "م" : "ص";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m ?? "00"} ${suffix}`;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4 text-start">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

export function PublicInvitationLayout({
  invitation,
  sections,
}: {
  invitation: PublicInvitation;
  sections: PublicSection[];
}) {
  const date = formatDate(invitation.event_date);
  const time = formatTime(invitation.event_time);
  const names = [invitation.groom_name, invitation.bride_name].filter(Boolean);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto w-full max-w-lg px-5 pb-16 pt-12">
        <header className="text-center">
          <p className="text-sm tracking-[0.3em] text-muted-foreground">بسم الله الرحمن الرحيم</p>
          <div className="rule-gold mx-auto mt-6 h-px w-24" />
          <p className="mt-6 text-sm text-muted-foreground">يتشرّفان بدعوتكم لحضور حفل زفافهما</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-foreground">
            {names.length === 2 ? (
              <>
                {names[0]}
                <span className="mx-3 text-gold">&</span>
                {names[1]}
              </>
            ) : (
              (names[0] ?? invitation.title ?? "")
            )}
          </h1>
          {invitation.groom_family || invitation.bride_family ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {[invitation.groom_family, invitation.bride_family].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <div className="rule-gold mx-auto mt-8 h-px w-40" />
        </header>

        <section className="mt-10 space-y-3">
          {date ? <InfoRow icon={CalendarDays} label="التاريخ" value={date} /> : null}
          {time ? <InfoRow icon={Clock} label="الوقت" value={time} /> : null}
          {invitation.venue_name ? (
            <InfoRow
              icon={MapPin}
              label="المكان"
              value={[invitation.venue_name, invitation.venue_address].filter(Boolean).join("\n")}
            />
          ) : null}
          {invitation.transportation_info ? (
            <InfoRow icon={Car} label="المواصلات" value={invitation.transportation_info} />
          ) : null}
          {invitation.parking_info ? (
            <InfoRow icon={ParkingCircle} label="مواقف السيارات" value={invitation.parking_info} />
          ) : null}
          {invitation.additional_notes ? (
            <InfoRow icon={StickyNote} label="ملاحظات" value={invitation.additional_notes} />
          ) : null}
        </section>

        {sections.length > 0 ? (
          <section className="mt-6 space-y-3">
            {sections.map((section) => (
              <div
                key={`${section.section_type}-${section.sort_order}`}
                className="rounded-xl border border-border bg-card p-4 text-start"
              >
                {section.title ? (
                  <p className="font-display text-lg font-semibold">{section.title}</p>
                ) : null}
                {section.content ? (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{section.content}</p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}

        {invitation.maps_url ? (
          <a
            href={invitation.maps_url}
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MapPin className="size-4" />
            الاتجاهات على الخريطة
          </a>
        ) : null}

        <footer className="mt-12 text-center">
          <div className="rule-gold mx-auto h-px w-20" />
          <p className="mt-4 font-display text-lg text-muted-foreground">فرحة</p>
        </footer>
      </div>
    </div>
  );
}
