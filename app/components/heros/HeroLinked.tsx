'use client'
import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import axios from 'axios'

const Hero = () => {
  return (
    <div className="font-sans text-gray-800">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowToSection />
        <PricingSection />
        <ContactSection />
      </main>

      {/* フッター */}
      <Footer />
    </div>
  )
}

// ヘッダーコンポーネント
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { useAtom } from 'jotai'
import { profileAtom } from '@/lib/atom'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const [profile] = useAtom(profileAtom)

  return (
    <header className="fixed top-0 w-full bg-white z-50 shadow-sm h-16 flex items-center justify-between px-4 sm:px-[5%]">
      <div className="logo text-2xl font-bold text-[#0a66c2]">
        Linked<span className="text-gray-800">.</span>
      </div>

      {/* Hamburger menu button for mobile */}
      <button
        className="block md:hidden text-gray-700"
        onClick={toggleMenu}
        aria-label="メニュー"
      >
        <Menu size={24} />
      </button>

      {/* Desktop navigation */}
      <nav className="hidden md:block">
        <ul className="flex items-center gap-6">
          <li className="text-sm font-bold">
            <a href="#features">機能</a>
          </li>
          <li className="text-sm font-bold">
            <a href="#how-to">使い方</a>
          </li>
          <li className="text-sm font-bold">
            <a href="#pricing">料金プラン</a>
          </li>
          <li className="text-sm font-bold">
            <a href="#contact">お問い合わせ</a>
          </li>
          <li>
            {profile ? (
              <a
                href="/dashboard"
                className="bg-[#0a66c2] text-white px-4 py-2 text-sm rounded-full font-bold transition-colors hover:bg-[#004182]"
              >
                ダッシュボード
              </a>
            ) : (
              <a
                href="/auth"
                className="bg-[#0a66c2] text-white px-4 py-2 text-sm rounded-full font-bold transition-colors hover:bg-[#004182]"
              >
                7日間無料トライアル
              </a>
            )}
          </li>
        </ul>
      </nav>

      {/* Mobile navigation dropdown */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white shadow-md md:hidden">
          <ul className="flex flex-col py-2">
            <li className="py-2 px-4 text-sm font-bold">
              <a href="#features" onClick={toggleMenu}>
                機能
              </a>
            </li>
            <li className="py-2 px-4 text-sm font-bold">
              <a href="#how-to" onClick={toggleMenu}>
                使い方
              </a>
            </li>
            <li className="py-2 px-4 text-sm font-bold">
              <a href="#pricing" onClick={toggleMenu}>
                料金プラン
              </a>
            </li>
            <li className="py-2 px-4 text-sm font-bold">
              <a href="#contact" onClick={toggleMenu}>
                お問い合わせ
              </a>
            </li>
            <li className="py-2 px-4">
              <a
                href="/auth"
                className="bg-[#0a66c2] text-white px-4 py-2 text-sm rounded-full font-bold transition-colors hover:bg-[#004182] inline-block"
                onClick={toggleMenu}
              >
                7日間無料トライアル
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}

// ヒーローセクションコンポーネント
const HeroSection = () => {
  return (
    <section className="pt-32 pb-20 text-center bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="max-w-6xl mx-auto px-5">
        <h1 className="text-5xl font-bold mb-5 leading-tight md:text-5xl text-4xl">
          LinkedInのリード獲得を
          <span className="bg-[#0a66c2] text-white px-2 ml-1 leading-relaxed whitespace-nowrap inline-block transform rotate-[-1deg]">
            自動化
          </span>
        </h1>
        <p className="text-xl mb-10 text-gray-600">
          リード抽出からつながり申請、エンゲージメント管理まで
          <br />
          LinkedInマーケティングを自動化するオールインワンツール
        </p>
        <a
          href="/auth"
          className="bg-[#0a66c2] text-white px-6 py-3 rounded-full font-bold transition-colors hover:bg-[#004182]"
        >
          無料で始める
        </a>
        <img
          src={'demo-lead.png'}
          alt="LinkedInマーケティングツールのイメージ"
          className="max-w-[80%] mx-auto block mt-10 rounded-lg shadow-xl"
        />
      </div>
    </section>
  )
}

// 特徴セクションコンポーネント
const FeaturesSection = () => {
  const features = [
    {
      // icon: '📊',
      title: 'リード作成',
      description:
        'キーワード、企業ページなど検索条件に合致するユーザーを検索。プロフィール情報、メールアドレス、職歴、学歴までエクスポートできます。',
    },
    {
      // icon: '🔄',
      title: 'つながり申請の自動化',
      description:
        'ターゲット層に合わせた条件設定で、コンバージョンを最大化する申請・メッセージフローにより効率的にリード獲得をできます。',
    },
    {
      // icon: '👍',
      title: 'エンゲージメント管理',
      description:
        'キーマンの投稿を自動検出しいいね・コメント。あなたの投稿にいいねしたユーザーへの自動いいね・コメントで潜在層の関係構築をサポート。',
    },
  ]

  return (
    <section className="py-20 bg-white" id="features">
      <h2 className="text-4xl font-bold text-center mb-16 relative">
        主な機能
        <span className="absolute bottom-[-15px] left-1/2 transform -translate-x-1/2 w-[60px] h-1 bg-[#0a66c2]"></span>
      </h2>
      <div className="grid md:grid-cols-3 grid-cols-1 gap-10 max-w-6xl mx-auto px-5">
        {features.map((feature, index) => (
          <div
            key={index}
            className="text-center p-8 rounded-lg shadow-md hover:transform hover:-translate-y-3 transition-transform duration-300"
          >
            {/* <div className="text-5xl text-[#0a66c2] mb-5">{feature.icon}</div> */}
            <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// 使い方セクションコンポーネント
const HowToSection = () => {
  const steps = [
    {
      number: 1,
      title: 'ターゲット設定',
      description:
        'キーワード、企業ページ、役職などの検索条件からアプローチしたい企業のユーザーを検索することができます。',
    },
    {
      number: 2,
      title: '自動アプローチ',
      description:
        'つながり申請の自動送信と、キーマンの投稿への自動エンゲージメントで関係構築をサポート。カスタマイズ可能なメッセージテンプレートで高い返信率を実現。',
    },
    {
      number: 3,
      title: '関係構築の自動化',
      description:
        '投稿にいいねしたユーザーを自動検出し、最適なタイミングでDM送信。効率的な関係構築をサポートします',
    },
    {
      number: 4,
      title: 'データ分析と最適化',
      description:
        'アクティビティレポートでコンバージョンを可視化。反応率の高いターゲット層や効果的なメッセージを特定し、戦略を継続的に最適化できます。',
    },
  ]

  return (
    <section className="py-20 bg-gray-100" id="how-to">
      <h2 className="text-4xl font-bold text-center mb-16 relative">
        使い方
        <span className="absolute bottom-[-15px] left-1/2 transform -translate-x-1/2 w-[60px] h-1 bg-[#0a66c2]"></span>
      </h2>
      <div className="max-w-3xl mx-auto px-5">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex md:flex-row flex-col md:text-left text-center items-center mb-16"
          >
            <div className="bg-[#0a66c2] text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold md:mr-8 md:mb-0 mb-4 flex-shrink-0">
              {step.number}
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// 料金プランセクションコンポーネント
const PricingSection = () => {
  const plans = [
    {
      name: 'スターター',
      price: '¥19,800',
      featured: false,
      features: [
        '月100件のつながり申請',
        '基本的な検索エクスポート',
        '5つのフローを保存可能',
        '基本分析機能',
        'メール・チャットサポート',
      ],
      ctaText: '今すぐ始める',
    },
    {
      name: 'プロフェッショナル',
      price: '¥39,800',
      featured: true,
      features: [
        '月500件のつながり申請',
        '高度なデータエクスポート',
        '15つのフローを保存可能',
        '自動エンゲージメント機能',
        '優先サポート（チャット）',
      ],
      ctaText: '今すぐ始める',
    },
    {
      name: 'エンタープライズ',
      price: 'カスタム',
      featured: false,
      features: [
        '無制限のつながり申請',
        '無制限のデータエクスポート',
        '無制限のフローを保存可能',
        '自動エンゲージメント機能',
        '専属コンサルタントによる分析・最適化',
        '優先サポート（チャット）',
      ],
      ctaText: 'デモを予約',
    },
  ]

  return (
    <section className="py-20 bg-white" id="pricing">
      <h2 className="text-4xl font-bold text-center mb-16 relative">
        料金プラン
        <span className="absolute bottom-[-15px] left-1/2 transform -translate-x-1/2 w-[60px] h-1 bg-[#0a66c2]"></span>
      </h2>
      <div className="grid md:grid-cols-3 grid-cols-1 gap-8 max-w-6xl mx-auto px-5">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`border-2 ${plan.featured ? 'border-[#0a66c2]' : 'border-gray-200'} 
                        rounded-lg p-10 text-center transition-all duration-300
                        ${plan.featured ? 'md:transform md:scale-105 md:shadow-xl relative' : ''}`}
          >
            {plan.featured && (
              <div className="absolute top-[-15px] right-8 bg-[#0a66c2] text-white px-4 py-1 rounded-full text-sm font-bold">
                おすすめ
              </div>
            )}
            <h3 className="text-2xl font-semibold mb-5">{plan.name}</h3>
            <div className="text-4xl font-bold mb-5">
              {plan.price}
              <span className="text-base font-normal">/月</span>
            </div>
            <ul className="mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li
                  key={featureIndex}
                  className="py-3 border-b border-dashed border-gray-200"
                >
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className="bg-[#0a66c2] text-white px-6 py-3 rounded-full font-bold inline-block transition-colors hover:bg-[#004182]"
            >
              {plan.ctaText}
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}

const ContactSection = () => {
  const contactFormSchema = yup.object({
    company: yup.string().required('会社名を入力してください'),
    name: yup.string().required('お名前を入力してください'),
    email: yup
      .string()
      .email('有効なメールアドレスを入力してください')
      .required('メールアドレスを入力してください'),
    phone: yup.string().required('電話番号を入力してください'),
    message: yup.string(),
    privacy: yup
      .boolean()
      .oneOf([true], 'プライバシーポリシーに同意してください'),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(contactFormSchema),
  })

  const onSubmit = async (data: any) => {
    try {
      await axios.post('/api/mail', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      alert('メッセージが正常に送信されました。3営業日以内にご返信いたします。')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('メッセージの送信に失敗しました。もう一度お試しください。')
    }
  }

  return (
    <section className="py-20 bg-gray-100" id="contact">
      <div className="max-w-3xl mx-auto px-5">
        <h2 className="text-4xl font-bold text-center mb-16 relative">
          お問い合わせ
          <span className="absolute bottom-[-15px] left-1/2 transform -translate-x-1/2 w-[60px] h-1 bg-[#0a66c2]"></span>
        </h2>
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-10">
          <p className="text-center text-gray-600 mb-8">
            ご質問やサービスに関するお問い合わせは、下記フォームからお気軽にご連絡ください。
            <br />
            通常2営業日以内にご返信いたします。
          </p>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid md:grid-cols-1 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <div className="bg-orange-400 text-white text-xs px-2 py-1 rounded mr-2">
                    必須
                  </div>
                  <label className="block font-medium">会社名</label>
                </div>
                <input
                  type="text"
                  className={`bg-white w-full px-4 py-3 border ${errors.company ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a66c2]`}
                  {...register('company')}
                />
                {errors.company && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.company.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <div className="bg-orange-400 text-white text-xs px-2 py-1 rounded mr-2">
                    必須
                  </div>
                  <label className="block font-medium">お名前</label>
                </div>
                <input
                  type="text"
                  className={`bg-white w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a66c2]`}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <div className="bg-orange-400 text-white text-xs px-2 py-1 rounded mr-2">
                    必須
                  </div>
                  <label className="block font-medium">メールアドレス</label>
                </div>
                <input
                  type="email"
                  className={`bg-white w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a66c2]`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <div className="bg-orange-400 text-white text-xs px-2 py-1 rounded mr-2">
                    必須
                  </div>
                  <label className="block font-medium">電話番号</label>
                </div>
                <input
                  type="tel"
                  className={`bg-white w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a66c2]`}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <div className="bg-gray-400 text-white text-xs px-2 py-1 rounded mr-2">
                    任意
                  </div>
                  <label className="block font-medium">お問い合わせ内容</label>
                </div>
                <textarea
                  className={`bg-white w-full px-4 py-3 border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#0a66c2] h-32`}
                  {...register('message')}
                ></textarea>
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-center mb-6">
                  <p className="text-center text-sm">
                    <a
                      href="https://spaceai.jp/privacy-policy"
                      className="underline text-[#0a66c2]"
                    >
                      プライバシーポリシー
                    </a>
                    、及びお問い合わせにおける個人情報の取扱いについて
                  </p>
                </div>
                <div className="flex justify-center mb-8">
                  <label
                    className={`flex items-center ${errors.privacy ? 'text-red-500' : ''}`}
                  >
                    <input
                      type="checkbox"
                      className={`appearance-none bg-white border border-gray-300 checked:bg-white checked:border-gray-500 mr-2 h-5 w-5 ${errors.privacy ? 'border-red-500' : ''}`}
                      {...register('privacy')}
                    />
                    <span>同意する(必須)</span>
                  </label>
                </div>
                {errors.privacy && (
                  <p className="text-red-500 text-sm text-center mb-4">
                    {errors.privacy.message}
                  </p>
                )}
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="bg-green-200 text-gray-500 px-8 py-4 rounded-full font-bold text-xl w-full max-w-md transition-colors hover:bg-green-300"
                  >
                    送信する
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

// フッターコンポーネント
const Footer = () => {
  const footerLinks = [
    {
      title: 'サービス',
      links: [
        { name: '機能', url: '#features' },
        { name: '使い方', url: '#how-to' },
        { name: '料金プラン', url: '#pricing' },
      ],
    },
    {
      title: '運営情報',
      links: [
        { name: '運営概要', url: 'https://spaceai.jp/company' },
        {
          name: 'プライバシーポリシー',
          url: 'https://spaceai.jp/privacy-policy',
        },
        { name: '利用規約', url: 'https://spaceai.jp/linked/tos' },
        { name: 'セキュリティ', url: 'https://spaceai.jp/security' },
      ],
    },
    {
      title: 'サポート',
      links: [
        { name: 'よくある質問', url: '#faq' },
        { name: 'お問い合わせ', url: '#contact' },
      ],
    },
  ]

  return (
    <footer className="bg-gray-800 text-white py-16 px-[5%]">
      <div className="grid md:grid-cols-4 grid-cols-1 gap-10 max-w-6xl mx-auto">
        <div>
          <div className="text-3xl font-bold mb-5">Linked.</div>
          <p className="mb-5">
            Linked(リンクト)は、LinkedInのリード獲得業務をサポートするオールインワンツールです。
          </p>
        </div>

        {footerLinks.map((column, columnIndex) => (
          <div key={columnIndex}>
            <h4 className="text-xl font-semibold mb-8 relative">
              {column.title}
              <span className="absolute bottom-[-10px] left-0 w-8 h-[3px] bg-[#0a66c2]"></span>
            </h4>
            <ul>
              {column.links.map((link, linkIndex) => (
                <li key={linkIndex} className="mb-3">
                  <a
                    href={link.url}
                    className="hover:text-gray-300 transition-colors"
                    target={link.url.startsWith('http') ? '_blank' : ''}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-center pt-10 mt-10 border-t border-gray-700 text-sm">
        &copy; 2025 Linked. All rights reserved.
      </div>
    </footer>
  )
}

export default Hero
