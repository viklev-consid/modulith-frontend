import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Modulith",
  description:
    "The modular .NET application template with a Next.js companion frontend.",
};

export default function LandingPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-4 py-20 md:px-6 md:py-28">
      <div className="grid max-w-2xl gap-4">
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Build modular .NET applications, faster.
        </h1>
        <p className="text-pretty text-base text-muted-foreground md:text-lg">
          Modulith pairs a modular .NET backend with a Next.js frontend that
          talks to it through a single OpenAPI spec. Auth, permissions, and
          background workflows are wired end-to-end so you can focus on shipping
          the feature that matters.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
          Get started
        </Link>
        <Link
          href="/login"
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
        >
          Sign in
        </Link>
      </div>
    </section>
  );
}
