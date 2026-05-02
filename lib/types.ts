export interface SearchFilters {
  brand?: string
  model?: string
  minPrice?: number
  maxPrice?: number
  minYear?: number
  maxYear?: number
  maxKm?: number
  fuel?: string
  province?: string
  sources?: string[] // ['wallapop', 'cochesnet', 'autoscout24', 'milanuncios']
}

export interface CarListing {
  id: string          // unique hash of URL
  source: string      // 'wallapop' | 'cochesnet' | 'autoscout24' | 'milanuncios'
  title: string
  price: number
  year?: number
  km?: number
  fuel?: string
  location?: string
  url: string
  imageUrl?: string
  publishedAt?: string
}

export interface SearchResult {
  listings: CarListing[]
  errors: { source: string; message: string }[]
}

export interface AlertFilters extends SearchFilters {
  sources: string[]
}
