import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface LicenseSection {
  id: string
  title: string
  content: string
}

export interface License {
  title: string
  lastUpdated: string
  sections: LicenseSection[]
  contact: {
    email?: string
    website?: string
    twitter?: string
  }
}

export async function GET() {
  try {
    const licensePath = join(process.cwd(), '..', 'data', 'license.json')
    const licenseContent = readFileSync(licensePath, 'utf-8')
    const license: License = JSON.parse(licenseContent)
    
    return NextResponse.json(license)
  } catch (error) {
    console.error('Error reading license data:', error)
    return NextResponse.json({ error: 'Failed to load license data' }, { status: 500 })
  }
}