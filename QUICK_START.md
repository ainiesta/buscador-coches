# Quick Start Guide - BuscaCoches

Fast track to running BuscaCoches locally and testing features.

## 1. Initial Setup (First Time Only)

```bash
# Clone the repository
git clone <repository-url>
cd buscador-coches

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Initialize database
npx prisma db push

# ✅ Done! Ready to develop
```

## 2. Start Development Server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## 3. Common Tasks

### Search for Cars

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "BMW",
    "minPrice": 20000,
    "maxPrice": 50000
  }'
```

### Create an Alert

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "name": "BMW X3 Under 50k",
    "filters": {
      "brand": "BMW",
      "model": "X3",
      "minPrice": 20000,
      "maxPrice": 50000
    }
  }'
```

### View Alerts

```bash
curl http://localhost:3000/api/alerts?email=your@email.com
```

### Run Tests

```bash
npm test
```

### Check TypeScript

```bash
npm run tsc
```

### View Database

```bash
npx prisma studio
```

## 4. Environment Variables

Create `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY="re_your_key"  # Optional for testing
CRON_SECRET="test-secret"
```

## 5. Troubleshooting

### Issue: Port 3000 already in use
```bash
npm run dev -- -p 3001
```

### Issue: Database locked
```bash
npx prisma db push --force-reset
```

### Issue: TypeScript errors
```bash
npm run tsc  # See specific errors
npm install  # Update dependencies
```

### Issue: Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

## 6. File Structure Highlights

```
lib/
├── db.ts            → Prisma client
├── email.ts         → Email sending
├── types.ts         → TypeScript types
└── scrapers/        → Web scrapers
    ├── cochesnet.ts
    └── wallapop.ts

app/api/
├── search/route.ts           → Main endpoint
├── alerts/route.ts           → Alert CRUD
└── cron/check-alerts/route.ts → Scheduled jobs

components/
├── SearchForm.tsx            → Search UI
├── SearchResults.tsx         → Results display
└── AlertManager.tsx          → Alerts UI
```

## 7. Documentation

| Document | Purpose |
|----------|---------|
| README.md | Project overview & deployment |
| DEVELOPMENT.md | Complete setup & development guide |
| BROWSER_AUTOMATION_GUIDE.md | Fix Coches.net scraper |
| SCRAPER_DIAGNOSTICS.md | Technical issue analysis |
| PROJECT_STATUS.md | Current state & next steps |
| QUICK_START.md | This file |

## 8. Next Steps

1. **Test locally** - Search for cars, create alerts
2. **Implement Puppeteer** - Fix Coches.net scraper
3. **Configure email** - Set RESEND_API_KEY
4. **Deploy to Vercel** - See README.md Deployment section

## 9. Useful Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm start            # Run production build

# Debugging
npm run tsc          # Type check
npm run lint         # Lint code
npm test             # Run tests

# Database
npx prisma studio   # Open database UI
npx prisma db push  # Apply migrations
npx prisma db push --force-reset  # Reset DB

# Git
git status           # See changes
git add .            # Stage all files
git commit -m "msg"  # Create commit
git push origin main # Push to remote
```

## 10. Testing the Scrapers

### Test Coches.net

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"brand": "BMW", "minPrice": 20000, "maxPrice": 50000}'

# Expected: Listings with prices > 0
```

### Test Wallapop

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"sources": ["wallapop"], "brand": "BMW"}'

# Current: May return empty array (known issue)
```

## 11. Email Testing

Set `RESEND_API_KEY` in `.env.local` to test email sending.

Trigger alert check:

```bash
curl -X POST http://localhost:3000/api/cron/check-alerts \
  -H "Authorization: Bearer test-secret"
```

Check email in Resend dashboard.

## 12. Production Checklist

Before deploying to production:

- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run tsc`
- [ ] Scrapers returning valid data
- [ ] Email configured with Resend API key
- [ ] Database configured for Vercel (LibSQL)
- [ ] Environment variables set in Vercel
- [ ] Cron secret configured
- [ ] Tested in staging environment first

## 13. Useful URLs

- Development: http://localhost:3000
- Prisma Studio: http://localhost:5555
- Resend Dashboard: https://resend.com
- Vercel Dashboard: https://vercel.com
- GitHub Repo: (your repo URL)

## 14. Getting Help

1. Check **DEVELOPMENT.md** for detailed guides
2. See **SCRAPER_DIAGNOSTICS.md** for known issues
3. Review **BROWSER_AUTOMATION_GUIDE.md** for scraper fixes
4. Check **PROJECT_STATUS.md** for current progress
5. Email: ainiesta@gmail.com

---

**Version**: 1.0  
**Last Updated**: 2026-05-03
