import { env } from '@/lib/env'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.NEXT_SUPABASE_SERVICE_KEY!
)
