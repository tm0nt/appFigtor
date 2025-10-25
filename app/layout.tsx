import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "sonner"
import { Providers } from "./providers"
import { ServiceWorkerRegister } from "./service-worker-register"

const inter = Inter({ subsets: ["latin"] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://app.figtor.com.br"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#90F209",
  colorScheme: "dark",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Figtor — Converter Figma em JSON para Elementor",
    template: "%s | Figtor",
  },
  description:
    "Converta arquivos do Figma em JSON otimizado para Elementor. Acelere a construção de páginas no WordPress com fidelidade de design.",
  keywords: [
    "Figtor",
    "Figma para JSON",
    "Figma para Elementor",
    "Converter Figma",
    "Elementor JSON",
    "WordPress",
    "Design to code",
  ],
  authors: [{ name: "Figtor" }],
  creator: "Figtor",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Figtor",
    title: "Figtor — Converter Figma em JSON para Elementor",
    description:
      "Converta layouts do Figma em JSON pronto para Elementor e lance páginas no WordPress muito mais rápido.",
    url: SITE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Figtor — Figma para JSON",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Figtor — Figma em JSON para Elementor",
    description:
      "Do Figma ao Elementor em minutos. Gere JSON fiel ao design.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased ${inter.className}`}>
        <ServiceWorkerRegister />
        <Providers>
          {children}
          <Analytics />
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: "#0f0f0f",
                color: "#ffffff",
                border: "1px solid #262626",
              },
            }}
          />
        </Providers>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Figtor",
              applicationCategory: "DesignApplication",
              operatingSystem: "Web",
              description:
                "Plataforma que converte Figma em JSON pronto para Elementor.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "BRL",
              },
              url: SITE_URL,
            }),
          }}
        />
      </body>
    </html>
  )
}
