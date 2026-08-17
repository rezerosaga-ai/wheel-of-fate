import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import AnalyticsClient from '@/components/AnalyticsClient';
import './globals.css';
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: 'Wheel of Fate 🎡❤️ — عبدو × أنفال',
  description: 'لعبة علاقة تفاعلية خاصة لشخصين — أسئلة ذات معنى وتجربة قرب حقيقية',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'عجلة الحظ',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#E88FA0',
  viewportFit: 'cover',
};


// FIX: fetch the session server-side and pass it to SessionProvider — the
// client-side session fetch inside next-auth crashes static prerendering of
// the builtin error pages ("Cannot read properties of null (reading 'useState')").
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        {/* Apple PWA meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="عجلة الحظ" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        {/* Splash screen color */}
        <meta name="msapplication-TileColor" content="#E88FA0" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
      </head>
      <body>
        <Providers session={session}>{children}</Providers>
        <AnalyticsClient />
        {/* Register Service Worker */}
        <script key="sw-register" type="text/javascript" dangerouslySetInnerHTML={{ __html: "if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) { console.log('SW registered:', reg.scope); }).catch(function(err) { console.log('SW error:', err); }); }); }" }} />
      </body>
    </html>
  );
}
