--
-- Name: workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflows (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    provider_id UUID NOT NULL REFERENCES public.providers(id),
    type SMALLINT NOT NULL,
    name TEXT NOT NULL,
    status SMALLINT NOT NULL DEFAULT 1,
    scheduled_hours SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
    scheduled_days SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
    scheduled_months SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
    scheduled_weekdays SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
    search_url TEXT NOT NULL DEFAULT '',
    keywords TEXT NOT NULL DEFAULT '',
    company_private_identifiers TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    target_workflow_id UUID NULL,
    network_distance SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
    invitation_message TEXT NOT NULL DEFAULT '',
    invitation_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    first_message TEXT NOT NULL DEFAULT '',
    first_message_days SMALLINT NOT NULL DEFAULT 0,
    first_message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    second_message TEXT NOT NULL DEFAULT '',
    second_message_days SMALLINT NOT NULL DEFAULT 1,
    second_message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    third_message TEXT NOT NULL DEFAULT '',
    third_message_days SMALLINT NOT NULL DEFAULT 2,
    third_message_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    limit_count SMALLINT NOT NULL DEFAULT 10,
    max_execution_minutes SMALLINT NOT NULL DEFAULT 10 CHECK (max_execution_minutes <= 300),
    max_number_of_launches SMALLINT NOT NULL DEFAULT 2 CHECK (max_number_of_launches <= 10),
    email_notify_manual_launch_error BOOLEAN NOT NULL DEFAULT TRUE,
    email_notify_auto_launch_error BOOLEAN NOT NULL DEFAULT TRUE,
    email_notify_manual_error BOOLEAN NOT NULL DEFAULT TRUE,
    email_notify_auto_error BOOLEAN NOT NULL DEFAULT TRUE,
    email_notify_manual_time_limit BOOLEAN NOT NULL DEFAULT TRUE,
    email_notify_auto_time_limit BOOLEAN NOT NULL DEFAULT TRUE,
    email_notify_manual_success BOOLEAN NOT NULL DEFAULT FALSE,
    email_notify_auto_success BOOLEAN NOT NULL DEFAULT FALSE,
    slack_webhook_url TEXT NOT NULL DEFAULT ''
);


--
-- Name: workflow_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_histories (
    id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
    deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
    workflow_id UUID NOT NULL REFERENCES public.workflows(id),
    status SMALLINT NOT NULL,
    cursor TEXT NOT NULL DEFAULT '',
    error_message TEXT NOT NULL DEFAULT ''
);

--
-- Name: Force Update updated_at Column
--

CREATE TRIGGER set_updated_at_workflows
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_workflow_histories
BEFORE UPDATE ON public.workflow_histories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();


CREATE INDEX workflows_company_id_index ON public.workflows (company_id);
CREATE INDEX workflows_provider_id_index ON public.workflows (provider_id);

CREATE INDEX workflow_histories_company_id_index ON public.workflow_histories (company_id);
CREATE INDEX workflow_histories_workflow_id_index ON public.workflow_histories (workflow_id);

--
-- Name: workflows Users can insert their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own workflows" 
ON public.workflows 
FOR INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

--
-- Name: workflows Users can select their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can select their own workflows" 
ON public.workflows 
FOR SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

--
-- Name: workflows Users can update their own workflows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own workflows" 
ON public.workflows
FOR UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));


CREATE POLICY "Users can insert their own workflow_histories" ON public.workflow_histories FOR 
INSERT WITH CHECK (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can select their own workflow_histories" ON public.workflow_histories FOR
SELECT USING (company_id = (select company_id from public.profiles where id = auth.uid()));

CREATE POLICY "Users can update their own workflow_histories" ON public.workflow_histories FOR
UPDATE USING (company_id = (select company_id from public.profiles where id = auth.uid()));

--
-- Name: workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_histories ENABLE ROW LEVEL SECURITY;