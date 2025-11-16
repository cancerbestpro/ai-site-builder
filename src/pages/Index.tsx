import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, FolderOpen, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Auto-submit if prompt comes from navigation state
  useEffect(() => {
    if (location.state?.prompt && user) {
      setPrompt(location.state.prompt);
      // Auto-navigate to builder with prompt
      setTimeout(() => {
        navigate('/builder', { state: { prompt: location.state.prompt }, replace: true });
      }, 100);
    }
  }, [location.state, user, navigate]);

  const handleCreateWebsite = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a website",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please describe the website you want to create",
        variant: "destructive",
      });
      return;
    }

    navigate('/builder', { state: { prompt } });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  return (
    <div className="min-h-screen hero-gradient-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AI Website Builder" className="w-8 h-8" />
            <h1 className="text-xl font-bold">AI Website Builder</h1>
          </div>
          <div className="flex gap-2">
            {user ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/projects')}
                  className="gap-2 bg-card/50 backdrop-blur-sm"
                >
                  <FolderOpen className="w-4 h-4" />
                  My Projects
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="gap-2 bg-card/50 backdrop-blur-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-3xl space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30 shadow-lg shadow-primary/20">
                <Sparkles className="w-16 h-16 text-primary" />
              </div>
            </div>
            <h2 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
              Create Your Dream Website
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe your vision, and our AI will generate a beautiful, professional React website in seconds.
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl shadow-primary/5">
            <div className="space-y-4">
              <Textarea
                placeholder="Describe the website you want to create... 
e.g., 'A modern landing page for a coffee shop with a hero section, menu, and contact form'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && prompt.trim()) {
                    handleCreateWebsite();
                  }
                }}
                className="min-h-[200px] resize-none text-lg bg-background/50 border-border/50"
              />
              <Button 
                onClick={handleCreateWebsite}
                size="lg"
                className="w-full text-lg h-14 gap-2 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
                disabled={!prompt.trim()}
              >
                <Sparkles className="w-5 h-5" />
                Generate Website
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Press Ctrl+Enter to generate quickly
              </p>
            </div>
          </div>

          {!user && (
            <p className="text-center text-sm text-muted-foreground">
              Sign in to save and manage your generated websites
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
