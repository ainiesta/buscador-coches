import { scrapeCochesNet } from '../cochesnet'
import type { SearchFilters } from '../../types'

describe('Coches.net Scraper', () => {
  it('should return an array of listings', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeCochesNet(filters)
    expect(Array.isArray(results)).toBe(true)
  })

  it('should return listings with required fields', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeCochesNet(filters)

    results.forEach((listing) => {
      expect(listing.id).toBeDefined()
      expect(listing.title).toBeDefined()
      expect(listing.title.length).toBeGreaterThan(0)
      expect(listing.url).toBeDefined()
      expect(listing.source).toBe('cochesnet')
    })
  })

  it('should return listings with valid prices', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeCochesNet(filters)

    // All listings should have a price > 0
    results.forEach((listing) => {
      expect(listing.price).toBeGreaterThan(0)
    })
  })

  it('should not return duplicate URLs', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice: 5000,
      maxPrice: 50000,
    }

    const results = await scrapeCochesNet(filters)
    const urls = results.map((r) => r.url)
    const uniqueUrls = new Set(urls)

    expect(uniqueUrls.size).toBe(urls.length)
  })

  it('should filter results by price range', async () => {
    const minPrice = 20000
    const maxPrice = 40000
    const filters: SearchFilters = {
      brand: 'BMW',
      minPrice,
      maxPrice,
    }

    const results = await scrapeCochesNet(filters)

    results.forEach((listing) => {
      expect(listing.price).toBeGreaterThanOrEqual(minPrice)
      expect(listing.price).toBeLessThanOrEqual(maxPrice)
    })
  })

  it('should handle missing optional fields gracefully', async () => {
    const filters: SearchFilters = {
      brand: 'BMW',
    }

    const results = await scrapeCochesNet(filters)

    results.forEach((listing) => {
      // Required fields
      expect(listing.id).toBeDefined()
      expect(listing.title).toBeDefined()
      expect(listing.url).toBeDefined()

      // Optional fields should be defined but may be undefined
      // (year, km, fuel, imageUrl are optional)
      if (listing.year !== undefined) {
        expect(typeof listing.year).toBe('number')
      }
      if (listing.km !== undefined) {
        expect(typeof listing.km).toBe('number')
      }
    })
  })
})
