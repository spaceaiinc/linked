-- Create the profiles table
create table
  public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    username TEXT NOT NULL UNIQUE CHECK (char_length(username) >= 3),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT NOT NULL DEFAULT '',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    type SMALLINT NOT NULL DEFAULT 0::SMALLINT,
    status SMALLINT NOT NULL DEFAULT 0::SMALLINT,
    role SMALLINT NOT NULL DEFAULT 0::SMALLINT,
    is_superuser SMALLINT NOT NULL DEFAULT 0::SMALLINT,
    credits SMALLINT NOT NULL default 20::SMALLINT
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
declare
  new_company_id UUID;
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

create policy "Users can select their own profile" on profiles
  for select using (auth.uid() = id);;

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;