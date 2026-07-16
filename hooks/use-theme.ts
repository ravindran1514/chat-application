"use client";

import { useEffect } from "react";
import { useChatStore } from "@/store/chat-store";

export function useTheme(): void {
  const theme = useChatStore((state) => state.settings.theme);
  const hasHydrated = useChatStore((state) => state.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [hasHydrated, theme]);
}
