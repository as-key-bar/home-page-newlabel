import type { Metadata } from "next";
import { Josefin_Sans, Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://newlabel.jp'),
  title: {
    default: '.new label - official website / 音楽制作・楽曲提供・料金表',
    template: '%s | .new label'
  },
  description: '外連味ある展開と大胆なアレンジ、キャッチーかつ斬新な音像。音楽レーベル「.new label」の公式ウェブサイト。楽曲試聴、制作実績、制作料金表（インスト4万円〜 / 歌モノ7万円〜）掲載中。',
  openGraph: {
    title: '.new label - 公式HP & 楽曲制作料金表・実績ポートフォリオ',
    description: '音楽レーベル「.new label」公式サイト。制作実績、得意ジャンル、楽曲制作の料金表（インスト4万円〜/歌モノ7万円〜）を掲載中。',
    url: 'https://newlabel.jp',
    siteName: '.new label',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/images/newlabel_logo.png',
        width: 1200,
        height: 630,
        alt: '.new label official website & price list',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '.new label - 公式HP & 楽曲制作料金表・実績ポートフォリオ',
    description: '音楽レーベル「.new label」公式サイト。制作実績、得意ジャンル、楽曲制作の料金表（インスト4万円〜/歌モノ7万円〜）を掲載中。',
    creator: '@askey_Azukibar',
    images: ['/images/newlabel_logo.png'],
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon-16x16.png',
        type: 'image/png',
        sizes: '16x16',
      },
      {
        url: '/favicon-32x32.png',
        type: 'image/png', 
        sizes: '32x32',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
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
              (function(d) {
                var config = {
                  kitId: 'vdw7vhg',
                  scriptTimeout: 3000,
                  async: true
                },
                h=d.documentElement,t=setTimeout(function(){h.className=h.className.replace(/\\bwf-loading\\b/g,"")+" wf-inactive";},config.scriptTimeout),tk=d.createElement("script"),f=false,s=d.getElementsByTagName("script")[0],a;h.className+=" wf-loading";tk.src='https://use.typekit.net/'+config.kitId+'.js';tk.async=true;tk.onload=tk.onreadystatechange=function(){a=this.readyState;if(f||a&&a!="complete"&&a!="loaded")return;f=true;clearTimeout(t);try{Typekit.load(config)}catch(e){}};s.parentNode.insertBefore(tk,s)
              })(document);
            `,
          }}
        />
      </head>
      <body
        className={`${josefinSans.variable} ${geistMono.variable} ${notoSansJP.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
