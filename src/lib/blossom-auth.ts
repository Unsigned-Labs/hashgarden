// Utility to create a Blossom auth event for file listing
export interface BlossomAuthEvent {
  kind: number;
  pubkey: string;
  created_at: number;
  content: string;
  tags: [string, string][];
  id?: string;
  sig?: string;
}

export async function createBlossomAuthEvent(action: string, pubkey: string): Promise<BlossomAuthEvent> {
  const now = Math.floor(Date.now() / 1000);
  const event: BlossomAuthEvent = {
    kind: 24242,
    pubkey,
    created_at: now,
    content: "",
    tags: [
      ["t", action],
      ["expiration", (now + 300).toString()],
    ],
  };
  // NIP-07 signEvent
  const nostr = (window as Window & { nostr?: { signEvent?: (event: BlossomAuthEvent) => Promise<BlossomAuthEvent> } }).nostr;
  if (!nostr || typeof nostr.signEvent !== "function") {
    throw new Error("Nostr extension with signEvent not available");
  }
  return await nostr.signEvent(event);
}
