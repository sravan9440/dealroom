import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, PlusCircle } from "lucide-react";

export default function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            DealRoom
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>

          {/* Mobile: show only theme icon in top, signout in bottom nav */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Page header */}
      <div className="mx-auto max-w-5xl px-4 pt-6 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="hidden md:block">{action}</div>
        </div>

        {/* Mobile action */}
        <div className="md:hidden mt-4">{action}</div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 pb-24">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-2 grid grid-cols-3 gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full rounded-2xl justify-center">
              <LayoutDashboard className="h-5 w-5" />
            </Button>
          </Link>

          <Link href="/deals/new">
            <Button className="w-full rounded-2xl justify-center">
              <PlusCircle className="h-5 w-5 mr-2" />
              New
            </Button>
          </Link>

          <SignOutButton />
        </div>
      </nav>
    </div>
  );
}
