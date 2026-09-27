import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin gate. Client-only because the Supabase session lives in browser storage.
 * Unauthenticated visitors are redirected to /login; RLS enforces admin access
 * on every query regardless of this UI gate.
 */
export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
