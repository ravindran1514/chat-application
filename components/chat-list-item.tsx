"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, MoreVertical, Pin, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatChatDate, truncateText } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import type { Chat } from "@/types/chat";

interface ChatListItemProps {
  chat: Chat;
}

export function ChatListItem({ chat }: ChatListItemProps) {
  const deleteChat = useChatStore((state) => state.deleteChat);
  const renameChat = useChatStore((state) => state.renameChat);
  const togglePinChat = useChatStore((state) => state.togglePinChat);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(chat.name);

  const handleRename = async () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== chat.name) {
      await renameChat(chat.id, trimmed);
    }
    setRenaming(false);
    setMenuOpen(false);
  };

  return (
    <>
      <motion.article
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16 }}
        className="glass relative rounded-2xl p-3"
      >
        <div className="flex items-center gap-3">
          <Link href={`/chat?id=${encodeURIComponent(chat.id)}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar color={chat.color} initials={chat.avatarInitials} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {chat.pinned ? <Pin size={13} className="shrink-0 fill-emerald-500 text-emerald-600" /> : null}
                <h2 className="truncate text-base font-black">{chat.name}</h2>
              </div>
              <p className="mt-1 truncate text-sm font-medium text-slate-500 dark:text-slate-400">
                {chat.lastMessageText ? truncateText(chat.lastMessageText) : `Room ${chat.roomCode}`}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <time className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {formatChatDate(chat.lastMessageAt || chat.updatedAt)}
              </time>
              {chat.unreadCount > 0 ? (
                <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-black text-white">
                  {chat.unreadCount}
                </span>
              ) : null}
            </div>
          </Link>
          <button
            type="button"
            aria-label="Open chat actions"
            onClick={() => setMenuOpen((value) => !value)}
            className="grid h-10 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition active:scale-95 dark:text-slate-300"
          >
            <MoreVertical size={19} />
          </button>
        </div>

        {menuOpen ? (
          <div className="absolute right-3 top-14 z-10 w-44 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
            <button
              type="button"
              onClick={() => {
                togglePinChat(chat.id);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Pin size={16} />
              {chat.pinned ? "Unpin chat" : "Pin chat"}
            </button>
            <button
              type="button"
              onClick={() => setRenaming(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Pencil size={16} />
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(chat.roomCode);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Copy size={16} />
              Copy code
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        ) : null}

        {renaming ? (
          <form onSubmit={(event) => event.preventDefault()} className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={handleRename}
              autoFocus
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-bold outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950/70"
            />
            <button
              type="button"
              onClick={handleRename}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white active:scale-95"
            >
              Save
            </button>
          </form>
        ) : null}
      </motion.article>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete chat?"
        description={`This removes ${chat.name} from Firebase for everyone in this room.`}
        confirmLabel="Delete"
        onCancel={() => {
          setConfirmOpen(false);
          setMenuOpen(false);
        }}
        onConfirm={() => {
          void deleteChat(chat.id);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
