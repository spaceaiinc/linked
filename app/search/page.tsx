'use client'
import PaymentModal from '@/components/paywall/Payment'
import { toolConfig } from './toolConfig'
import AppInfo from '@/components/input/AppInfo'
import { PaddingIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/utils/supabase/client'
import { User } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import Login from '@/components/input/login'
import SearchProfileInputCapture from '@/components/input/SearchProfileInput'
import { IconMessage, IconPoint } from '@tabler/icons-react'

export default function Page() {
  const [user, setUser] = useState<User | null>()
  const [provider, setProvider] = useState<any | null>()
  useEffect(() => {
    const f = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      // If user is logged in, we check if the tool is paywalled.
      // If it is, we check if the user has a valid purchase & enough credits for one generation
      let credits

      if (user) {
        if (toolConfig.paywall) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          credits = profile.credits

          // console.table(profile)

          if (credits < toolConfig.credits) {
            return <PaymentModal />
          }
        }

        const { data, error } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 0)

        if (error) {
          console.error('Error fetching', error)
        } else {
          if (data.length > 0) setProvider(data[0])
        }
      }
    }
    f()
  }, [])

  const InfoCard = (
    <AppInfo title="概要" background="bg-accent/10">
      {/* キーワードまたは、ユーザーIDのCSVからつながり申請&CSVエクスポートを行います。 */}
      <ul className="mt-4 ml-4 text-sm space-y-2 flex flex-col mb-4 relative xs:leading-7">
        <li className="text-l flex mb-2">
          <span className="ml-2">
            キーワードまたは、ユーザーIDのCSVからつながり申請&CSVエクスポートを行います。
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">
            「Connect」ボタンをクリックして、LinkedInアカウントと紐づける。
          </span>
        </li>

        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">
            検索に使用する形式(検索URL, キーワード,
            CSV)を入力した後、実行ボタンを押すことで検索結果をエクスポートできます。
          </span>
        </li>
      </ul>
    </AppInfo>
  )

  const handleConnect = async () => {
    try {
      // Try to get LinkedIn cookies
      const response = await fetch('/api/provider/auth', {
        method: 'POST',
      })
      // const res: {
      //   object: 'HostedAuthUrl'
      //   url: string
      // }
      // push to url
      if (response.ok) {
        const { url } = await response.json()
        // router.push(url)
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error checking login status:', error)
    }
  }

  // If the tool is not paywalled or the user has a valid purchase, render the page
  return (
    <div data-theme={toolConfig.company.theme} className="bg-white">
      {user?.email ? (
        <>
          {provider ? (
            <>
              <SearchProfileInputCapture
                toolConfig={toolConfig}
                userEmail={user ? user.email : undefined}
                credits={toolConfig.paywall ? 10 : undefined}
                emptyStateComponent={InfoCard}
              />
              {/* <LinkedInUsage generations={[]} generationType="linkedin" /> */}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[75vh]">
              <h1 className="text-2xl font-bold mb-8">
                Connect Your LinkedIn Account
              </h1>
              <Button
                onClick={() => handleConnect()}
                disabled={provider ? true : false}
                className="bg-[#0077b5] hover:bg-[#0077b5]/90 text-white"
              >
                {'Connect'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <Login />
        </div>
      )}
    </div>
  )
}
