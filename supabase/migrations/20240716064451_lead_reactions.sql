--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_reactions (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    reacted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reaction_type SMALLINT NOT NULL,
    post_url TEXT NOT NULL,
    post_private_identifier TEXT NOT NULL,
    private_identifier TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    UNIQUE (post_private_identifier, private_identifier, reaction_type)
);

--
-- Name: Force Update updated_at Column
--

CREATE TRIGGER set_updated_at_lead_reactions BEFORE
UPDATE ON public.lead_reactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX lead_reactions_company_id_index ON public.lead_reactions (company_id);
CREATE INDEX lead_reactions_lead_id_index ON public.lead_reactions (lead_id);

CREATE POLICY "Users can insert their own lead_reactions" ON public.lead_reactions FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_reactions" ON public.lead_reactions FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_reactions" ON public.lead_reactions FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_reactions ENABLE ROW LEVEL SECURITY;