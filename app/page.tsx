import Section from '@/app/components/Section'
import Navbar from '@/app/components/navbars/Navbar-1'
import Hero from '@/app/components/heros/HeroWhisper'
import Features from '@/app/components/features/Features-1'
import Pricing from '@/app/components/pricing/Pricing-1'
import CTA from '@/app/components/ctas/CTA-1'
import FAQ from '@/app/components/faqs/FAQ-1'
import Footer from '@/app/components/footers/Footer-1'
import Testimonials from '@/app/components/testimonials/Testimonials-1'

import { toolConfig } from './toolConfig'
import LinkedinMarketingTool from '@/app/components/heros/LinkedinMarketingTool'

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
      <LinkedinMarketingTool />
      {/* <div data-theme={toolConfig.company.theme}>
        <Navbar
          companyConfig={toolConfig.company!}
          navbarConfig={toolConfig.navbarLanding!}
        />
        <Hero />
        <Section>
          <Features />
          <Testimonials />
        </Section>
        <Pricing />
        <CTA />
        <FAQ />
        <Footer
          companyConfig={toolConfig.company!}
          footerConfig={toolConfig.footerLanding!}
        />
      </div> */}
    </>
  )
}
