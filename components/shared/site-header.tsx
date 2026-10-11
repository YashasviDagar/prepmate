import { BrainCircuitIcon } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BrainCircuitIcon className="size-5" />
          InterviewPrep
        </Link>
        <nav className="text-muted-foreground ml-6 hidden items-center gap-6 text-sm md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#roles" className="hover:text-foreground transition-colors">
            Roles
          </a>
        </nav>
        <div className="flex-1" />
        <ThemeToggle />
        <Button variant="ghost" asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
      </div>
    </header>
  );
}
