import { BrainCircuitIcon } from "lucide-react";
import Link from "next/link";

import { MobileNav } from "@/components/shared/mobile-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import type { SessionUser } from "@/lib/auth/guards";

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <MobileNav />
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:hidden">
        <BrainCircuitIcon className="size-5" />
        InterviewPrep
      </Link>
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu name={user.name} email={user.email} image={user.image} />
    </header>
  );
}
