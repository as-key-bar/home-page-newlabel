'use client'

import React, { memo } from 'react'
import { Profile } from '../../lib/firestore'

interface ProfileSectionProps {
  profile: Profile | null
  songsCount: number
  isAtBottom: boolean
  isVisible: boolean
}

function ProfileCard({
  profile,
  interactive
}: {
  profile: Profile
  interactive: boolean
}) {
  return (
    <section
      className={`${
        interactive
          ? 'bg-transparent pointer-events-auto'
          : 'bg-white/90 rounded-lg shadow-md select-text cursor-auto'
      } p-3 w-full max-w-3xl mx-auto`}
    >
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center">
        Profile
      </h2>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* プロフィール画像 */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-sm">画像</span>
            </div>
          )}
        </div>

        {/* プロフィール情報 */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {profile.name}
          </h3>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            {profile.bio}
          </p>

          <div className="mb-2">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              得意ジャンル
            </h4>
            <div className="flex flex-wrap gap-2">
              {profile.genres.map((genre, index) => (
                <span
                  key={index}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {profile.equipment && (
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                使用機材・ソフト
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-xs">
                {profile.equipment}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              連絡先
            </h4>
            <div className="flex gap-4 flex-wrap">
              {profile.contact.email && (
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  Email
                </a>
              )}
              {profile.contact.twitter && (
                <a
                  href={profile.contact.twitter}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  X/Twitter
                </a>
              )}
              {profile.contact.soundcloud && (
                <a
                  href={profile.contact.soundcloud}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SoundCloud
                </a>
              )}
              {profile.contact.bandcamp && (
                <a
                  href={profile.contact.bandcamp}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bandcamp
                </a>
              )}
              {profile.contact.youtube && (
                <a
                  href={profile.contact.youtube}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </a>
              )}
              {profile.contact.instagram && (
                <a
                  href={profile.contact.instagram}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ナビゲーションボタン群 */}
      {interactive ? (
        <div className="flex flex-col gap-3 justify-center items-center">
          <a
            href="/license"
            className="bg-transparent text-black px-4 py-2 rounded-lg font-medium text-center min-w-[140px] text-sm cursor-pointer"
            style={{ position: 'relative', zIndex: 3010 }}
          >
            楽曲利用規約はこちら
          </a>
          <a
            href="/contact"
            className="bg-transparent text-black px-4 py-2 rounded-lg font-medium text-center min-w-[140px] text-sm cursor-pointer"
            style={{ position: 'relative', zIndex: 3010 }}
          >
            お問い合わせはこちら
          </a>
          <a
            href="/work"
            className="bg-black/90 hover:bg-black text-white px-5 py-2.5 rounded-lg font-semibold text-center min-w-[160px] text-sm cursor-pointer shadow-md transition-all hover:scale-105"
            style={{ position: 'relative', zIndex: 3010 }}
          >
            制作実績・できること・料金表はこちら
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-3 justify-center items-center">
          <div className="bg-transparent text-black px-4 py-2 rounded-lg font-medium text-center min-w-[140px] text-sm">
            楽曲利用規約はこちら
          </div>
          <div className="bg-transparent text-black px-4 py-2 rounded-lg font-medium text-center min-w-[140px] text-sm">
            お問い合わせはこちら
          </div>
          <div className="bg-black/80 text-white px-5 py-2.5 rounded-lg font-semibold text-center min-w-[160px] text-sm">
            制作実績・できること・料金表はこちら
          </div>
        </div>
      )}
    </section>
  )
}

function ProfileSectionComponent({
  profile,
  songsCount,
  isAtBottom,
  isVisible
}: ProfileSectionProps) {
  if (!isVisible && !isAtBottom) {
    return null
  }

  return (
    <>
      {/* プロフィール背景レイヤー（重い backdrop-filter を廃止し軽量な半透明背景に変更） */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          zIndex: -(songsCount + 2)
        }}
      />

      {/* プロフィールコンテンツレイヤー（背面表示） */}
      <div
        className="fixed inset-0 w-full h-full flex flex-col items-center justify-center"
        style={{
          zIndex: -(songsCount + 1),
          pointerEvents: 'auto'
        }}
      >
        {profile && <ProfileCard profile={profile} interactive={false} />}
      </div>

      {/* 最下部スクロール時クリックレイヤー */}
      <div
        className="fixed inset-0 w-full h-full flex flex-col items-center justify-center"
        style={{
          zIndex: 300,
          pointerEvents: isAtBottom ? 'auto' : 'none'
        }}
      >
        {isAtBottom && profile && <ProfileCard profile={profile} interactive={true} />}
      </div>
    </>
  )
}

const ProfileSection = memo(ProfileSectionComponent)
export default ProfileSection
