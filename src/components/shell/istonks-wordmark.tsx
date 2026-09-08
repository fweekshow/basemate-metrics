import { cn } from "@/lib/utils";

/**
 * iStonks wordmark.
 *
 * Set in live type rather than shipped as an image: the mark is a neutral
 * grotesk, which Geist reproduces closely, and type stays sharp at any size,
 * recolours with the theme, and costs no bytes. Swap in an SVG here if the
 * brand file ever diverges from what type can do.
 */
export function IstonksWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-block font-semibold leading-none tracking-[-0.035em] text-foreground",
        size === "sm" && "text-[15px]",
        size === "md" && "text-[19px]",
        size === "lg" && "text-[28px]",
        className,
      )}
    >
      iStonks
    </span>
  );
}
