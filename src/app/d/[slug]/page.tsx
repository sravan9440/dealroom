import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import crypto from "crypto";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}



async function baseUrlFromHeaders() {
  const h = await headers(); // ✅ await
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}



function milestoneBadge(status: string) {
  if (status === "approved") return <Badge>approved</Badge>;
  if (status === "changes") return <Badge variant="secondary">changes</Badge>;
  if (status === "disputed") return <Badge variant="destructive">disputed</Badge>;
  return <Badge variant="outline">pending</Badge>;
}

export default async function PublicDealPage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient();
  const slug = params.slug;

  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("id,title,scope_summary,status,public_slug,owner_user_id,created_at")
    .eq("public_slug", slug)
    .single();

  if (dealErr || !deal) notFound();

  const { data: milestones } = await supabase
    .from("milestones")
    .select("id,title,amount_inr,due_date,status,created_at")
    .eq("deal_id", deal.id)
    .order("created_at", { ascending: true });

  const allApproved = (milestones ?? []).length > 0 && (milestones ?? []).every((m) => m.status === "approved");

  async function submitMilestoneDecision(formData: FormData) {
    "use server";

    const supabase = createAdminClient();
    const slug = String(formData.get("slug") || "");
    const milestoneId = String(formData.get("milestone_id") || "");
    const action = String(formData.get("action") || "");
    const message = String(formData.get("message") || "").trim();

    if (!slug || !milestoneId) redirect(`/d/${slug}`);
    if (!["approve", "changes", "dispute"].includes(action)) redirect(`/d/${slug}`);

    const { data: deal } = await supabase
      .from("deals")
      .select("id,owner_user_id,public_slug")
      .eq("public_slug", slug)
      .single();

    if (!deal) notFound();

    const { data: ms } = await supabase
      .from("milestones")
      .select("id,deal_id,title,amount_inr,due_date,status")
      .eq("id", milestoneId)
      .eq("deal_id", deal.id)
      .single();

    if (!ms) notFound();

    const { data: decision, error: dErr } = await supabase
      .from("decisions")
      .insert({
        deal_id: deal.id,
        milestone_id: ms.id,
        actor: "client",
        action,
        message: message || null,
      })
      .select("id,created_at")
      .single();

    if (dErr || !decision) redirect(`/d/${slug}`);

    // update milestone status for quick UI
    const newStatus = action === "approve" ? "approved" : action === "changes" ? "changes" : "disputed";
    await supabase.from("milestones").update({ status: newStatus }).eq("id", ms.id);

    const payload = {
      version: 1,
      kind: "milestone_decision",
      deal_public_slug: slug,
      deal_id: deal.id,
      milestone_id: ms.id,
      milestone_title: ms.title,
      action,
      message: message || null,
      at: new Date().toISOString(),
    };

    const payloadHash = sha256(JSON.stringify(payload));

    const { data: receipt, error: rErr } = await supabase
      .from("receipts")
      .insert({
        deal_id: deal.id,
        milestone_id: ms.id,
        decision_id: decision.id,
        owner_user_id: deal.owner_user_id ?? null,
        kind: "milestone_decision",
        payload,
        payload_hash: payloadHash,
      })
      .select("id")
      .single();

    if (rErr || !receipt) redirect(`/d/${slug}`);

    redirect(`/d/${slug}/r/${receipt.id}`);
  }

  async function approveFinalDeal() {
    "use server";

    const supabase = createAdminClient();

    const { data: deal2 } = await supabase
      .from("deals")
      .select("id,owner_user_id,public_slug")
      .eq("public_slug", slug)
      .single();

    if (!deal2) notFound();

    const { data: ms } = await supabase
      .from("milestones")
      .select("status")
      .eq("deal_id", deal2.id);

    const allApproved = (ms ?? []).length > 0 && (ms ?? []).every((m) => m.status === "approved");
    if (!allApproved) redirect(`/d/${slug}`);

    const { data: decision } = await supabase
      .from("decisions")
      .insert({
        deal_id: deal2.id,
        milestone_id: null,
        actor: "client",
        action: "approve_deal",
        message: null,
      })
      .select("id")
      .single();

    const payload = {
      version: 1,
      kind: "deal_final_approval",
      deal_public_slug: slug,
      deal_id: deal2.id,
      action: "approve_deal",
      at: new Date().toISOString(),
    };

    const payloadHash = sha256(JSON.stringify(payload));

    const { data: receipt } = await supabase
      .from("receipts")
      .insert({
        deal_id: deal2.id,
        milestone_id: null,
        decision_id: decision?.id ?? null,
        owner_user_id: deal2.owner_user_id ?? null,
        kind: "deal_final_approval",
        payload,
        payload_hash: payloadHash,
      })
      .select("id")
      .single();

    redirect(`/d/${slug}/r/${receipt?.id}`);
  }

  const fullLink = `${await baseUrlFromHeaders()}/d/${slug}`;


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium">DealRoom</Link>
          <Badge variant="outline">client view</Badge>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">{deal.title}</CardTitle>
            <CardDescription>{deal.scope_summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground break-all">
              Link: {fullLink}
            </div>

            {allApproved && (
              <form action={approveFinalDeal}>
                <Button className="w-full rounded-2xl" size="lg">
                  Approve final delivery
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Milestones</div>

          {(milestones ?? []).map((m) => (
            <Card key={m.id} className="rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">{m.title}</div>
                    <div className="text-sm text-muted-foreground">
                      ₹ {Number(m.amount_inr ?? 0).toLocaleString("en-IN")}
                      {m.due_date ? ` • Due ${m.due_date}` : ""}
                    </div>
                  </div>
                  {milestoneBadge(String(m.status || "pending"))}
                </div>

                {/* Approve */}
                <form action={submitMilestoneDecision}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="milestone_id" value={m.id} />
                  <input type="hidden" name="action" value="approve" />
                  <Button className="w-full rounded-2xl" size="lg">
                    Approve milestone
                  </Button>
                </form>

                {/* Changes + Dispute */}
                <details className="rounded-xl border p-3">
                  <summary className="text-sm cursor-pointer">Request changes or dispute</summary>

                  <div className="mt-3 space-y-3">
                    <Textarea
                      name="message"
                      placeholder="Write a short message (what’s wrong / what to change)…"
                      className="rounded-2xl"
                      form={`msg-${m.id}`}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <form id={`msg-${m.id}`} action={submitMilestoneDecision}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="milestone_id" value={m.id} />
                        <input type="hidden" name="action" value="changes" />
                        <Button type="submit" variant="secondary" className="w-full rounded-2xl">
                          Changes
                        </Button>
                      </form>

                      <form action={submitMilestoneDecision}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="milestone_id" value={m.id} />
                        <input type="hidden" name="action" value="dispute" />
                        <input type="hidden" name="message" value="Client marked as disputed." />
                        <Button type="submit" variant="destructive" className="w-full rounded-2xl">
                          Dispute
                        </Button>
                      </form>
                    </div>
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
