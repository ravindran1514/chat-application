"use client";

import { AnimatePresence } from "framer-motion";
import { Copy, Pin, Send, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MessageBubble } from "@/components/message-bubble";
import { TopBar } from "@/components/top-bar";
import { getMessagesForChat, useChatStore } from "@/store/chat-store";

function ChatScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id") ?? "";
  const chats = useChatStore((state) => state.chats);
  const allMessages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const togglePinChat = useChatStore((state) => state.togglePinChat);
  const markChatRead = useChatStore((state) => state.markChatRead);
  const subscribeMessages = useChatStore((state) => state.subscribeMessages);
  const hasHydrated = useChatStore((state) => state.hasHydrated);
  const userId = useChatStore((state) => state.userId);
  const error = useChatStore((state) => state.error);
  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const chat = chats.find((item) => item.id === chatId);

  const messages = useMemo(() => getMessagesForChat(allMessages, chatId), [allMessages, chatId]);

  useEffect(() => {
    if (chatId) {
      markChatRead(chatId);
    }
  }, [chatId, markChatRead]);

  useEffect(() => {
    if (!chatId || !userId) {
      return;
    }

    return subscribeMessages(chatId);
  }, [chatId, subscribeMessages, userId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || !chat) {
      return;
    }
    void sendMessage(chat.id, draft);
    setDraft("");
  };

  if (hasHydrated && !chat) {
    return (
      <AppShell>
        <TopBar title="Chat not found" backHref="/" />
        <div className="flex flex-1 items-center justify-center px-8 text-center text-sm font-semibold text-slate-500">
          This Firebase room is not available for this device.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        backHref="/"
        title={
          <div className="flex min-w-0 items-center gap-2">
            {chat ? <Avatar color={chat.color} initials={chat.avatarInitials} size="sm" /> : null}
            <span className="truncate">{chat?.name ?? "Loading"}</span>
          </div>
        }
        subtitle={chat ? `Room ${chat.roomCode}` : "Connecting"}
        actions={
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Copy room code"
              disabled={!chat}
              onClick={() => chat && void navigator.clipboard?.writeText(chat.roomCode)}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition active:scale-95 disabled:opacity-40 dark:text-slate-200"
            >
              <Copy size={19} />
            </button>
            <button
              type="button"
              aria-label="Pin chat"
              disabled={!chat}
              onClick={() => chat && togglePinChat(chat.id)}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition active:scale-95 disabled:opacity-40 dark:text-slate-200"
            >
              <Pin size={19} className={chat?.pinned ? "fill-emerald-500 text-emerald-600" : ""} />
            </button>
            <button
              type="button"
              aria-label="Delete chat"
              disabled={!chat}
              onClick={() => setConfirmOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-rose-600 transition active:scale-95 disabled:opacity-40"
            >
              <Trash2 size={19} />
            </button>
          </div>
        }
      />

      <section className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} isOwn={message.senderId === userId} />
            ))}
          </AnimatePresence>
          {messages.length === 0 ? (
            <div className="pt-20 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              {error || "Say something to begin."}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </section>

      <form onSubmit={handleSend} className="safe-bottom sticky bottom-0 px-4 pt-2">
        <div className="glass flex items-end gap-2 rounded-[1.7rem] p-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message"
            rows={1}
            className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-[1.35rem] bg-white/80 px-4 py-3 text-[15px] font-semibold leading-6 outline-none placeholder:text-slate-500 dark:bg-slate-950/60 dark:placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!draft.trim() || !chat}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-glow transition active:scale-95 disabled:opacity-45"
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete chat?"
        description={chat ? `This removes ${chat.name} and all messages from this device.` : "This chat will be removed."}
        confirmLabel="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (chat) {
            void deleteChat(chat.id);
            router.replace("/");
          }
        }}
      />
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatScreen />
    </Suspense>
  );
}
