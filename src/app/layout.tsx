import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading', weight: ['500', '600', '700'] });

export const metadata: Metadata = {
  title: 'InversionTracker',
  description: 'Control de inversiones y gastos personales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans h-full bg-slate-50 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
