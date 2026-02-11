import AppShell from "@/components/Appshell";
import { Card, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

    if (!title) {
      redirect("/deals/new?error=" + encodeURIComponent("Title is required"));
    }

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

    if (error) {
      redirect("/deals/new?error=" + encodeURIComponent(error.message));
    }

    redirect(`/deals/${data.id}`);
  }

return (
  <AppShell title="Create Deal" subtitle="Start a deal room for a client project.">
    {sp?.error && (
      <Card>
        <CardContent className="text-sm">
          <span className="font-semibold">Error:</span> {sp.error}
        </CardContent>
      </Card>
    )}

    <Card>
      <CardContent>
        <form action={createDealAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Deal title</label>
            <Input name="title" placeholder="Example: Website redesign for ABC" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Scope summary (optional)</label>
            <Textarea
              name="scope_summary"
              className="min-h-[120px]"
              placeholder="Short summary of scope, expectations, and what ‘done’ means..."
            />
          </div>

          <Button type="submit">Create deal</Button>
        </form>
      </CardContent>
    </Card>
  </AppShell>
);

}
