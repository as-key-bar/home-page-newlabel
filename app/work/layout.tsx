import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Works & Pricing | .new label - 制作実績・楽曲提供・料金表',
  description: '音楽レーベル「.new label」の制作実績、得意ジャンル、楽曲制作料金表（インスト4万円〜 / 歌モノ7万円〜）。ワンクリックで試聴できるポートフォリオやご依頼ガイドラインを掲載しています。',
  openGraph: {
    title: '.new label - 制作実績・楽曲提供・制作料金表（Works & Price）',
    description: '音楽レーベル「.new label」公式サイト。制作実績、得意ジャンル、楽曲制作料金表（インスト4万円〜 / 歌モノ7万円〜）を掲載中。',
    url: 'https://newlabel.jp/work',
    siteName: '.new label',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/images/newlabel_logo.png',
        width: 1200,
        height: 630,
        alt: '.new label Works & Pricing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '.new label - 制作実績・楽曲提供・制作料金表（Works & Price）',
    description: '音楽レーベル「.new label」公式サイト。制作実績、得意ジャンル、楽曲制作料金表（インスト4万円〜 / 歌モノ7万円〜）を掲載中。',
    creator: '@askey_Azukibar',
    images: ['/images/newlabel_logo.png'],
  },
}

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

