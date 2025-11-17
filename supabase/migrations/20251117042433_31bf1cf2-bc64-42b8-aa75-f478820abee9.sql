-- Create domains table for custom domain management
CREATE TABLE IF NOT EXISTS public.project_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  domain_type TEXT NOT NULL CHECK (domain_type IN ('subdomain', 'custom')),
  domain_name TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'verifying')),
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
  verification_token TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_domains ENABLE ROW LEVEL SECURITY;

-- Policies for domains
CREATE POLICY "Users can view domains of their own projects"
ON public.project_domains FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_domains.project_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can view domains of public projects"
ON public.project_domains FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_domains.project_id
  AND projects.is_public = true
));

CREATE POLICY "Users can create domains for their own projects"
ON public.project_domains FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_domains.project_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update domains of their own projects"
ON public.project_domains FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_domains.project_id
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete domains of their own projects"
ON public.project_domains FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = project_domains.project_id
  AND projects.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_project_domains_updated_at
BEFORE UPDATE ON public.project_domains
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add published_at field to projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Function to generate unique subdomain
CREATE OR REPLACE FUNCTION generate_project_subdomain()
RETURNS TRIGGER AS $$
DECLARE
  base_subdomain TEXT;
  final_subdomain TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate base subdomain from project name
  base_subdomain := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_subdomain := trim(both '-' from base_subdomain);
  
  -- Ensure subdomain is not empty
  IF base_subdomain = '' THEN
    base_subdomain := 'project';
  END IF;
  
  final_subdomain := base_subdomain;
  
  -- Check for uniqueness and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.projects WHERE subdomain = final_subdomain) LOOP
    counter := counter + 1;
    final_subdomain := base_subdomain || '-' || counter;
  END LOOP;
  
  NEW.subdomain := final_subdomain;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate subdomain on project creation
CREATE TRIGGER generate_subdomain_trigger
BEFORE INSERT ON public.projects
FOR EACH ROW
WHEN (NEW.subdomain IS NULL)
EXECUTE FUNCTION generate_project_subdomain();