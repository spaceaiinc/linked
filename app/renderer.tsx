'use client'
import LoadingPage from '@/app/components/Loading'
import {
  providerAtom,
  userAtom,
  providersAtom,
  profileAtom,
  workflowsAtom,
  loadingAtom,
  scoutScreeningsAtom,
} from '@/lib/atom'
import { Provider } from '@/lib/types/supabase'
import { createClient } from '@/lib/utils/supabase/client'
import { useAtom } from 'jotai'
import { useEffect } from 'react'

interface Props {
  children: React.ReactNode
}

export default function Renderer({ children }: Props) {
  const [, setUser] = useAtom(userAtom)
  const [, setProfile] = useAtom(profileAtom)
  const [, setProvider] = useAtom(providerAtom)
  const [, setProviders] = useAtom(providersAtom)
  const [, setWorkflows] = useAtom(workflowsAtom)
  const [, setScoutScreenings] = useAtom(scoutScreeningsAtom)
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

      const { data: profileData, error: selectProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()
      if (selectProfileError) {
        console.error('Error selecting profile:', selectProfileError)
        return <>{children}</>
      }

      if (!profileData) {
        return <>{children}</>
      }
      const profile = profileData

      setProfile(profile)

      // URLパラメータをチェック
      const searchParams = new URLSearchParams(window.location.search)
      const shouldWait = searchParams.get('wait') === 'true'
      // ?wait=true がある場合はリロード クエリを削除
      if (shouldWait) {
        // wait for 1 second
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }

      const { data: providersData, error: selectProviderError } = await supabase
        .from('providers')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('deleted_at', '-infinity')
        .order('updated_at', { ascending: false })
      if (selectProviderError) {
        console.error('Error selecting providers:', selectProviderError)
        return <>{children}</>
      }
      if (!providersData || providersData.length === 0) {
        return <>{children}</>
      }
      const providers = providersData as Provider[]
      if (!profile?.selected_provider_id) {
        const { error: updateSelectedProviderIdError } = await supabase
          .from('profiles')
          .update({ selected_provider_id: providers[0].id })
          .eq('id', user.id)
        if (updateSelectedProviderIdError) {
          console.error(
            'Error updating selected provider id:',
            updateSelectedProviderIdError
          )
        }

        profile.selected_provider_id = providers[0].id
      }

      // profile.selected_provider_id と一致する provider を選択
      const selectedProvider = providers.find(
        (p) => p.id === profile?.selected_provider_id
      )
      if (selectedProvider) {
        setProvider(selectedProvider)
      } else {
        setProvider(providers[0] as Provider)
        const { error: updateSelectedProviderIdError } = await supabase
          .from('profiles')
          .update({ selected_provider_id: providers[0].id })
          .eq('id', user.id)
        if (updateSelectedProviderIdError) {
          console.error(
            'Error updating selected provider id:',
            updateSelectedProviderIdError
          )
        }

        profile.selected_provider_id = providers[0].id
      }
      setProviders(providers as Provider[])

      if (profile?.company_id === undefined || !profile?.company_id) {
        console.error('Company ID not found')
        return <>{children}</>
      }
      if (
        profile?.selected_provider_id === undefined ||
        !profile?.selected_provider_id
      ) {
        console.error('Selected provider ID not found')
        return <>{children}</>
      }

      const { data: workflows, error: selectWorkflowsError } = await supabase
        .from('workflows')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('provider_id', profile?.selected_provider_id)
        .eq('deleted_at', '-infinity')
        .order('updated_at', { ascending: false })
      if (selectWorkflowsError) {
        console.error('Error selecting workflows:', selectWorkflowsError)
        return <>{children}</>
      }

      if (!workflows) {
        console.error('Workflows not found')
        return <>{children}</>
      }

      setWorkflows(workflows)

      const { data: scoutScreenings, error: selectScoutScreeningsError } =
        await supabase
          .from('scout_screenings') // Assuming the table name is 'scout_screenings'
          .select('*')
          .eq('company_id', profile?.company_id)
          .eq('deleted_at', '-infinity')
          .order('updated_at', { ascending: false })

      if (selectScoutScreeningsError) {
        console.error(
          'Error selecting scout screenings:',
          selectScoutScreeningsError
        )
        return <>{children}</>
      }

      if (!scoutScreenings) {
        console.error('Scout screenings not found')
        return <>{children}</>
      }
      setScoutScreenings(scoutScreenings)
    }
    f()
  }, [])

  if (loading) {
    return <LoadingPage />
  }

  return <>{children}</>
}
