-- Create the profiles table
create table
  public.companies (
    id uuid NOT NULL PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    name TEXT NOT NULL,
    domain TEXT NOT NULL DEFAULT ''::TEXT,
    plan SMALLINT NOT NULL DEFAULT 0::SMALLINT
  ) tablespace pg_default;

-- Create indexes for better performance
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_domain ON public.companies(domain);