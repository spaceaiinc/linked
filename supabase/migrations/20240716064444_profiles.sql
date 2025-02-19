-- Create the profiles table
create table
  public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    username TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NULL,
    avatar_url TEXT NULL,
    first_name TEXT NULL,
    last_name TEXT NULL,
    type SMALLINT DEFAULT '0'::SMALLINT,
    status SMALLINT DEFAULT '0'::SMALLINT,
    is_superuser SMALLINT DEFAULT '0'::SMALLINT,
    credits SMALLINT null default '20'::SMALLINT,
    constraint profiles_username_key unique (username),
    constraint username_length check ((char_length(username) >= 3))
  ) tablespace pg_default;

-- Create indexes for better performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_updated_at ON public.profiles(updated_at);
CREATE INDEX idx_profiles_credits ON public.profiles(credits);

-- Enable Row Level Security
CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Link authenticated users to profiles table
create function public.handle_new_user()
returns trigger as $$
begin
  -- 新しいcompany_idを生成
  new_company_id := extensions.UUID_generate_v4();
  insert into public.companies (id, name)
  values (new_company_id, new.raw_user_meta_data->>'full_name');
  insert into public.profiles (id, company_id, full_name, avatar_url, username, email)
  values (new.id, new_company_id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', extensions.UUID_generate_v4(), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security
alter table profiles
  enable row level security;

create policy "Users can select their own profile." on profiles
  for select using (exists (
    select 1
    from profiles as sub_profiles
    where sub_profiles.id = auth.uid()
    and sub_profiles.company_id = profiles.company_id
  ));

create policy "Users can insert their own profile." on profiles
  for insert with check (exists (
    select 1
    from profiles as sub_profiles
    where sub_profiles.id = auth.uid()
    and sub_profiles.company_id = profiles.company_id
  ));

create policy "Users can update own profile." on profiles
  for update using (exists (
    select 1
    from profiles as sub_profiles
    where sub_profiles.id = auth.uid()
    and sub_profiles.company_id = profiles.company_id
  ));


  CREATE POLICY "Users can select their own company." ON companies
  FOR SELECT USING (exists (
    select 1
    from profiles as sub_profiles
    where sub_profiles.id = auth.uid()
    and sub_profiles.company_id = id
  ));

CREATE POLICY "Users can insert their own company." ON companies
  FOR SELECT USING (exists (
    select 1
    from profiles as sub_profiles
    where sub_profiles.id = auth.uid()
    and sub_profiles.company_id = id
  ));


CREATE POLICY "Users can update their own company." ON companies
  FOR SELECT USING (exists (
    select 1
    from profiles as sub_profiles
    where sub_profiles.id = auth.uid()
    and sub_profiles.company_id = id
  ));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;