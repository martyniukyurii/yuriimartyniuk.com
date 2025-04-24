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
import Script from "next/script";

import { Providers } from "./providers";

import { fontSans } from "@/config/fonts";
import { SectionProvider } from "@/components/section-provider";
import { FloatingDockDemo } from "@/components/floating-dock-demo";
import { PageTransition } from "@/components/page-transition";
import { PreloadingScreen } from "@/components/PreloadingScreen";
import { TranslatedText } from "@/components/ui/translated-text";

export const metadata: Metadata = {
  title: {
    default: "Юрій Мартинюк | Full Stack Developer",
    template: "%s | Юрій Мартинюк",
  },
  description: "Персональний сайт Юрія Мартинюка - Full Stack розробника з досвідом 5+ років. Експерт з Python, TypeScript, React, Next.js та MongoDB. CTO і співзасновник стартапів Mindex, MediaMood і Vishunka. Громадський активіст і учасник ГО 'Фонд Символи'.",
  keywords: "Юрій Мартинюк, Martyniuk Yurii, Юрій Мартинюк розробник, Python, React, Next.js, MongoDB, TypeScript, JavaScript, Full Stack Developer, Громадський активіст, Фонд Символи, Mindex, MediaMood, Vishunka, програміст",
  authors: [{ name: "Юрій Мартинюк", url: "https://www.linkedin.com/in/yurii-martyniuk-488a72326/" }],
  creator: "Юрій Мартинюк",
  publisher: "Юрій Мартинюк",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: "https://yuriimartyniuk.com",
    title: "Юрій Мартинюк | Full Stack Developer",
    description: "Персональний сайт Юрія Мартинюка - Full Stack розробника з досвідом 5+ років. Експерт з Python, TypeScript, React, Next.js та MongoDB.",
    siteName: "Юрій Мартинюк",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Юрій Мартинюк - Full Stack Developer",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Юрій Мартинюк | Full Stack Developer",
    description: "Персональний сайт Юрія Мартинюка - Full Stack розробника з досвідом 5+ років. Експерт з Python, TypeScript, React, Next.js та MongoDB.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://yuriimartyniuk.com",
    languages: {
      'uk': 'https://yuriimartyniuk.com',
      'en': 'https://yuriimartyniuk.com?lang=en',
    },
  },
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "google-site-verification=your-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning className="overflow-y-auto overflow-x-hidden scroll-smooth">
      <head />
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
        <Script async id="gtag-manager" src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-GA-ID" strategy="afterInteractive" />
        <Script id="gtag-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YOUR-GA-ID');
          `}
        </Script>
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
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
      </body>
    </html>
  );
}
