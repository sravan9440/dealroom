// src/app/deals/new/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) redirect("/login");

  async function createDealAction(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) redirect("/login");

    const title = String(formData.get("title") ?? "").trim();
    const scope_summary = String(formData.get("scope_summary") ?? "").trim();

    if (!title) {
      redirect("/deals/new?error=" + encodeURIComponent("Title is required"));
    }

    // NOTE: if your column is not "owner_id", rename it here to match your schema (commonly "user_id")
    const { data: deal, error } = await supabase
      .from("deals")
      .insert({
        title,
        scope_summary,
        status: "draft",
        owner_id: userData.user.id,
      })
      .select("id")
      .single();

    if (error || !deal) {
      redirect("/deals/new?error=" + encodeURIComponent(error?.message ?? "Failed to create deal"));
    }

    redirect(`/deals/${deal.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-sm underline">
          ← Back
        </Link>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Create a new deal</CardTitle>
          <CardDescription>Start with a title and quick scope summary.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {sp?.error ? (
            <div className="rounded-xl border p-3 text-sm">
              {sp.error}
            </div>
          ) : null}

          <form action={createDealAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deal title</label>
              <Input name="title" placeholder="e.g., Website + Payments + Admin Panel" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scope summary</label>
              <Textarea
                name="scope_summary"
                placeholder="1–3 lines: what you’re building, key deliverables, timeline hints…"
                className="min-h-[120px]"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit">Create Deal</Button>
              <Link href="/dashboard" className="text-sm underline self-center">
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
