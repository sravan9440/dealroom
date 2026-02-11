import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import CopyButton from "@/components/CopyButton";
import SubmitButton from "@/components/SubmitButton";
import DateField from "@/components/DateField";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Link as LinkIcon, PlusCircle, IndianRupee, CalendarDays } from "lucide-react";

function milestoneBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800";
    case "submitted":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900";
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900";
    case "changes":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900";
    case "disputed":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800";
  }
}

export default async function DealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: deal, error: dealErr } = await supabase
    .from("deals")
    .select("id,title,scope_summary,status,public_slug,created_at")
    .eq("id", id)
    .single();

  if (dealErr || !deal) notFound();

  const { data: milestones, error: msErr } = await supabase
    .from("milestones")
    .select("id,title,amount_inr,due_date,payment_link,status,created_at")
    .eq("deal_id", id)
    .order("created_at", { ascending: true });

  if (msErr) throw new Error(msErr.message);

  async function addMilestoneAction(formData: FormData) {
    "use server";

    const title = String(formData.get("title") || "").trim();
    const amountStr = String(formData.get("amount_inr") || "").trim();
    const due = String(formData.get("due_date") || "").trim();
    const payment_link = String(formData.get("payment_link") || "").trim();

    if (!title) redirect(`/deals/${id}?error=` + encodeURIComponent("Milestone title is required"));

    const amount_inr = Number.parseInt(amountStr || "0", 10);
    if (Number.isNaN(amount_inr) || amount_inr < 0) {
      redirect(`/deals/${id}?error=` + encodeURIComponent("Amount must be a valid number"));
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/login");

    const { error } = await supabase.from("milestones").insert({
      deal_id: id,
      title,
      amount_inr,
      due_date: due ? due : null,
      payment_link: payment_link || null,
      status: "pending",
    });

    if (error) redirect(`/deals/${id}?error=` + encodeURIComponent(error.message));

    redirect(`/deals/${id}`);
  }

  // Use your deployed domain later; for now show relative + localhost
  const localClientLink = `http://localhost:3000/d/${deal.public_slug}`;

  return (
    <AppShell
      title={deal.title}
      subtitle="Milestones + approvals + receipts (WhatsApp-friendly)."
      action={
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-2xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      }
    >
      {/* Deal summary */}
      <Card className="rounded-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center justify-between gap-3">
            <span className="tracking-tight">Deal overview</span>
            <Badge variant="outline" className="rounded-full">
              {deal.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            Share the client link on WhatsApp once we build the public page.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {deal.scope_summary && (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {deal.scope_summary}
            </div>
          )}

          <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="h-4 w-4" />
              Client link (local)
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex-1 text-sm break-all text-muted-foreground">{localClientLink}</div>
              <CopyButton text={localClientLink} />
            </div>

            <p className="text-xs text-muted-foreground">
              Next step: we’ll create <span className="font-medium">/d/[slug]</span> so the client can approve from phone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {sp?.error && (
        <Card className="rounded-2xl border-destructive/40">
          <CardContent className="p-4 text-sm">
            <span className="font-semibold">Error:</span> {sp.error}
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Milestones</h2>
          <span className="text-sm text-muted-foreground">{milestones?.length ?? 0} total</span>
        </div>

        {!milestones || milestones.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center space-y-2">
              <div className="text-base font-semibold">No milestones yet</div>
              <p className="text-sm text-muted-foreground">
                Add milestones to make scope + payments crystal clear.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {milestones.map((m) => (
              <Card key={m.id} className="rounded-2xl">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-base font-semibold tracking-tight">{m.title}</div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <IndianRupee className="h-4 w-4" /> ₹{m.amount_inr}
                        </span>
                        {m.due_date && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" /> Due: {m.due_date}
                          </span>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn("rounded-full", milestoneBadgeClass(m.status))}
                    >
                      {m.status}
                    </Badge>
                  </div>

                  {m.payment_link && (
                    <div className="text-sm text-muted-foreground break-all">
                      Payment link: {m.payment_link}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add milestone */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Add milestone</CardTitle>
          <CardDescription>
            Tip: keep milestones small. It speeds approvals and reduces disputes.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={addMilestoneAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Milestone title</label>
              <Input name="title" placeholder="Example: Homepage + UI" className="rounded-xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (INR)</label>
                <Input name="amount_inr" placeholder="10000" className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due date (optional)</label>
                <DateField name="due_date" placeholder="Pick a date" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment link (optional)</label>
                <Input
                  name="payment_link"
                  placeholder="Razorpay/UPI link (later)"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <SubmitButton className="rounded-2xl" loadingText="Adding...">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add milestone
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
