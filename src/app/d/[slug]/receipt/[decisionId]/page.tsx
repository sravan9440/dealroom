import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ slug: string; decisionId: string }>;
}) {
  const { slug, decisionId } = await params;
  const supabase = createAdminClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("id,title,public_slug,public_enabled")
    .eq("public_slug", slug)
    .single();

  if (!deal || !deal.public_enabled) notFound();

  const { data: decision } = await supabase
    .from("deal_decisions")
    .select("id,decision,note,created_at")
    .eq("id", decisionId)
    .single();

  if (!decision) notFound();

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const receiptUrl = `${baseUrl}/d/${slug}/receipt/${decisionId}`;

  const waText =
    `Deal receipt: ${deal.title}\nDecision: ${decision.decision.toUpperCase()}\n` +
    `${decision.note ? `Note: ${decision.note}\n` : ""}` +
    `Receipt: ${receiptUrl}`;

  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="mx-auto max-w-xl p-4 space-y-4">
      <Card className="rounded-2xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">Receipt</CardTitle>
          <CardDescription>Your decision has been recorded.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">{deal.title}</div>
            <Badge>{decision.decision}</Badge>
          </div>

          <div className="text-sm opacity-80">
            {new Date(decision.created_at).toLocaleString()}
          </div>

          {decision.note ? (
            <div className="rounded-xl border p-3 text-sm whitespace-pre-wrap">
              {decision.note}
            </div>
          ) : null}

          <div className="rounded-xl border p-3 text-sm break-all">
            {receiptUrl}
          </div>

          <div className="flex gap-2">
            <Button asChild className="flex-1 rounded-2xl h-12">
              <a href={waHref} target="_blank" rel="noreferrer">
                Share on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-2xl h-12">
              <Link href={`/d/${slug}`}>Back</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
