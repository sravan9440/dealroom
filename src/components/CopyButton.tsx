"use client";

import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-xl"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          toast.success("Copied");
          setTimeout(() => setOk(false), 1200);
        } catch {
          toast.error("Copy failed");
        }
      }}
    >
      {ok ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
      Copy
    </Button>
  );
}
