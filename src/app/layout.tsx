import type { Metadata } from 'next';
import '@richaadgigi/stylexui/css/xui.css';
import '@/assets/css/style.css';
import { GeneralProvider } from '@/context/GeneralContext';
import StyleXuiProvider from '@/components/StyleXUIProvider';

export const metadata: Metadata = {
  title: 'The Dickson Movement (TDM)',
  description: 'The Dickson Movement administration dashboard',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <StyleXuiProvider>
          <GeneralProvider>{children}</GeneralProvider>
        </StyleXuiProvider>
      </body>
    </html>
  );
}
