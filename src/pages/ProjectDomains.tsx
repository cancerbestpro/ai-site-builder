import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Copy, Check, ExternalLink, Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProjectDomains = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [customDomain, setCustomDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      loadProject();
      loadDomains();
    }
  }, [user, id]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Error",
        description: "Failed to load project",
        variant: "destructive",
      });
    }
  };

  const loadDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('project_domains')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const publishProject = async () => {
    if (!project) return;
    
    setIsLoading(true);
    try {
      // Update project as published
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          published_at: new Date().toISOString(),
          is_public: true 
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create subdomain domain entry
      const subdomainName = `${project.subdomain}.aibuilder.app`;
      const { error: domainError } = await supabase
        .from('project_domains')
        .insert({
          project_id: id,
          domain_type: 'subdomain',
          domain_name: subdomainName,
          is_primary: true,
          status: 'active'
        });

      if (domainError && domainError.code !== '23505') throw domainError;

      toast({
        title: "Published!",
        description: `Your website is now live at ${subdomainName}`,
      });
      
      loadProject();
      loadDomains();
    } catch (error: any) {
      console.error('Error publishing project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to publish project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomDomain = async () => {
    if (!customDomain.trim()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('project_domains')
        .insert({
          project_id: id,
          domain_type: 'custom',
          domain_name: customDomain.toLowerCase(),
          status: 'verifying',
          verification_token: crypto.randomUUID()
        });

      if (error) throw error;

      toast({
        title: "Domain Added",
        description: "Please configure your DNS settings",
      });
      
      setCustomDomain("");
      loadDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add custom domain",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeDomain = async (domainId: string) => {
    try {
      const { error } = await supabase
        .from('project_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;

      toast({
        title: "Removed",
        description: "Domain has been removed",
      });
      
      loadDomains();
    } catch (error) {
      console.error('Error removing domain:', error);
      toast({
        title: "Error",
        description: "Failed to remove domain",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Domain copied to clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'verifying': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const freeSubdomain = domains.find(d => d.domain_type === 'subdomain');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground">Manage your website domains</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/builder/${id}`)}>
            Back to Editor
          </Button>
        </div>

        {/* Free Subdomain Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Free Subdomain
            </CardTitle>
            <CardDescription>
              Your website is available at a free subdomain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {freeSubdomain ? (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(freeSubdomain.status)}>
                    {freeSubdomain.status}
                  </Badge>
                  <span className="font-mono text-sm">{freeSubdomain.domain_name}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(`https://${freeSubdomain.domain_name}`)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(`https://${freeSubdomain.domain_name}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Publish your website to get a free subdomain
                </p>
                <Button onClick={publishProject} disabled={isLoading}>
                  {isLoading ? "Publishing..." : "Publish Website"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Domains Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Custom Domains
            </CardTitle>
            <CardDescription>
              Connect your own domain to your website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomDomain()}
              />
              <Button onClick={addCustomDomain} disabled={isLoading || !customDomain.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </div>

            {domains.filter(d => d.domain_type === 'custom').length > 0 ? (
              <div className="space-y-3">
                {domains.filter(d => d.domain_type === 'custom').map((domain) => (
                  <div key={domain.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(domain.status)}>
                          {domain.status}
                        </Badge>
                        <span className="font-mono text-sm">{domain.domain_name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeDomain(domain.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {domain.status === 'verifying' && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-2">DNS Configuration Required:</p>
                          <div className="space-y-1 text-xs">
                            <p>Add these DNS records at your domain registrar:</p>
                            <code className="block bg-muted p-2 rounded mt-2">
                              A Record: @ → 185.158.133.1<br/>
                              A Record: www → 185.158.133.1<br/>
                              TXT Record: _verify → {domain.verification_token}
                            </code>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No custom domains added yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDomains;
