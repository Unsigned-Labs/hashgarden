// Fetch files from Blossom server for a user
export interface BlossomFile {
  name: string;
  size: number;
  type: string;
  uploaded: number; // unix timestamp (seconds)
  sha256: string;
}

export type BlossomFilesResult =
  | { status: "success"; files: BlossomFile[] }
  | { status: "error"; error: string };

export async function fetchBlossomFiles(serverUrl: string, pubkey: string, authEvent: unknown): Promise<BlossomFilesResult> {
  try {
    const apiUrl = `${serverUrl}/list/${pubkey}`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Nostr ${btoa(JSON.stringify(authEvent))}`,
        "Content-Type": "application/json",
      },
      mode: "cors",
    });
    if (!response.ok) {
      return {
        status: "error",
        error: `Server responded with ${response.status}: ${response.statusText}`,
      };
    }
    const files = (await response.json()) as BlossomFile[];
    return { status: "success", files };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
