# Browser Automation Implementation Guide

This guide outlines options for implementing browser automation to fix the Coches.net scraper's price extraction issue.

## Problem Summary

Coches.net is a JavaScript-heavy website that renders car listings and prices client-side. The current approach (axios + cheerio) fetches static HTML that doesn't contain listing data. We need browser automation to:

1. Load the page in a real browser
2. Wait for JavaScript to render the content
3. Extract prices from the rendered DOM

## Solution Options

### Option 1: Puppeteer (Local Development)

**Best for**: Local development and testing

**Pros**:
- Full control over browser behavior
- Can handle complex interactions
- Easy to debug locally

**Cons**:
- Cannot run on Vercel serverless by default
- High memory overhead
- Requires chromium binary (~150MB)

**Installation**:

```bash
npm install puppeteer
npm install --save-dev @types/puppeteer
```

**Implementation**:

```typescript
// lib/scrapers/cochesnet-puppeteer.ts
import puppeteer from 'puppeteer'
import type { CarListing, SearchFilters } from '../types'

export async function scrapeCochesNetWithBrowser(
  filters: SearchFilters
): Promise<CarListing[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()

  try {
    const url = buildUrl(filters) // Same buildUrl function as before

    await page.goto(url, { waitUntil: 'networkidle2' })

    // Wait for listings to load
    await page.waitForSelector('[data-test="car-card"], .mt-CardAd, .VehicleCard')

    const listings = await page.evaluate(() => {
      const items: any[] = []

      document.querySelectorAll('[data-test="car-card"], .mt-CardAd, .VehicleCard').forEach((el) => {
        const titleEl = el.querySelector('[data-test="title"], .mt-CardAd-title, h2')
        const priceEl = el.querySelector('[data-test="price"], .mt-CardAd-price, [class*="price"]')
        const linkEl = el.querySelector('a[href]')

        if (titleEl && linkEl) {
          items.push({
            title: titleEl.textContent?.trim() || '',
            price: parseInt(priceEl?.textContent?.replace(/\D/g, '') || '0'),
            url: linkEl.getAttribute('href'),
            imageUrl: el.querySelector('img')?.getAttribute('src'),
          })
        }
      })

      return items
    })

    return listings.map((listing) => ({
      id: createHash('md5').update(listing.url).digest('hex'),
      source: 'cochesnet',
      title: listing.title,
      price: listing.price,
      url: listing.url.startsWith('http') ? listing.url : 'https://www.coches.net' + listing.url,
      imageUrl: listing.imageUrl,
    }))
  } finally {
    await browser.close()
  }
}
```

### Option 2: Playwright (Production-Ready)

**Best for**: Better performance and Vercel compatibility options

**Pros**:
- Better performance than Puppeteer
- Works with multiple browser engines
- Better error handling

**Cons**:
- Still requires browser binaries
- Cannot run on Vercel serverless without external service

**Installation**:

```bash
npm install playwright
npm install --save-dev @types/playwright
```

### Option 3: External Rendering Service (Recommended for Production)

**Best for**: Production Vercel deployment

