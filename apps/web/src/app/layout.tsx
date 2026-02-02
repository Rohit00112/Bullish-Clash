import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
    title: 'Bullish Clash - Nepal Stock Trading Simulator',
    description: 'Real-time NEPSE stock trading competition simulator',
    keywords: ['NEPSE', 'Nepal', 'stock', 'trading', 'simulator', 'competition'],
};

// Script to prevent flash of wrong theme
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'system') {
      if (!window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.remove('dark');
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className="font-sans antialiased">
                <Providers>
                    {children}
                    <Toaster />
                </Providers>
            </body>
        </html>
    );
}
