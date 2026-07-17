import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

function getMessageBody(message) {
  if (typeof message.text === "string" && message.text.trim()) {
    return message.text.trim().slice(0, 120);
  }

  if (message.imageUrl) {
    return "Photo";
  }

  if (message.audioUrl) {
    return "Voice message";
  }

  return "New message";
}

export const sendChatMessageNotification = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
  const message = event.data?.data();
  const { chatId, messageId } = event.params;

  if (!message?.senderId) {
    return;
  }

  const chatSnapshot = await db.doc(`chats/${chatId}`).get();
  const chat = chatSnapshot.data();
  const participantIds = Array.isArray(chat?.participantIds) ? chat.participantIds : [];
  const recipientIds = participantIds.filter((participantId) => participantId !== message.senderId);

  if (recipientIds.length === 0) {
    return;
  }

  const tokenSnapshots = await Promise.all(
    recipientIds.map((recipientId) => db.collection("users").doc(recipientId).collection("pushTokens").get())
  );
  const tokenRefs = [];
  const tokens = [];

  tokenSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((tokenDoc) => {
      const token = tokenDoc.data().token;
      if (typeof token === "string" && token) {
        tokenRefs.push(tokenDoc.ref);
        tokens.push(token);
      }
    });
  });

  if (tokens.length === 0) {
    return;
  }

  const response = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: message.senderName || chat?.name || "New message",
      body: getMessageBody(message)
    },
    data: {
      chatId,
      messageId,
      type: "chat_message"
    },
    android: {
      priority: "high",
      notification: {
        channelId: "messages",
        tag: chatId
      }
    }
  });

  const cleanup = response.responses
    .map((result, index) => ({ result, ref: tokenRefs[index] }))
    .filter(({ result }) => {
      const code = result.error?.code;
      return code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
    })
    .map(({ ref }) => ref.delete());

  await Promise.all(cleanup);
  logger.info("Sent chat push notifications", {
    chatId,
    messageId,
    successCount: response.successCount,
    failureCount: response.failureCount
  });
});
