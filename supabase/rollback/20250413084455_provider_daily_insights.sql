-- まずポリシーを削除
DROP POLICY IF EXISTS "user can select provider_daily_insights their company has" ON public.provider_daily_insights;
-- 次にトリガーを削除
DROP TRIGGER IF EXISTS set_updated_at_provider_daily_insights ON public.provider_daily_insights;
-- インデックスを削除
DROP INDEX IF EXISTS provider_daily_insights_company_id_index;
DROP INDEX IF EXISTS provider_daily_insights_provider_id_index;
-- 最後にテーブル自体を削除
DROP TABLE IF EXISTS public.provider_daily_insights;