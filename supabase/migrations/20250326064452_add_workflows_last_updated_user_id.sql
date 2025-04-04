ALTER TABLE public.workflows
ADD COLUMN last_updated_user_id UUID NULL REFERENCES public.profiles(id),
ADD COLUMN run_limit_count INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN agent_type INTEGER NOT NULL DEFAULT 0,
ADD COLUMN invitation_message_dify_api_key TEXT NOT NULL DEFAULT '',
ADD COLUMN first_message_dify_api_key TEXT NOT NULL DEFAULT '',
ADD COLUMN first_message_trigger_type INTEGER NOT NULL DEFAULT 0,
ADD COLUMN second_message_dify_api_key TEXT NOT NULL DEFAULT '',
ADD COLUMN second_message_trigger_type INTEGER NOT NULL DEFAULT 0,
ADD COLUMN third_message_dify_api_key TEXT NOT NULL DEFAULT '',
ADD COLUMN third_message_trigger_type INTEGER NOT NULL DEFAULT 0;

UPDATE public.workflows
SET last_updated_user_id = (SELECT user_id FROM public.providers WHERE id = public.workflows.provider_id);

ALTER TABLE public.workflows
ALTER COLUMN last_updated_user_id SET NOT NULL;