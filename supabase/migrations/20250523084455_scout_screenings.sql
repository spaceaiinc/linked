--
-- Name: scout_screenings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scout_screenings (
  id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  company_name TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT ''
);

CREATE TABLE public.scout_screening_patterns (
  id UUID DEFAULT extensions.UUID_generate_v4() NOT NULL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('UTC', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '-infinity',
  scout_screening_id UUID NOT NULL REFERENCES public.scout_screenings(id),
  name TEXT NOT NULL DEFAULT '',
  age_min SMALLINT NOT NULL DEFAULT 0,
  age_max SMALLINT NOT NULL DEFAULT 0,
  exclude_job_changes SMALLINT NOT NULL DEFAULT 0,
  has_management_experience BOOLEAN NOT NULL DEFAULT FALSE,
  work_location_prefectures SMALLINT[] NOT NULL DEFAULT '{}',
  conditions TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  resend_subject TEXT NOT NULL DEFAULT '',
  resend_body TEXT NOT NULL DEFAULT '',
  re_resend_subject TEXT NOT NULL DEFAULT '',
  re_resend_body TEXT NOT NULL DEFAULT ''
);

CREATE TRIGGER set_updated_at_scout_screenings BEFORE
UPDATE ON public.scout_screenings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_scout_screening_patterns BEFORE
UPDATE ON public.scout_screening_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX scout_screenings_company_id_index ON public.scout_screenings (company_id);
CREATE INDEX scout_screenings_user_id_index ON public.scout_screenings (user_id);
CREATE INDEX scout_screening_patterns_company_id_index ON public.scout_screening_patterns (company_id);
CREATE INDEX scout_screening_patterns_scout_screening_id_index ON public.scout_screening_patterns (scout_screening_id);
--
-- Name: scout_screenings providers can select their own scout_screenings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "user can insert scout_screenings for their company" ON public.scout_screenings FOR
INSERT WITH CHECK (
    (user_id = auth.uid())
    AND (
      company_id = (
        SELECT p.company_id
        FROM public.profiles p
        WHERE p.id = auth.uid()
      )
    )
  );

CREATE POLICY "user can update scout_screenings for their company" ON public.scout_screenings FOR
UPDATE USING (
    (user_id = auth.uid())
    AND (
      company_id = (
        SELECT p.company_id
        FROM public.profiles p
        WHERE p.id = auth.uid()
      )
    )
  );


CREATE POLICY "user can insert scout_screening_patterns for their company" ON public.scout_screening_patterns FOR
INSERT WITH CHECK (
    (
      company_id = (
        SELECT p.company_id
        FROM public.profiles p
        WHERE p.id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1
      FROM public.scout_screenings ss
      WHERE ss.id = scout_screening_id
        AND ss.company_id = (
          SELECT p2.company_id
          FROM public.profiles p2
          WHERE p2.id = auth.uid()
        )
    )
  );

CREATE POLICY "user can update scout_screening_patterns for their company" ON public.scout_screening_patterns FOR
UPDATE USING (
  company_id = (
    SELECT p.company_id
    FROM public.profiles p
    WHERE p.id = auth.uid()
  )
  AND scout_screening_id IN (
    SELECT ss.id
    FROM public.scout_screenings ss
    WHERE ss.company_id = (
      SELECT p2.company_id
      FROM public.profiles p2
      WHERE p2.id = auth.uid()
    )
  )
);

CREATE POLICY "user can select scout_screenings their company has" ON public.scout_screenings FOR
SELECT USING (
    company_id = (
      select company_id
      from public.profiles
      where id = auth.uid()
    )
  );

--
-- Name: scout_screenings; Type: POLICY; Schema: public; Owner: -
--


CREATE POLICY "user can select scout_screening_patterns their company has" ON public.scout_screening_patterns FOR
SELECT USING (
    company_id = (
      select company_id
      from public.profiles
      where id = auth.uid()
    )
  );




--
-- Name: scout_screenings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scout_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_screening_patterns ENABLE ROW LEVEL SECURITY;