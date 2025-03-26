ALTER TABLE public.workflows
  ADD COLUMN last_updated_user_id UUID NOT NULL REFERENCES public.users(id),
  ADD COLUMN job_position TEXT NOT NULL DEFAULT '',
  ADD COLUMN job_position TEXT NOT NULL DEFAULT '',
  ADD COLUMN run_limit_count INTEGER NOT NULL,
  ADD COLUMN agent_type SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN invitation_message_dify_api_key TEXT NOT NULL DEFAULT '',
  ADD COLUMN first_message_dify_api_key TEXT NOT NULL DEFAULT '',
  ADD COLUMN first_message_trigger_type SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN second_message_dify_api_key TEXT NOT NULL DEFAULT '',
  ADD COLUMN second_message_trigger_type SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN third_message_dify_api_key TEXT NOT NULL DEFAULT '',
  ADD COLUMN third_message_trigger_type SMALLINT NOT NULL DEFAULT 0;