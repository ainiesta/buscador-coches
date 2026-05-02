# BuscaCoches Scraper Diagnostics Report

**Date:** 2026-05-03  
**Status:** Initial validation completed

## Summary

The BuscaCoches dev server is fully functional and running locally. API routes are accessible. However, the scrapers require updates to function correctly with the current state of target websites.

## Test Results

### ✅ Infrastructure Working

- Dev server running on `http://localhost:3000`
- Search form renders correctly
- API route `/api/search` responds to requests
- Results are returned in proper format
- No compilation errors

### ⚠️ Wallapop Scraper

**Status:** Not returning results  
**Issue:** The Wallapop API endpoint returns empty `search_objects` array even with valid parameters.

**Test Command:**
```bash
curl "https://api.wallapop.com/api/v3/cars/search?category_ids=100&step=40&keywords=BMW&min_sale_price=5000&max_sale_price=50000" \
  -H "User-Agent: Mozilla/5.0..."
```

**Response:** `{"search_objects": [], ...}`

**Possible Causes:**
- API endpoint deprecated or rate-limited
- Wallapop blocking automated requests
- Location-based filtering issues (coordinates may need adjustment)
- API requires additional authentication headers

**Next Steps:**
- Check if Wallapop has updated their API
- Consider using browser automation (Puppeteer/Playwright)
- Implement proxy rotation to avoid blocking
- Add retry logic with exponential backoff

### ⚠️ Coches.net Scraper

**Status:** Returning listings but with invalid prices  
**Issue:** Price field returns `0` for all listings, indicating price extraction failure.

**Current Data Example:**
```json
{
  "id": "e2e3cad7cd545dd73cc7110c5d80cca0",
  "source": "cochesnet",
  "title": "BMW X6 xDrive40i M Sport",
  "price": 0,  // ❌ Should be a valid number
  "url": "https://www.coches.net/..."
}
```

**Root Cause:** 
- Coches.net is a JavaScript-heavy site that renders content client-side
- Server-side HTML scraping doesn't contain car listings with prices
- JSON-LD structured data extraction (if present) is not providing price information
- HTML fallback parser can't locate price elements in the static HTML

**Current Scraper Approach:**
1. Tries to extract from JSON-LD `@type: Car` objects → Returns 0 prices
2. Falls back to HTML parsing (never executed because step 1 returns results)
3. Results have incomplete/invalid data

**Next Steps:**
- Implement browser automation for Coches.net:
  - Use Puppeteer or Playwright to render JavaScript
  - Wait for dynamic content to load
  - Extract prices from rendered DOM
- Or find Coches.net API endpoint
- Consider using a rendering service (Browserless, ScrapeOps)

## Required Changes

### 1. **Immediate: Choose Scraping Strategy**

For serverless/Vercel compatibility:
- **Option A:** Use a rendering API (recommended for Vercel deployment)
  - BrowserBase
  - Browserless
  - Render API
- **Option B:** Switch to headless browser with Vercel compatibility
  - Puppeteer with chromium layer
  - Playwright with browser binaries

### 2. **Update Scraper Implementations**

**File:** `lib/scrapers/wallapop.ts`
- Add error handling for empty results
- Implement retry logic
- Consider alternative search strategy

**File:** `lib/scrapers/cochesnet.ts`
- Replace HTML/JSON-LD parsing with browser automation
- Implement wait conditions for dynamic content
- Extract price from rendered elements

### 3. **Add Tests**

Create test files to validate:
- Scraper returns > 0 listings
- All prices are > 0
- Required fields (title, url, price) are populated
- Location filtering works correctly

```typescript
// lib/scrapers/__tests__/wallapop.test.ts
it('should return listings with valid prices', async () => {
  const results = await scrapeWallapop({ brand: 'BMW' })
  expect(results.length).toBeGreaterThan(0)
  expect(results.every(r => r.price > 0)).toBe(true)
})
```

## Architecture Considerations

**Current Flow:**
```
Frontend (SearchForm) 
  → POST /api/search 
    → Promise.all([wallapop(), cochesnet()])
    → Returns combined results
```

**Issue:** Serverless functions have execution limits (60s timeout is set)
- Browser automation adds overhead
- Need to optimize performance
- Consider caching results
- Rate-limit external requests

## Recommendation

**Phase 1 (Current):** 
- Disable Wallapop scraper temporarily or mark as "coming soon"
- Update Coches.net to use a rendering service
- Get one scraper working reliably

**Phase 2 (Next):**
- Add additional sources with proven working scrapers
- Implement result caching
- Add monitoring/alerting for scraper failures

**Phase 3 (Future):**
- Add more sources (Vinted, OLX, etc.)
- Implement user-submitted listings
- Add ML-based price prediction

## Files to Update

- [ ] `lib/scrapers/cochesnet.ts` - Implement browser automation
- [ ] `lib/scrapers/wallapop.ts` - Improve error handling or deprecate
- [ ] `app/api/search/route.ts` - Add timeout handling
- [ ] `package.json` - Add puppeteer or rendering service dependency
- [ ] Tests - Add scraper validation tests
