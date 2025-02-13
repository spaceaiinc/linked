import { Suspense } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ContentFooter } from '@/components/dashboard/Footer'
import { createClient } from '@/lib/utils/supabase/server'
import { Container } from '@/components/dashboard/Container'
import { Heading } from '@/components/dashboard/Heading'
import LoadingSpinner from '@/components/Loading'
import { ToolConfig } from '@/lib/types/toolconfig'

interface LinkedInLayoutProps {
  children: React.ReactNode
  toolConfig: ToolConfig
  showGreeting?: boolean
}

export async function LinkedInLayout({
  children,
  toolConfig,
  showGreeting = true,
}: LinkedInLayoutProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <div className="flex overflow-hidden bg-gray-100">
        <Sidebar user={user} />
        <div className="lg:pl-2 lg:pt-2 bg-gray-100 flex-1 overflow-y-auto">
          <div className="flex-1 bg-white lg:rounded-tl-xl border border-transparent lg:border-neutral-200 overflow-y-auto">
            <Suspense fallback={<LoadingSpinner />}>
              <MainContent
                toolConfig={toolConfig}
                showGreeting={showGreeting}
                user={user}
              >
                {children}
              </MainContent>
            </Suspense>
            <ContentFooter />
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
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  let credits
  if (user && toolConfig.paywall) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    credits = profile.credits
  }

  return (
    <Container>
      {showGreeting && (
        <>
          {/* <span className="text-4xl">👋🏼</span> */}
          <Heading className="font-black mb-10">
            {'LinkedIn Automation'}
          </Heading>
          {/* <Paragraph className="max-w-xl mt-4">
            Input your LinkedIn credentials and the message you want to send to your connections.
          </Paragraph> */}
        </>
      )}
      {children}
    </Container>
  )
}
