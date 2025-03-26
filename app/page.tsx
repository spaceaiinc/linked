import { toolConfig } from './toolConfig'
import Hero from '@/app/components/heros/HeroLinked'

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

export default function Page() {
  return (
    <>
      <Hero />
    </>
  )
}
