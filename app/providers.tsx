import { Toaster } from '@/app/components/ui/toaster'
import { PHProvider } from '@/lib/services/posthog/provider'

// This needs to be declared so we can use Pixel tracking in the app
declare global {
  interface Window {
    fbq: any
    ttq: any
  }
}

export default async function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="min-h-screen bg-white">
      <PHProvider>
        <body>
          <Toaster />
          {children}
        </body>
      </PHProvider>
    </html>
  )
}
