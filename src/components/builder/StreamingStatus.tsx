import { Loader2, Check, AlertCircle } from "lucide-react";

interface StreamingStatusProps {
  status: 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';
  message?: string;
}

const StreamingStatus = ({ status, message }: StreamingStatusProps) => {
  if (status === 'idle') return null;

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm">
      {status === 'analyzing' && (
        <>
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium">Analyzing request...</p>
            <p className="text-xs text-muted-foreground">Understanding what you want to build</p>
          </div>
        </>
      )}
      
      {status === 'generating' && (
        <>
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <div>
            <p className="text-sm font-medium">Generating React components...</p>
            <p className="text-xs text-muted-foreground">{message || 'Creating your website'}</p>
          </div>
        </>
      )}
      
      {status === 'complete' && (
        <>
          <Check className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-500">Generation complete!</p>
            <p className="text-xs text-muted-foreground">{message || 'Your website is ready'}</p>
          </div>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Error</p>
            <p className="text-xs text-muted-foreground">{message || 'Something went wrong'}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default StreamingStatus;