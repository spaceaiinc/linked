import { companyConfig } from '@/config'

import Navbar from '@/app/components/navbars/Navbar-1'
import FAQ from '@/app/components/faqs/FAQ-1'
import Footer from '@/app/components/footers/Footer-1'
import Section from '@/app/components/Section'
import Features from '@/app/components/features/Features-1'
import Pricing from '@/app/components/pricing/Pricing-1'
import CTA from '@/app/components/ctas/CTA-3'
import Testimonials from '@/app/components/testimonials/Testimonials-1'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div data-theme={companyConfig.company.name}>
      <Navbar
        companyConfig={companyConfig.company!}
        navbarConfig={companyConfig.navbarLanding!}
      />
      <div className="min-h-screen">{children}</div>
      <Section>
        <Features />
        <Testimonials />
      </Section>
      <Pricing />
      <CTA />
      <FAQ />
      <Footer
        companyConfig={companyConfig.company!}
        footerConfig={companyConfig.footerLanding!}
      />
    </div>
  )
}
