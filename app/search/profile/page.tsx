'use client'
import { toolConfig } from './toolConfig'
import AppInfo from '@/components/input/AppInfo'
import { Button } from '@/components/ui/button'
import Login from '@/components/input/login'
import SearchProfileInputCapture from '@/components/input/SearchProfileInput'
import { IconPoint } from '@tabler/icons-react'
import { useAtom } from 'jotai'
import { providerAtom, userAtom } from '@/lib/atom'

export default function Page() {
  const [user, _] = useAtom(userAtom)
  const [provider, __] = useAtom(providerAtom)

  const InfoCard = (
    <AppInfo title="概要" background="bg-accent/10">
      <ul className="mt-4 ml-4 text-sm space-y-2 flex flex-col mb-4 relative xs:leading-7">
        <li className="text-l flex mb-2">
          <span className="ml-2">
            つながり申請・CSVエクスポートを行います。
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">
            連携前の場合、左下の「LinkedInアカウント追加」ボタンをクリックして、LinkedInアカウントと紐づける。
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">
            検索に使用する形式(検索URL, キーワード,
            CSV)を入力した後、実行ボタンを押すことで検索結果をつながり申請・CSVエクスポートできます。
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">
            時間と曜日の入力がない場合は即時実行。
            つながり申請のみ時間・曜日指定が有効です。
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
      // push to url
      if (response.ok) {
        const { url } = await response.json()
        if (url) window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error checking login status:', error)
      alert('Error checking login status')
    }
  }

  // If the tool is not paywalled or the user has a valid purchase, render the page
  return (
    <div data-theme={toolConfig.company.theme} className="bg-white">
      {!user?.email ? (
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <Login />
        </div>
      ) : provider ? (
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
    </div>
  )
}
