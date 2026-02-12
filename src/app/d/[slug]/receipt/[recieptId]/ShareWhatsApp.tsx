"use client";

import { Button } from "@/components/ui/button";

export default function ShareWhatsApp({ text }: { text: string }) {
  return (
    <div className="grid gap-2">
      <Button
        className="w-full rounded-2xl"
        size="lg"
        onClick={() => {
          const url = "https://wa.me/?text=" + encodeURIComponent(text);
          window.open(url, "_blank");
        }}
      >
        Share on WhatsApp
      </Button>

      <Button
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          alert("Copied link");
        }}
      >
        Copy link
      </Button>
    </div>
  );
}
