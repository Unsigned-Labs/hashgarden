import { Button } from "@/components/ui/button";
import { KeyRound, Puzzle, ShieldCheck } from "lucide-react";

interface LoginOptionsProps {
  onLogin: (provider: "nip07" | "nip46") => void;
}

export default function LoginOptions({ onLogin }: LoginOptionsProps) {
  return (
    <div className="w-full max-w-md mx-auto bg-card/70 backdrop-blur border border-border rounded-2xl p-8 shadow-sm">
      <div className="flex items-center justify-center gap-2 mb-6">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">Login using nostr</p>
      </div>
      <div className="space-y-3">
        <Button className="w-full h-11" onClick={() => onLogin("nip07")}> 
          <Puzzle className="mr-2" />
          Continue with browser extension (NIP-07)
        </Button>
        <Button variant="outline" className="w-full h-11" onClick={() => onLogin("nip46")}> 
          <KeyRound className="mr-2" />
          Continue with Bunker (NIP-46)
        </Button>
      </div>
    </div>
  );
}
