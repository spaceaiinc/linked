// Please read the @/lib/types/toolconfig file for more details on each field.
import { ToolConfig } from '@/lib/types/toolconfig'

export const toolConfig: ToolConfig = {
  ////// Base config
  company: {
    name: 'プロフィール検索',
    theme: 'default',
    homeUrl: '/',
    appUrl: '/search',
    description: 'LinkedIn Automation',
    logo: 'https://cdn2.iconfinder.com/data/icons/privacy-policy/512/privacy-data-policy-security-05-512.png',
    navbarLinks: [
      { label: 'App', href: `/search` },
      { label: 'Home', href: '/' },
      // { label: 'Other apps', href: '/apps' },
      // { label: 'Blog', href: '/blog' },
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
  fields: [
    {
      label: 'Search URL',
      name: 'search_url',
      type: 'input',
      placeholder: '',
      required: false,
      custom: true,
    },
    {
      label: 'File URL',
      name: 'file_url',
      type: 'input',
      placeholder: '',
      required: false,
      custom: true,
    },
    {
      label: 'URLリスト',
      name: 'target_account_urls',
      type: 'textarea',
      placeholder: '',
      required: false,
      custom: true,
    },
    {
      label: 'キーワード',
      name: 'keywords',
      type: 'input',
      placeholder: '',
      required: false,
      custom: true,
    },
    {
      label: '検索数',
      name: 'limit',
      type: 'input',
      inputType: 'number',
      placeholder: '10',
      required: false,
    },
  ],
  submitText: '実行',
  submitTextGenerating: '実行中',
  responseTitle: '処理が完了しました',
  responseSubTitle: '',

  ////// UI config
  navbarLanding: {
    bgColor: 'primary',
    textColor: 'text-neutral',
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
