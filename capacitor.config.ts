import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.offline.chat",
  appName: "Firebase Chat",
  webDir: "out",
  server: {
    androidScheme: "https"
  }
};

export default config;
