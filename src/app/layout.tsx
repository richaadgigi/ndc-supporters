import type { Metadata } from 'next';
import '@richaadgigi/stylexui/css/xui.css';
import '@/assets/css/style.css';
import { GeneralProvider } from '@/context/GeneralContext';
import StyleXuiProvider from '@/components/StyleXUIProvider';

export const metadata: Metadata = {
  title: 'NDC Campaign CRM',
  description: 'NDC Campaign Management Portal',
  icons: { icon: '/ndc-logo3.jpeg' },
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
