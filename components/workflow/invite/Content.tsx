'use client'
import { toolConfig } from './toolConfig'
import AppInfo from '@/components/input/AppInfo'
import InviteInputCapture from './Input'
import { IconPoint } from '@tabler/icons-react'
import { useAtom } from 'jotai'
import { userAtom } from '@/lib/atom'
import { useEffect, useState } from 'react'
import { Lead } from '@/lib/types/supabase'
import { getLeadsByWorkflowId } from '@/lib/db/queries/leadClient'
import { convertToDisplay } from '@/lib/csv'
import { LeadTable } from '@/components/dashboard/LeadTable'

export default function InviteContent({ workflowId }: { workflowId: string }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [user, _] = useAtom(userAtom)
  useEffect(() => {
    const f = async () => {
      const fetchedLeads = await getLeadsByWorkflowId({ workflowId })
      if (fetchedLeads && fetchedLeads.length) {
        const convertedRow = convertToDisplay(fetchedLeads)
        if (convertedRow && convertedRow.length)
          setLeads(convertedRow as Lead[] | [])
      }
    }
    f()
  }, [])
  const InfoCard = (
    <AppInfo title="概要" background="bg-accent/10">
      <ul className="mt-4 ml-4 text-sm space-y-2 flex flex-col mb-4 relative xs:leading-7">
        <li className="text-l flex mb-2">
          <span className="ml-2">つながり申請を行います。</span>
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
            時間と曜日の入力がない場合は即時で処理が実行します。
            ※現在は時間指定機能は未実装です(時間指定した場合、処理は行われません)。
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">1回毎の申請数は、現在20件まで可能です。</span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">
            CSV入力の場合、指定カラム列のLinkedIn
            URLを読み込みます。以下の形式で入力してください。
            例:https://www.linkedin.com/in/[user id]
          </span>
        </li>
        <li className="text-l flex">
          <span className="w-4 h-4 mt-1">
            <IconPoint className="w-4 h-4" />
          </span>
          <span className="ml-2">
            キーワードは"A" or "B"、"A" and "B"、"A" not
            "B"の形式で絞り込むことが可能です。(https://www.linkedin.com/help/linkedin/answer/a524335?lang=ja)
          </span>
        </li>
      </ul>
    </AppInfo>
  )

  // If the tool is not paywalled or the user has a valid purchase, render the page
  return (
    <>
      <InviteInputCapture
        workflowId={workflowId}
        toolConfig={toolConfig}
        userEmail={user ? user.email : undefined}
        credits={toolConfig.paywall ? 10 : undefined}
        emptyStateComponent={InfoCard}
      />
      <LeadTable leads={leads} />
    </>
  )
}
