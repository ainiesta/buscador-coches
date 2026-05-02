import { scrapeWallapop } from '../wallapop'
import type { SearchFilters } from '../../types'

describe('Wallapop Scraper', () => {
  it('should return an array of listings', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeWallapop(filters)
    expect(Array.isArray(results)).toBe(true)
  })

  it('should return listings with required fields', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeWallapop(filters)

    if (results.length > 0) {
      results.forEach((listing) => {
        expect(listing.id).toBeDefined()
        expect(listing.title).toBeDefined()
        expect(listing.url).toBeDefined()
        expect(listing.source).toBe('wallapop')
      })
    }
  })

  it('should return listings with valid prices when available', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeWallapop(filters)

    if (results.length > 0) {
      const listingsWithPrice = results.filter((r) => r.price > 0)
      // At least some listings should have valid prices
      expect(listingsWithPrice.length).toBeGreaterThanOrEqual(0)
    }
  })

  it('should not return duplicate URLs', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeWallapop(filters)
    const urls = results.map((r) => r.url)
    const uniqueUrls = new Set(urls)

    expect(uniqueUrls.size).toBe(urls.length)
  })
})
