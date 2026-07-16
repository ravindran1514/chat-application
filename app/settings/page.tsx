"use client";

import Link from "next/link";
import { Check, Info, Moon, Sun, Trash2, User } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TopBar } from "@/components/top-bar";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import type { ThemeMode } from "@/types/chat";

const themeOptions: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon }
];

export default function SettingsPage() {
  const theme = useChatStore((state) => state.settings.theme);
  const profile = useChatStore((state) => state.profile);
  const setTheme = useChatStore((state) => state.setTheme);
  const setProfile = useChatStore((state) => state.setProfile);
  const clearAllData = useChatStore((state) => state.clearAllData);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile.displayName);

  return (
    <AppShell>
      <TopBar title="Settings" subtitle="Local preferences" backHref="/" />

      <section className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const trimmed = displayName.trim();
            if (trimmed) {
              setProfile({ ...profile, displayName: trimmed });
            }
          }}
          className="glass rounded-3xl p-4"
        >
          <div className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <User size={17} />
            Your name
          </div>
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ravi"
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950/70"
            />
            <button
              type="submit"
              aria-label="Save profile name"
              className="grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white transition active:scale-95"
            >
              <Check size={19} />
            </button>
          </div>
        </form>

        <div className="glass rounded-3xl p-4">
          <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Appearance</h2>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-950/50">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition active:scale-95",
                    theme === option.value
                      ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  <Icon size={18} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <Link href="/about" className="glass flex items-center gap-3 rounded-3xl p-4 transition active:scale-[0.99]">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200">
            <Info size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-black">About</h2>
            <p className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">Firebase, room codes, and build details</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="glass flex items-center gap-3 rounded-3xl p-4 text-left transition active:scale-[0.99]"
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200">
            <Trash2 size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-rose-600">Clear all data</h2>
            <p className="truncate text-sm font-semibold text-slate-500 dark:text-slate-400">Reset local preferences on this phone</p>
          </div>
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset this phone?"
        description="This clears local preferences, pins, and read badges. Firebase rooms remain online."
        confirmLabel="Clear"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          clearAllData();
          setConfirmOpen(false);
        }}
      />
    </AppShell>
  );
}
