import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect } from "react";

interface BuildErrorModalProps {
  error: string | null;
  onClose: () => void;
  onTryFix?: () => void;
}

const BuildErrorModal = ({ error, onClose, onTryFix }: BuildErrorModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && error) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [error, onClose]);

  if (!error) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-destructive rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-destructive/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Build Error</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Error Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <pre className="text-sm font-mono text-destructive whitespace-pre-wrap break-words">
              {error}
            </pre>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Click outside, press <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>, or fix the code to dismiss.</p>
            <p className="mt-2">You can also disable this overlay by setting <code className="bg-muted px-1 rounded">server.overlay</code> to <code className="bg-muted px-1 rounded">false</code> in vite.config.ts.</p>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onTryFix && (
            <Button onClick={onTryFix}>
              Try to Fix Automatically
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildErrorModal;
