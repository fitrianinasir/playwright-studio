import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="h-full antialiased">
      <Head>
        <meta
          name="description"
          content="No-code e2e and Figma visual testing with multi-browser runs and reports."
        />
      </Head>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
