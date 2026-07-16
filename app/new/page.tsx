"use client";

import { useRouter } from "next/navigation";
import { Check, Link2, Palette, Plus } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { TopBar } from "@/components/top-bar";
import { cn, getInitials } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";

const colors = [
  { name: "Emerald", value: "#16a34a" },
  { name: "Cyan", value: "#0891b2" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Rose", value: "#db2777" },
  { name: "Orange", value: "#ea580c" },
  { name: "Blue", value: "#2563eb" },
  { name: "Teal", value: "#0f766e" },
  { name: "Ruby", value: "#be123c" }
];

type Mode = "create" | "join";

export default function NewChatPage() {
  const router = useRouter();
  const createChat = useChatStore((state) => state.createChat);
  const joinChat = useChatStore((state) => state.joinChat);
  const isOnlineReady = useChatStore((state) => state.isOnlineReady);
  const errorMessage = useChatStore((state) => state.error);
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [color, setColor] = useState(colors[0].value);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedColor = colors.find((item) => item.value === color) ?? colors[0];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (mode === "create") {
        const trimmedName = name.trim();
        if (trimmedName.length < 2) {
          throw new Error("Enter at least 2 characters.");
        }

        const chatId = await createChat(trimmedName, color);
        router.replace(`/chat?id=${encodeURIComponent(chatId)}`);
        return;
      }

      const chatId = await joinChat(roomCode);
      router.replace(`/chat?id=${encodeURIComponent(chatId)}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to continue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <TopBar title="Online chat" subtitle="Create or join a Firebase room" backHref="/chats" />

      <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-6">
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition active:scale-95",
              mode === "create" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-300"
            )}
          >
            <Plus size={18} />
            Create
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition active:scale-95",
              mode === "join" ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-600 dark:text-slate-300"
            )}
          >
            <Link2 size={18} />
            Join
          </button>
        </div>

        <section className="glass rounded-3xl p-5">
          {mode === "create" ? (
            <div className="flex flex-col items-center gap-4">
              <Avatar color={color} initials={getInitials(name || "New")} size="lg" />
              <label className="w-full">
                <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Chat name</span>
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError("");
                  }}
                  autoFocus
                  placeholder="Ravi and Ram"
                  className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 text-base font-bold outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950/70"
                />
              </label>
            </div>
          ) : (
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700 dark:text-slate-200">Room code</span>
              <input
                value={roomCode}
                onChange={(event) => {
                  setRoomCode(event.target.value.toUpperCase());
                  setError("");
                }}
                autoFocus
                placeholder="AB12CD"
                className="w-full rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 text-center text-2xl font-black uppercase tracking-widest outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950/70"
              />
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                Ask your friend to copy the room code from the chat menu.
              </p>
            </label>
          )}

          {error || errorMessage ? <p className="mt-4 text-sm font-bold text-rose-600">{error || errorMessage}</p> : null}
        </section>

        {mode === "create" ? (
          <section className="glass mt-4 rounded-3xl p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/70 text-slate-700 shadow-sm dark:bg-slate-950/50 dark:text-slate-200">
                <Palette size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">Profile color</h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{selectedColor.name}</p>
              </div>
              <div
                className="h-9 w-9 shrink-0 rounded-full shadow-lg shadow-slate-950/10 ring-4 ring-white/70 dark:ring-slate-950/50"
                style={{ background: `linear-gradient(135deg, ${selectedColor.value}, ${selectedColor.value}aa)` }}
                aria-hidden="true"
              />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {colors.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-label={`Use ${item.name} profile color`}
                  onClick={() => setColor(item.value)}
                  className={cn(
                    "grid h-12 w-12 shrink-0 place-items-center rounded-full border transition active:scale-95",
                    color === item.value
                      ? "border-white shadow-lg shadow-slate-950/15 ring-2 ring-slate-950 ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-slate-900"
                      : "border-white/70 shadow-sm shadow-slate-950/10 dark:border-white/10"
                  )}
                  style={{ background: `linear-gradient(135deg, ${item.value}, ${item.value}aa)` }}
                >
                  {color === item.value ? <Check className="text-white drop-shadow" size={19} /> : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <button
          type="submit"
          disabled={saving || !isOnlineReady}
          className="mt-5 w-full rounded-full bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-glow transition active:scale-95 disabled:opacity-50"
        >
          {saving ? "Please wait..." : mode === "create" ? "Create room" : "Join room"}
        </button>
      </form>
    </AppShell>
  );
}
