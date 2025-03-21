--
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    provider_id UUID NOT NULL REFERENCES public.providers(id),
    private_identifier TEXT NOT NULL DEFAULT '',
    public_identifier TEXT NOT NULL DEFAULT '',
    profile_picture_url TEXT NOT NULL DEFAULT '',
    full_name TEXT NOT NULL DEFAULT '',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    emails TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    phones TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    addresses TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    socials TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    birth_month TEXT NOT NULL DEFAULT '',
    birth_day TEXT NOT NULL DEFAULT '',
    primary_locale_country TEXT NOT NULL DEFAULT '',
    primary_locale_language TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    websites TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    can_send_inmail BOOLEAN NOT NULL DEFAULT FALSE,
    is_influencer BOOLEAN NOT NULL DEFAULT FALSE,
    is_creator BOOLEAN NOT NULL DEFAULT FALSE,
    is_hiring BOOLEAN NOT NULL DEFAULT FALSE,
    is_open_to_work BOOLEAN NOT NULL DEFAULT FALSE,
    network_distance SMALLINT NOT NULL DEFAULT 0,
    connections_count INT NOT NULL DEFAULT 0,
    follower_count INT NOT NULL DEFAULT 0,
    shared_connections_count INT NOT NULL DEFAULT 0,
    keywords TEXT NOT NULL DEFAULT '',
    thread TEXT NOT NULL DEFAULT '',
    invitation_message TEXT NOT NULL DEFAULT '',
    generated_invitation_message TEXT NOT NULL DEFAULT '',
    invitation_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    invitation_replied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    first_message TEXT NOT NULL DEFAULT '',
    first_message_days SMALLINT NOT NULL DEFAULT 0,
    generated_first_message TEXT NOT NULL DEFAULT '',
    first_message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    first_message_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    first_message_replied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    second_message TEXT NOT NULL DEFAULT '',
    second_message_days SMALLINT NOT NULL DEFAULT 1,
    generated_second_message TEXT NOT NULL DEFAULT '',
    second_message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    second_message_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    second_message_replied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    third_message TEXT NOT NULL DEFAULT '',
    third_message_days SMALLINT NOT NULL DEFAULT 2,
    generated_third_message TEXT NOT NULL DEFAULT '',
    third_message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    third_message_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    third_message_replied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    UNIQUE (provider_id, private_identifier),
    UNIQUE (provider_id, public_identifier)
);
--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.lead_statuses (
id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
company_id UUID NOT NULL REFERENCES public.companies(id),
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
lead_id UUID NOT NULL REFERENCES public.leads(id),
status SMALLINT NOT NULL -- In queue, Invited, Accepted, Follow-up sent, Replied, Not sent
);
--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--
CREATE TABLE public.lead_workflows (
id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
company_id UUID NOT NULL REFERENCES public.companies(id),
created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
lead_id UUID NOT NULL REFERENCES public.leads(id),
workflow_id UUID NOT NULL REFERENCES public.workflows(id),
UNIQUE (lead_id, workflow_id)
);
--
-- Name: lead_work_experiences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_work_experiences (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    position TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    skills TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    current BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT '',
    start_date DATE NOT NULL DEFAULT '-infinity',
    end_date DATE NOT NULL DEFAULT '-infinity',
    UNIQUE (lead_id, company, start_date)
);
--
-- Name: lead_volunteering_experiences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_volunteering_experiences (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    company TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL,
    cause TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT '-infinity',
    end_date DATE NOT NULL DEFAULT '-infinity',
    UNIQUE (lead_id, company, start_date)
);
--
-- Name: lead_educations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_educations (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    degree TEXT NOT NULL,
    school TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT '-infinity',
    end_date DATE NOT NULL DEFAULT '-infinity',
    UNIQUE (lead_id, school, start_date)
);
--
-- Name: lead_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_skills (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    name TEXT NOT NULL,
    endorsement_count INT NOT NULL DEFAULT 0,
    endorsement_id INT NOT NULL DEFAULT 0,
    insights TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    endorsed BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (lead_id, name)
);
--
-- Name: lead_languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_languages (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    name TEXT NOT NULL,
    proficiency TEXT NOT NULL,
    UNIQUE (lead_id, name)
);
--
-- Name: lead_certifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_certifications (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    url TEXT NOT NULL,
    UNIQUE (lead_id, name)
);
--
-- Name: lead_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_projects (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    lead_id UUID NOT NULL REFERENCES public.leads(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    skills TEXT [] NOT NULL DEFAULT ARRAY []::TEXT [],
    start_date DATE NOT NULL DEFAULT '-infinity',
    end_date DATE NOT NULL DEFAULT '-infinity',
    UNIQUE (lead_id, name, start_date)
);
--
-- Name: Force Update updated_at Column
--

CREATE TRIGGER set_updated_at_leads BEFORE
UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_workflows BEFORE
UPDATE ON public.lead_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_statuses BEFORE
UPDATE ON public.lead_statuses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_work_experiences BEFORE
UPDATE ON public.lead_work_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_volunteering_experiences BEFORE
UPDATE ON public.lead_volunteering_experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_educations BEFORE
UPDATE ON public.lead_educations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_skills BEFORE
UPDATE ON public.lead_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_languages BEFORE
UPDATE ON public.lead_languages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_certifications BEFORE
UPDATE ON public.lead_certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_lead_projects BEFORE
UPDATE ON public.lead_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX leads_company_id_index ON public.leads (company_id);
CREATE INDEX leads_provider_id_index ON public.leads (provider_id);
CREATE INDEX lead_statuses_company_id_index ON public.lead_statuses (company_id);
CREATE INDEX lead_statuses_lead_id_index ON public.lead_statuses (lead_id);
CREATE INDEX lead_work_experiences_company_id_index ON public.lead_work_experiences (company_id);
CREATE INDEX lead_work_experiences_lead_id_index ON public.lead_work_experiences (lead_id);
CREATE INDEX lead_volunteering_experiences_company_id_index ON public.lead_volunteering_experiences (company_id);
CREATE INDEX lead_volunteering_experiences_lead_id_index ON public.lead_volunteering_experiences (lead_id);
CREATE INDEX lead_educations_company_id_index ON public.lead_educations (company_id);
CREATE INDEX lead_educations_lead_id_index ON public.lead_educations (lead_id);
CREATE INDEX lead_skills_company_id_index ON public.lead_skills (company_id);
CREATE INDEX lead_skills_lead_id_index ON public.lead_skills (lead_id);
CREATE INDEX lead_languages_company_id_index ON public.lead_languages (company_id);
CREATE INDEX lead_languages_lead_id_index ON public.lead_languages (lead_id);
CREATE INDEX lead_certifications_company_id_index ON public.lead_certifications (company_id);
CREATE INDEX lead_certifications_lead_id_index ON public.lead_certifications (lead_id);
CREATE INDEX lead_projects_company_id_index ON public.lead_projects (company_id);
CREATE INDEX lead_projects_lead_id_index ON public.lead_projects (lead_id);
--
-- Name: leads Users can insert their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own leads" ON public.leads FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
--
-- Name: leads Users can select their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own leads" ON public.leads FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
--
-- Name: leads Users can update their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own leads" ON public.leads FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_workflows" ON public.lead_workflows FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_workflows" ON public.lead_workflows FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_workflows" ON public.lead_workflows FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_statuses" ON public.lead_statuses FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_statuses" ON public.lead_statuses FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_statuses" ON public.lead_statuses FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_work_experiences" ON public.lead_work_experiences FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_work_experiences" ON public.lead_work_experiences FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_work_experiences" ON public.lead_work_experiences FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_volunteering_experiences" ON public.lead_volunteering_experiences FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_volunteering_experiences" ON public.lead_volunteering_experiences FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_volunteering_experiences" ON public.lead_volunteering_experiences FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_educations" ON public.lead_educations FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_educations" ON public.lead_educations FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_educations" ON public.lead_educations FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_skills" ON public.lead_skills FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_skills" ON public.lead_skills FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_skills" ON public.lead_skills FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_languages" ON public.lead_languages FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_languages" ON public.lead_languages FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_languages" ON public.lead_languages FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_certifications" ON public.lead_certifications FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_certifications" ON public.lead_certifications FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_certifications" ON public.lead_certifications FOR
UPDATE USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can insert their own lead_projects" ON public.lead_projects FOR
INSERT WITH CHECK (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can select their own lead_projects" ON public.lead_projects FOR
SELECT USING (
        company_id = (
            select company_id
            from public.profiles
            where id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own lead_projects" ON public.lead_projects FOR
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

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_volunteering_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_projects ENABLE ROW LEVEL SECURITY;