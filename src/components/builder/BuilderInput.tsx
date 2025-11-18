import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";

interface BuilderInputProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  initialPrompt?: string;
}

const BuilderInput = ({ onGenerate, isGenerating, initialPrompt = "" }: BuilderInputProps) => {
  const [prompt, setPrompt] = useState(initialPrompt);

  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt);
      setPrompt("");
    }
  };

  return (
    <div className="fixed bottom-0 left-80 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-10">
      <div className="max-w-4xl mx-auto space-y-2">
        <Textarea
          placeholder="Describe the website you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="min-h-[100px] resize-none"
          disabled={isGenerating}
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Website
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BuilderInput;
