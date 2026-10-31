'use client'

import { useState, useEffect, useRef } from 'react'
import { Song } from '../lib/firestore'

export function useAudioPlayer(initialVolume: number = 0.15) {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(initialVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(initialVolume)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleTogglePlay = (song: Song) => {
    if (!song.audioPath) return

    if (currentPlayingId === song.id) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          audioRef.current.play().catch(console.error)
          setIsPlaying(true)
        }
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(song.audioPath)
      audio.volume = isMuted ? 0 : volume
      audioRef.current = audio
      setCurrentPlayingId(song.id)
      setIsPlaying(true)
      setCurrentTime(0)
      setDuration(0)

      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime)
      })

      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      audio.play().catch((err) => {
        console.error('Audio play error:', err)
        setIsPlaying(false)
      })
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol)
    if (newVol > 0 && isMuted) {
      setIsMuted(false)
    } else if (newVol === 0) {
      setIsMuted(true)
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      const restored = prevVolume > 0 ? prevVolume : initialVolume
      setVolume(restored)
      setIsMuted(false)
      if (audioRef.current) {
        audioRef.current.volume = restored
      }
    } else {
      setPrevVolume(volume)
      setIsMuted(true)
      if (audioRef.current) {
        audioRef.current.volume = 0
      }
    }
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return {
    currentPlayingId,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    handleTogglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute
  }
}

