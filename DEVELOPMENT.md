# Development Guide - BuscaCoches

Complete guide for setting up and developing BuscaCoches locally.

## Prerequisites

- **Node.js**: 18.17 or higher
- **npm**: 9 or higher
- **Git**: Latest version
- **macOS/Linux/Windows**: Cross-platform compatible

Check your versions:
```bash
node --version   # Should be v18.17.0 or higher
npm --version    # Should be 9.0.0 or higher
git --version    # Should be 2.0 or higher
```

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd buscador-coches

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
nano .env.local
```

**Minimum required values**:
- `DATABASE_URL`: Leave as-is for local SQLite
- `RESEND_API_KEY`: Get from https://resend.com (optional for testing)
- `NEXT_PUBLIC_APP_URL`: http://localhost:3000

### 3. Database Setup

```bash
# Initialize SQLite database and run migrations
npx prisma db push

# (Optional) Open Prisma Studio to inspect data
npx prisma studio
```

### 4. Start Development Server

```bash
# Start Next.js dev server
npm run dev
```

Open http://localhost:3000 in your browser.

## Development Workflow

### Running Tests

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests for specific scraper
npm test -- wallapop
npm test -- cochesnet
```

### Type Checking

```bash
# Check for TypeScript errors
npm run tsc

# Run type checker in watch mode
npx tsc --watch
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma db push --force-reset

# Create a migration after schema changes
npx prisma migrate dev --name add_new_feature

# View migration status
npx prisma migrate status
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint -- --fix

# Type check
npm run tsc
```

## Testing the Scrapers

### Manual Testing

#### Test via HTTP Request

```bash
# Test search endpoint
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "BMW",
    "minPrice": 5000,
    "maxPrice": 50000,
    "sources": ["cochesnet", "wallapop"]
  }'

# Test with more filters
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "BMW",
    "model": "X3",
    "minPrice": 20000,
    "maxPrice": 50000,
    "minYear": 2018,
    "maxYear": 2024,
    "maxKm": 150000,
    "fuel": "diesel",
    "province": "Madrid",
    "sources": ["cochesnet"]
  }'
```

#### Expected Results

**Coches.net (Current Issues)**:
- Returns listings: ✅
- Returns valid prices: ❌ (All prices = 0)
- Fix: Implement browser automation (see BROWSER_AUTOMATION_GUIDE.md)

**Wallapop (Current Issues)**:
- Returns listings: ❌ (Empty array)
- Issue: API endpoint deprecated or blocked
- Fix: Pending investigation

### Setting Up Browser Automation (Local Development)

Follow these steps to enable Coches.net scraping with Puppeteer:

#### Step 1: Install Puppeteer

```bash
npm install puppeteer
```

#### Step 2: Create Browser Scraper

Create `lib/scrapers/cochesnet-browser.ts`:

```typescript
import puppeteer, { Browser, Page } from 'puppeteer'
import crypto from 'crypto'
import type { CarListing, SearchFilters } from '../types'

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    })
  }
  return browser
}

function buildUrl(filters: SearchFilters): string {
  // Same as in cochesnet.ts
  const parts: string[] = []
  if (filters.brand) parts.push(filters.brand.toLowerCase())
  if (filters.model) parts.push(filters.model.toLowerCase())

  const basePath = parts.length
    ? `/segunda-mano/${parts.join('/')}`
    : '/segunda-mano'

  const qs = new URLSearchParams()
  if (filters.minPrice) qs.set('precioDesde', String(filters.minPrice))
  if (filters.maxPrice) qs.set('precioHasta', String(filters.maxPrice))
  if (filters.minYear) qs.set('anyoDesde', String(filters.minYear))
  if (filters.maxYear) qs.set('anyoHasta', String(filters.maxYear))
  if (filters.maxKm) qs.set('kmHasta', String(filters.maxKm))
  if (filters.fuel) {
    const FUEL_MAP: Record<string, string> = {
      gasolina: 'Gasolina',
      diesel: 'Diésel',
      electrico: 'Eléctrico',
      hibrido: 'Híbrido',
    }
    qs.set('combustible', FUEL_MAP[filters.fuel.toLowerCase()] ?? '')
  }
  if (filters.province) qs.set('provincia', filters.province)

  const query = qs.toString()
  return `https://www.coches.net${basePath}${query ? '?' + query : ''}`
}

