export type ThemeMode = "light" | "dark";

export interface Chat {
  id: string;
  roomCode: string;
  name: string;
  color: string;
  avatarInitials: string;
  pinned: boolean;
  unreadCount: number;
  participantIds: string[];
  participantNames: Record<string, string>;
  lastMessageText: string;
  lastMessageAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  imageUrl?: string;
  imageName?: string;
  imageType?: string;
  imageSize?: number;
  audioUrl?: string;
  audioType?: string;
  audioSize?: number;
  audioDurationMs?: number;
  createdAt: number;
  updatedAt?: number;
  edited: boolean;
}

export interface Settings {
  theme: ThemeMode;
}

export interface UserProfile {
  displayName: string;
  color: string;
}
