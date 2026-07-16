"use client";

import { Database, PackageCheck, ShieldCheck, Smartphone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TopBar } from "@/components/top-bar";

const items = [
  {
    icon: Smartphone,
    title: "Android ready",
    detail: "Static export configured for Capacitor with Android web assets."
  },
  {
    icon: Database,
    title: "Realtime updates",
    detail: "Fresh items sync through Firestore across signed-in devices."
  },
  {
    icon: ShieldCheck,
    title: "Anonymous sign-in",
    detail: "Devices connect with Firebase Auth for a lightweight account-free experience."
  },
  {
    icon: PackageCheck,
    title: "Production stack",
    detail: "Next.js 15, React, TypeScript, Tailwind CSS, Zustand, Framer Motion, and Lucide."
  }
];

export default function AboutPage() {
  return (
    <AppShell>
      <TopBar title="About" subtitle="Daily Brief 1.0.0" backHref="/settings" />

      <section className="flex flex-1 flex-col gap-4 px-4 pb-6 pt-4">
        <div className="glass rounded-3xl p-5">
          <h1 className="text-3xl font-black tracking-normal">Daily Brief</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            A lightweight mobile-first daily updates app for Firebase and Capacitor Android.
          </p>
        </div>

        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="glass flex gap-3 rounded-3xl p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="font-black">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
              </div>
            </article>
          );
        })}
      </section>
    </AppShell>
  );
}
