import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SubmitButton from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlusCircle } from "lucide-react";

export default async function NewDealPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  async function createDealAction(formData: FormData) {
    "use server";

    const title = String(formData.get("title") || "").trim();
    const scope_summary = String(formData.get("scope_summary") || "").trim();

    if (!title) redirect("/deals/new?error=" + encodeURIComponent("Deal title is required"));

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/login");

    const { data, error } = await supabase
      .from("deals")
      .insert({
        owner_id: userData.user.id,
        title,
        scope_summary: scope_summary || null,
      })
      .select("id")
      .single();

    if (error) redirect("/deals/new?error=" + encodeURIComponent(error.message));

    redirect(`/deals/${data.id}`);
  }

  return (
    <AppShell
      title="Create Deal"
      subtitle="Set the deal scope clearly — it reduces disputes later."
      action={
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-2xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      }
    >
      {sp?.error && (
        <Card className="rounded-2xl border-destructive/40">
          <CardContent className="p-4 text-sm">
            <span className="font-semibold">Error:</span> {sp.error}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Deal details</CardTitle>
          <CardDescription>
            You can add milestones next. Client approvals + receipts will happen on the public link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form action={createDealAction} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deal title</label>
              <Input
                name="title"
                placeholder="Example: Website redesign for ABC"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Keep it specific. This appears on the client link too.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Scope summary (optional)</label>
              <Textarea
                name="scope_summary"
                placeholder="What’s included, what’s not included, and what ‘done’ means..."
                className="min-h-[140px] rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Pro tip: mention revision policy (e.g., 2 rounds included).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="rounded-2xl" type="button">
                  Cancel
                </Button>
              </Link>
              <SubmitButton className="rounded-2xl" loadingText="Creating...">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create deal
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
