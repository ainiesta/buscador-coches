import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'
import type { CarListing, SearchFilters } from '../types'

const BASE = 'https://www.autoscout24.es'

const FUEL_CODES: Record<string, string> = {
  gasolina: 'B',
  diesel: 'D',
  electrico: 'E',
  hibrido: 'M',
}

function buildUrl(filters: SearchFilters): string {
  const qs = new URLSearchParams()
  qs.set('atype', 'C') // coches
  qs.set('sort', 'age')
  qs.set('desc', '0')

  if (filters.brand) qs.set('mmvmk0', filters.brand.toUpperCase())
  if (filters.model) qs.set('mmvmd0', filters.model)
  if (filters.minPrice) qs.set('pricefrom', String(filters.minPrice))
  if (filters.maxPrice) qs.set('priceto', String(filters.maxPrice))
  if (filters.minYear) qs.set('fregfrom', String(filters.minYear))
  if (filters.maxYear) qs.set('fregto', String(filters.maxYear))
  if (filters.maxKm) qs.set('kmto', String(filters.maxKm))
  if (filters.fuel) {
    const code = FUEL_CODES[filters.fuel.toLowerCase()]
    if (code) qs.set('fuel', code)
  }
  if (filters.province) qs.set('zip', filters.province)

  return `${BASE}/lst?${qs.toString()}`
}

export async function scrapeAutoScout24(filters: SearchFilters): Promise<CarListing[]> {
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

  // AutoScout24 embeds listing data as JSON in __NEXT_DATA__
  const nextDataEl = $('#__NEXT_DATA__').text()
  if (nextDataEl) {
    try {
      const nextData = JSON.parse(nextDataEl)
      const articles = nextData?.props?.pageProps?.listings?.data ?? []

      articles.forEach((item: any) => {
        const listingUrl = `${BASE}/annonce/${item.id}`
        const id = crypto.createHash('md5').update(listingUrl).digest('hex')
        listings.push({
          id,
          source: 'autoscout24',
          title: `${item.vehicle?.make ?? ''} ${item.vehicle?.model ?? ''}`.trim(),
          price: item.prices?.public?.priceRaw ?? 0,
          year: item.vehicle?.offerAttributes?.constructionYear,
          km: item.vehicle?.mileageInKmRaw,
          fuel: item.vehicle?.offerAttributes?.fuelCategory?.formatted,
          location: item.location?.countryName,
          url: listingUrl,
          imageUrl: item.media?.photos?.[0]?.src,
        })
      })
    } catch {}
  }

  // Fallback: HTML parsing
  if (listings.length === 0) {
    $('article[data-listingid], article.cldt-summary-full-item').each((_, el) => {
      const $el = $(el)
      const listingId = $el.attr('data-listingid') ?? ''
      const href = $el.find('a').first().attr('href') ?? ''
      const listingUrl = href.startsWith('http') ? href : BASE + href
      const title = $el.find('h2, [data-testid="title"]').first().text().trim()
      const priceText = $el.find('[data-testid="price"], .cldt-stage-primary-keyfact').first().text().replace(/\D/g, '')
      const imgSrc = $el.find('img').first().attr('src') ?? ''

      if (!title) return

      const id = crypto.createHash('md5').update(listingUrl || listingId).digest('hex')
      listings.push({
        id,
        source: 'autoscout24',
        title,
        price: parseInt(priceText) || 0,
        url: listingUrl,
        imageUrl: imgSrc,
      })
    })
  }

  return listings
}
