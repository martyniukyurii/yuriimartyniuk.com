import "./globals.css";
import { Metadata } from "next";
import { 
  IconBrandFacebook, 
  IconBrandGithub,
  IconBrandInstagram, 
  IconBrandLinkedin, 
  IconBrandTelegram, 
  IconMail
} from "@tabler/icons-react";
import Link from "next/link";
import { headers } from "next/headers";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

import { Providers } from "./providers";

import { fontSans } from "@/config/fonts";
import { SectionProvider } from "@/components/section-provider";
import { FloatingDockDemo } from "@/components/floating-dock-demo";
import { PageTransition } from "@/components/page-transition";
import { PreloadingScreen } from "@/components/PreloadingScreen";
import { TranslatedText } from "@/components/ui/translated-text";
import { LANGUAGE_HEADER, PATHNAME_HEADER, isSiteLanguage } from "@/lib/language-detection";
import { SITE_URL, localizedUrl, seoContent } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const headerLanguage = requestHeaders.get(LANGUAGE_HEADER);
  const language = isSiteLanguage(headerLanguage) ? headerLanguage : "uk";
  const pathname = requestHeaders.get(PATHNAME_HEADER) || "/";
  const seo = seoContent[language];
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.title,
      template: `%s | ${seo.name}`,
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: seo.name, url: "https://www.linkedin.com/in/yurii-martyniuk-488a72326/" }],
    creator: seo.name,
    publisher: seo.name,
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      locale: seo.ogLocale,
      alternateLocale: seoContent[language === "uk" ? "en" : "uk"].ogLocale,
      url: pathname,
      title: seo.title,
      description: seo.description,
      siteName: seo.name,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: seo.ogImageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: ["/og-image.jpg"],
    },
    category: "technology",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    ...(googleVerification && { verification: { google: googleVerification } }),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const detectedLanguage = requestHeaders.get(LANGUAGE_HEADER);
  const language = isSiteLanguage(detectedLanguage) ? detectedLanguage : "uk";
  const pathname = requestHeaders.get(PATHNAME_HEADER) || "/";

  return (
    <html suppressHydrationWarning className="overflow-y-auto overflow-x-hidden scroll-smooth" lang={language}>
      <head>
        {/* canonical і hreflang вручну: Next.js відкидає ?lang= у metadata для кореня сайту */}
        {!pathname.startsWith("/blog/") && (
          <>
            <link href={localizedUrl(pathname, language)} rel="canonical" />
            <link href={localizedUrl(pathname, "uk")} hrefLang="uk" rel="alternate" />
            <link href={localizedUrl(pathname, "en")} hrefLang="en" rel="alternate" />
            <link href={new URL(pathname, SITE_URL).toString()} hrefLang="x-default" rel="alternate" />
          </>
        )}
      </head>
      <body
        className={`min-h-screen bg-background font-sans antialiased overflow-y-auto overflow-x-hidden ${fontSans.variable}`}
      >
        <Script id="scroll-to-top">
          {`
            if (typeof window !== 'undefined') {
              window.onload = function() {
                window.scrollTo(0, 0);
              }
              
              window.history.scrollRestoration = 'manual';
              
              if (location.hash) {
                setTimeout(function() {
                  window.scrollTo(0, 0);
                }, 1);
              }
            }
          `}
        </Script>
        <Providers initialLanguage={language} themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <SectionProvider>
            <PreloadingScreen />
            <div className="relative flex flex-col min-h-screen">
              <main className="flex-grow">
                {children}
              </main>
              <FloatingDockDemo id="main-floating-dock" />
              <PageTransition />
              <footer className="w-full flex items-center py-3 px-4 md:px-10 bg-black/30 backdrop-blur-sm border-t border-gray-800/20">
                <div className="w-full flex flex-col md:flex-row md:items-center">
                  <div className="w-full md:w-1/3 flex justify-start md:justify-start" />
                  <div className="w-full md:w-1/3 flex justify-start md:justify-center mb-2 md:mb-0">
                    <p className="text-gray-400 dark:text-white font-medium">
                      © {new Date().getFullYear()} Yurii Martyniuk. <TranslatedText translationKey="footer.rights" />
                    </p>
                  </div>
                  <div className="w-full md:w-1/3 flex justify-start md:justify-end mt-3 md:mt-0">
                    <div className="flex items-center gap-4">
                      <Link aria-label="GitHub" href="https://github.com/martyniukyurii" rel="noopener noreferrer" target="_blank">
                        <IconBrandGithub className="text-gray-400 dark:text-white hover:opacity-70 transition-opacity" size={20} />
                      </Link>
                      <Link aria-label="LinkedIn" href="https://www.linkedin.com/in/yurii-martyniuk-488a72326/" rel="noopener noreferrer" target="_blank">
                        <IconBrandLinkedin className="text-gray-400 dark:text-white hover:opacity-70 transition-opacity" size={20} />
                      </Link>
                      <Link aria-label="Instagram" href="https://www.instagram.com/georg6262/" rel="noopener noreferrer" target="_blank">
                        <IconBrandInstagram className="text-gray-400 dark:text-white hover:opacity-70 transition-opacity" size={20} />
                      </Link>
                      <Link aria-label="Facebook" href="https://www.facebook.com/yuriimartyniukofficial/" rel="noopener noreferrer" target="_blank">
                        <IconBrandFacebook className="text-gray-400 dark:text-white hover:opacity-70 transition-opacity" size={20} />
                      </Link>
                      <Link aria-label="Telegram" href="https://t.me/gay_control" rel="noopener noreferrer" target="_blank">
                        <IconBrandTelegram className="text-gray-400 dark:text-white hover:opacity-70 transition-opacity" size={20} />
                      </Link>
                      <Link aria-label="Email" href="mailto:yura.martin@icloud.com">
                        <IconMail className="text-gray-400 dark:text-white hover:opacity-70 transition-opacity" size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </SectionProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
