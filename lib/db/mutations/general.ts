import { createClient } from '@/lib/utils/supabase/server'
import { revalidateTag } from 'next/cache'
import { PostgrestError } from '@supabase/supabase-js'
import { Client, handleDatabaseError } from '@/lib/types/supabase'

// Define getSupabase here instead of importing
const getSupabase = async () => createClient()

// Reuse the mutateQuery helper from chat.ts
async function mutateQuery<T extends any[]>(
  queryFn: (client: Client, ...args: T) => Promise<void>,
  args: T,
  tags: string[]
) {
  const supabase = await getSupabase()
  try {
    await queryFn(supabase, ...args)
    tags.forEach((tag) => revalidateTag(tag))
  } catch (error) {
    handleDatabaseError(error as PostgrestError)
  }
}

export async function reduceUserCredits(email: string, credits: number) {
  if (credits <= 0) throw new Error('Credits must be positive')

  let result: any[] | null = null
  await mutateQuery(
    async (client, email, credits: number) => {
      const { data: userData, error: userError } = await client
        .from('profiles')
        .select('credits')
        .eq('email', email as string)
        .single()

      if (userError) throw userError
      if (!userData) throw new Error('User not found')
      if (userData.credits === null)
        throw new Error('User credits not initialized')

      const currentCredits: number = Number(userData.credits)
      const creditsToReduce: number = Number(credits)
      const updatedCredits = currentCredits - creditsToReduce

      const { data, error } = await client
        .from('profiles')
        .update({
          credits: updatedCredits,
          id: '',
          company_id: '',
          full_name: '',
          username: '',
        })
        .eq('email', email as string)
        .select()

      if (error) throw error
      if (!data || data.length === 0)
        throw new Error('No data returned from update')
      result = data
    },
    [email, credits],
    [`user_${email}_credits`, 'profiles']
  )

  if (!result) throw new Error('Operation failed')
  return result
}

// Helper functions
function getSeoMetadata(output: any) {
  if (output.seoMetadata) return output.seoMetadata
  if (output.parameters?.seoMetadata) return output.parameters.seoMetadata
  return null
}
