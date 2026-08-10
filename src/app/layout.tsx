import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rev AI — AI Sales Autopilot",
  description: "Your AI-Powered Sales & Automation Team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}
