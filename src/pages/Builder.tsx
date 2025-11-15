import { useState } from "react";
import { useLocation } from "react-router-dom";
import BuilderSidebar from "@/components/builder/BuilderSidebar";
import BuilderPreview from "@/components/builder/BuilderPreview";

const Builder = () => {
  const location = useLocation();
  const initialPrompt = location.state?.prompt || "";
  const [files, setFiles] = useState<Array<{ name: string; content: string; status: 'creating' | 'complete' }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'preview' | 'code' | 'analytics'>('preview');

  return (
    <div className="flex h-screen w-full bg-background">
      <BuilderSidebar 
        files={files}
        isGenerating={isGenerating}
        initialPrompt={initialPrompt}
        onFilesUpdate={setFiles}
        onGeneratingChange={setIsGenerating}
      />
      <BuilderPreview 
        files={files}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
    </div>
  );
};

export default Builder;
