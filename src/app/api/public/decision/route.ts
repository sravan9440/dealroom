import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { slug, decision, note } = body as {
      slug?: string;
      decision?: "approve" | "changes" | "dispute";
      note?: string;
    };

    if (!slug || !decision) {
      return NextResponse.json({ error: "Missing slug/decision" }, { status: 400 });
    }
    if (!["approve", "changes", "dispute"].includes(decision)) {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // only allow public page if enabled
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .select("id, title, public_slug, public_enabled")
      .eq("public_slug", slug)
      .single();

    if (dealErr || !deal || !deal.public_enabled) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const user_agent = req.headers.get("user-agent") || null;

    const { data: row, error } = await supabase
      .from("deal_decisions")
      .insert({
        deal_id: deal.id,
        decision,
        note: note?.trim() ? note.trim() : null,
        ip,
        user_agent,
      })
      .select("id")
      .single();

    if (error || !row) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, decisionId: row.id }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
