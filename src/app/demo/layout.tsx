import type { ReactNode } from "react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${inter.className} min-h-full bg-[#f5f5f5] text-[#252525] antialiased`}
    >
      {children}
    </div>
  );
}
