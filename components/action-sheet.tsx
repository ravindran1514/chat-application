"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionSheetItem {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  keepOpen?: boolean;
  onSelect: () => void;
}

interface ActionSheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  items: ActionSheetItem[];
  onClose: () => void;
}

export function ActionSheet({ open, title, subtitle, items, onClose }: ActionSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 px-4 pb-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 28, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 28, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="glass safe-bottom w-full max-w-md rounded-[1.7rem] p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center gap-3 px-2 py-1">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-black">{title}</h2>
                {subtitle ? <p className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
              </div>
              <button
                type="button"
                aria-label="Close actions"
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95 dark:bg-slate-800 dark:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.onSelect();
                      if (!item.keepOpen) {
                        onClose();
                      }
                    }}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition active:scale-[0.99]",
                      item.destructive
                        ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        : "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon size={18} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
