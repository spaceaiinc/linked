'use client'
import { providerAtom, userAtom, providersAtom, profileAtom } from '@/lib/atom'
import { Provider } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/client'
import { useAtom } from 'jotai'
import { useEffect } from 'react'

interface Props {
  children: React.ReactNode
}

export default function Renderer({ children }: Props) {
  const [_, setUser] = useAtom(userAtom)
  const [__, setProfile] = useAtom(profileAtom)
  const [___, setProvider] = useAtom(providerAtom)
  const [____, setProviders] = useAtom(providersAtom)
  useEffect(() => {
    const f = async () => {
      // authenticate
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        // return router.push('/auth')
        return <>{children}</>
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      setProfile(profile)

      const { data: providers } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user?.id)
        .eq('company_id', profile?.company_id)
        .order('updated_at', { ascending: false })

      if (!providers) {
        // return router.push('/auth')
        return <>{children}</>
      }

      setProvider(providers[0] as Provider)
      setProviders(providers as Provider[])
    }
    f()
  }, [])

  return <>{children}</>
}
