declare module "@capacitor/push-notifications" {
  type PermissionStatus = { receive: "prompt" | "prompt-with-rationale" | "granted" | "denied" };
  type PushEvent = {
    error?: string;
    value?: string;
    notification?: {
      data?: Record<string, unknown>;
    };
  };

  export const PushNotifications: {
    addListener: (eventName: string, listenerFunc: (event: PushEvent) => void | Promise<void>) => Promise<{ remove: () => Promise<void> }>;
    checkPermissions: () => Promise<PermissionStatus>;
    createChannel: (channel: Record<string, unknown>) => Promise<void>;
    register: () => Promise<void>;
    requestPermissions: () => Promise<PermissionStatus>;
  };
}
