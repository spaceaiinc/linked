/// Core Website config
export const companyConfig = {
  ////// Base config used mainly for layout (@/components/navbar/Navbar-1.tsx and @/components/footer/Footer-1.tsx)
  company: {
    name: 'Linked',
    theme: 'default',
    homeUrl: 'https://linked.spaceai.jp',
    appUrl: '/',
    description: 'Linked is a platform that helps your business grow.',
    logo: '/',
    navbarLinks: [],
  },

  ////// UI config
  navbarLanding: {
    bgColor: 'base-100',
    textColor: 'base-content',
    buttonColor: 'primary',
  },

  footerLanding: {
    bgColor: 'base-200',
    textColor: 'base-content',
  },
}

/// Core Website config
const productionUrl =
  process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://linked.spaceai.jp'
export const companyName = 'Linked'
export const defaultTitle = 'Linked(リンクト) | LinkedInリード獲得支援サービス'
export const defaultDescription =
  'Linked(リンクト)は、LinkedInリード獲得支援サービスです。'
export const defaultKeywords =
  'linkedin, リード獲得, リード獲得支援, リード獲得支援サービス, SNS運用, SNS運用代行, SNS運用支援, SNS運用支援サービス'
export const defaultOgImage = '/og.png'
export const favicon = '/favicon.ico'

// LEGAL STUFF
export const privacyPolicyUrl = 'https://spaceai.jp/ja/privacy-policy'
export const tosUrl = 'https://spaceai.jp/linked/tos'
export const securityUrl = 'https://spaceai.jp/ja/security'

// Inside routing
export const homePage = '/'
const getRedirectUrl = (next: string) => {
  return `${productionUrl}/auth/confirm?next=/dashboard`
}

export const redirectTo = getRedirectUrl

// Modal redirect with specific next path
export const redirectToModal = (next?: string) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_PRODUCTION_URL || 'https://linked.spaceai.jp'
  return next
    ? `${baseUrl}/auth/confirm?next=${next}`
    : `${baseUrl}/auth/confirm?next=/dashboard`
}
