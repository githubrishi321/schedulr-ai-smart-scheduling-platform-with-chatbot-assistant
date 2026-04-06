import { Syne, DM_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/components/Providers';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata = {
  title: { default: 'Schedulr — Smart Scheduling, Simplified', template: '%s | Schedulr' },
  description: 'Book meetings effortlessly. Share your link, let others pick a time, and get back to what matters.',
  keywords: ['scheduling', 'calendar', 'meetings', 'booking', 'calendly alternative'],
  openGraph: {
    title: 'Schedulr — Smart Scheduling, Simplified',
    description: 'Book meetings effortlessly with Schedulr.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-sans antialiased bg-[#0F0F1A] text-[#F0F0FF]">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A1A2E',
              color: '#F0F0FF',
              border: '1px solid #2E2E50',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#10B981', secondary: '#1A1A2E' } },
            error: { iconTheme: { primary: '#EF4444', secondary: '#1A1A2E' } },
          }}
        />
      </body>
    </html>
  );
}
