import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PlusCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// ✅ IMPORTANT: use the SAME import path as in /deals/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  async function createDeal(formData: FormData) {
    "use server";

    const supabase = await createClient();

    // Optional: protect route
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) redirect("/login");

    const title = String(formData.get("title") || "").trim();
    const scope_summary = String(formData.get("scope_summary") || "").trim();

    if (!title) {
      redirect("/deals/new?error=" + encodeURIComponent("Deal title is required"));
    }

    const base = slugify(title) || "deal";
    const suffix = Math.random().toString(36).slice(2, 8);
    const public_slug = `${base}-${suffix}`;

    const { data, error } = await supabase
      .from("deals")
      .insert({
        title,
        scope_summary,
        status: "draft",
        public_slug,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      redirect("/deals/new?error=" + encodeURIComponent(error?.message || "Failed to create deal"));
    }

    redirect(`/deals/${data.id}`);
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">New Deal</CardTitle>
          <CardDescription>Create a deal, then add milestones on the next page.</CardDescription>
          {sp?.error ? (
            <p className="text-sm text-red-600 mt-2">{sp.error}</p>
          ) : null}
        </CardHeader>

        <CardContent>
          <form action={createDeal} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" placeholder="e.g., Website redesign for ABC" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scope summary (optional)</label>
              <Textarea name="scope_summary" placeholder="Short scope / notes..." />
            </div>

            <Button type="submit" className="w-full md:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Deal
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
