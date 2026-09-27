import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarHeart,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Mail,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n, type TKey } from "@/lib/i18n";
import { displayName, useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LanguageToggle } from "@/components/admin/LanguageToggle";

type NavItem = { to: string; labelKey: TKey; icon: typeof LayoutDashboard; soon?: boolean };

const NAV: NavItem[] = [
  { to: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/admin/invitations", labelKey: "invitations", icon: Mail },
  { to: "/admin/clients", labelKey: "clients", icon: Users },
  { to: "/admin/templates", labelKey: "templates", icon: LayoutTemplate },
  { to: "/admin/media", labelKey: "media", icon: Images, soon: true },
  { to: "/admin/rsvp", labelKey: "rsvp", icon: CalendarHeart, soon: true },
  { to: "/admin/analytics", labelKey: "analytics", icon: BarChart3, soon: true },
  { to: "/admin/settings", labelKey: "settings", icon: Settings },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <span className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-display text-lg font-bold">
          ف
        </span>
        <div className="leading-tight">
          <p className="font-display text-xl font-semibold">{t("brand")}</p>
          <p className="text-xs text-sidebar-foreground/70">Far7a Admin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 pb-6">
        {NAV.map((item) => {
          const active =
            item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{t(item.labelKey)}</span>
              {item.soon ? (
                <span className="rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-[10px] font-medium text-sidebar-primary">
                  {t("comingSoon")}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="absolute end-4 top-4"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 md:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-2xl font-semibold text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <LanguageToggle />
              <div className="hidden text-end lg:block">
                <p className="max-w-40 truncate text-sm font-medium">{displayName(user)}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSignOut} title={t("signOut")}>
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
