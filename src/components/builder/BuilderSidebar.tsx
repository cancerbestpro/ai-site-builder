import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileCode, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FileItem from "./FileItem";
import StreamingMessage from "./StreamingMessage";
import logo from "@/assets/logo.png";

interface BuilderSidebarProps {
  files: Array<{ name: string; content: string; status: 'creating' | 'complete' }>;
  isGenerating: boolean;
  initialPrompt: string;
  projectName: string;
  onFilesUpdate: (files: Array<{ name: string; content: string; status: 'creating' | 'complete' }>) => void;
  onGeneratingChange: (generating: boolean) => void;
  onSave: () => void;
  onProjectNameChange: (name: string) => void;
}

const BuilderSidebar = ({ 
  files, 
  isGenerating, 
  initialPrompt,
  projectName,
  onFilesUpdate, 
  onGeneratingChange,
  onSave,
  onProjectNameChange,
}: BuilderSidebarProps) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    onGeneratingChange(true);
    const userMessage = prompt;
    setPrompt("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-website', {
        body: { prompt: userMessage }
      });

      if (error) throw error;

      if (data?.files && Array.isArray(data.files)) {
        // Show files being created with shimmer effect
        const newFiles: Array<{ name: string; content: string; status: 'creating' | 'complete' }> = [];
        for (let i = 0; i < data.files.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 600));
          const file = data.files[i];
          newFiles.push({ ...file, status: 'creating' as const });
          onFilesUpdate([...newFiles]);
        }

        // Mark all files as complete
        await new Promise(resolve => setTimeout(resolve, 800));
        onFilesUpdate(data.files.map((f: any) => ({ ...f, status: 'complete' as const })));

        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.message || 'Website generated successfully! You can now preview and edit your website.' 
        }]);
      } else {
        throw new Error('Invalid response format from AI');
      }

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate website",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating your website. Please try again.'
      }]);
    } finally {
      onGeneratingChange(false);
    }
  };

  return (
    <div className="w-[400px] border-r border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        <img src={logo} alt="Logo" className="w-8 h-8" />
        <h2 className="font-semibold text-lg">AI Website Builder</h2>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-4 py-2 max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-foreground'
              }`}>
                {msg.role === 'assistant' && isGenerating && idx === messages.length - 1 ? (
                  <StreamingMessage content={msg.content} />
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Files Section */}
        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileCode className="w-4 h-4" />
              <span>Generated Files</span>
            </div>
            {files.map((file, idx) => (
              <FileItem key={idx} file={file} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe the website you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] resize-none"
            disabled={isGenerating}
          />
          <Button 
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
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

export default BuilderSidebar;
