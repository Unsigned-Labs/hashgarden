import { useState } from "react";
import LoginOptions from "@/components/app/LoginOptions";
import Loading from "@/components/app/Loading";
import FileBrowser from "@/components/app/FileBrowser";
import { Sprout, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  loginWithNip07,
  fetchNostrProfile,
  type NostrProfileMetadata,
} from "@/lib/nostr-login";
import { fetchOutboxRelays } from "@/lib/blossom-relays";
import { fetchBlossomServers } from "@/lib/blossom-servers";
import { createBlossomAuthEvent } from "@/lib/blossom-auth";
import { fetchBlossomFiles, type BlossomFile } from "@/lib/blossom-files";

type Step = "login" | "loading" | "ready";

export default function Index() {
  const [step, setStep] = useState<Step>("login");
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [servers, setServers] = useState<string[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [files, setFiles] = useState<BlossomFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<NostrProfileMetadata | null>(null);

  // Handles login and all data fetching for NIP-07
  const handleLogin = async (p: "nip07" | "nip46") => {
    setStep("loading");
    setError(null);
    setPubkey(null);
    setServers([]);
    setSelectedServer(null);
    setFiles([]);

    if (p === "nip07") {
      // 1. Login
      const loginRes = await loginWithNip07();
      if (loginRes.status === "error") {
        setError(loginRes.error);
        setStep("login");
        return;
      }
      setPubkey(loginRes.pubkey);

      // 1.5. Fetch profile
      const profileRes = await fetchNostrProfile(loginRes.pubkey);
      if (profileRes.status === "success") {
        setProfile(profileRes.metadata);
      }

      // 2. Fetch relays
      const relayRes = await fetchOutboxRelays(loginRes.pubkey);
      if (relayRes.status === "error") {
        setError(relayRes.error);
        setStep("login");
        return;
      }

      // 3. Fetch blossom servers
      const serverRes = await fetchBlossomServers(loginRes.pubkey, relayRes.relays);
      if (serverRes.status === "error" || serverRes.servers.length === 0) {
        setError(
          serverRes.status === "error"
            ? (serverRes as any).error
            : "No servers found."
        );
        setStep("login");
        return;
      }
      setServers(serverRes.servers);
      setSelectedServer(serverRes.servers[0]);

      // 4. Fetch files from first server
      try {
        const authEvent = await createBlossomAuthEvent("list", loginRes.pubkey);
        const filesRes = await fetchBlossomFiles(
          serverRes.servers[0],
          loginRes.pubkey,
          authEvent
        );
        if (filesRes.status === "success") {
          setFiles(filesRes.files);
        } else {
          setError(filesRes.error);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }

      setStep("ready");
    } else {
      // NIP-46 (Bunker) not implemented
      setError("NIP-46 (Bunker) login is not yet implemented.");
      setStep("login");
    }
  };

  const logout = () => {
    setStep("login");
    setPubkey(null);
    setServers([]);
    setSelectedServer(null);
    setFiles([]);
    setError(null);
    setProfile(null);
  };

  return (
    <div className="min-h-screen relative bg-background">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 to-transparent" />

      <header className="w-full">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center shadow-sm">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">
              hash garden
            </span>
          </div>
          {step === "ready" && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                {profile?.picture && (
                  <img
                    src={profile.picture}
                    alt="Profile"
                    className="w-7 h-7 rounded-full"
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="flex flex-col">
                  {profile?.name ? (
                    <span className="text-sm font-medium">{profile.name}</span>
                  ) : (
                    <span className="text-sm font-mono text-muted-foreground">
                      {pubkey?.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="px-6 pb-16">
        <section className="max-w-6xl mx-auto mt-12 sm:mt-20">
          {step === "login" && (
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                hash garden
              </h1>
              <p className="mt-3 text-base sm:text-lg text-muted-foreground">
                Manage your blossom files.
              </p>
              {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
            </div>
          )}

          <div className="mt-6">
            {step === "login" && <LoginOptions onLogin={handleLogin} />}
            {step === "loading" && <Loading />}
            {step === "ready" && (
              <FileBrowser
                servers={servers}
                selectedServer={selectedServer}
                onSelectServer={async (server) => {
                  setSelectedServer(server);
                  if (!pubkey) return;

                  try {
                    const authEvent = await createBlossomAuthEvent("list", pubkey);
                    const filesRes = await fetchBlossomFiles(
                      server,
                      pubkey,
                      authEvent
                    );
                    if (filesRes.status === "success") {
                      setFiles(filesRes.files);
                    } else {
                      setError(filesRes.error);
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : String(e));
                  }
                }}
                files={files}
                error={error}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-muted-foreground">
        Made with 💜 by{" "}
        <a
          href="https://unsigned.in/"
          target="_blank"
          rel="noopener"
          className="underline hover:text-purple-400 transition"
        >
          Team Unsigned
        </a>
      </footer>
    </div>
  );
}
