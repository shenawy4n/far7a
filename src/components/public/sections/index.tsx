import type { ComponentType } from "react";
import { CalendarDays, Car, Clock, MapPin, ParkingCircle, StickyNote } from "lucide-react";

import type { PublicInvitation } from "@/lib/public-invitation.functions";
import type { LayoutVariant, RenderMedia, RenderSection, SectionType } from "@/lib/template-engine";
import { formatDate, formatTime, type IconType } from "../templates/shared";

export type SectionProps = {
  invitation: PublicInvitation;
  section: RenderSection;
  media: RenderMedia[];
  variant: LayoutVariant;
};

function Item({
  variant,
  icon: Icon,
  label,
  value,
}: {
  variant: LayoutVariant;
  icon: IconType;
  label: string;
  value: string;
}) {
  if (variant === "minimal") {
    return (
      <div className="grid grid-cols-[6rem_1fr] gap-4 border-t border-border py-4 text-start">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="whitespace-pre-line text-sm leading-relaxed">{value}</p>
      </div>
    );
  }
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

/** Optional admin-authored title/content stored on the section row. */
function Extra({ section }: { section: RenderSection }) {
  if (!section.title && !section.content) return null;
  return (
    <div className="text-start">
      {section.title ? <p className="font-display text-lg font-semibold">{section.title}</p> : null}
      {section.content ? (
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{section.content}</p>
      ) : null}
    </div>
  );
}

function Stack({ variant, children }: { variant: LayoutVariant; children: React.ReactNode }) {
  return <section className={variant === "minimal" ? "" : "space-y-3"}>{children}</section>;
}

function names(inv: PublicInvitation) {
  return [inv.groom_name, inv.bride_name].filter(Boolean);
}

function HeroSection({ invitation, variant, section }: SectionProps) {
  const n = names(invitation);
  const cover = invitation.cover_image_url;
  if (variant === "minimal") {
    const date = formatDate(invitation.event_date);
    const time = formatTime(invitation.event_time);
    return (
      <header className="text-start">
        {cover ? <img src={cover} alt="" className="mb-8 aspect-[4/3] w-full object-cover" /> : null}
        <p className="text-xs font-medium tracking-[0.25em] text-primary">{section.title || "دعوة"}</p>
        <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.1] text-foreground">
          {n.length ? n.join(" و ") : (invitation.title ?? "")}
        </h1>
        {date ? (
          <p className="mt-8 inline-block rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
            {[date, time].filter(Boolean).join(" — ")}
          </p>
        ) : null}
      </header>
    );
  }
  return (
    <header className="text-center">
      {cover ? <img src={cover} alt="" className="mb-8 aspect-[4/3] w-full rounded-2xl object-cover" /> : null}
      <p className="text-sm tracking-[0.3em] text-muted-foreground">بسم الله الرحمن الرحيم</p>
      <div className="rule-gold mx-auto mt-6 h-px w-24" />
      <p className="mt-6 text-sm text-muted-foreground">
        {section.title || "يتشرّفان بدعوتكم لحضور حفل زفافهما"}
      </p>
      <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-foreground">
        {n.length === 2 ? (
          <>
            {n[0]}
            <span className="mx-3 text-gold">&</span>
            {n[1]}
          </>
        ) : (
          (n[0] ?? invitation.title ?? "")
        )}
      </h1>
    </header>
  );
}

function CoupleSection({ invitation, variant, section }: SectionProps) {
  const families = [invitation.groom_family, invitation.bride_family].filter(Boolean).join(" · ");
  if (!families && !section.content) return null;
  return (
    <section className={variant === "minimal" ? "text-start" : "text-center"}>
      {families ? <p className="text-sm text-muted-foreground">{families}</p> : null}
      {section.content ? <p className="mt-2 whitespace-pre-line text-sm">{section.content}</p> : null}
      {variant === "classic" ? <div className="rule-gold mx-auto mt-8 h-px w-40" /> : null}
    </section>
  );
}

function EventSection({ invitation, variant, section }: SectionProps) {
  const date = formatDate(invitation.event_date);
  const time = formatTime(invitation.event_time);
  // Minimal shows date/time in the hero; only show time here if there is no date.
  const showDate = variant === "classic" && date;
  const showTime = variant === "classic" ? time : !date && time;
  if (!showDate && !showTime && !section.title && !section.content) return null;
  return (
    <Stack variant={variant}>
      {showDate ? <Item variant={variant} icon={CalendarDays} label="التاريخ" value={date} /> : null}
      {showTime ? <Item variant={variant} icon={Clock} label="الوقت" value={time!} /> : null}
      <Extra section={section} />
    </Stack>
  );
}

function VenueSection({ invitation, variant, section }: SectionProps) {
  if (!invitation.venue_name && !invitation.maps_url && !section.content) return null;
  return (
    <Stack variant={variant}>
      {invitation.venue_name ? (
        <Item
          variant={variant}
          icon={MapPin}
          label="المكان"
          value={[invitation.venue_name, invitation.venue_address].filter(Boolean).join("\n")}
        />
      ) : null}
      <Extra section={section} />
      {invitation.maps_url ? (
        <a
          href={invitation.maps_url}
          target="_blank"
          rel="noreferrer"
          className={
            variant === "minimal"
              ? "mt-6 flex w-full items-center justify-center gap-2 border border-foreground px-6 py-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
              : "mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          }
        >
          <MapPin className="size-4" />
          الاتجاهات على الخريطة
        </a>
      ) : null}
    </Stack>
  );
}

function TransportationSection({ invitation, variant, section }: SectionProps) {
  if (!invitation.transportation_info && !invitation.parking_info && !section.content) return null;
  return (
    <Stack variant={variant}>
      {invitation.transportation_info ? (
        <Item variant={variant} icon={Car} label="المواصلات" value={invitation.transportation_info} />
      ) : null}
      {invitation.parking_info ? (
        <Item variant={variant} icon={ParkingCircle} label="مواقف السيارات" value={invitation.parking_info} />
      ) : null}
      <Extra section={section} />
    </Stack>
  );
}

function GallerySection({ media, variant, section }: SectionProps) {
  const images = media.filter((m) => !m.file_type || m.file_type.startsWith("image"));
  if (images.length === 0) return null; // renders nothing when there is no media yet
  return (
    <section className="space-y-3">
      {section.title ? <p className="font-display text-lg font-semibold">{section.title}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        {images.map((m) => (
          <img
            key={`${m.file_url}-${m.sort_order}`}
            src={m.file_url}
            alt=""
            loading="lazy"
            className={`aspect-square w-full object-cover ${variant === "classic" ? "rounded-xl" : ""}`}
          />
        ))}
      </div>
    </section>
  );
}

function NotesSection({ invitation, variant, section }: SectionProps) {
  if (!invitation.additional_notes && !section.content) return null;
  return (
    <Stack variant={variant}>
      {invitation.additional_notes ? (
        <Item variant={variant} icon={StickyNote} label="ملاحظات" value={invitation.additional_notes} />
      ) : null}
      <Extra section={section} />
    </Stack>
  );
}

export const SECTION_COMPONENTS: Record<SectionType, ComponentType<SectionProps>> = {
  hero: HeroSection,
  couple: CoupleSection,
  event: EventSection,
  venue: VenueSection,
  transportation: TransportationSection,
  gallery: GallerySection,
  notes: NotesSection,
};

export function SectionRenderer(props: SectionProps) {
  const Component = SECTION_COMPONENTS[props.section.section_type as SectionType];
  return Component ? <Component {...props} /> : null;
}
