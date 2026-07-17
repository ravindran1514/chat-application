"use client";

import { motion } from "framer-motion";
import { BriefcaseBusiness, CloudSun, Newspaper, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { AppShell } from "@/components/app-shell";

const briefs = [
  {
    title: "Morning traffic eases near the east corridor",
    tag: "City",
    copy: "Signal timing updates are expected to reduce peak-hour wait times through the week."
  },
  {
    title: "Weekend food street adds new evening stalls",
    tag: "Local",
    copy: "Small vendors are preparing late-night counters with tea, snacks, and handmade desserts."
  },
  {
    title: "Independent artists announce a pop-up show",
    tag: "Culture",
    copy: "A compact gallery event will feature sketchbooks, prints, and live acoustic sets."
  }
];

export default function CoverPage() {
  const router = useRouter();
  const secretPatternRef = useRef({ step: 0, lastTapAt: 0 });
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date());

  const handleSecretStep = (step: number) => {
    const now = Date.now();
    const previousStep = now - secretPatternRef.current.lastTapAt < 5000 ? secretPatternRef.current.step : 0;
    const nextStep = step === previousStep + 1 ? step : step === 1 ? 1 : 0;

    secretPatternRef.current = {
      step: nextStep,
      lastTapAt: now
    };

    if (nextStep === 3) {
      secretPatternRef.current = {
        step: 0,
        lastTapAt: 0
      };
      router.push("/chats");
    }
  };

  return (
    <AppShell>
      <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#eef4ef] px-4 py-5 text-slate-950 dark:bg-[#071013] dark:text-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-md flex-1 flex-col"
        >
          <header className="safe-top">
            <div className="flex items-center justify-between border-b-2 border-slate-950 pb-3 dark:border-white">
              <div className="flex items-center gap-2">
                <Newspaper size={24} />
                <div>
                  <h1 className="text-2xl font-black leading-none tracking-normal">Daily Brief</h1>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Local updates
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <p>{today}</p>
                <p>Edition 08</p>
              </div>
            </div>
          </header>

          <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.28, ease: "easeOut" }}
            className="mt-4 rounded-[1.7rem] border-2 border-slate-950 bg-[#fbfaf4] p-5 shadow-[8px_8px_0_rgba(15,23,42,0.22)] dark:border-white dark:bg-slate-900 dark:shadow-[8px_8px_0_rgba(255,255,255,0.12)]"
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">Featured</p>
            <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-normal">
              Small city moments draw bigger weekend attention.
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="col-span-2 border-t-2 border-slate-950 pt-3 dark:border-white">
                <p className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                  A round-up of quiet places, evening plans, and personal notes from around town.
                </p>
              </div>
              <button
                type="button"
                aria-label="View local weather details"
                onClick={() => handleSecretStep(1)}
                className="grid place-items-center rounded-2xl bg-emerald-700 p-4 text-white transition active:scale-95"
              >
                <CloudSun size={34} />
                <span className="mt-2 text-xs font-black">29°C</span>
              </button>
            </div>
          </motion.article>

          <section className="mt-5 grid grid-cols-2 gap-3">
            <article className="rounded-2xl bg-white/75 p-4 shadow-sm dark:bg-slate-900/70">
              <button
                type="button"
                aria-label="View market trend"
                onClick={() => handleSecretStep(2)}
                className="-m-2 grid h-9 w-9 place-items-center rounded-full text-emerald-700 transition active:scale-95 dark:text-emerald-300"
              >
                <TrendingUp size={20} />
              </button>
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Markets</p>
              <h3 className="mt-1 text-lg font-black leading-tight">Green close for local indexes</h3>
            </article>
            <article className="rounded-2xl bg-white/75 p-4 shadow-sm dark:bg-slate-900/70">
              <button
                type="button"
                aria-label="View work brief"
                onClick={() => handleSecretStep(3)}
                className="-m-2 grid h-9 w-9 place-items-center rounded-full text-cyan-700 transition active:scale-95 dark:text-cyan-300"
              >
                <BriefcaseBusiness size={20} />
              </button>
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Work</p>
              <h3 className="mt-1 text-lg font-black leading-tight">Hybrid offices extend summer hours</h3>
            </article>
          </section>

          <section className="mt-5 space-y-3 pb-5">
            {briefs.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-950/10 bg-white/70 p-4 dark:border-white/10 dark:bg-slate-900/60">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{item.tag}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                </div>
                <h3 className="mt-2 text-base font-black leading-tight">{item.title}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">{item.copy}</p>
              </article>
            ))}
          </section>
        </motion.div>
      </section>
    </AppShell>
  );
}
