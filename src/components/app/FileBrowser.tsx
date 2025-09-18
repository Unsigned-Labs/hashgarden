import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Grid2x2, Hash, List, Server } from "lucide-react";
import { type BlossomFile } from "@/lib/blossom-files";
import { FilePreview } from "./FilePreview"

type ViewMode = "list" | "grid";

interface FileBrowserProps {
  servers: string[];
  selectedServer: string | null;
  onSelectServer: (server: string) => void;
  files: BlossomFile[];
  error: string | null;
  isLoading?: boolean;
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export default function FileBrowser({
  servers,
  selectedServer,
  onSelectServer,
  files: fileList,
  error,
  isLoading = false,
}: FileBrowserProps) {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedFile, setSelectedFile] = useState<BlossomFile | null>(null);
  const pageSize = viewMode === "list" ? 10 : 12;

  const handleFileClick = (file: BlossomFile) => {
    setSelectedFile(file);
  };

  const paginatedFiles = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return fileList.slice(start, end);
  }, [fileList, page, pageSize]);

  const totalPages = Math.ceil(fileList.length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Select a server
          </h2>
        </div>
        <Select
          value={selectedServer || ""}
          onValueChange={(value: string) => {
            onSelectServer(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[260px]">
            <SelectValue placeholder="Choose server" />
          </SelectTrigger>
          <SelectContent>
            {servers.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="size-8"
          >
            <List className="size-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="size-8"
          >
            <Grid2x2 className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-900/20 border border-red-900 text-red-400 rounded-lg p-4 text-sm">
          {error}
        </div>
      ) : isLoading ? (
        <div className="text-center py-8 text-muted-foreground animate-pulse">
          Loading...
        </div>
      ) : fileList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No files found
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {viewMode === "list" ? (
            <>
              <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground bg-muted/40 border-b">
                <div className="col-span-6">Hash</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-4">Created At</div>
              </div>
              <div className="divide-y">
                {paginatedFiles.map((file) => (
                  <div
                    key={file.sha256}
                    onClick={() => handleFileClick(file)}
                    className="grid grid-cols-12 px-4 py-3 items-center hover:bg-accent/40 transition-colors cursor-pointer"
                  >
                    <div className="col-span-6 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <span
                        className="font-mono truncate hover:text-foreground"
                        title={file.sha256}
                      >
                        {file.sha256.slice(0, 16)}...
                      </span>
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </div>
                    <div className="col-span-4 text-sm text-muted-foreground">
                      {formatDate(file.uploaded)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
              {paginatedFiles.map((file) => (
                <div
                  key={file.sha256}
                  onClick={() => handleFileClick(file)}
                  className="rounded-lg border bg-card hover:bg-accent/40 transition-colors cursor-pointer"
                >
                  <FilePreview file={file} showHash className="h-full" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog 
        open={selectedFile !== null} 
        onOpenChange={(open) => !open && setSelectedFile(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <FilePreview file={selectedFile} className="p-0" />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hash:</span>
                  <span className="font-mono text-sm">{selectedFile.sha256.substring(0, 16)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Size:</span>
                  <span className="text-sm">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploaded:</span>
                  <span className="text-sm">{formatDate(selectedFile.uploaded)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm">{selectedFile.type || "Unknown"}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}