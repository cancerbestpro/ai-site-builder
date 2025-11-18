import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileCode, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FileItem from "./FileItem";
import StreamingMessage from "./StreamingMessage";
import ThinkingStep from "./ThinkingStep";
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
  const [thinkingSteps, setThinkingSteps] = useState<Array<{ id: string; message: string }>>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    onGeneratingChange(true);
    const userMessage = prompt;
    setPrompt("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setThinkingSteps([]);
    
    try {
      const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-website`;
      
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start generation');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const collectedFiles: Array<{ name: string; content: string; status: 'creating' | 'complete' }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'thinking') {
              // Add thinking step with shimmer effect
              setThinkingSteps(prev => [...prev, { id: Date.now().toString(), message: parsed.message }]);
            } else if (parsed.type === 'file_start') {
              // File is starting to be created
              const file = { name: parsed.fileName, content: '', status: 'creating' as const };
              collectedFiles.push(file);
              onFilesUpdate([...collectedFiles]);
            } else if (parsed.type === 'file') {
              // Update file with actual content
              const fileIndex = collectedFiles.findIndex(f => f.name === parsed.data.name);
              if (fileIndex !== -1) {
                collectedFiles[fileIndex] = { ...parsed.data, status: 'creating' as const };
              } else {
                collectedFiles.push({ ...parsed.data, status: 'creating' as const });
              }
              onFilesUpdate([...collectedFiles]);
            } else if (parsed.type === 'file_complete') {
              // Mark specific file as complete
              const fileIndex = collectedFiles.findIndex(f => f.name === parsed.fileName);
              if (fileIndex !== -1) {
                collectedFiles[fileIndex] = { ...collectedFiles[fileIndex], status: 'complete' as const };
                onFilesUpdate([...collectedFiles]);
              }
            } else if (parsed.type === 'complete') {
              // Mark all files as complete
              const completedFiles = collectedFiles.map(f => ({ ...f, status: 'complete' as const }));
              onFilesUpdate(completedFiles);
              setMessages(prev => [...prev, { role: 'assistant', content: parsed.message }]);
              setThinkingSteps([]);
            } else if (parsed.type === 'error') {
              setThinkingSteps([]);
              throw new Error(parsed.message);
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
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
