import { cn } from "@/lib/utils";

/** Soft lilac + blue ambient glow — bone-gradient panels */
export function LilacMesh({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lilac/25 blur-3xl" />
      <div className="absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-1/3 top-1/2 h-24 w-24 rounded-full bg-violet/15 blur-2xl" />
    </div>
  );
}

/** Scattered lilac accent dots — corners and edges */
export function LilacDots({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      <span className="absolute right-6 top-6 size-2 rounded-full bg-lilac/70" />
      <span className="absolute right-14 top-10 size-1 rounded-full bg-lilac/40" />
      <span className="absolute bottom-8 left-8 size-1.5 rounded-full bg-lilac/50" />
      <span className="absolute bottom-14 left-16 size-1 rounded-full bg-violet/30" />
    </div>
  );
}

/** Mono uppercase eyebrow — lilac is the default label tint per brand kit */
export function MonoEyebrow({
  children,
  tone = "lilac",
  className,
}: {
  children: React.ReactNode;
  tone?: "lilac" | "violet" | "primary" | "muted";
  className?: string;
}) {
  const toneClass = {
    lilac: "text-lilac",
    violet: "text-violet",
    primary: "text-primary",
    muted: "text-muted-foreground",
  }[tone];

  return (
    <p
      className={cn(
        "text-[10px] font-bold tracking-[0.22em]",
        toneClass,
        className,
      )}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </p>
  );
}

/** Phase column label — lilac for mono section headers, blue/violet/green for status */
export function PhaseLabel({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "lilac" | "green" | "blue" | "violet";
}) {
  const styles = {
    lilac: { dot: "bg-lilac", text: "text-[#6B5FA8]" },
    green: { dot: "bg-[var(--up)]", text: "text-[#16A34A]" },
    blue: { dot: "bg-primary", text: "text-primary" },
    violet: { dot: "bg-violet", text: "text-violet" },
  }[color];

  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-1.5 rounded-full", styles.dot)} />
      <span
        className={cn("text-[10px] font-bold tracking-[0.2em]", styles.text)}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {children}
      </span>
    </div>
  );
}

/** Bone gradient panel shell with lilac top accent */
export function BonePanel({
  children,
  className,
  accent = "lilac",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "lilac" | "blue" | "violet" | "none";
}) {
  const accentBar = {
    lilac: "from-lilac/60 via-lilac/20 to-transparent",
    blue: "from-primary/40 via-primary/10 to-transparent",
    violet: "from-violet/40 via-violet/10 to-transparent",
    none: "",
  }[accent];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent via-bone to-[#F3F0FF] shadow-sm",
        className,
      )}
    >
      {accent !== "none" ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
            accentBar,
          )}
        />
      ) : null}
      {children}
    </div>
  );
}
