"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <button
      className="rounded-md border px-3 py-1 text-sm"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
