"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { siteConfig } from "@/lib/config";
export function Providers({ children }: { children: React.ReactNode }) {
  return siteConfig.authEnabled ? (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#BEDD76",
          colorBackground: "#171e3c",
          colorForeground: "#FBFCFD",
          colorMutedForeground: "#c2c8dd",
          colorInput: "#202955",
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