**Services**:
- [BrowserBase](https://www.browserbase.com/) - $10-50/month
- [Browserless](https://www.browserless.io/) - Pay-per-use
- [ScrapingBee](https://www.scrapingbee.com/) - Scraping-specific
- [Render API](https://www.render.com/) - Open source option

**Implementation with BrowserBase**:

```typescript
// lib/scrapers/cochesnet-browserbase.ts
import axios from 'axios'
import * as cheerio from 'cheerio'

const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY
const BROWSERBASE_URL = 'https://api.browserbase.com/v1/sessions'

export async function scrapeCochesNetWithBrowserBase(
  filters: SearchFilters
): Promise<CarListing[]> {
  const url = buildUrl(filters)

  // Create browser session
  const sessionResponse = await axios.post(
    BROWSERBASE_URL,
    {},
    {
      headers: {
        'x-bb-api-key': BROWSERBASE_API_KEY,
      },
    }
  )

  const sessionId = sessionResponse.data.id

  // Navigate to URL and get rendered HTML
  const htmlResponse = await axios.post(
    `${BROWSERBASE_URL}/${sessionId}/evaluate`,
    {
      code: `
        window.location.href = '${url}';
        await new Promise(r => setTimeout(r, 3000)); // Wait for rendering
        document.body.outerHTML;
      `,
    },
    {
      headers: {
        'x-bb-api-key': BROWSERBASE_API_KEY,
      },
    }
  )

  const html = htmlResponse.data.result

  // Parse as before with cheerio
  const $ = cheerio.load(html)
  // ... rest of parsing logic
}
```

### Option 4: Hybrid Approach (Recommended)

**Best for**: Development flexibility and production reliability

```typescript
// lib/scrapers/cochesnet.ts
import type { SearchFilters } from '../types'

export async function scrapeCochesNet(filters: SearchFilters) {
  // In development: use local Puppeteer
  if (process.env.NODE_ENV === 'development') {
    try {
      return await scrapeCochesNetWithBrowser(filters)
    } catch (e) {
      console.error('Browser scraping failed, falling back to API:', e)
      return await scrapeCochesNetWithAPI(filters)
    }
  }

  // In production: use external service
  if (process.env.BROWSERBASE_API_KEY) {
    return await scrapeCochesNetWithBrowserBase(filters)
  }

  // Fallback: return empty array with warning
  console.warn('No browser automation available, returning empty results')
  return []
}
```

## Implementation Steps

### Phase 1: Local Development (Week 1)

1. **Install Puppeteer**
   ```bash
   npm install puppeteer
   ```

2. **Create new scraper file** `lib/scrapers/cochesnet-browser.ts`
   - Implement Puppeteer-based scraping
   - Add error handling and timeouts
   - Test with local dev server

3. **Update tests**
   - Test new browser-based scraper
   - Validate price extraction works correctly

4. **Local testing**
   ```bash
   npm run dev
   # Test /api/search endpoint with BMW filters
   ```

### Phase 2: Production Preparation (Week 2)

1. **Choose external service**
   - BrowserBase recommended for reliability
   - Set up account and API key

2. **Implement service integration**
   - Create wrapper for chosen service
   - Add error handling and fallbacks

3. **Add to environment variables**
   ```env
   BROWSERBASE_API_KEY="your-key"
   # or
   BROWSERLESS_TOKEN="your-key"
   ```

4. **Test with production-like environment**
   - Use vercel dev for local simulation
   - Test timeout behavior with 60s limit

### Phase 3: Deployment (Week 3)

1. **Update Vercel environment**
   - Add API keys to project settings
   - Set up cost alerts if using pay-per-use service

2. **Deploy and monitor**
   - Deploy to staging branch
   - Monitor scraper performance
   - Check for rate limits

3. **Production release**
   - Deploy to main
   - Monitor scraper results
   - Set up alerting for failures

## Performance Considerations

### Timeout Management

Current API timeout: **60 seconds**

Browser automation adds overhead:
- Launch browser: 2-3 seconds
- Navigate to page: 3-5 seconds
- Wait for rendering: 2-5 seconds
- Extract data: 1-2 seconds
- **Total per URL: 8-15 seconds**

With multiple sources running in parallel:
- If both sources complete: ~15 seconds
- Safety margin: Reduce per-request timeout to 8 seconds to leave buffer

### Memory Optimization

For serverless functions:
- Use browser pooling if possible
- Launch browser once, reuse for multiple pages
- Close browser immediately after use
- Monitor memory usage in Vercel logs

## Testing the Implementation

### Local Test Script

```bash
# Test new Puppeteer scraper
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "BMW",
    "model": "X3",
    "minPrice": 20000,
    "maxPrice": 50000
  }'

# Expected response should include:
# - Multiple listings
# - All prices > 0
# - Real data from Coches.net
```

### Production Validation Checklist

- [ ] Scraper returns > 0 listings per request
- [ ] All returned prices > 0
- [ ] Response time < 20 seconds
- [ ] No timeouts in production
- [ ] Email alerts work with real data
- [ ] Cost is within budget ($0-50/month)

## Fallback Strategy

If browser automation fails:

1. **Immediate**: Return cached results from last successful run
2. **Short-term**: Disable Coches.net scraper, keep Wallapop
3. **Long-term**: Migrate to API-based sources (Autoscout24, Vinted APIs)

## Cost Estimation

| Service | Cost | Notes |
|---------|------|-------|
| Puppeteer (local) | $0 | Development only |
| BrowserBase | $10-50/month | Recommended, reliable |
| Browserless | $0.50-2/month | Pay-per-use, budget-friendly |
| ScrapingBee | $0.01-0.05/request | Higher per-request cost |

## References

- [Puppeteer Documentation](https://pptr.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [BrowserBase Docs](https://docs.browserbase.com/)
- [Vercel Edge Runtime Limitations](https://vercel.com/docs/functions/runtimes)
