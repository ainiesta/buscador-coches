import type { CarListing, SearchFilters, SearchResult } from '../types'
import { scrapeWallapop } from './wallapop'
import { scrapeCochesNet } from './cochesnet'
import { scrapeAutoScout24 } from './autoscout24'
import { scrapeMilanuncios } from './milanuncios'

const SCRAPERS: Record<string, (f: SearchFilters) => Promise<CarListing[]>> = {
  wallapop: scrapeWallapop,
  cochesnet: scrapeCochesNet,
  autoscout24: scrapeAutoScout24,
  milanuncios: scrapeMilanuncios,
}

export const ALL_SOURCES = Object.keys(SCRAPERS)

export async function scrapeAll(filters: SearchFilters): Promise<SearchResult> {
  const sources = filters.sources?.length ? filters.sources : ALL_SOURCES

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const scraper = SCRAPERS[source]
      if (!scraper) return { source, listings: [] }
      const listings = await scraper(filters)
      return { source, listings }
    })
  )

  const listings: CarListing[] = []
  const errors: { source: string; message: string }[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      listings.push(...result.value.listings)
    } else {
      errors.push({
        source: sources[i],
        message: result.reason?.message ?? 'Error desconocido',
      })
    }
  })

  // Sort by price ascending, free listings last
  listings.sort((a, b) => {
    if (!a.price) return 1
    if (!b.price) return -1
    return a.price - b.price
  })

  return { listings, errors }
}
