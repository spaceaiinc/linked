--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    workflow_id UUID NOT NULL REFERENCES public.workflows(id),
    status SMALLINT NOT NULL, -- In queue, Invited, Accepted, Follow-up sent, Replied, Not sent
    private_identifier TEXT NOT NULL,
    public_profile_url TEXT NOT NULL,
    profile_picture_url TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    emails TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    phones TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    addresses TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    socials TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    birth_month TEXT NOT NULL DEFAULT '',
    birth_day TEXT NOT NULL DEFAULT '',
    primary_locale_country TEXT NOT NULL DEFAULT '',
    primary_locale_language TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL,
    websites TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
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
    invitation_message TEXT NOT NULL DEFAULT '',
    generated_invitation_message TEXT NOT NULL DEFAULT '',
    invitation_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    invitation_replied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    first_message TEXT NOT NULL DEFAULT '',
    generated_first_message TEXT NOT NULL DEFAULT '',
    first_message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    first_message_replied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    thread TEXT NOT NULL DEFAULT '',
    last_imported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE ('UTC', NOW())
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
    skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    current BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT '',
    start_date DATE NOT NULL DEFAULT '-infinity',
    end_date DATE NOT NULL DEFAULT '-infinity'
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
    end_date DATE NOT NULL DEFAULT '-infinity'
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
    end_date DATE NOT NULL DEFAULT '-infinity'
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
    insights TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    endorsed BOOLEAN NOT NULL DEFAULT FALSE
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
    proficiency TEXT NOT NULL
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
    url TEXT NOT NULL
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
    skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    start_date DATE NOT NULL DEFAULT '-infinity',
    end_date DATE NOT NULL DEFAULT '-infinity'
);

--
-- Name: Force Update updated_at Column
--

CREATE TRIGGER set_updated_at_leads
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_lead_work_experiences
BEFORE UPDATE ON public.lead_work_experiences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_lead_volunteering_experiences
BEFORE UPDATE ON public.lead_volunteering_experiences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_lead_educations
BEFORE UPDATE ON public.lead_educations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_lead_skills
BEFORE UPDATE ON public.lead_skills
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_lead_languages
BEFORE UPDATE ON public.lead_languages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_lead_certifications
BEFORE UPDATE ON public.lead_certifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_lead_projects
BEFORE UPDATE ON public.lead_projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


CREATE INDEX leads_company_id_index ON public.leads (company_id);
CREATE INDEX leads_workflow_id_index ON public.leads (workflow_id);

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

CREATE POLICY "Users can insert their own leads" 
ON public.leads 
FOR INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

--
-- Name: leads Users can select their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own leads" ON public.leads 
FOR SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

--
-- Name: leads Users can update their own leads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own leads" ON public.leads
FOR UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own lead_work_experiences" ON public.lead_work_experiences FOR
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own lead_work_experiences" ON public.lead_work_experiences FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can update their own lead_work_experiences" ON public.lead_work_experiences FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own lead_volunteering_experiences" ON public.lead_volunteering_experiences FOR
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own lead_volunteering_experiences" ON public.lead_volunteering_experiences FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can update their own lead_volunteering_experiences" ON public.lead_volunteering_experiences FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own lead_educations" ON public.lead_educations FOR
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own lead_educations" ON public.lead_educations FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can update their own lead_educations" ON public.lead_educations FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own lead_skills" ON public.lead_skills FOR
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own lead_skills" ON public.lead_skills FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can update their own lead_skills" ON public.lead_skills FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own lead_languages" ON public.lead_languages FOR
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own lead_languages" ON public.lead_languages FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can update their own lead_languages" ON public.lead_languages FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own lead_certifications" ON public.lead_certifications FOR
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own lead_certifications" ON public.lead_certifications FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can update their own lead_certifications" ON public.lead_certifications FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own lead_projects" ON public.lead_projects FOR
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own lead_projects" ON public.lead_projects FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can update their own lead_projects" ON public.lead_projects FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));

--
-- Name: leads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_volunteering_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_projects ENABLE ROW LEVEL SECURITY;