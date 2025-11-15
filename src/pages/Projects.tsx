import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, LogOut, Code, Globe, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

interface Project {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  is_public: boolean;
  remix_count: number;
  created_at: string;
  updated_at: string;
}

const Projects = () => {
  const { user, signOut } = useAuth();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProjects();
  }, [user, navigate]);

  const loadProjects = async () => {
    try {
      // Load user's projects
      const { data: myData, error: myError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (myError) throw myError;
      setMyProjects(myData || []);

      // Load public projects
      const { data: publicData, error: publicError } = await supabase
        .from('projects')
        .select('*')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (publicError) throw publicError;
      setPublicProjects(publicData || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemixProject = async (project: Project) => {
    try {
      // Load project files
      const { data: files, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', project.id);

      if (filesError) throw filesError;

      // Create new project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user?.id,
          name: `${project.name} (Remix)`,
          description: project.description,
          prompt: project.prompt,
          is_public: false,
          original_project_id: project.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Copy files to new project
      if (files && files.length > 0) {
        const newFiles = files.map(file => ({
          project_id: newProject.id,
          name: file.name,
          content: file.content,
          language: file.language,
        }));

        const { error: filesInsertError } = await supabase
          .from('project_files')
          .insert(newFiles);

        if (filesInsertError) throw filesInsertError;
      }

      // Increment remix count
      await supabase
        .from('projects')
        .update({ remix_count: project.remix_count + 1 })
        .eq('id', project.id);

      toast({
        title: 'Success!',
        description: 'Project remixed successfully',
      });

      navigate(`/builder/${newProject.id}`);
    } catch (error) {
      console.error('Error remixing project:', error);
      toast({
        title: 'Error',
        description: 'Failed to remix project',
        variant: 'destructive',
      });
    }
  };

  const ProjectCard = ({ project, showRemix }: { project: Project; showRemix: boolean }) => (
    <Card className="p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer group">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description || project.prompt}
            </p>
          </div>
          {project.is_public && (
            <Globe className="w-4 h-4 text-primary ml-2" />
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/builder/${project.id}`)}
            className="flex-1"
          >
            <Code className="w-4 h-4 mr-2" />
            Open
          </Button>
          {showRemix && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemixProject(project)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Remix
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
          {project.remix_count > 0 && (
            <span>{project.remix_count} remixes</span>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <h1 className="text-xl font-bold">My Projects</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/')} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button onClick={signOut} variant="ghost">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="my-projects" className="w-full">
          <TabsList>
            <TabsTrigger value="my-projects">My Projects ({myProjects.length})</TabsTrigger>
            <TabsTrigger value="explore">Explore Public ({publicProjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading your projects...
              </div>
            ) : myProjects.length === 0 ? (
              <div className="text-center py-12">
                <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground mb-4">No projects yet</p>
                <Button onClick={() => navigate('/')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} showRemix={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="explore" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading public projects...
              </div>
            ) : publicProjects.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No public projects available yet
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} showRemix={true} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Projects;
