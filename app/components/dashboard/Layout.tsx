import { Suspense } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import { Container } from '@/app/components/dashboard/Container'
import LoadingSpinner from '@/app/components/Loading'
import { ToolConfig } from '@/lib/types/toolconfig'
import { UnifiedSidebar } from './UnifiedSidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
  toolConfig: ToolConfig
  showGreeting?: boolean
}

export async function DashboardLayout({
  children,
  toolConfig,
  showGreeting = true,
}: DashboardLayoutProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {/* サイドバー部分 - 固定位置 */}
        <UnifiedSidebar user={user} showChatHistory={true} />

        {/* メインコンテンツエリア - スクロール可能 */}
        <div className="flex-1 overflow-y-auto">
          <div className="lg:pl-2 lg:pt-2 bg-gray-100 min-h-screen">
            <div className="flex-1 bg-white lg:rounded-tl-xl border border-transparent lg:border-neutral-200">
              <Suspense fallback={<LoadingSpinner />}>
                <MainContent
                  toolConfig={toolConfig}
                  showGreeting={showGreeting}
                  user={user}
                >
                  {children}
                </MainContent>
              </Suspense>
              {/* <ContentFooter /> */}
              {/* </div> */}
            </div>
          </div>
        </div>
      </div>
      {/* <Suspense fallback={<LoadingSpinner />}>
        <Footer
          companyConfig={toolConfig.company!}
          footerConfig={toolConfig.footerApp!}
        />
      </Suspense> */}
    </>
  )
}

async function MainContent({
  children,
  toolConfig,
  showGreeting,
  user,
}: {
  children: React.ReactNode
  toolConfig: ToolConfig
  showGreeting: boolean
  user: any
}) {
  const supabase = createClient()
  // const {
  //   data: { user: supabaseUser },
  // } = await supabase.auth.getUser()

  let credits
  if (user && toolConfig.paywall) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    credits = profile?.credits
  }

  return (
    <Container>
      {showGreeting && (
        <>
          {/* <span className="text-4xl">👋🏼</span> */}
          {/* <Heading className="font-black mb-10">
            {toolConfig.company?.name}
          </Heading> */}
          {/* <Paragraph className="max-w-xl mt-4">
            {toolConfig.company?.description}
          </Paragraph> */}
        </>
      )}
      {children}
    </Container>
  )
}
