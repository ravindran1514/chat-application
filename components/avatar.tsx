"use client";

import { cn } from "@/lib/utils";

interface AvatarProps {
  color: string;
  initials: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-9 w-9 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl"
};

export function Avatar({ color, initials, size = "md" }: AvatarProps) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-black text-white shadow-lg shadow-slate-950/10",
        sizes[size]
      )}
      style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
