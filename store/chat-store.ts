"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { arrayRemove, arrayUnion, collection, deleteDoc, deleteField, doc, getDoc, onSnapshot, orderBy, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import type { Unsubscribe } from "firebase/firestore";
import { createIndexedDbStorage } from "@/lib/idb-storage";
import { getFirebaseAuth, getFirebaseDb, hasFirebaseConfig } from "@/lib/firebase";
import { createId, getInitials } from "@/lib/utils";
import type { Chat, Message, Settings, ThemeMode, UserProfile } from "@/types/chat";

const PROFILE_COLORS = ["#16a34a", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#2563eb"];
const MAX_FIRESTORE_IMAGE_BYTES = 720 * 1024;

interface ChatState {
  chats: Chat[];
  messages: Message[];
  settings: Settings;
  profile: UserProfile;
  userId: string | null;
  isOnlineReady: boolean;
  isLoading: boolean;
  error: string;
  localPinned: Record<string, boolean>;
  localReadAt: Record<string, number>;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  bootFirebase: () => void;
  createChat: (name: string, color?: string) => Promise<string>;
  joinChat: (roomCode: string) => Promise<string>;
  renameChat: (chatId: string, name: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  togglePinChat: (chatId: string) => void;
  markChatRead: (chatId: string) => void;
  subscribeMessages: (chatId: string) => Unsubscribe;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  sendImageMessage: (chatId: string, file: File) => Promise<void>;
  editMessage: (chatId: string, messageId: string, text: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  setTheme: (theme: ThemeMode) => void;
  setProfile: (profile: UserProfile) => void;
  clearAllData: () => void;
}

type PersistedChatState = Pick<ChatState, "settings" | "profile" | "localPinned" | "localReadAt">;

let authUnsubscribe: Unsubscribe | null = null;
let chatsUnsubscribe: Unsubscribe | null = null;

function getRandomProfileColor(): string {
  return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)] ?? PROFILE_COLORS[0];
}

function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function mapChatDoc(id: string, data: Record<string, unknown>, localPinned: Record<string, boolean>, localReadAt: Record<string, number>, userId: string | null): Chat {
  const lastMessageAt = Number(data.lastMessageAt ?? data.updatedAt ?? data.createdAt ?? Date.now());
  const unreadCount =
    userId && data.lastSenderId !== userId && lastMessageAt > (localReadAt[id] ?? 0) && data.lastMessageText
      ? 1
      : 0;

  return {
    id,
    roomCode: String(data.roomCode ?? id),
    name: String(data.name ?? "Chat"),
    color: String(data.color ?? PROFILE_COLORS[0]),
    avatarInitials: String(data.avatarInitials ?? getInitials(String(data.name ?? "Chat"))),
    pinned: Boolean(localPinned[id]),
    unreadCount,
    participantIds: Array.isArray(data.participantIds) ? data.participantIds.map(String) : [],
    participantNames: typeof data.participantNames === "object" && data.participantNames ? (data.participantNames as Record<string, string>) : {},
    lastMessageText: String(data.lastMessageText ?? ""),
    lastMessageAt,
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? lastMessageAt)
  };
}

function mapMessageDoc(id: string, chatId: string, data: Record<string, unknown>): Message {
  return {
    id,
    chatId,
    senderId: String(data.senderId ?? ""),
    senderName: String(data.senderName ?? "Someone"),
    text: String(data.text ?? ""),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    imageName: data.imageName ? String(data.imageName) : undefined,
    imageType: data.imageType ? String(data.imageType) : undefined,
    imageSize: data.imageSize ? Number(data.imageSize) : undefined,
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: data.updatedAt ? Number(data.updatedAt) : undefined,
    edited: Boolean(data.edited)
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image."));
    };
    image.src = objectUrl;
  });
}

async function compressImageToDataUrl(file: File): Promise<{ dataUrl: string; size: number; type: string }> {
  const image = await loadImage(file);
  const maxSide = 960;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image compression is not available on this device.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const qualities = [0.72, 0.62, 0.52, 0.42];
  for (const quality of qualities) {
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    const size = Math.ceil((dataUrl.length * 3) / 4);

    if (size <= MAX_FIRESTORE_IMAGE_BYTES) {
      return {
        dataUrl,
        size,
        type: "image/jpeg"
      };
    }
  }

  throw new Error("Image is too large. Choose a smaller image.");
}

function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }

    return b.updatedAt - a.updatedAt;
  });
}

