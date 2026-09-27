import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="font-display text-2xl font-semibold leading-tight">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
