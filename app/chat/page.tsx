"use client";

import { AnimatePresence } from "framer-motion";
import { Copy, ImagePlus, Mic, Pin, Send, Square, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MessageBubble } from "@/components/message-bubble";
import { TopBar } from "@/components/top-bar";
import { copyToClipboard } from "@/lib/utils";
import { getMessagesForChat, useChatStore } from "@/store/chat-store";

function ChatScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get("id") ?? "";
  const chats = useChatStore((state) => state.chats);
  const allMessages = useChatStore((state) => state.messages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const sendImageMessage = useChatStore((state) => state.sendImageMessage);
  const sendVoiceMessage = useChatStore((state) => state.sendVoiceMessage);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const togglePinChat = useChatStore((state) => state.togglePinChat);
  const markChatRead = useChatStore((state) => state.markChatRead);
  const subscribeMessages = useChatStore((state) => state.subscribeMessages);
  const hasHydrated = useChatStore((state) => state.hasHydrated);
  const userId = useChatStore((state) => state.userId);
  const error = useChatStore((state) => state.error);
  const [draft, setDraft] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState(0);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!recording || !recordingStartedAt) {
      setRecordingSeconds(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setRecordingSeconds(Math.max(1, Math.round((Date.now() - recordingStartedAt) / 1000)));
    }, 500);

    return () => window.clearInterval(intervalId);
  }, [recording, recordingStartedAt]);

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || !chat) {
      return;
    }
    void sendMessage(chat.id, draft);
    setDraft("");
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !chat) {
      return;
    }

    setUploadingImage(true);
    setUploadError("");

    try {
      await sendImageMessage(chat.id, file);
    } catch (imageError) {
      setUploadError(imageError instanceof Error ? imageError.message : "Unable to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    if (!chat) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setUploadError("Voice recording is not supported in this browser.");
      return;
    }

    setUploadError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const supportedMimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((item) =>
        MediaRecorder.isTypeSupported(item)
      );
      const recorder = supportedMimeType ? new MediaRecorder(stream, { mimeType: supportedMimeType }) : new MediaRecorder(stream);
      const startedAt = Date.now();

      audioChunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setRecordingStartedAt(startedAt);
      setRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const durationMs = Date.now() - startedAt;
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setRecordingStartedAt(0);
        setRecordingSeconds(0);

        if (durationMs < 500 || audioBlob.size === 0) {
          setUploadError("Voice note was too short.");
          return;
        }

        void sendVoiceMessage(chat.id, audioBlob, durationMs).catch((voiceError) => {
          setUploadError(voiceError instanceof Error ? voiceError.message : "Unable to send voice message.");
        });
      };

      recorder.start();
      window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, 30000);
    } catch {
      setRecording(false);
      setUploadError("Microphone permission is needed for voice messages.");
    }
  };

  if (hasHydrated && !chat) {
    return (
      <AppShell>
        <TopBar title="Chat not found" backHref="/chats" />
        <div className="flex flex-1 items-center justify-center px-8 text-center text-sm font-semibold text-slate-500">
          This Firebase room is not available for this device.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopBar
        backHref="/chats"
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
              onClick={() => chat && void copyToClipboard(chat.roomCode)}
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
              aria-label="Delete chat for me"
              disabled={!chat}
              onClick={() => setConfirmOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full text-rose-600 transition active:scale-95 disabled:opacity-40"
            >
              <Trash2 size={19} />
            </button>
          </div>
        }
      />

      <section className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-2">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} isOwn={message.senderId === userId} />
            ))}
          </AnimatePresence>
          {messages.length === 0 ? (
            <div className="pt-20 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              {uploadError || error || "Say something to begin."}
            </div>
          ) : null}
          {uploadError && messages.length > 0 ? (
            <p className="text-center text-sm font-bold text-rose-600">{uploadError}</p>
          ) : null}
          <div ref={endRef} />
        </div>
      </section>

      <form onSubmit={handleSend} className="safe-bottom shrink-0 px-4 pt-2">
        <div className="glass flex items-end gap-2 rounded-[1.7rem] p-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          <button
            type="button"
            aria-label="Upload image"
            disabled={!chat || uploadingImage}
            onClick={() => fileInputRef.current?.click()}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/80 text-slate-700 transition active:scale-95 disabled:opacity-45 dark:bg-slate-950/60 dark:text-slate-200"
          >
            <ImagePlus size={20} />
          </button>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={recording ? "Recording voice..." : uploadingImage ? "Compressing image..." : "Message"}
            rows={1}
            className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-[1.35rem] bg-white/80 px-4 py-3 text-[15px] font-semibold leading-6 outline-none placeholder:text-slate-500 dark:bg-slate-950/60 dark:placeholder:text-slate-400"
          />
          {draft.trim() ? (
            <button
              type="submit"
              aria-label="Send message"
              disabled={!chat || uploadingImage || recording}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-glow transition active:scale-95 disabled:opacity-45"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              type="button"
              aria-label={recording ? "Stop recording" : "Record voice message"}
              disabled={!chat || uploadingImage}
              onClick={recording ? stopRecording : () => void startRecording()}
              className={
                recording
                  ? "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-900/20 transition active:scale-95 disabled:opacity-45"
                  : "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-glow transition active:scale-95 disabled:opacity-45"
              }
            >
              {recording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
            </button>
          )}
        </div>
        {recording ? (
          <p className="px-4 pt-2 text-center text-xs font-black text-rose-600">
            Recording {recordingSeconds || 1}s
          </p>
        ) : null}
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete for you?"
        description={chat ? `This removes ${chat.name} from your chat list. Others in the room can still chat, and you can join again with code ${chat.roomCode}.` : "This chat will be removed from your list."}
        confirmLabel="Delete"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (chat) {
            void deleteChat(chat.id);
            router.replace("/chats");
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
