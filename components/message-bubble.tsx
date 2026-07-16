"use client";

import { motion } from "framer-motion";
import { Check, Pencil, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useLongPress } from "@/hooks/use-long-press";
import { formatTime } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const editMessage = useChatStore((state) => state.editMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const longPressHandlers = useLongPress({ onLongPress: openMenu });

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      void editMessage(message.chatId, message.id, trimmed);
    }
    setEditing(false);
    setMenuOpen(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={isOwn ? "relative ml-auto max-w-[84%]" : "relative mr-auto max-w-[84%]"}
      {...longPressHandlers}
    >
      <div
        className={
          isOwn
            ? "rounded-3xl rounded-br-md bg-emerald-600 px-4 py-2.5 text-white shadow-lg shadow-emerald-900/15"
            : "rounded-3xl rounded-bl-md bg-white/90 px-4 py-2.5 text-slate-900 shadow-lg shadow-slate-950/10 dark:bg-slate-800 dark:text-white"
        }
      >
        {!isOwn ? <p className="mb-1 text-xs font-black text-emerald-600 dark:text-emerald-300">{message.senderName}</p> : null}
        {message.imageUrl ? (
          <a href={message.imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.imageUrl}
              alt={message.imageName || "Shared image"}
              className="max-h-72 w-full min-w-48 object-cover"
              loading="lazy"
            />
          </a>
        ) : null}
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveEdit();
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold text-white outline-none placeholder:text-white/70"
            />
            <button type="submit" aria-label="Save message" className="grid h-8 w-8 place-items-center rounded-full bg-white text-emerald-700">
              <Check size={16} />
            </button>
          </form>
        ) : message.text ? (
          <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-6">{message.text}</p>
        ) : null}
        {!message.text && message.imageUrl ? (
          <p className={isOwn ? "mt-2 text-xs font-bold text-white/75" : "mt-2 text-xs font-bold text-slate-500 dark:text-slate-400"}>
            {message.imageName || "Photo"}
          </p>
        ) : null}
        <div className={isOwn ? "mt-1 flex items-center justify-end gap-1.5 text-[11px] font-bold text-white/75" : "mt-1 flex items-center justify-end gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400"}>
          {message.edited ? <span>edited</span> : null}
          <time>{formatTime(message.updatedAt ?? message.createdAt)}</time>
        </div>
      </div>

      {menuOpen && !editing && isOwn ? (
        <div className="absolute bottom-full right-0 z-10 mb-2 flex overflow-hidden rounded-full border border-white/60 bg-white/95 p-1 shadow-xl shadow-slate-950/15 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
          {message.text ? (
            <button
              type="button"
              aria-label="Edit message"
              onClick={() => setEditing(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Pencil size={17} />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Delete message"
            onClick={() => void deleteMessage(message.chatId, message.id)}
            className="grid h-10 w-10 place-items-center rounded-full text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 size={17} />
          </button>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Check size={17} />
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
