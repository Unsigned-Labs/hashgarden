// Utility and hook for connecting to relays and fetching Blossom servers (NIP-07 context)
export interface OutboxRelay {
  url: string;
}

export interface BlossomServer {
  url: string;
}

export type RelayResult =
  | { status: "success"; relays: string[] }
  | { status: "error"; error: string };

export async function fetchOutboxRelays(pubkey: string): Promise<RelayResult> {
  try {
    const relayUrl = "wss://purplepag.es";
    const ws = new WebSocket(relayUrl);
    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error("Failed to connect to relay"));
    });
    const subscription = [
      "REQ",
      "outbox",
      {
        kinds: [10002],
        authors: [pubkey],
        limit: 1,
      },
    ];
    ws.send(JSON.stringify(subscription));
    const result = await new Promise<unknown | null>((resolve) => {
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data[0] === "EVENT" && data[1] === "outbox") {
            resolve(data[2]);
          } else if (data[0] === "EOSE" && data[1] === "outbox") {
            resolve(null);
          }
        } catch {
          // Ignore parse errors, treat as no result
          resolve(null);
        }
      };
      setTimeout(() => resolve(null), 5000);
    });
    ws.close();
    if (
      result &&
      typeof result === "object" &&
      result !== null &&
      "tags" in result &&
      Array.isArray((result as { tags: unknown }).tags)
    ) {
      const tags = (result as { tags: unknown }).tags;
      const relays = (tags as unknown[])
        .filter((tag): tag is [string, string] => Array.isArray(tag) && tag[0] === "r" && typeof tag[1] === "string")
        .map((tag) => tag[1]);
      return { status: "success", relays };
    } else {
      return { status: "error", error: "No connected relays found for this pubkey" };
    }
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}
