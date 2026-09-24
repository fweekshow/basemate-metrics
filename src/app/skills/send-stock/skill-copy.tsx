"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SkillCopy({ skill, pageUrl }: { skill: string; pageUrl: string }) {
  const [copied, setCopied] = useState<"skill" | "url" | null>(null);

  async function copy(kind: "skill" | "url", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <>
      <article
        className="overflow-hidden rounded-[20px] border border-border/80 bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <pre className="max-h-[55vh] overflow-auto px-4 py-4 font-mono text-[12px] leading-relaxed text-foreground select-all whitespace-pre-wrap break-words">
          {skill}
        </pre>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            type="button"
            size="lg"
            className="h-12 flex-1 rounded-full text-base"
            onClick={() => void copy("skill", skill)}
          >
            {copied === "skill" ? "Copied" : "Copy skill"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 rounded-full px-4 text-base"
            onClick={() => void copy("url", pageUrl)}
          >
            {copied === "url" ? "Copied" : "Copy URL"}
          </Button>
        </div>
      </div>
    </>
  );
}
