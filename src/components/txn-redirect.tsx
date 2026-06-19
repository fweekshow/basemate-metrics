"use client";

import { useEffect } from "react";

export function TxnRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="font-mono text-sm text-muted-foreground">Redirecting to transaction…</p>
      <a
        href={url}
        className="font-mono text-sm text-primary underline-offset-4 hover:underline"
      >
        Continue on Basescan
      </a>
    </main>
  );
}
