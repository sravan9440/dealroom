import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ShareWhatsApp from "./ShareWhatsApp";

async function baseUrlFromHeaders() {
  const h = await headers(); // ✅ await
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}


export default async function ReceiptPage({
  params,
}: {
  params: { slug: string; receiptId: string };
}) {
  const supabase = createAdminClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("id,title,public_slug")
    .eq("public_slug", params.slug)
    .single();

  if (!deal) notFound();

  const { data: receipt } = await supabase
    .from("receipts")
    .select("id,deal_id,kind,payload,payload_hash,created_at")
    .eq("id", params.receiptId)
    .eq("deal_id", deal.id)
    .single();

  if (!receipt) notFound();

  const link = `${await baseUrlFromHeaders()}/d/${params.slug}/r/${params.receiptId}`;


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md p-4 space-y-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Receipt</CardTitle>
            <CardDescription>{deal.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm"><b>Type:</b> {receipt.kind}</div>
            <div className="text-sm break-all"><b>Hash:</b> {receipt.payload_hash}</div>
            <pre className="text-xs whitespace-pre-wrap rounded-xl border p-3">
{JSON.stringify(receipt.payload, null, 2)}
            </pre>
            <ShareWhatsApp text={`Deal receipt: ${link}`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
