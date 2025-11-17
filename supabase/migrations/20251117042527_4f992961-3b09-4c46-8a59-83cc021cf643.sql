-- Fix security: Update function to set search_path
CREATE OR REPLACE FUNCTION generate_project_subdomain()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;