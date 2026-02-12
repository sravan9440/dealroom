"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Decision = "approve" | "changes" | "dispute";

export default function DecisionPanel({ slug }: { slug: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<Decision>("approve");
  const [pending, start] = useTransition();

  const hint = useMemo(() => {
    if (mode === "approve") return "Confirm you approve the milestones and total.";
    if (mode === "changes") return "Tell what changes you need (scope, price, dates).";
    return "Explain the dispute reason so we can resolve quickly.";
  }, [mode]);

  async function submit(decision: Decision) {
    start(async () => {
      try {
        const res = await fetch("/api/public/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, decision, note: note.trim() }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Failed");

        toast.success("Saved your decision");
        router.push(`/d/${slug}/receipt/${json.decisionId}`);
      } catch (e: any) {
        toast.error(e?.message ?? "Something went wrong");
      }
    });
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 bg-background/90 backdrop-blur border-t">
      <div className="mx-auto max-w-xl p-3 space-y-3">
        <Card className="rounded-2xl">
          <CardContent className="p-3 space-y-2">
            <div className="text-sm font-medium">Your decision</div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "approve" ? "default" : "outline"}
                className="flex-1 rounded-2xl h-12"
                onClick={() => setMode("approve")}
                disabled={pending}
              >
                Approve ✅
              </Button>
              <Button
                type="button"
                variant={mode === "changes" ? "default" : "outline"}
                className="flex-1 rounded-2xl h-12"
                onClick={() => setMode("changes")}
                disabled={pending}
              >
                Changes ✍️
              </Button>
              <Button
                type="button"
                variant={mode === "dispute" ? "default" : "outline"}
                className="flex-1 rounded-2xl h-12"
                onClick={() => setMode("dispute")}
                disabled={pending}
              >
                Dispute ⚠️
              </Button>
            </div>

            {(mode === "changes" || mode === "dispute") && (
              <div className="space-y-2">
                <div className="text-xs opacity-70">{hint}</div>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={mode === "changes" ? "Describe changes..." : "Describe dispute..."}
                  className="min-h-[90px]"
                />
              </div>
            )}

            <Button
              type="button"
              className="w-full rounded-2xl h-12"
              onClick={() => submit(mode)}
              disabled={pending || ((mode === "changes" || mode === "dispute") && !note.trim())}
            >
              {pending ? "Saving..." : "Submit Decision"}
            </Button>
          </CardContent>
        </Card>

        <div className="text-xs opacity-60 text-center px-2">
          This response is recorded securely and generates a receipt.
        </div>
      </div>
    </div>
  );
}
