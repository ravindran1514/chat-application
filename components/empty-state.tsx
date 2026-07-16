"use client";

import Link from "next/link";
import { MessageCirclePlus } from "lucide-react";

export function EmptyState() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="glass mb-5 grid h-24 w-24 place-items-center rounded-[2rem]">
        <MessageCirclePlus className="text-emerald-600 dark:text-emerald-300" size={42} />
      </div>
      <h2 className="text-2xl font-black tracking-normal">Start a chat</h2>
      <p className="mt-2 max-w-64 text-sm leading-6 text-slate-600 dark:text-slate-300">
        Create a room or join one with a code.
      </p>
      <Link
        href="/new"
        className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-glow transition active:scale-95"
      >
        Create or join
      </Link>
    </section>
  );
}
