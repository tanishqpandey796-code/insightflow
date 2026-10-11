import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/context/app-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlobalModals } from "@/components/layout/global-modals";

export const metadata: Metadata = {
  title: "InsightFlow — Intelligent Customer Feedback & Decision Platform",
  description:
    "Turn raw customer feedback into sentiment, recurring topics, prioritized issues and actionable recommendations with Adaption Adaptive Data cleaning.",
  openGraph: {
    title: "InsightFlow — Intelligent Customer Feedback & Decision Platform",
    description: "Prioritize customer feedback with Adaption Adaptive Data & AI recommendations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <AppProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Header />
              <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
          <GlobalModals />
        </AppProvider>
      </body>
    </html>
  );
}
