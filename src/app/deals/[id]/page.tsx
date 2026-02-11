import AppShell from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";


import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

    if (!title) {
      redirect(`/deals/${id}?error=` + encodeURIComponent("Milestone title is required"));
    }

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

    if (error) {
      redirect(`/deals/${id}?error=` + encodeURIComponent(error.message));
    }

    redirect(`/deals/${id}`);
  }

  const localClientLink = `http://localhost:3000/d/${deal.public_slug}`;

return (
  <AppShell
    title={deal.title}
    subtitle="Milestones, submissions, approvals, and receipts will live here."
  >
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Status</p>
          <Badge>{deal.status}</Badge>
        </div>

        {deal.scope_summary && (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{deal.scope_summary}</p>
        )}

        <div className="pt-2 text-sm">
          <p className="font-semibold">Client link (next step we activate)</p>
          <p className="text-slate-600 break-all">
            http://localhost:3000/d/{deal.public_slug}
          </p>
        </div>
      </CardContent>
    </Card>

    {sp?.error && (
      <Card>
        <CardContent className="text-sm">
          <span className="font-semibold">Error:</span> {sp.error}
        </CardContent>
      </Card>
    )}

    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Milestones</h2>

      {!milestones || milestones.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-slate-600">No milestones yet.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {milestones.map((m) => (
            <Card key={m.id}>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{m.title}</p>
                  <Badge>{m.status}</Badge>
                </div>
                <p className="text-sm text-slate-600">Amount: ₹{m.amount_inr}</p>
                {m.due_date && <p className="text-sm text-slate-600">Due: {m.due_date}</p>}
                {m.payment_link && (
                  <p className="text-sm text-slate-600 break-all">
                    Payment link: {m.payment_link}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>

    <Card>
      <CardContent>
        <h2 className="text-lg font-semibold mb-3">Add milestone</h2>

        <form action={addMilestoneAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Milestone title</label>
            <Input name="title" placeholder="Example: Homepage + UI" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (INR)</label>
              <Input name="amount_inr" placeholder="10000" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Due date (optional)</label>
              <DatePicker name="due_date" placeholder="Select due date" />

            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Payment link (optional)</label>
            <Input name="payment_link" placeholder="Paste Razorpay/UPI link later" />
          </div>

          <Button type="submit">Add milestone</Button>
        </form>
      </CardContent>
    </Card>
  </AppShell>
);

}
