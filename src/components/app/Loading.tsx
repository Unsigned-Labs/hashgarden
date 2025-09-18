import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full max-w-md mx-auto bg-card/70 backdrop-blur border border-border rounded-2xl p-8 shadow-sm text-center">
      <div className="flex items-center justify-center mb-4">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
      <h3 className="text-lg font-semibold">Preparing your garden</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Loading your relays and fetching your blossom servers. This usually takes a moment.
      </p>
    </div>
  );
}
