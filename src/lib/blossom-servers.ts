// Fetch Blossom servers for a user from a list of relays
export type BlossomServerResult =
  | { status: "success"; servers: string[] }
  | { status: "error"; error: string };

export async function fetchBlossomServers(pubkey: string, relays: string[]): Promise<BlossomServerResult> {
  for (const relayUrl of relays) {
    try {
      const ws = new WebSocket(relayUrl);
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("Failed to connect to relay: " + relayUrl));
      });
      const subscription = [
        "REQ",
        "blossom",
        {
          kinds: [10063],
          authors: [pubkey],
          limit: 1,
        },
      ];
      ws.send(JSON.stringify(subscription));
      const result = await new Promise<unknown | null>((resolve) => {
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data[0] === "EVENT" && data[1] === "blossom") {
              resolve(data[2]);
            } else if (data[0] === "EOSE" && data[1] === "blossom") {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        };
        setTimeout(() => resolve(null), 3000);
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
        const servers = (tags as unknown[])
          .filter((tag): tag is [string, string] => Array.isArray(tag) && tag[0] === "server" && typeof tag[1] === "string")
          .map((tag) => tag[1]);
        if (servers.length > 0) {
          return { status: "success", servers };
        }
      }
    } catch {
      // Try next relay
      continue;
    }
  }
  return { status: "error", error: "No Blossom servers found in your configuration" };
}
