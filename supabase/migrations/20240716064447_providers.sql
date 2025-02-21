
--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    type SMALLINT NOT NULL,
    status SMALLINT NOT NULL,
    account_id TEXT NOT NULL,
    public_identifier TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    like_target_account_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    like_target_account_hours SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
    check_reaction_hours SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[]
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

-- CREATE POLICY "Users can select providers their company has" ON public.providers FOR SELECT 
-- USING (company_id = (select company_id from public.profiles where id = auth.uid()));

-- Name: providers; Type: ROW SECURITY; Schema: public; Owner: -
--

-- ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
