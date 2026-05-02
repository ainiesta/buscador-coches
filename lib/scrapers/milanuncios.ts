import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import type { CarListing, SearchFilters } from '../types'

const BASE = 'https://www.milanuncios.com'

function buildUrl(filters: SearchFilters): string {
  const parts: string[] = []

  if (filters.brand) parts.push(filters.brand.toLowerCase().replace(/\s+/g, '-'))
  if (filters.model) parts.push(filters.model.toLowerCase().replace(/\s+/g, '-'))

  const slug = parts.length ? parts.join('-') : 'coches-de-segunda-mano'
  const qs = new URLSearchParams()

  if (filters.minPrice) qs.set('desde', String(filters.minPrice))
  if (filters.maxPrice) qs.set('hasta', String(filters.maxPrice))
  if (filters.minYear) qs.set('aniodesde', String(filters.minYear))
  if (filters.maxYear) qs.set('aniohasta', String(filters.maxYear))
  if (filters.maxKm) qs.set('kmhasta', String(filters.maxKm))

  const query = qs.toString()
  return `${BASE}/motor-y-accesorios/coches/${slug}/${query ? '?' + query : ''}`
}

export async function scrapeMilanuncios(filters: SearchFilters): Promise<CarListing[]> {
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

  // Try JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text())
      const items = json?.['@graph'] ?? (Array.isArray(json) ? json : [json])
      items.forEach((item: any) => {
        if (item['@type'] === 'Car' || item['@type'] === 'Vehicle' || item['@type'] === 'Product') {
          const listingUrl = item.url ?? ''
          if (!listingUrl) return
          const id = crypto.createHash('md5').update(listingUrl).digest('hex')
          listings.push({
            id,
            source: 'milanuncios',
            title: item.name ?? '',
            price: parseInt(item.offers?.price ?? '0') || 0,
            url: listingUrl.startsWith('http') ? listingUrl : BASE + listingUrl,
            imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
          })
        }
      })
    } catch {}
  })

  // Fallback HTML
  if (listings.length === 0) {
    $('article.ma-AdCard, .ma-AdCard, [class*="AdCard"]').each((_, el) => {
      const $el = $(el)
      const title = $el.find('h2, .ma-AdCard-titleAd, [class*="title"]').first().text().trim()
      const priceText = $el.find('[class*="price"], .ma-AdCard-price').first().text().replace(/\D/g, '')
      const href = $el.find('a').first().attr('href') ?? ''
      const listingUrl = href.startsWith('http') ? href : BASE + href
      const imgSrc = $el.find('img').first().attr('src') ?? $el.find('img').first().attr('data-src') ?? ''

      if (!title || !href) return

      const id = crypto.createHash('md5').update(listingUrl).digest('hex')
      listings.push({
        id,
        source: 'milanuncios',
        title,
        price: parseInt(priceText) || 0,
        url: listingUrl,
        imageUrl: imgSrc,
      })
    })
  }

  return listings
}
