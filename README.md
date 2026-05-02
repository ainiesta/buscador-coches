# 🚗 BuscaCoches - Car Search & Alert Platform

A modern web application for searching used cars across multiple sources and setting up automated price alerts. Built with Next.js 16, React 19, TypeScript, and Vercel.

## Features

- 🔍 **Real-time Search**: Search used cars across multiple sources (Coches.net, Wallapop)
- 🔔 **Price Alerts**: Set up automated alerts for specific car searches with email notifications
- 📊 **Advanced Filters**: Filter by brand, model, price range, year, mileage, fuel type, and location
- ⚡ **Fast Performance**: Optimized serverless API routes with 60-second timeout
- 📧 **Email Notifications**: Automatic email alerts using Resend service
- 🗄️ **Database Persistence**: SQLite for development, LibSQL for Vercel deployments
- 🔐 **Type-Safe**: Full TypeScript implementation with strict mode
- 🚀 **Serverless Ready**: Vercel deployment with Cron Jobs support

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js App Router, Serverless Functions
- **Database**: Prisma ORM (SQLite for dev, LibSQL for Vercel)
- **Scraping**: Axios, Cheerio (HTML parsing), JSON-LD extraction
- **Email**: Resend service
- **Hosting**: Vercel with Cron Jobs
- **Package Manager**: npm

## Installation

### Prerequisites
- Node.js 18+ and npm
- Git

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd buscador-coches
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# Email Service (Resend)
RESEND_API_KEY="re_your_api_key_here"

# Next.js Public URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Cron Job Security (for production)
CRON_SECRET="your-secret-token-here"
```

4. **Initialize the database**
```bash
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Prisma database connection string |
| `RESEND_API_KEY` | ✅ | API key for Resend email service |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL (used in email links) |
| `CRON_SECRET` | ❌ | Bearer token for cron job authentication |

## Directory Structure

```
buscador-coches/
├── app/
│   ├── api/
│   │   ├── search/
│   │   │   └── route.ts          # Search endpoint
│   │   ├── alerts/
│   │   │   └── route.ts          # Alerts CRUD endpoints
│   │   └── cron/
│   │       └── check-alerts/
│   │           └── route.ts      # Cron job for checking alerts
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── alerts/
│       └── page.tsx               # Alerts management page
├── lib/
│   ├── db.ts                      # Prisma client
│   ├── email.ts                   # Email service
│   ├── types.ts                   # TypeScript types
│   ├── scrapers/
│   │   ├── wallapop.ts            # Wallapop scraper
│   │   └── cochesnet.ts           # Coches.net scraper
│   └── utils.ts                   # Utility functions
├── components/
│   ├── SearchForm.tsx             # Search form component
│   ├── SearchResults.tsx          # Results display component
│   └── AlertManager.tsx           # Alert management component
├── prisma/
│   └── schema.prisma              # Database schema
├── public/
│   └── favicon.ico
├── .env.local                      # Environment variables (gitignored)
├── package.json
├── tsconfig.json
└── README.md                       # This file
```

## API Endpoints

### Search Endpoint

**POST** `/api/search`

Search for cars across configured sources.

**Request:**
```json
{
  "brand": "BMW",
  "model": "X3",
  "minPrice": 20000,
  "maxPrice": 50000,
  "minYear": 2018,
  "maxYear": 2024,
  "maxKm": 150000,
  "fuel": "diesel",
  "province": "Madrid",
  "sources": ["cochesnet", "wallapop"]
}
```

**Response:**
```json
{
  "listings": [
    {
      "id": "e2e3cad7cd545dd73cc7110c5d80cca0",
      "source": "cochesnet",
      "title": "BMW X3 xDrive20d",
      "price": 35000,
      "year": 2021,
      "km": 45000,
      "fuel": "Diésel",
      "url": "https://www.coches.net/...",
      "imageUrl": "https://...",
      "publishedAt": "2026-04-15T10:30:00Z"
    }
  ],
  "errors": [
    {
      "source": "wallapop",
      "message": "API returned empty results"
    }
  ]
}
```

### Alerts Endpoints

**GET** `/api/alerts`

Get all user alerts.

```bash
curl -X GET "http://localhost:3000/api/alerts?email=user@example.com"
```

**POST** `/api/alerts`

Create a new alert.

```bash
curl -X POST "http://localhost:3000/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "BMW X3 Diesel",
    "filters": {
      "brand": "BMW",
      "model": "X3",
      "minPrice": 20000,
      "maxPrice": 50000,
      "fuel": "diesel"
    }
  }'
```

**PUT** `/api/alerts/:id`

Update an alert.

```bash
curl -X PUT "http://localhost:3000/api/alerts/123" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

**DELETE** `/api/alerts/:id`

Delete an alert.

```bash
curl -X DELETE "http://localhost:3000/api/alerts/123"
```

### Cron Job Endpoint

**POST** `/api/cron/check-alerts`

Internal endpoint for Vercel Cron Jobs. Checks all active alerts and sends email notifications.

**Authorization**: Requires `CRON_SECRET` bearer token in production.

```bash
curl -X POST "http://localhost:3000/api/cron/check-alerts" \
  -H "Authorization: Bearer your-cron-secret"
```

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run TypeScript compiler check
npm run tsc

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (development only)
npx prisma db push --force-reset
```

## Known Limitations

### Wallapop Scraper
- **Status**: ⚠️ Not returning results
- **Issue**: API endpoint returns empty `search_objects` array
- **Cause**: Possible API deprecation, rate limiting, or authentication changes
- **Solution**: Pending investigation and API endpoint update

### Coches.net Scraper
- **Status**: ⚠️ Returning listings with zero prices
- **Issue**: Coches.net uses JavaScript-heavy rendering; server-side HTML contains no pricing data
- **Cause**: Client-side JavaScript rendering not captured by axios/cheerio
- **Solution**: Requires browser automation (Puppeteer, Playwright) or rendering service

See `SCRAPER_DIAGNOSTICS.md` for detailed technical analysis.

## Roadmap

### Phase 1 (Current)
- [ ] Fix Coches.net price extraction with browser automation
- [ ] Improve Wallapop API integration or disable temporarily
- [ ] Complete documentation and deployment guide
- [ ] Add email notification tests

### Phase 2
- [ ] Add more car sources (Vinted, OLX, Autoscout24)
- [ ] Implement result caching
- [ ] Add monitoring and alerting for scraper failures
- [ ] Create admin dashboard

### Phase 3
- [ ] Add user authentication
- [ ] Implement saved searches/favorites
- [ ] ML-based price predictions
- [ ] Mobile app

## Deployment

### Deploy to Vercel

1. **Connect your repository**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import the repository

2. **Configure environment variables**
   - Add to Vercel project settings:
     - `DATABASE_URL`: Your LibSQL database URL
     - `RESEND_API_KEY`: Your Resend API key
     - `NEXT_PUBLIC_APP_URL`: Your deployed URL
     - `CRON_SECRET`: A secure random token

3. **Create `vercel.json` for Cron Jobs**

```json
{
  "crons": [
    {
      "path": "/api/cron/check-alerts",
      "schedule": "0 * * * *"
    }
  ]
}
```

4. **Deploy**
   - Push to your repository
   - Vercel automatically deploys on push

5. **Set up Vercel Postgres (optional)**
   - Vercel Postgres -> Create Database
   - Update `DATABASE_URL` in environment variables

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and not available for public distribution.

## Support

For issues or questions, contact: ainiesta@gmail.com

## See Also

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Resend Email Service](https://resend.com)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
