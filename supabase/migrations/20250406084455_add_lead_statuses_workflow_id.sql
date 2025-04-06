ALTER TABLE public.lead_statuses
ADD COLUMN workflow_id UUID NULL REFERENCES public.workflows(id);

UPDATE public.lead_statuses
SET workflow_id = (
    SELECT workflow_id
    FROM public.lead_workflows
    WHERE public.lead_statuses.lead_id = public.lead_workflows.lead_id
    ORDER BY public.lead_workflows.created_at DESC
    LIMIT 1
  );

ALTER TABLE public.lead_statuses
ALTER COLUMN workflow_id
SET NOT NULL;