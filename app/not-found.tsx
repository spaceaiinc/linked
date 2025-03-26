import { Dock, DockIcon } from '@/app/components/magicui/dock'
import { HomeIcon } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <section className="relative bg-base-100 text-base-content h-screen w-full flex flex-col justify-center gap-8 items-center p-10">
      <div className="relative flex h-[500px] w-full max-w-[32rem] flex-col items-center justify-center overflow-hidden rounded-lg">
        <p className="text-lg md:text-xl font-semibold">404 - Page Not Found</p>
        <Dock>
          <DockIcon href="/">
            <HomeIcon className="h-6 w-6" />
          </DockIcon>
        </Dock>
      </div>
    </section>
  )
}
