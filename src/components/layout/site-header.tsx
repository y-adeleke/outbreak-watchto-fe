"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navLinks = siteConfig.nav.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === item.href ? "text-primary" : "text-muted-foreground")}
      onClick={() => setOpen(false)}>
      {item.label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-lg">
            OutbreakWatch<span className="text-primary">TO</span>
          </Link>
        </div>
        <nav className="hidden items-center gap-6 md:flex">{navLinks}</nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="outline" size="sm">
            <Link href="#learn-more">Learn more</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/outbreaks">Launch app</Link>
          </Button>
        </div>
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">{navLinks}</div>
              <Button asChild>
                <Link href="/outbreaks">Launch app</Link>
              </Button>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
