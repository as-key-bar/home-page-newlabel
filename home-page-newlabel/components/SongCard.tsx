'use client'

import { Song } from '../app/api/songs/route'
import { useState, useRef } from 'react'

interface SongCardProps {
  song: Song
}

export default function SongCard({ song }: SongCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // 音源ファイルのパスを生成（titleベースでファイルを探す）
  const getAudioPath = () => {
    // とりあえず固定のパスを使用（後で動的に変更可能）
    return '/audio/noiseOK_askey_Vocaloid_happy_ending_theme_4424_rec01_premaster01.wav'
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {song.title}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {song.duration}
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-2">
        {song.artist} • {song.album}
      </p>
      
      <p className="text-gray-700 dark:text-gray-200 mb-3">
        {song.description}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
          {song.genre}
        </span>
        {song.tags.split(',').map((tag, index) => (
          <span
            key={index}
            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs"
          >
            {tag.trim()}
          </span>
        ))}
      </div>
      
      {song.originalTracks && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">原曲:</span> {song.originalTracks}
          </p>
        </div>
      )}
      
      {/* 音声プレイヤー */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <audio
          ref={audioRef}
          src={getAudioPath()}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
        
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {song.streamingUrl && (
          <a
            href={song.streamingUrl}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            外部で試聴
          </a>
        )}
        {song.downloadUrl && (
          <a
            href={song.downloadUrl}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            ダウンロード
          </a>
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        リリース日: {song.releaseDate}
      </div>
    </div>
  )
}