function requireOnline(state: ChatState): { userId: string } {
  if (!hasFirebaseConfig()) {
    throw new Error("Add Firebase keys in .env.local first.");
  }

  if (!state.userId) {
    throw new Error("Still connecting to Firebase. Try again in a moment.");
  }

  return { userId: state.userId };
}

function subscribeChatsForUser(userId: string, set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void) {
  chatsUnsubscribe?.();
  const db = getFirebaseDb();
  const chatsQuery = query(collection(db, "chats"), where("participantIds", "array-contains", userId));

  chatsUnsubscribe = onSnapshot(
    chatsQuery,
    (snapshot) => {
      set((state) => {
        const chats = snapshot.docs.map((item) => mapChatDoc(item.id, item.data(), state.localPinned, state.localReadAt, state.userId));
        return {
          chats: sortChats(chats),
          isLoading: false,
          error: ""
        };
      });
    },
    (error) => {
      set({
        isLoading: false,
        error: error.message
      });
    }
  );
}

export const useChatStore = create<ChatState>()(
  persist<ChatState, [], [], PersistedChatState>(
    (set, get) => ({
      chats: [],
      messages: [],
      settings: {
        theme: "light"
      },
      profile: {
        displayName: "Me",
        color: PROFILE_COLORS[0]
      },
      userId: null,
      isOnlineReady: false,
      isLoading: true,
      error: "",
      localPinned: {},
      localReadAt: {},
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      bootFirebase: () => {
        if (!hasFirebaseConfig()) {
          set({
            isLoading: false,
            isOnlineReady: false,
            error: "Firebase config missing. Create .env.local from .env.example."
          });
          return;
        }

        if (authUnsubscribe) {
          return;
        }

        set({ isLoading: true });
        const auth = getFirebaseAuth();
        authUnsubscribe = onAuthStateChanged(auth, (user: User | null) => {
          if (user) {
            set({ userId: user.uid, isOnlineReady: true, error: "" });
            subscribeChatsForUser(user.uid, set);
            return;
          }

          signInAnonymously(auth).catch((error: Error) => {
            set({
              isLoading: false,
              isOnlineReady: false,
              error: error.message
            });
          });
        });
      },
      createChat: async (name, color) => {
        const { userId } = requireOnline(get());
        const trimmedName = name.trim();
        const now = Date.now();
        const db = getFirebaseDb();
        const roomCode = makeRoomCode();
        const chatRef = doc(db, "chats", roomCode);

        await setDoc(chatRef, {
          roomCode,
          name: trimmedName,
          color: color ?? getRandomProfileColor(),
          avatarInitials: getInitials(trimmedName),
          participantIds: [userId],
          participantNames: {
            [userId]: get().profile.displayName
          },
          lastMessageText: "",
          lastMessageAt: now,
          lastSenderId: "",
          createdAt: now,
          updatedAt: now
        });

        return roomCode;
      },
      joinChat: async (roomCode) => {
        const { userId } = requireOnline(get());
        const code = normalizeRoomCode(roomCode);
        if (code.length < 4) {
          throw new Error("Enter a valid room code.");
        }

        const db = getFirebaseDb();
        const chatRef = doc(db, "chats", code);

        try {
          await updateDoc(chatRef, {
            participantIds: arrayUnion(userId),
            [`participantNames.${userId}`]: get().profile.displayName,
            updatedAt: Date.now()
          });
        } catch (error) {
          if (error instanceof Error && error.message.toLowerCase().includes("not-found")) {
            throw new Error("No chat found for this room code.");
          }

          throw error;
        }

        return code;
      },
      renameChat: async (chatId, name) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          return;
        }

        requireOnline(get());
        await updateDoc(doc(getFirebaseDb(), "chats", chatId), {
          name: trimmedName,
          avatarInitials: getInitials(trimmedName),
          updatedAt: Date.now()
        });
      },
      deleteChat: async (chatId) => {
        const { userId } = requireOnline(get());
        const db = getFirebaseDb();
        const chatRef = doc(db, "chats", chatId);
        const chatSnapshot = await getDoc(chatRef);

        if (!chatSnapshot.exists()) {
          return;
        }

        await updateDoc(chatRef, {
          participantIds: arrayRemove(userId),
          [`participantNames.${userId}`]: deleteField(),
          updatedAt: Date.now()
        });

        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          messages: state.messages.filter((message) => message.chatId !== chatId)
        }));
      },
      togglePinChat: (chatId) => {
        set((state) => {
          const nextPinned = {
            ...state.localPinned,
            [chatId]: !state.localPinned[chatId]
          };

          return {
            localPinned: nextPinned,
            chats: sortChats(state.chats.map((chat) => (chat.id === chatId ? { ...chat, pinned: nextPinned[chatId] } : chat)))
          };
        });
      },
      markChatRead: (chatId) => {
        set((state) => ({
          localReadAt: {
            ...state.localReadAt,
            [chatId]: Date.now()
          },
          chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat))
        }));
      },
      subscribeMessages: (chatId) => {
        requireOnline(get());
        const db = getFirebaseDb();
        const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));

        return onSnapshot(
          messagesQuery,
          (snapshot) => {
            const chatMessages = snapshot.docs.map((item) => mapMessageDoc(item.id, chatId, item.data()));
            set((state) => ({
              messages: [...state.messages.filter((message) => message.chatId !== chatId), ...chatMessages]
            }));
          },
          (error) => {
            set({ error: error.message });
          }
        );
      },
      sendMessage: async (chatId, text) => {
        const trimmedText = text.trim();
        if (!trimmedText) {
          return;
        }

        const { userId } = requireOnline(get());
        const now = Date.now();
        const db = getFirebaseDb();
        const messageId = createId("msg");
        const profile = get().profile;
        const batch = writeBatch(db);

        batch.set(doc(db, "chats", chatId, "messages", messageId), {
          senderId: userId,
          senderName: profile.displayName,
          text: trimmedText,
          createdAt: now,
          edited: false
        });
        batch.update(doc(db, "chats", chatId), {
          lastMessageText: trimmedText,
          lastMessageAt: now,
          lastSenderId: userId,
          updatedAt: now
        });

        await batch.commit();
      },
      sendImageMessage: async (chatId, file) => {
        if (!file.type.startsWith("image/")) {
          throw new Error("Choose an image file.");
        }

        if (file.size > 8 * 1024 * 1024) {
          throw new Error("Image must be under 8 MB.");
        }

        const { userId } = requireOnline(get());
        const now = Date.now();
        const db = getFirebaseDb();
        const messageId = createId("msg");
        const profile = get().profile;
        const compressedImage = await compressImageToDataUrl(file);
        const batch = writeBatch(db);

        batch.set(doc(db, "chats", chatId, "messages", messageId), {
          senderId: userId,
          senderName: profile.displayName,
          text: "",
          imageUrl: compressedImage.dataUrl,
          imageName: file.name,
          imageType: compressedImage.type,
          imageSize: compressedImage.size,
          createdAt: now,
          edited: false
        });
        batch.update(doc(db, "chats", chatId), {
          lastMessageText: "Photo",
          lastMessageAt: now,
          lastSenderId: userId,
          updatedAt: now
        });

        await batch.commit();
      },
      editMessage: async (chatId, messageId, text) => {
        const trimmedText = text.trim();
        if (!trimmedText) {
          return;
        }

        requireOnline(get());
        const now = Date.now();
        await updateDoc(doc(getFirebaseDb(), "chats", chatId, "messages", messageId), {
          text: trimmedText,
          updatedAt: now,
          edited: true
        });
      },
      deleteMessage: async (chatId, messageId) => {
        requireOnline(get());
        await deleteDoc(doc(getFirebaseDb(), "chats", chatId, "messages", messageId));
      },
      setTheme: (theme) => {
        set((state) => ({
          settings: {
            ...state.settings,
            theme
          }
        }));
      },
      setProfile: (profile) => {
        set({ profile });
      },
      clearAllData: () => {
        set({
          chats: [],
          messages: [],
          localPinned: {},
          localReadAt: {},
          settings: {
            theme: "light"
          }
        });
      }
    }),
    {
      name: "online-chat-state",
      storage: createIndexedDbStorage<PersistedChatState>(),
      partialize: (state) => ({
        settings: state.settings,
        profile: state.profile,
        localPinned: state.localPinned,
        localReadAt: state.localReadAt
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.bootFirebase();
      }
    }
  )
);

export function getMessagesForChat(messages: Message[], chatId: string): Message[] {
  return messages.filter((message) => message.chatId === chatId).sort((a, b) => a.createdAt - b.createdAt);
}

export function getLastMessage(messages: Message[], chatId: string): Message | undefined {
  return messages
    .filter((message) => message.chatId === chatId)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}
