import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ActivityLog from "@/components/builder/ActivityLog";
import BuilderInput from "@/components/builder/BuilderInput";
import BuilderPreview from "@/components/builder/BuilderPreview";
import BuildErrorModal from "@/components/builder/BuildErrorModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ActivityItem {
  id: string;
  type: 'thought' | 'read' | 'edited' | 'deployed' | 'error';
  message: string;
  fileName?: string;
  details?: string;
  timestamp: number;
}

const Builder = () => {
  const location = useLocation();
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const initialPrompt = location.state?.prompt || "";
  const [files, setFiles] = useState<Array<{ name: string; content: string; status: 'creating' | 'complete' }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentView, setCurrentView] = useState<'preview' | 'code' | 'analytics'>('preview');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId || null);
  const [projectName, setProjectName] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [buildError, setBuildError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for build errors from console
    const originalError = console.error;
    console.error = (...args: any[]) => {
      originalError(...args);
      
      // Check if it's a build error
      const errorStr = args.join(' ');
      if (errorStr.includes('Parse error') || 
          errorStr.includes('Typecheck Error') || 
          errorStr.includes('Build error') ||
          errorStr.includes('CSS') ||
          errorStr.includes('error TS')) {
        setBuildError(errorStr);
      }
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (projectId) {
      loadProject(projectId);
    }
  }, [user, projectId, navigate]);

  const loadProject = async (id: string) => {
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;

      setProjectName(project.name);

      const { data: projectFiles, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', id);

      if (filesError) throw filesError;

      setFiles(projectFiles.map(f => ({
        name: f.name,
        content: f.content,
        status: 'complete' as const,
      })));
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      });
    }
  };

  const saveProject = async (projectFiles: Array<{ name: string; content: string }> = files) => {
    if (!user) return;

    try {
      let id = currentProjectId;

      if (!id) {
        // Create new project
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectName || 'Untitled Project',
            prompt: initialPrompt,
            is_public: false,
          })
          .select()
          .single();

        if (projectError) throw projectError;
        id = newProject.id;
        setCurrentProjectId(id);
        navigate(`/builder/${id}`, { replace: true });
      }

      // Save files
      if (id && projectFiles.length > 0) {
        // Delete existing files
        await supabase.from('project_files').delete().eq('project_id', id);

        // Insert new files
        const filesToInsert = projectFiles.map(f => ({
          project_id: id,
          name: f.name,
          content: f.content,
          language: f.name.split('.').pop() || 'text',
        }));

        const { error: filesError } = await supabase
          .from('project_files')
          .insert(filesToInsert);

        if (filesError) throw filesError;

        toast({
          title: 'Saved',
          description: 'Project saved successfully',
        });
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error',
        description: 'Failed to save project',
        variant: 'destructive',
      });
    }
  };

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    setActivities(prev => [...prev, {
      id: Date.now().toString(),
      type: 'thought',
      message: `User requested: ${prompt}`,
      timestamp: Date.now()
    }]);

    try {
      const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-website`;
      
      const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
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
              setActivities(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                type: 'thought',
                message: parsed.message,
                timestamp: Date.now()
              }]);
            } else if (parsed.type === 'file_start') {
              const file = { name: parsed.fileName, content: '', status: 'creating' as const };
              collectedFiles.push(file);
              setFiles([...collectedFiles]);
              
              setActivities(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                type: 'read',
                message: 'Reading file',
                fileName: parsed.fileName,
                timestamp: Date.now()
              }]);
            } else if (parsed.type === 'file') {
              const fileIndex = collectedFiles.findIndex(f => f.name === parsed.data.name);
              if (fileIndex !== -1) {
                collectedFiles[fileIndex] = { ...parsed.data, status: 'creating' as const };
              } else {
                collectedFiles.push({ ...parsed.data, status: 'creating' as const });
              }
              setFiles([...collectedFiles]);
            } else if (parsed.type === 'file_complete') {
              const fileIndex = collectedFiles.findIndex(f => f.name === parsed.fileName);
              if (fileIndex !== -1) {
                collectedFiles[fileIndex] = { ...collectedFiles[fileIndex], status: 'complete' as const };
                setFiles([...collectedFiles]);
                
                setActivities(prev => [...prev, {
                  id: Date.now().toString() + Math.random(),
                  type: 'edited',
                  message: 'File created',
                  fileName: parsed.fileName,
                  timestamp: Date.now()
                }]);
              }
            } else if (parsed.type === 'complete') {
              const completedFiles = collectedFiles.map(f => ({ ...f, status: 'complete' as const }));
              setFiles(completedFiles);
              
              setActivities(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                type: 'deployed',
                message: 'Website generated successfully',
                timestamp: Date.now()
              }]);
              
              // Auto-save
              saveProject(completedFiles);
            } else if (parsed.type === 'error') {
              setBuildError(parsed.message);
              setActivities(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                type: 'error',
                message: parsed.message,
                details: parsed.message,
                timestamp: Date.now()
              }]);
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
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate website',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <ActivityLog activities={activities} isGenerating={isGenerating} />
      
      <div className="flex-1 flex flex-col relative">
        <BuilderPreview
          files={files}
          currentView={currentView}
          projectId={currentProjectId}
          onViewChange={setCurrentView}
          onFilesChange={setFiles}
          onSave={async () => {
            await saveProject(files);
          }}
        />
        
        <BuilderInput
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          initialPrompt={initialPrompt}
        />
      </div>

      <BuildErrorModal
        error={buildError}
        onClose={() => setBuildError(null)}
        onTryFix={() => {
          setBuildError(null);
          // Could trigger auto-fix logic here
        }}
      />
    </div>
  );
};

export default Builder;
