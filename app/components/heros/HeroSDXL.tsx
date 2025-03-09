import SocialProof from '@/app/components/socialproof/SocialProof'
import { MailIcon } from 'lucide-react'

export default function Hero() {
  return (
    <>
      {' '}
      <div className="relative text-white-content bg-white">
        <div className="absolute inset-x-0 bottom-0">
          <svg
            viewBox="0 0 224 12"
            fill="currentColor"
            className="w-full -mb-1 text-base-100"
            preserveAspectRatio="none"
          >
            <path d="M0,0 C48.8902582,6.27314026 86.2235915,9.40971039 112,9.40971039 C137.776408,9.40971039 175.109742,6.27314026 224,0 L224,12.0441132 L0,12.0441132 L0,0 Z" />
          </svg>
        </div>
        <div className="px-4 py-16 sm:max-w-xl md:max-w-4xl lg:max-w-4xl md:px-24 lg:px-16 lg:py-20">
          <h2 className="text-5xl font-bold leading-tight"> Linked</h2>
          <h1 className="mt-4 mb-8">LinkedInマーケティングを自動化！</h1>
          <div className="max-w-md flex rounded-lg overflow-hidden">
            <div className="flex-grow flex-shrink flex items-center">
              <div className="flex md:flex-row flex-col items-center space-x-4">
                <a className="btn btn-accent hover:bg-white/80 w-64 text-accent-content bg-transparent border border-white text-white">
                  <MailIcon className="w-6 h-6" />
                  お問い合わせ
                </a>
                {/* <a className="btn btn-ghost text-content" href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </a> */}
              </div>
            </div>
          </div>
          <div className="mt-5 flex  ">
            <SocialProof
              text={'Powered by Trusted Services'}
              color={'text-base-100'}
            />
          </div>
          {/* <p className="max-w-mdtext-xs font-thin tracking-wide sm:text-sm">
            LinkedIn Automation Tool for Marketing, Sales, and Growth Hacking.
          </p> */}
        </div>

        <div className="lg:w-full flex flex-col items-center justify-center gap-10">
          <div className="flex flex-row">
            <div className="flex justify-center items-center">
              <video
                className="rounded-3xl w-full sm:w-[60rem] border-4 md:border-8 border-base-content/20"
                autoPlay
                muted
                loop
                playsInline
                controls
                width="1000"
              >
                <source
                  src="https://d3cka28z30w0vx.cloudfront.net/newfulldemo.mp4"
                  type="video/webm"
                />
                <source
                  src="https://d3cka28z30w0vx.cloudfront.net/newfulldemo.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
