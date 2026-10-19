import type { SiteLanguage } from "@/lib/language-detection";

export const SITE_URL = "https://www.yuriimartyniuk.com";

// Тексти для пошукових систем і соцмереж окремо для кожної мови
export const seoContent: Record<SiteLanguage, {
  name: string;
  title: string;
  description: string;
  keywords: string[];
  ogLocale: string;
  ogImageAlt: string;
}> = {
  uk: {
    name: "Юрій Мартинюк",
    title: "Юрій Мартинюк | Full Stack Developer",
    description: "Персональний сайт Юрія Мартинюка — Full Stack розробника з досвідом 5+ років. Python, TypeScript, React, Next.js та MongoDB. CTO і співзасновник стартапів Mindex, MediaMood і Vishunka. Громадський активіст ГО «Фонд Символи».",
    keywords: ["Юрій Мартинюк", "Yurii Martyniuk", "Full Stack розробник", "Python розробник", "React", "Next.js", "MongoDB", "TypeScript", "Фонд Символи", "Mindex", "MediaMood", "Vishunka", "програміст Чернівці"],
    ogLocale: "uk_UA",
    ogImageAlt: "Юрій Мартинюк — Full Stack Developer",
  },
  en: {
    name: "Yurii Martyniuk",
    title: "Yurii Martyniuk | Full Stack Developer",
    description: "Personal website of Yurii Martyniuk — a Full Stack developer with 5+ years of experience in Python, TypeScript, React, Next.js and MongoDB. CTO and co-founder of Mindex, MediaMood and Vishunka. Civic activist at the Symvoly Foundation.",
    keywords: ["Yurii Martyniuk", "Юрій Мартинюк", "Full Stack Developer", "Python developer", "React", "Next.js", "MongoDB", "TypeScript", "Ukrainian developer", "Mindex", "MediaMood", "Vishunka"],
    ogLocale: "en_US",
    ogImageAlt: "Yurii Martyniuk — Full Stack Developer",
  },
};

// Адреса сторінки конкретною мовою: ?lang= фіксує мову незалежно від IP і браузера
// Абсолютна адреса: відносну Next.js нормалізує й губить ?lang=
export function localizedUrl(pathname: string, language: SiteLanguage) {
  const url = new URL(pathname, SITE_URL);

  url.searchParams.set("lang", language);

  return url.toString();
}
