"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/**
 * ResponsiveContainer reads parent size on mount; in flex/grid layouts that can
 * be 0×0 and Recharts logs width(-1)/height(-1). Wait for a real box first.
 */
export function ChartMount({
  className,
  minHeight,
  children,
}: {
  className?: string;
  minHeight?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("min-h-0 min-w-0", className)}
      style={minHeight !== undefined ? { minHeight } : undefined}
    >
      {size ? (
        <ResponsiveContainer width={size.w} height={size.h}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
