import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AIBudgetGuard — AI Cost Governance",
    template: "%s | AIBudgetGuard",
  },
  description:
    "Stop surprise AI bills. Real-time cost attribution, budget caps, and Slack alerts for OpenAI, Anthropic, and Gemini. One URL change to deploy.",
  openGraph: {
    title: "AIBudgetGuard — AI Cost Governance",
    description:
      "Real-time spend tracking, budget enforcement, and Slack alerts for AI APIs. One proxy URL. Zero code changes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
