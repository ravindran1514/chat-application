# Firebase Online Chat

A mobile-first realtime chat app built with Next.js 15, React, TypeScript, Tailwind CSS, Zustand, Firebase Auth, Firestore, Framer Motion, Lucide React, and Capacitor.

## How Two Phones Chat

1. Ravi opens the app and sets his name in Settings.
2. Ravi taps `+`, creates a room, and copies the room code from the chat header/menu.
3. Ram opens the app on another phone, sets his name in Settings, taps `+`, chooses Join, and enters the same room code.
4. Messages sync live through Firebase Firestore.

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

## Development

```bash
npm install
npm run dev
```

## Production Web Build

```bash
npm run lint
npm run typecheck
npm run build
```

The static app is exported to `out/`.

## Android Setup

```bash
npm install
npm run build
npx cap init
npx cap add android
npx cap sync
npx cap open android
```

This project already includes `capacitor.config.ts`; if prompted, reuse the existing app name and ID.

## APK Generation

```bash
npm run build
npx cap sync android
npx cap open android
```

In Android Studio:

- Debug APK: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
- Release APK: `Build > Generate Signed Bundle / APK`

Any time web code changes:

```bash
npm run build
npx cap sync android
```
