import { cache } from 'react'
import { unstable_cache, revalidateTag } from 'next/cache'
import { createClient } from '@/lib/utils/supabase/server'
import { getSessionQuery, getUserQuery, getUserCreditsQuery } from '../queries'

// Create a singleton Supabase client instance
export const getSupabase = cache(() => createClient())

/**
 * Gets the current user session with caching
 * Includes safeguards against stale cache data and session mismatches
 */
export const getSession = async () => {
  const supabase = await getSupabase()

  try {
    // First check if we have a current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no active session, return null immediately
    if (!session) return null

    // Create a unique cache key using both user ID and token
    // This ensures cache entries are unique per user and session
    const cacheKey = `session_${session.user.id}_${session.access_token.slice(-10)}`

    return unstable_cache(
      async () => {
        try {
          // Fetch current user data from Supabase
          const user = await getSessionQuery(supabase)
          if (!user) return null

          // Double-check that the cached user matches current session
          // This prevents serving stale data if user has changed
          const currentSession = await supabase.auth.getSession()
          if (currentSession.data.session?.user.email !== user.email) {
            // If emails don't match, invalidate cache and return null
            revalidateTag(cacheKey)
            return null
          }

          return user
        } catch (error) {
          return null
        }
      },
      // Cache key components for the unstable_cache function
      ['session', session.user.id, session.access_token.slice(-10)],
      {
        tags: [cacheKey],
        revalidate: 10, // Revalidate every 10 seconds to prevent stale data
      }
    )()
  } catch (error) {
    return null
  }
}

/**
 * Gets user profile data by email with caching
 * Used for looking up user details
 */
export const getUser = async (email: string) => {
  const supabase = await getSupabase()
  return unstable_cache(
    async () => getUserQuery(supabase, email),
    ['user', email],
    {
      tags: [`user_${email}`],
      revalidate: 3600, // Cache for 1 hour as profile data changes less frequently
    }
  )()
}

/**
 * Gets user credits with caching
 * Short cache duration as credits can change frequently
 */
export const getUserCredits = async (userId: string) => {
  const supabase = await getSupabase()
  return unstable_cache(
    async () => getUserCreditsQuery(supabase, userId),
    ['user_credits', userId],
    {
      tags: [`user_${userId}_credits`],
      revalidate: 10, // Frequent revalidation for credit balance
    }
  )()
}
