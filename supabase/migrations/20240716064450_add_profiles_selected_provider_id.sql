
ALTER TABLE public.profiles
ADD COLUMN selected_provider_id UUID REFERENCES public.providers(id);