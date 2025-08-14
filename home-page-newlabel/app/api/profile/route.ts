import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface Profile {
  name: string
  bio: string
  genres: string[]
  equipment: string
  contact: {
    email: string
    twitter: string
    soundcloud: string
    bandcamp: string
    youtube: string
    instagram: string
  }
  profileImage: string
}

export async function GET() {
  try {
    const profilePath = join(process.cwd(), '..', 'data', 'profile.json')
    const profileContent = readFileSync(profilePath, 'utf-8')
    const profile: Profile = JSON.parse(profileContent)
    
    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error reading profile:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}