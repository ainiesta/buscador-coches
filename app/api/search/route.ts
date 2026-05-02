import { NextRequest, NextResponse } from 'next/server'
import { scrapeWallapop } from '@/lib/scrapers/wallapop'
import { scrapeCochesNet } from '@/lib/scrapers/cochesnet'
import type { SearchFilters } from '@/lib/types'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const filters: SearchFilters = await req.json()

    const sources = filters.sources || ['wallapop', 'cochesnet']
    const results: { listings: any[], errors: Array<{source: string, message: string}> } = { listings: [], errors: [] }

    const promises = []

    if (sources.includes('wallapop')) {
      promises.push(
        scrapeWallapop(filters).catch((e) => {
          results.errors.push({ source: 'wallapop', message: e.message })
          return []
        })
      )
    }

    if (sources.includes('cochesnet')) {
      promises.push(
        scrapeCochesNet(filters).catch((e) => {
          results.errors.push({ source: 'cochesnet', message: e.message })
          return []
        })
      )
    }

    const allListings = await Promise.all(promises)
    results.listings = allListings.flat().sort((a, b) => b.price - a.price)

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
