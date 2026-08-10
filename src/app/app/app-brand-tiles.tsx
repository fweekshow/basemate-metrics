"use client";

const EYES_BLUE = "/brand/mascot/mate-eyes-blue.png";
/** Chat bubble with googly eyes — logo is the mascot. */
const BUBBLE_MARK = "/brand/logo/basemate-mark-transparent.png";

/** Full electric-blue tile + eyes (header, compact anchor). */
export function MarkTile({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const r = Math.round(size * 0.28);
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-[var(--app-mark-blue,#0505ff)] shadow-[var(--app-shadow-mark)] ${className}`}
      style={{ width: size, height: size, borderRadius: r }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={EYES_BLUE} alt="" className="h-[88%] w-[88%] object-contain" />
    </div>
  );
}

/** White squircle + bubble mark — empty states, success moments (goofy chat vibe). */
export function BubbleMarkTile({
  size = 80,
  tilt = false,
  animate = false,
  className = "",
}: {
  size?: number;
  tilt?: boolean;
  animate?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--app-radius-lg,20px)] bg-white p-2 shadow-[var(--shadow-card)] ${animate ? "app-mate-animate" : ""} ${className}`}
      style={{
        width: size,
        height: size,
        transform: tilt ? "rotate(-1.5deg)" : undefined,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BUBBLE_MARK} alt="" className="h-[78%] w-[78%] object-contain" />
    </div>
  );
}
