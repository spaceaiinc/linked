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
export const defaultTitle = 'Linked - Platform that helps your business grow'
export const defaultDescription =
  'Linked is a platform that helps your business grow.'
export const defaultKeywords =
  'openai, gpt-3, ai app, ai, artificial intelligence, machine learning, deep learning, nlp, natural language processing, text generation, text completion, text classification, text summarization, text translation, text to speech, speech recognition, image recognition, image generation, image editing, image classification, image segmentation, image enhancement, image compression, image super-resolution, image synthesis, image-to-image translation, image captioning, image colorization, image denoising, image inpainting, image restoration, image style transfer, image watermarking, image recognition, image generation, image editing, image classification, image segmentation, image enhancement, image compression, image super-resolution, image synthesis, image-to-image translation, image captioning, image colorization, image denoising, image inpainting, image restoration, image style transfer, image watermarking'
export const defaultOgImage = '/og.png'
export const favicon = '/favicon.ico'

// LEGAL STUFF
export const privacyPolicyUrl = 'https://spaceai.jp/privacy-policy'
export const tosUrl = 'https://spaceai.jp/linked/tos'
export const securityUrl = 'https://spaceai.jp/security'

// Auth
export const authImage = '/hero.webp'

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
