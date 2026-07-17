# Daily Brief Chat

A mobile-first realtime chat app built with Next.js 15, React, TypeScript, Tailwind CSS, Zustand, Firebase Auth, Firestore, Framer Motion, Lucide React, and Capacitor Android.

## Latest Features

- Realtime Firebase chat rooms with short room codes.
- Anonymous Firebase Auth, so users can start chatting without account signup.
- Create or join rooms from the mobile app.
- Live text messaging through Firestore.
- Compressed image messages stored directly in Firestore documents.
- Short voice messages with microphone recording and playback.
- Message edit and delete actions from the sender side.
- Delivery indicators for sent and delivered messages.
- Blue double-tick read receipts when the other active member reads the message.
- Room members dialog with realtime online and last-seen status.
- Local profile name and color settings.
- Light and dark theme support.
- Local pinned chats and unread badges.
- Secret tap pattern on the home screen to open the chat area.
- Static export configured for Capacitor Android.
- GitHub Actions cloud build for signed release APKs.
- Release APK signing setup so future APKs can install as app updates.

## How Two Phones Chat

1. User A opens the app and sets a name in Settings.
2. User A taps `+`, creates a room, and shares the room code.
3. User B opens the app on another phone, sets a name, taps `+`, chooses Join, and enters the same room code.
4. Text, image, and voice messages sync live through Firestore.

## Firebase Setup

Create a Firebase project and enable:

- Authentication: Anonymous sign-in
- Firestore Database

Copy `.env.example` to `.env.local` and fill the web app config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Deploy or paste the included `firestore.rules` in Firebase Console.

Image and voice messages are compressed or size-limited and stored in Firestore documents so the app can stay on the no-cost Spark plan without Firebase Storage. This is best for light media sharing, not large media storage.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

The static app is exported to `out/`.

## Android Build

```bash
npm run build
npx cap sync android
npx cap open android
```

This project already includes `capacitor.config.ts` and the Android project.

## Cloud APK Build

The workflow at `.github/workflows/android-apk.yml` builds a signed release APK in GitHub Actions.

Required Firebase repository secrets:

```text
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Required Android signing repository secrets:

```text
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_PASSWORD
```

The release key alias is fixed as:

```text
daily-brief
```

To create a release keystore:

```bash
keytool -genkeypair -v -keystore daily-brief-release.keystore -alias daily-brief -keyalg RSA -keysize 2048 -validity 10000
base64 -w 0 daily-brief-release.keystore
```

Add the base64 output to `ANDROID_KEYSTORE_BASE64`. Keep `daily-brief-release.keystore` backed up safely. Future APK updates require the same signing key.

## Installing Updates

The first signed release APK may require uninstalling an older debug APK because debug and release signatures are different.

After the signed release APK is installed once, future cloud-built APKs can be installed directly as app updates.
