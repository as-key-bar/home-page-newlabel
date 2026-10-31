'use client'

import React from 'react'
import Link from 'next/link'

interface WorkLink {
  title: string
  url: string
  icon: React.ReactNode
}

const WORK_LINKS: WorkLink[] = [
  {
    title: 'YouTube (東方アレンジ)',
    url: 'https://www.youtube.com/@bazaarrecords',
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    title: 'YouTube (Vocaloid / 歌モノ)',
    url: 'https://www.youtube.com/@newlabelofficial',
    icon: (
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  },
  {
    title: 'X (Twitter)',
    url: 'https://x.com/askey_Azukibar',
    icon: (
      <svg
        className="w-5 h-5 text-gray-700 dark:text-gray-300"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    title: 'サブスク配信リンク',
    url: 'https://lnk.to/4582736134755',
    icon: (
      <svg
        className="w-5 h-5 text-green-600 dark:text-green-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    )
  }
]

export default function PricingAndFlowSection() {
  return (
    <>
      {/* 2. Pricing カード: 制作料金の目安 & 制作の流れ */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            楽曲制作料金の目安
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            ご依頼内容に応じた基本料金の目安です。個人・同人・企業案件を問わず対応しております。
            <br />
            曲の尺や構成、ご予算に応じた柔軟な調整も可能ですので、まずはお気軽にご相談ください。
          </p>
        </div>

        {/* 料金プラン一覧（横長リスト） */}
        <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {/* BGM・インスト楽曲 */}
          <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-start md:items-center">
            <div className="md:col-span-5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-0.5">
                BGM / Instrumental
              </span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                BGM・インスト楽曲
              </h3>
              <div className="mt-1">
                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  40,000円〜
                </span>
                <span className="text-xs text-gray-500 ml-1">（税込）</span>
              </div>
            </div>
            <div className="md:col-span-7">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                ゲームBGM、配信オープニング・エンディング、PV、各種劇伴など。
                <br className="hidden sm:inline" />
                また、作詞を行わない歌モノ楽曲もこちらのプランでご相談いただけます。
              </p>
            </div>
          </div>

          {/* 歌モノ・ボーカル楽曲 */}
          <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-start md:items-center">
            <div className="md:col-span-5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-0.5">
                Vocal Song
              </span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                歌モノ・ボーカル楽曲
              </h3>
              <div className="mt-1">
                <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  70,000円〜
                </span>
                <span className="text-xs text-gray-500 ml-1">（税込）</span>
              </div>
            </div>
            <div className="md:col-span-7">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                VTuberオリジナル曲、ボーカロイド楽曲、同人・商業テーマソングなど。
                <br className="hidden sm:inline" />
                作詞込みの料金です。
              </p>
            </div>
          </div>
        </div>

        {/* 相談ボタン */}
        <div className="pt-6 pb-2 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center py-2.5 px-8 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors shadow-sm"
          >
            ご依頼・お見積りの相談はこちらから
          </Link>
        </div>

        {/* 制作の流れ */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-4">
            制作の流れ
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                Step 1
              </span>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                ご相談・お見積もり
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                用途、希望納期、イメージ参考曲、ご予算感などを伺いお見積もりをご案内します。
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                Step 2
              </span>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                デモ制作・ご確認
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                ワンコーラス等のデモ音源を制作し、楽曲の方向性やメロディをご確認いただきます。
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                Step 3
              </span>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                本制作・ミックス
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                フル尺への展開、細部のアレンジの作り込み、ミックス・マスタリングを行います。
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                Step 4
              </span>
              <div className="text-sm font-bold text-gray-900 dark:text-white">最終確認・納品</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                完成音源をご確認いただき、24bit/48kHz WAV等のご指定形式にて納品いたします。
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Links カード: 外部リンク & 公式チャンネル */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            公式リンク・配信チャンネル
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            YouTubeでのMV公開やサブスク配信、SNSでの告知を行っています。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WORK_LINKS.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors flex items-center gap-3.5 group"
            >
              <div className="flex-shrink-0">{link.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {link.title}
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 text-xs">
                ↗
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* 4. Contact カード: お問い合わせ CTA */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8 border border-gray-200 dark:border-gray-700 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          ご依頼・お見積もりのお問い合わせ
        </h2>
        <p className="text-gray-700 dark:text-gray-300 text-sm max-w-xl mx-auto leading-relaxed mb-6">
          楽曲制作のご依頼やお見積もり、利用に関するご相談など、<br className="hidden sm:inline" />
          お問い合わせフォームまたはX（Twitter）のDMよりお気軽にご連絡ください。
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium py-3 px-8 rounded-lg transition-colors text-sm"
          >
            お問い合わせフォームへ
          </Link>
          <a
            href="https://x.com/askey_Azukibar"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium py-3 px-8 rounded-lg transition-colors text-sm"
          >
            X（Twitter）DMで相談
          </a>
        </div>
      </section>
    </>
  )
}