export async function scrapeCochesNetWithBrowser(
  filters: SearchFilters
): Promise<CarListing[]> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    const url = buildUrl(filters)
    console.log('Navigating to:', url)

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Wait for listings to appear
    await page.waitForSelector('[data-test="car-card"], .mt-CardAd', {
      timeout: 10000,
    })

    const listings = await page.evaluate(() => {
      const results: any[] = []

      document
        .querySelectorAll('[data-test="car-card"], .mt-CardAd')
        .forEach((el) => {
          const titleEl = el.querySelector(
            '[data-test="title"], .mt-CardAd-title, h2'
          )
          const priceEl = el.querySelector(
            '[data-test="price"], .mt-CardAd-price, [class*="price"]'
          )
          const linkEl = el.querySelector('a[href*="coches.net"]')

          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent?.trim() || '',
              price: parseInt(
                priceEl?.textContent?.replace(/\D/g, '') || '0'
              ) || 0,
              url: linkEl.getAttribute('href') || '',
              imageUrl: el.querySelector('img')?.getAttribute('src') || '',
            })
          }
        })

      return results
    })

    return listings
      .filter((l) => l.title && l.url && l.price > 0)
      .map((l) => ({
        id: crypto.createHash('md5').update(l.url).digest('hex'),
        source: 'cochesnet',
        title: l.title,
        price: l.price,
        url: l.url.startsWith('http')
          ? l.url
          : 'https://www.coches.net' + l.url,
        imageUrl: l.imageUrl,
      }))
  } catch (error) {
    console.error('Puppeteer scraping error:', error)
    return []
  } finally {
    await page.close()
  }
}

// Close browser on process exit
process.on('exit', async () => {
  if (browser) {
    await browser.close()
  }
})
```

#### Step 3: Test Browser Scraper

```bash
# Test via API
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "BMW",
    "minPrice": 20000,
    "maxPrice": 50000,
    "sources": ["cochesnet"]
  }'
```

You should now see listings with actual prices > 0.

## Alert Testing

### Create an Alert

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "BMW X3 Diesel",
    "filters": {
      "brand": "BMW",
      "model": "X3",
      "minPrice": 20000,
      "maxPrice": 50000,
      "fuel": "diesel",
      "sources": ["cochesnet"]
    }
  }'
```

### Trigger Manual Cron Job

```bash
curl -X POST http://localhost:3000/api/cron/check-alerts \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

### View Alerts

```bash
curl http://localhost:3000/api/alerts?email=test@example.com
```

## Debugging

### Enable Debug Logging

```bash
# All modules
DEBUG=* npm run dev

# Specific modules
DEBUG=buscador:* npm run dev
DEBUG=prisma:* npm run dev
```

### Browser Automation Debugging

Add to `.env.local`:
```env
# Show browser window during scraping (for Puppeteer)
PUPPETEER_HEADLESS=false
```

### Database Debugging

```bash
# Open Prisma Studio
npx prisma studio

# Enable SQL logging
DATABASE_LOG_QUERIES=true npm run dev
```

## Common Issues

### Issue: `Cannot find module 'puppeteer'`

**Solution**:
```bash
npm install puppeteer
```

### Issue: Database locked error

**Solution**:
```bash
# Reset database
npx prisma db push --force-reset

# Or remove the database file
rm dev.db
npx prisma db push
```

### Issue: Timeout errors on Coches.net

**Solution**:
- Increase timeout in page.goto() to 60000 (60 seconds)
- Check network connectivity
- Try reducing filter complexity

### Issue: Email not sending (RESEND_API_KEY not set)

**Solution**:
1. Get API key from https://resend.com
2. Add to `.env.local`:
   ```env
   RESEND_API_KEY="re_your_key_here"
   ```
3. Restart dev server

## Building for Production

```bash
# Build the project
npm run build

# Start production server locally
npm start

# Run in production mode
NODE_ENV=production npm start
```

## Performance Optimization

### Database Queries

```typescript
// Optimize with Prisma select
const alerts = await prisma.alert.findMany({
  select: {
    id: true,
    name: true,
    filters: true,
    // Don't select large fields unless needed
  },
})
```

### Scraper Performance

```bash
# Monitor scraper performance
VERBOSE_SCRAPING=true npm run dev

# Add timeouts to prevent hanging
const SCRAPER_TIMEOUT = 15000 // 15 seconds
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: describe your changes"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
```

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Puppeteer Docs](https://pptr.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## Support

For questions or issues:
- Check existing [GitHub Issues](https://github.com/your-repo/issues)
- Create a new issue with detailed description
- Contact: ainiesta@gmail.com
