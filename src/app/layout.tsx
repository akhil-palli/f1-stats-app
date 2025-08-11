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
  title: "F1 Stats Dashboard",
  description: "Comprehensive F1 2025 Season Dashboard with real-time data and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress hydration warnings for browser extensions
              if (typeof window !== 'undefined') {
                const originalConsoleError = console.error;
                console.error = (...args) => {
                  const message = args[0];
                  if (
                    typeof message === 'string' &&
                    (
                      message.includes('data-darkreader') ||
                      message.includes('data-gr-ext') ||
                      message.includes('data-new-gr-c-s-check-loaded') ||
                      message.includes('A tree hydrated but some attributes of the server rendered HTML')
                    )
                  ) {
                    return;
                  }
                  originalConsoleError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-800 text-white`}
        suppressHydrationWarning
      >
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
