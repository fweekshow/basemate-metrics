"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { resolveAppHash } from "@/lib/nav-config";

export function AppHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    router.replace(resolveAppHash(hash));
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[14px] text-muted-foreground">
      Opening your account…
    </div>
  );
}
