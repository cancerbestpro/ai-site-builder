-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

-- Create profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  prompt text not null,
  thumbnail_url text,
  is_public boolean default false,
  remix_count integer default 0,
  original_project_id uuid references public.projects(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.projects enable row level security;

-- Create projects policies
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can view public projects"
  on public.projects for select
  using (is_public = true);

create policy "Users can create their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Create project_files table
create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  content text not null,
  language text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(project_id, name)
);

alter table public.project_files enable row level security;

-- Create project_files policies
create policy "Users can view files of their own projects"
  on public.project_files for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can view files of public projects"
  on public.project_files for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.is_public = true
    )
  );

create policy "Users can create files in their own projects"
  on public.project_files for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update files in their own projects"
  on public.project_files for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete files in their own projects"
  on public.project_files for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Create function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger handle_project_files_updated_at
  before update on public.project_files
  for each row execute procedure public.handle_updated_at();

-- Create index for better performance
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_is_public on public.projects(is_public);
create index idx_project_files_project_id on public.project_files(project_id);
