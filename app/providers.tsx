"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LanguageProvider } from "@/components/language-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  
  // Виводимо дані для дебагу
  React.useEffect(() => {
    console.log("Providers component mounted");
    console.log("ToastProvider initialized with bottom-right placement");
  }, []);

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </NextThemesProvider>
      <ToastProvider 
        placement="bottom-right" 
        maxVisibleToasts={5} 
        toastProps={{ 
          color: "primary", 
          variant: "flat",
          timeout: 5000
        }} 
      />
    </HeroUIProvider>
  );
}
