--
-- Name: provider_daily_insights; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_daily_insights (
  id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  follower_count INTEGER NOT NULL DEFAULT 0,
  connections_count INTEGER NOT NULL DEFAULT 0
);

CREATE TRIGGER set_updated_at_provider_daily_insights BEFORE
UPDATE ON public.provider_daily_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX provider_daily_insights_company_id_index ON public.provider_daily_insights (company_id);
CREATE INDEX provider_daily_insights_provider_id_index ON public.provider_daily_insights (provider_id);
--
-- Name: provider_daily_insights providers can select their own provider_daily_insights; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can select provider_daily_insights their company has" ON public.provider_daily_insights FOR
SELECT USING (
    company_id = (
      select company_id
      from public.profiles
      where id = auth.uid()
    )
  );
-- Name: provider_daily_insights; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_daily_insights ENABLE ROW LEVEL SECURITY;