import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Briefcase, CheckCircle2, Clock3, PlusCircle } from "lucide-react";

function statusBadgeClass(status: string) {
  // subtle but meaningful colors
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900";
    case "closed":
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800";
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: deals, error } = await supabase
    .from("deals")
    .select("id,title,scope_summary,status,public_slug,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const total = deals?.length ?? 0;
  const active = deals?.filter((d) => d.status === "active").length ?? 0;
  const closed = deals?.filter((d) => d.status === "closed").length ?? 0;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Create deals, track milestones, and collect approvals with receipts."
      action={
        <Link href="/deals/new">
          <Button className="rounded-2xl">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </Link>
      }
    >
      {/* Stats row */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Total Deals
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tracking-tight">{total}</CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock3 className="h-4 w-4" /> Active
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tracking-tight">{active}</CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Closed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tracking-tight">{closed}</CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent deals</h2>
          {total > 0 && (
            <Link href="/deals/new" className="hidden md:block">
              <Button variant="outline" className="rounded-2xl">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create
              </Button>
            </Link>
          )}
        </div>

        {!deals || deals.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center space-y-3">
              <div className="text-xl font-semibold tracking-tight">No deals yet</div>
              <p className="text-sm text-muted-foreground">
                Create your first deal room and add milestones. Then share the client link on WhatsApp.
              </p>
              <Link href="/deals/new">
                <Button className="rounded-2xl">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create first deal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {deals.map((d) => (
              <Link key={d.id} href={`/deals/${d.id}`} className="block">
                <Card className="rounded-2xl hover:shadow-md transition">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-base md:text-lg font-semibold tracking-tight">
                          {d.title}
                        </h3>
                        {d.scope_summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {d.scope_summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("rounded-full", statusBadgeClass(d.status))}
                        >
                          {d.status}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(d.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
