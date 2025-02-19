
--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    type SMALLINT NOT NULL,
    status SMALLINT NOT NULL,
    account_id TEXT NOT NULL,
    public_identifier TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    like_target_account_ids TEXT[],
    like_target_account_hours SMALLINT[],
    check_reaction_hours SMALLINT[]
);

CREATE TRIGGER set_updated_at_providers
BEFORE UPDATE ON public.providers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


CREATE INDEX providers_company_id_index ON public.providers (company_id);
CREATE INDEX providers_user_id_index ON public.providers (user_id);

--
-- Name: providers Users can select their own providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own providers" ON public.providers FOR SELECT USING (exists (
    select 1
    from profiles as sub_profiles
    where sub_profiles.id = auth.uid()
    and sub_profiles.company_id = providers.company_id
  ));

--
-- Name: providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
