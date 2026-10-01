import { createFileRoute } from "@tanstack/react-router";
import { CalendarX } from "lucide-react";

import { getPublicInvitation } from "@/lib/public-invitation.functions";
import { InvitationRenderer } from "@/components/public/InvitationRenderer";

export const Route = createFileRoute("/i/$slug")({
  loader: ({ params }) => getPublicInvitation({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const invitation = loaderData?.invitation;
    if (!invitation) {
      return {
        meta: [
          { title: "الدعوة غير متاحة — فرحة" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const names = [invitation.groom_name, invitation.bride_name].filter(Boolean).join(" & ");
    const title = `${names || invitation.title || "دعوة"} — دعوة على فرحة`;
    const description = [invitation.venue_name, invitation.event_date].filter(Boolean).join(" · ");
    return {
      meta: [
        { title },
        { name: "description", content: description || "دعوة إلكترونية على منصة فرحة" },
        { property: "og:title", content: title },
        { property: "og:description", content: description || "دعوة إلكترونية على منصة فرحة" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PublicInvitationPage,
  errorComponent: Unavailable,
  notFoundComponent: Unavailable,
});

function Unavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5" dir="rtl">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CalendarX className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">الدعوة غير متاحة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          هذا الرابط غير صحيح أو لم يتم نشر الدعوة بعد.
        </p>
      </div>
    </div>
  );
}

function PublicInvitationPage() {
  const { invitation, sections } = Route.useLoaderData();
  if (!invitation) return <Unavailable />;
  return <InvitationRenderer invitation={invitation} sections={sections} />;
}
