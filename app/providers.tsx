"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { Language, LanguageProvider } from "@/components/language-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  initialLanguage?: Language;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps, initialLanguage }: ProvidersProps) {
  const router = useRouter();
  
  // Виводимо дані для дебагу
  React.useEffect(() => {
    console.log("Providers component mounted");
    console.log("ToastProvider initialized with bottom-right placement");
  }, []);

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <LanguageProvider initialLanguage={initialLanguage}>
          {children}
        </LanguageProvider>
      </NextThemesProvider>
      <ToastProvider 
        maxVisibleToasts={5} 
        placement="bottom-right" 
        toastProps={{ 
          color: "primary", 
          variant: "flat",
          timeout: 5000
        }} 
      />
    </HeroUIProvider>
  );
}
