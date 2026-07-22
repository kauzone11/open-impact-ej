import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import AtlasHubShell from "@/components/hub/AtlasHubShell";
import { PRODUCT } from "@/lib/product";
import "./globals.css";
import "./hub-theme.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });
const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: PRODUCT.name, template: `%s · ${PRODUCT.shortName}` },
  description: PRODUCT.description,
  applicationName: PRODUCT.name,
  openGraph: { title: PRODUCT.name, description: PRODUCT.description, siteName: PRODUCT.name, locale: "pt_BR", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="pt-BR" className={`${manrope.variable} ${dmMono.variable}`}><body><AtlasHubShell publicPaths={["/login", "/convite", "/selecionar-organizacao"]}>{children}</AtlasHubShell></body></html>;
}
