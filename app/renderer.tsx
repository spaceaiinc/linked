'use client'
import { providerAtom, userAtom } from '@/lib/atom'
import { Provider } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/client'
import { useAtom } from 'jotai'
import { useEffect } from 'react'

interface Props {
  children: React.ReactNode
}

export default function Renderer({ children }: Props) {
  const [_, setUser] = useAtom(userAtom)
  const [__, setProvider] = useAtom(providerAtom)
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

      const { data: provider } = await supabase
        .from('providers')
        .select('id, account_id')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .single()

      setProvider(provider as Provider)

      if (!provider || !provider?.id) {
        // return router.push('/auth')
        return <>{children}</>
      }
    }
    f()
  }, [])

  return <>{children}</>
}
