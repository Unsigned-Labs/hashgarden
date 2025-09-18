import { FileIcon, FileImage, FileText, FileVideo, Hash } from "lucide-react";
import { type BlossomFile } from "@/lib/blossom-files";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  file: BlossomFile;
  className?: string;
  showHash?: boolean;
}

const commonIconProps = {
  className: "w-8 h-8 text-muted-foreground"
};

export function FilePreview({ file, className, showHash = false }: FilePreviewProps) {
  const getIcon = () => {
    // Basic MIME type detection
    if (file.type.startsWith("image/")) {
      return <FileImage {...commonIconProps} />;
    }
    if (file.type.startsWith("video/")) {
      return <FileVideo {...commonIconProps} />;
    }
    if (file.type === "application/pdf") {
      return <FileText {...commonIconProps} />;
    }
    return <FileIcon {...commonIconProps} />;
  };

  return (
    <div className={cn("flex flex-col items-center gap-2 p-4", className)}>
      {getIcon()}
      <div className="text-sm text-center space-y-1">
        {showHash && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="w-3 h-3" />
            <span className="font-mono truncate" title={file.sha256}>
              {file.sha256.slice(0, 8)}...
            </span>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {file.type || "Unknown type"}
        </div>
      </div>
    </div>
  );
}