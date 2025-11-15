import { FileCode, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileItemProps {
  file: {
    name: string;
    content: string;
    status: 'creating' | 'complete';
  };
}

const FileItem = ({ file }: FileItemProps) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-all relative overflow-hidden",
        file.status === 'creating' && "animate-pulse"
      )}
    >
      {file.status === 'creating' && (
        <div className="absolute inset-0 animate-shimmer" />
      )}
      
      <div className={cn(
        "p-2 rounded-md relative z-10",
        file.status === 'creating' ? "bg-primary/10" : "bg-accent/10"
      )}>
        <FileCode className={cn(
          "w-4 h-4",
          file.status === 'creating' ? "text-primary" : "text-accent"
        )} />
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {file.status === 'creating' ? 'Creating...' : 'Complete'}
        </p>
      </div>
      
      <div className="relative z-10">
        {file.status === 'creating' ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Check className="w-4 h-4 text-accent" />
        )}
      </div>
    </div>
  );
};

export default FileItem;
