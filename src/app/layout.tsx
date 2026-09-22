import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'Mister Manager OS | Gestão Inteligente de Barbearias',
  description: 'Gestão inteligente para sua barbearia',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} bg-zinc-950 text-white min-h-screen antialiased`}>
        <div className="min-h-screen bg-[#0D0F12] text-zinc-100">{children}</div>
      </body>
    </html>
  );
}