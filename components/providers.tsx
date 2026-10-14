"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/lib/config";
export function Providers({ children }: { children: React.ReactNode }) {
  return siteConfig.authEnabled ? (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#BEDD76",
          colorPrimaryForeground: "#171717",
          colorBackground: "#171717",
          colorForeground: "#FBFCFD",
          colorMutedForeground: "#c4c4c4",
          colorInput: "#292929",
          colorInputForeground: "#FBFCFD",
          borderRadius: "12px",
        },
      }}
    >
      {children}
    </ClerkProvider>
  ) : (
    children
  );
}
