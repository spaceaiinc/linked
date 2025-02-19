// Please read the @/lib/types/toolconfig file for more details on each field.
import { ToolConfig } from '@/lib/types/toolconfig'

export const toolConfig: ToolConfig = {
  ////// Base config
  company: {
    name: 'Linked',
    theme: '',
    homeUrl: '/',
    appUrl: '/dashboard',
    description: 'LinkedIn Automation',
    logo: 'https://cdn2.iconfinder.com/data/icons/privacy-policy/512/privacy-data-policy-security-05-512.png',
    navbarLinks: [
      // { label: 'App', href: `/dashboard` },
      // { label: 'Home', href: '/' },
    ],
  },
  ////// SEO stuff
  metadata: {
    title: 'LinkedIn Automation | Space AI',
    description: 'LinkedIn Automation',
    og_image: 'https://linked.spaceai.jp/og.png',
    canonical: 'https://linked.spaceai.jp/dashboard',
  },

  ////// Paywall
  paywall: true,
  credits: 5,

  ////// Location
  toolPath: '(apps)/linkedin',

  ////// AI config
  aiModel: '',
  systemMessage: '',

  ////// Form input
  type: 'groq',
  fields: [],
  submitText: '実行',
  submitTextGenerating: '実行中',
  responseTitle: '処理が完了しました',
  responseSubTitle: '',

  ////// UI config
  navbarLanding: {
    bgColor: 'primary',
    textColor: 'white',
    buttonColor: 'accent',
  },

  navbarApp: {
    bgColor: 'base-100',
    textColor: 'text-base-content',
    buttonColor: 'accent',
  },

  footerLanding: {
    bgColor: 'accent',
    textColor: 'white',
  },

  footerApp: {
    bgColor: 'accent',
    textColor: 'white',
  },
}
