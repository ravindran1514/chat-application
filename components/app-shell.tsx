"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useChatStore } from "@/store/chat-store";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  useTheme();
  const bootFirebase = useChatStore((state) => state.bootFirebase);

  useEffect(() => {
    bootFirebase();
  }, [bootFirebase]);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden text-slate-950 dark:text-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        {children}
      </motion.div>
    </main>
  );
}
