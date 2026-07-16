"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { MessageCirclePlus, Search, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ChatListItem } from "@/components/chat-list-item";
import { EmptyState } from "@/components/empty-state";
import { TopBar } from "@/components/top-bar";
import { useChatStore } from "@/store/chat-store";

export default function HomePage() {
  const chats = useChatStore((state) => state.chats);
  const hasHydrated = useChatStore((state) => state.hasHydrated);
  const isLoading = useChatStore((state) => state.isLoading);
  const error = useChatStore((state) => state.error);
  const [query, setQuery] = useState("");

  const filteredChats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return chats;
    }

    return chats.filter((chat) => chat.name.toLowerCase().includes(normalizedQuery));
  }, [chats, query]);

  return (
    <AppShell>
      <TopBar
        title="Chats"
        subtitle={`${chats.length} online ${chats.length === 1 ? "room" : "rooms"}`}
        actions={
          <Link
            href="/settings"
            aria-label="Open settings"
            className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition active:scale-95 dark:text-slate-200"
          >
            <Settings size={21} />
          </Link>
        }
      />

      <section className="px-4 pb-3">
        <label className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
          <Search size={19} className="shrink-0 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search chats"
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </label>
      </section>

      {!hasHydrated ? (
        <div className="flex flex-1 items-center justify-center text-sm font-bold text-slate-500">Loading app...</div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm font-bold text-rose-600">{error}</div>
      ) : isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm font-bold text-slate-500">Connecting to Firebase...</div>
      ) : chats.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-28 pt-1">
          <AnimatePresence initial={false}>
            {filteredChats.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} />
            ))}
          </AnimatePresence>
          {filteredChats.length === 0 ? (
            <p className="pt-12 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">No chats match your search.</p>
          ) : null}
        </section>
      )}

      <Link
        href="/new"
        aria-label="Create new chat"
        className="fixed bottom-6 right-[max(1.25rem,calc((100vw-28rem)/2+1.25rem))] z-30 grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white shadow-glow transition active:scale-95"
      >
        <MessageCirclePlus size={28} />
      </Link>
    </AppShell>
  );
}
