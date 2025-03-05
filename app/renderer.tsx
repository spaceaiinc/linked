'use client'
import LoadingPage from '@/components/Loading'
import {
  providerAtom,
  userAtom,
  providersAtom,
  profileAtom,
  workflowsAtom,
  loadingAtom,
} from '@/lib/atom'
import { Provider } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/client'
import { useAtom } from 'jotai'
import { useEffect } from 'react'

interface Props {
  children: React.ReactNode
}

export default function Renderer({ children }: Props) {
  const [user, setUser] = useAtom(userAtom)
  const [profile, setProfile] = useAtom(profileAtom)
  const [provider, setProvider] = useAtom(providerAtom)
  const [, setProviders] = useAtom(providersAtom)
  const [, setWorkflows] = useAtom(workflowsAtom)
  const [loading] = useAtom(loadingAtom)
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
        return <LoadingPage />
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      setProfile(profile)

      // URLパラメータをチェック
      const searchParams = new URLSearchParams(window.location.search)
      const shouldWait = searchParams.get('wait') === 'true'
      // ?wait=true がある場合はリロード クエリを削除
      if (shouldWait) {
        // wait for 1 second
        console.log('wait for 5 seconds')
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }

      const { data: providers } = await supabase
        .from('providers')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('updated_at', { ascending: false })

      if (!providers) {
        // return router.push('/auth')
        return <LoadingPage />
      }

      // profile.selected_provider_id と一致する provider を選択
      const selectedProvider = providers.find(
        (p) => p.id === profile?.selected_provider_id
      )
      if (selectedProvider) {
        setProvider(selectedProvider)
      } else {
        setProvider(providers[0] as Provider)
      }
      setProviders(providers as Provider[])

      const { data: workflows } = await supabase
        .from('workflows')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('provider_id', profile?.selected_provider_id)
        .order('updated_at', { ascending: false })

      if (!workflows) {
        return <LoadingPage />
      }

      setWorkflows(workflows)
    }
    f()
  }, [user, profile, provider])

  if (loading) {
    return <LoadingPage />
  }

  return <>{children}</>
}
