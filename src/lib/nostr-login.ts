export interface NostrProfileMetadata {
  name?: string;
  picture?: string;
  nip05?: string;
  about?: string;
  banner?: string;
}

export interface NostrExtension {
  getPublicKey(): Promise<string>;
  signEvent?(event: unknown): Promise<unknown>;
}

export type NostrLoginResult =
  | { status: "success"; pubkey: string }
  | { status: "error"; error: string };

export type NostrProfileResult =
  | { status: "success"; metadata: NostrProfileMetadata }
  | { status: "error"; error: string };

export async function fetchNostrProfile(pubkey: string): Promise<NostrProfileResult> {
  try {
    // Connect to a reliable relay to fetch profile metadata
    const relayUrl = "wss://purplepag.es";
    const ws = new WebSocket(relayUrl);
    
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("Failed to connect to relay"));
    });

    // Subscribe to kind:0 events for the user's metadata
    const subscription = [
      "REQ",
      "profile",
      {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      },
    ];

    ws.send(JSON.stringify(subscription));

    const result = await new Promise<NostrProfileMetadata | null>((resolve) => {
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data[0] === "EVENT" && data[1] === "profile" && data[2].content) {
            try {
              const metadata = JSON.parse(data[2].content);
              resolve(metadata);
            } catch {
              resolve(null);
            }
          } else if (data[0] === "EOSE" && data[1] === "profile") {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });

    ws.close();

    if (result) {
      return { status: "success", metadata: result };
    } else {
      return { status: "error", error: "No profile metadata found" };
    }
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export async function loginWithNip07(): Promise<NostrLoginResult> {
  // Wait for window.nostr to be injected (max 1s)
  let attempts = 0;
  const maxAttempts = 10;
  while (!(window as Window & { nostr?: NostrExtension }).nostr && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }
  const nostr = (window as Window & { nostr?: NostrExtension }).nostr;
  if (!nostr) {
    return {
      status: "error",
      error:
        "No Nostr browser extension found. Please install Alby, nos2x, or another NIP-07 extension and refresh the page.",
    };
  }
  try {
    const pubkey = await nostr.getPublicKey();
    return { status: "success", pubkey };
  } catch (e) {
    let msg = "Unknown error";
    if (typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string") {
      msg = (e as { message: string }).message;
    }
    if (msg.includes("denied") || msg.includes("rejected")) {
      msg = "Permission denied. Please allow this site to access your Nostr extension and try again.";
    }
    return { status: "error", error: msg };
  }
}
