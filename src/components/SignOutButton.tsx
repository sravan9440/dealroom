"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      className="rounded-xl"
      onClick={async () => {
        await supabase.auth.signOut();
        toast.success("Signed out");
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  );
}

