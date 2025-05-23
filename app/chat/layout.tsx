import { toolConfig } from './toolConfig'
import { SidebarInset, SidebarProvider } from '@/app/components/ui/sidebar'
import { getSession } from '@/lib/db/cached-queries'
import { UnifiedSidebar } from '../components/dashboard/UnifiedSidebar'

export const metadata = {
  title: toolConfig.metadata.title,
  description: toolConfig.metadata.description,
  openGraph: {
    images: [toolConfig.metadata.og_image],
  },
  alternates: {
    canonical: toolConfig.metadata.canonical,
  },
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  return (
    <SidebarProvider>
      <UnifiedSidebar user={user} showChatHistory={true} />
      <div className="lg:pl-2 lg:pt-2 bg-gray-100 flex-1 overflow-y-auto">
        <SidebarInset
          data-theme="spaceai"
          className="flex-1 bg-white lg:rounded-tl-xl border border-transparent lg:border-neutral-200 overflow-y-auto"
        >
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
