import type { AppProps } from "next/app";
import Head from "next/head";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { useRouter } from "next/router";
import { Providers } from "@/components/providers";
import { StudioShell } from "@/components/studio/studio-shell";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDemo = router.pathname.startsWith("/demo");

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} flex min-h-full flex-1 flex-col antialiased`}
    >
      <Head>
        <title>Playwright Studio — Visual-Testing-Automation</title>
      </Head>
      <Providers>
        {isDemo ? (
          <div
            className={`${inter.className} min-h-full bg-[#f5f5f5] text-[#252525] antialiased`}
          >
            <Component {...pageProps} />
          </div>
        ) : (
          <StudioShell>
            <Component {...pageProps} />
          </StudioShell>
        )}
      </Providers>
    </div>
  );
}
