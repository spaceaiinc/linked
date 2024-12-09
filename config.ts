/// Core Website config
export const companyConfig = {
  ////// Base config used mainly for layout (@/components/navbar/Navbar-1.tsx and @/components/footer/Footer-1.tsx)
  company: {
    name: "Space AI",
    theme: "default",
    homeUrl: "https://lab.spaceai.jp",
    appUrl: "/",
    description: "Lab is a platform that helps your business grow.",
    logo: "/logo.png",
    navbarLinks: [],
  },

  ////// UI config
  navbarLanding: {
    bgColor: "base-100",
    textColor: "base-content",
    buttonColor: "primary",
  },

  footerLanding: {
    bgColor: "base-200",
    textColor: "base-content",
  },
};

/// Core Website config
const productionUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://lab.spaceai.jp";
export const companyName = "Space AI";
export const defaultTitle =
  "Lab - Platform that helps your business grow";
export const defaultDescription =
  "Lab is a platform that helps your business grow.";
export const defaultKeywords =
  "openai, gpt-3, ai app, ai, artificial intelligence, machine learning, deep learning, nlp, natural language processing, text generation, text completion, text classification, text summarization, text translation, text to speech, speech recognition, image recognition, image generation, image editing, image classification, image segmentation, image enhancement, image compression, image super-resolution, image synthesis, image-to-image translation, image captioning, image colorization, image denoising, image inpainting, image restoration, image style transfer, image watermarking, image recognition, image generation, image editing, image classification, image segmentation, image enhancement, image compression, image super-resolution, image synthesis, image-to-image translation, image captioning, image colorization, image denoising, image inpainting, image restoration, image style transfer, image watermarking";
export const defaultOgImage = "/og.png";
export const favicon = "/favicon.ico";

// LEGAL STUFF
export const privacyPolicyUrl = "https://spaceai.jp/privacy-policy";
export const tosUrl = "https://spaceai.jp/lab/tos";
export const securityUrl = "https://spaceai.jp/security";

// Auth
export const authImage = "/hero.webp";

// Inside routing
export const homePage = "/home";
const getRedirectUrl = () => {
  return `${productionUrl}/auth/confirm?next=/home`
};

export const redirectTo = getRedirectUrl();
