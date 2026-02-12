import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DecisionPanel from "./ui/DecisionPanel";

export default async function PublicDealPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("id,title,scope_summary,status,public_slug,public_enabled,created_at")
    .eq("public_slug", slug)
    .single();

  if (dealErr || !deal || !deal.public_enabled) notFound();

  const { data: milestones } = await supabase
    .from("milestones")
    .select("id,title,amount_inr,due_date,status,created_at")
    .eq("deal_id", deal.id)
    .order("created_at", { ascending: true });

  const total = (milestones ?? []).reduce((sum, m: any) => sum + (m.amount_inr ?? 0), 0);

  return (
    <div className="mx-auto max-w-xl p-4 pb-28 space-y-4">
      <Card className="rounded-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">{deal.title}</CardTitle>
            <Badge>{deal.status ?? "deal"}</Badge>
          </div>
          <CardDescription className="text-sm whitespace-pre-wrap">
            {deal.scope_summary || "No scope summary provided."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Milestones</span>
              <span className="font-medium">Total: ₹{total.toLocaleString("en-IN")}</span>
            </div>
            <div className="mt-3 space-y-2">
              {(milestones ?? []).map((m: any) => (
                <div key={m.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.title}</div>
                    <div className="text-xs opacity-70">
                      {m.due_date ? `Due: ${new Date(m.due_date).toLocaleDateString()}` : "No due date"}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">₹{Number(m.amount_inr ?? 0).toLocaleString("en-IN")}</div>
                </div>
              ))}
              {!milestones?.length ? <div className="text-xs opacity-70">No milestones yet.</div> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Big decision buttons (fixed bottom) */}
      <DecisionPanel slug={deal.public_slug} />
    </div>
  );
}
