import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import type { CarListing, SearchFilters } from '../types'

const BASE = 'https://www.coches.net'

const FUEL_MAP: Record<string, string> = {
  gasolina: 'Gasolina',
  diesel: 'Diésel',
  electrico: 'Eléctrico',
  hibrido: 'Híbrido',
}

function buildUrl(filters: SearchFilters): string {
  const parts: string[] = []

  if (filters.brand) parts.push(filters.brand.toLowerCase())
  if (filters.model) parts.push(filters.model.toLowerCase())

  const basePath = parts.length ? `/segunda-mano/${parts.join('/')}` : '/segunda-mano'

  const qs = new URLSearchParams()
  if (filters.minPrice) qs.set('precioDesde', String(filters.minPrice))
  if (filters.maxPrice) qs.set('precioHasta', String(filters.maxPrice))
  if (filters.minYear) qs.set('anyoDesde', String(filters.minYear))
  if (filters.maxYear) qs.set('anyoHasta', String(filters.maxYear))
  if (filters.maxKm) qs.set('kmHasta', String(filters.maxKm))
  if (filters.fuel) qs.set('combustible', FUEL_MAP[filters.fuel.toLowerCase()] ?? '')
  if (filters.province) qs.set('provincia', filters.province)

  const query = qs.toString()
  return `${BASE}${basePath}${query ? '?' + query : ''}`
}

function extractPrice(priceStr: string | null | undefined): number {
  if (!priceStr) return 0
  // Remove all non-digit characters and convert to number
  const price = parseInt(String(priceStr).replace(/\D/g, ''))
  return isNaN(price) ? 0 : price
}

export async function scrapeCochesNet(filters: SearchFilters): Promise<CarListing[]> {
  const url = buildUrl(filters)

  const { data: html } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
    timeout: 12000,
  })

  const $ = cheerio.load(html)
  const listings: CarListing[] = []
  const seenUrls = new Set<string>()

  // Try to extract from JSON-LD or embedded JSON first
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text())
      const items = Array.isArray(json['@graph']) ? json['@graph'] : [json]

      items.forEach((item: any) => {
        if (item['@type'] === 'Car' || item['@type'] === 'Vehicle') {
          const listingUrl = item.url ?? ''
          if (!listingUrl || seenUrls.has(listingUrl)) return

          seenUrls.add(listingUrl)

          // Try multiple price sources
          let price = 0
          if (item.offers?.price) {
            price = extractPrice(item.offers.price)
          } else if (item.offers?.[0]?.price) {
            price = extractPrice(item.offers[0].price)
          } else if (item.price) {
            price = extractPrice(item.price)
          }

          const id = crypto.createHash('md5').update(listingUrl).digest('hex')
          listings.push({
            id,
            source: 'cochesnet',
            title: item.name ?? '',
            price,
            year: item.vehicleModelDate ? parseInt(item.vehicleModelDate) : undefined,
            km: item.mileageFromOdometer?.value ? parseInt(item.mileageFromOdometer.value) : undefined,
            fuel: item.fuelType,
            url: listingUrl,
            imageUrl: item.image,
            publishedAt: item.datePublished,
          })
        }
      })
    } catch (e) {
      // Silently skip malformed JSON-LD
    }
  })

  // Fallback: parse HTML cards if JSON-LD extraction failed
  if (listings.length === 0) {
    $('[data-test="car-card"], .mt-CardAd, article.vehicle, .VehicleCard').each((_, el) => {
      const $el = $(el)
      const title = $el.find('[data-test="title"], .mt-CardAd-title, h2, .title').first().text().trim()
      const priceText = $el.find('[data-test="price"], .mt-CardAd-price, .price, [class*="price"]').first().text()
      const price = extractPrice(priceText)
      const href = $el.find('a[href*="coches.net"]').first().attr('href') ?? ''
      const listingUrl = href.startsWith('http') ? href : BASE + href
      const imgSrc = $el.find('img').first().attr('src') ?? $el.find('img').first().attr('data-src') ?? ''

      if (!title || !href) return
      if (seenUrls.has(listingUrl)) return

      seenUrls.add(listingUrl)

      const id = crypto.createHash('md5').update(listingUrl).digest('hex')
      listings.push({
        id,
        source: 'cochesnet',
        title,
        price,
        url: listingUrl,
        imageUrl: imgSrc,
      })
    })
  }

  return listings.filter(l => l.title && l.url) // Final validation
}
