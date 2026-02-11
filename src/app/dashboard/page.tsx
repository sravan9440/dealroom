import AppShell from "@/components/Appshell";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: deals, error } = await supabase
    .from("deals")
    .select("id,title,scope_summary,status,public_slug,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    // If RLS or schema mismatch, you'll see it here
    throw new Error(error.message);
  }

return (
  <AppShell
    title="Dashboard"
    subtitle="Manage your deals & milestones"
    action={
      <Link href="/deals/new">
        <Button>+ New Deal</Button>
      </Link>
    }
  >
    {!deals || deals.length === 0 ? (
      <Card>
        <CardContent className="space-y-2">
          <p className="text-slate-700">No deals yet.</p>
          <Link href="/deals/new" className="inline-block">
            <Button>Create your first deal</Button>
          </Link>
        </CardContent>
      </Card>
    ) : (
      <div className="grid gap-3">
        {deals.map((d) => (
          <Link key={d.id} href={`/deals/${d.id}`} className="block">
            <Card className="hover:shadow-md transition">
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{d.title}</h2>
                  <Badge>{d.status}</Badge>
                </div>

                {d.scope_summary && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {d.scope_summary}
                  </p>
                )}

                <p className="text-xs text-slate-500">
                  Created: {new Date(d.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    )}
  </AppShell>
);
}
