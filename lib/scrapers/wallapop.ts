import axios from 'axios'
import crypto from 'crypto'
import type { CarListing, SearchFilters } from '../types'

const FUEL_MAP: Record<string, string> = {
  gasolina: 'gasoline',
  diesel: 'diesel',
  electrico: 'electric',
  hibrido: 'hybrid',
}

export async function scrapeWallapop(filters: SearchFilters): Promise<CarListing[]> {
  const params: Record<string, string | number> = {
    category_ids: '100',
    order_by: 'newest',
    start: 0,
    step: 40,
    longitude: '-3.7038',
    latitude: '40.4168',
    distance: '200000', // toda España
  }

  const keywords: string[] = []
  if (filters.brand) keywords.push(filters.brand)
  if (filters.model) keywords.push(filters.model)
  if (keywords.length) params.keywords = keywords.join(' ')

  if (filters.minPrice) params.min_sale_price = filters.minPrice
  if (filters.maxPrice) params.max_sale_price = filters.maxPrice

  const response = await axios.get('https://api.wallapop.com/api/v3/cars/search', {
    params,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'DeviceOS': '0',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
    timeout: 10000,
  })

  const items = response.data?.search_objects ?? []

  return items
    .filter((item: any) => {
      const c = item.content
      if (filters.minYear && c.year && c.year < filters.minYear) return false
      if (filters.maxYear && c.year && c.year > filters.maxYear) return false
      if (filters.maxKm && c.km && c.km > filters.maxKm) return false
      if (filters.fuel && c.engine) {
        const mapped = FUEL_MAP[filters.fuel.toLowerCase()]
        if (mapped && c.engine.toLowerCase() !== mapped) return false
      }
      return true
    })
    .map((item: any) => {
      const c = item.content
      const url = `https://es.wallapop.com/item/${item.id}`
      return {
        id: crypto.createHash('md5').update(url).digest('hex'),
        source: 'wallapop',
        title: c.title ?? `${c.brand ?? ''} ${c.model ?? ''}`.trim(),
        price: c.sale_price ?? 0,
        year: c.year,
        km: c.km,
        fuel: c.engine,
        location: c.location?.city,
        url,
        imageUrl: item.images?.[0]?.small,
        publishedAt: item.publish_date,
      } as CarListing
    })
}
