import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Code, Zap, Rocket } from "lucide-react";
import logo from "@/assets/logo.png";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleCreateWebsite = () => {
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateWebsite();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-3xl space-y-8 animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center space-y-6">
          <img src={logo} alt="AI Website Builder" className="w-20 h-20 mx-auto" />
          <div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Build Websites with AI
            </h1>
            <p className="text-xl text-muted-foreground">
              Transform your ideas into stunning websites in seconds
            </p>
          </div>
        </div>

        {/* Main Input */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
          <div className="relative bg-card border border-border rounded-2xl p-6 shadow-elegant">
            <Textarea
              placeholder="Describe the website you want to create...&#10;&#10;Example: 'Create a modern portfolio website with a hero section, about page, and contact form'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[150px] text-base resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">Press Enter to create</p>
              <Button 
                onClick={handleCreateWebsite}
                disabled={!prompt.trim()}
                size="lg"
                className="gap-2 bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              >
                <Sparkles className="w-5 h-5" />
                Create Website
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Zap, title: "Lightning Fast", desc: "Generate websites in seconds" },
            { icon: Code, title: "Clean Code", desc: "Production-ready HTML, CSS & JS" },
            { icon: Rocket, title: "Deploy Instantly", desc: "Publish with one click" },
          ].map((feature, idx) => (
            <div 
              key={idx}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              <feature.icon className="w-10 h-10 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
