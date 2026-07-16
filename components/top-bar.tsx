"use client";

import Link from "next/link";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function TopBar({ title, subtitle, backHref, actions, className }: TopBarProps) {
  return (
    <header className={cn("safe-top sticky top-0 z-20 px-4 pb-3", className)}>
      <div className="glass flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-700 transition active:scale-95 dark:text-slate-200"
          >
            <ArrowLeft size={22} />
          </Link>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-black tracking-normal">{title}</div>
          {subtitle ? <div className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
        </div>
        {actions ?? <MoreVertical className="opacity-0" size={20} aria-hidden="true" />}
      </div>
    </header>
  );
}
