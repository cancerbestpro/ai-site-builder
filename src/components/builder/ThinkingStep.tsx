import { Loader2 } from "lucide-react";

interface ThinkingStepProps {
  message: string;
}

const ThinkingStep = ({ message }: ThinkingStepProps) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10">
      <Loader2 className="w-4 h-4 text-primary animate-spin" />
      <p className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-shimmer-text">
        {message}
      </p>
    </div>
  );
};

export default ThinkingStep;
