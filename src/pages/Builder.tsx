import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BuilderSidebar from "@/components/builder/BuilderSidebar";
import BuilderPreview from "@/components/builder/BuilderPreview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const handleFilesUpdate = (newFiles: Array<{ name: string; content: string; status: 'creating' | 'complete' }>) => {
    setFiles(newFiles);
    
    // Auto-save when files are complete
    const completeFiles = newFiles.filter(f => f.status === 'complete');
    if (completeFiles.length > 0 && completeFiles.length === newFiles.length) {
      saveProject(completeFiles);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <BuilderSidebar 
        files={files}
        isGenerating={isGenerating}
        initialPrompt={initialPrompt}
        onFilesUpdate={handleFilesUpdate}
        onGeneratingChange={setIsGenerating}
        onSave={() => saveProject(files)}
        projectName={projectName}
        onProjectNameChange={setProjectName}
      />
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
    </div>
  );
};

export default Builder;
