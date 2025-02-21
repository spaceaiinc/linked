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


INSERT INTO "public"."companies" ("id", "updated_at", "name", "domain", "plan") 
VALUES ('b2f62c00-a76c-4dd3-bc44-b1ce238cb512', '2025-02-21 06:21:33.752068+00', 'サービス運営事務局', 'spaceai.jp', '0');
