"use client";

import { Capacitor } from "@capacitor/core";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

let registeredUserId: string | null = null;
let listenersBound = false;

function getTokenDocId(token: string): string {
  return encodeURIComponent(token).replace(/\./g, "%2E");
}

export async function registerPushNotifications(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || registeredUserId === userId) {
    return;
  }

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const db = getFirebaseDb();

  if (!listenersBound) {
    listenersBound = true;

    await PushNotifications.addListener("registration", async (token) => {
      const activeUserId = registeredUserId;
      if (!activeUserId || !token.value) {
        return;
      }

      await setDoc(
        doc(db, "users", activeUserId, "pushTokens", getTokenDocId(token.value)),
        {
          token: token.value,
          platform: Capacitor.getPlatform(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.warn("Push notification registration failed", error.error);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
      const chatId = typeof event.notification?.data?.chatId === "string" ? event.notification.data.chatId : "";
      if (chatId) {
        window.location.href = `/chat?id=${encodeURIComponent(chatId)}`;
      }
    });
  }

  registeredUserId = userId;

  await PushNotifications.createChannel({
    id: "messages",
    name: "Messages",
    description: "New chat messages",
    importance: 4,
    visibility: 1,
    vibration: true
  }).catch(() => undefined);

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
    permission = await PushNotifications.requestPermissions();
  }

  if (permission.receive === "granted") {
    await PushNotifications.register();
  }
}
