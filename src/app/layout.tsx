import type { Metadata } from "next";

import localFont from "next/font/local";

import Header from "@/components/common/Header";
import { AuthProvider } from "@/lib/auth/AuthProvider";

import "@/styles/main.scss";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "Daily Mood Diary",
  description: "Daily Mood Diary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        <nav id="skip">
          <ul>
            <li>
              <a href="#content">본문 콘텐츠 바로가기</a>
            </li>
            {/* <li>
              <a href="#footer">푸터 바로가기</a>
            </li> */}
          </ul>
        </nav>
        <AuthProvider>
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
