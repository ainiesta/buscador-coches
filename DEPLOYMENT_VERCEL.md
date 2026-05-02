# Deployment to Vercel - BuscaCoches

Complete guide to deploy BuscaCoches to Vercel with all configurations.

## Prerequisites

- GitHub account (for repository)
- Vercel account (free at vercel.com)
- API keys:
  - Resend API key (for emails)
  - BrowserBase API key (optional, for production scraping)

## Step 1: Prepare Git Repository

```bash
cd buscador-coches

# Initialize git if not done
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: BuscaCoches car search platform

- Next.js 16 with React 19 and TypeScript
- Prisma ORM with SQLite/LibSQL
- Web scrapers for Coches.net and Wallapop
- Alert system with email notifications
- Vercel Cron Jobs for scheduled checks"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/buscador-coches.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Connect to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Click "Continue with GitHub"
3. Authorize Vercel access to your GitHub account
4. Select your repository `buscador-coches`
5. Click "Import"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Link project to Vercel
vercel --prod

# Follow prompts:
# - Link to existing project? No (create new)
# - Project name: buscador-coches
# - Framework: Next.js
# - Root directory: ./
```

## Step 3: Configure Environment Variables

### Via Vercel Dashboard

1. Go to Project Settings → Environment Variables
2. Add each variable below:

```
Name: DATABASE_URL
Value: libsql://[your-database-uuid].turso.io?authToken=[your-token]
Environment: Production, Preview, Development
```

```
Name: RESEND_API_KEY
Value: re_your_actual_api_key
Environment: Production, Preview, Development
```

```
Name: NEXT_PUBLIC_APP_URL
Value: https://buscador-coches.vercel.app
Environment: Production, Preview, Development
```

```
Name: CRON_SECRET
Value: [generate-random-token]
Environment: Production, Preview, Development
```

```
Name: BROWSERBASE_API_KEY
Value: [your-browserbase-api-key]
Environment: Production, Preview, Development
```

### Generate CRON_SECRET

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -join ''))
```

### Via Vercel CLI

```bash
vercel env add DATABASE_URL
# Paste: libsql://[your-database-uuid].turso.io?authToken=[your-token]

vercel env add RESEND_API_KEY
# Paste: re_your_api_key

vercel env add NEXT_PUBLIC_APP_URL
# Paste: https://buscador-coches.vercel.app

vercel env add CRON_SECRET
# Paste: [generated-secret]
```

## Step 4: Set Up Database (Turso/LibSQL)

### Create Turso Database

1. Go to [https://turso.tech](https://turso.tech)
2. Sign up with GitHub
3. Create a new database:
   - Name: `buscador-coches`
   - Location: Select closest to your users
4. Copy the connection string:
   - Database URL: `libsql://[uuid].turso.io?authToken=[token]`

### Initialize Database on Vercel

```bash
# Connect to Turso database locally
export DATABASE_URL="libsql://[your-uuid].turso.io?authToken=[your-token]"

# Run migrations
npx prisma migrate deploy

# Or push schema directly
npx prisma db push --skip-generate
```

## Step 5: Configure Vercel Cron Jobs

Your `vercel.json` file is already configured. Verify it contains:

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

This runs the alert check **every hour at minute 0**.

To test cron locally:
```bash
curl -X POST http://localhost:3000/api/cron/check-alerts \
  -H "Authorization: Bearer your-cron-secret"
```

## Step 6: Configure Resend Email

### Get Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up / Log in
3. Go to API Keys
4. Create new API key
5. Copy the key (format: `re_xxx...`)
6. Add to Vercel environment variables

### Verify Email Domain (Optional but Recommended)

1. In Resend dashboard → Domains
2. Add your domain (e.g., noreply@yourdomain.com)
3. Follow verification steps
4. Update email address in `lib/email.ts`:

```typescript
await resend.emails.send({
  from: 'Buscador Coches <noreply@yourdomain.com>', // Change this
  to,
  subject: `🚗 ${listings.length} coches nuevos: ${alertName}`,
  html,
})
```

## Step 7: Optional - Browser Automation for Production

### Option A: BrowserBase (Recommended)

1. Go to [https://www.browserbase.com](https://www.browserbase.com)
2. Sign up and create account
3. Create new API key
4. Add `BROWSERBASE_API_KEY` to Vercel environment variables
5. Deploy will automatically use it

### Option B: Browserless.io

1. Go to [https://www.browserless.io](https://www.browserless.io)
2. Create account
3. Get API token
4. Add `BROWSERLESS_TOKEN` to Vercel environment variables

### Option C: Disable for Now

Leave Coches.net scraper as-is (returns 0 prices). You can add browser automation later.

## Step 8: Deploy

### Via Vercel Dashboard

1. Push changes to GitHub:
```bash
git add .
git commit -m "Configure for Vercel deployment"
git push
```

2. Vercel automatically deploys on every push to `main`
3. Watch deployment in Vercel dashboard

### Via Vercel CLI

```bash
vercel --prod
```

## Step 9: Verify Deployment

### Check Live URL

```bash
# Your app is now live at:
https://buscador-coches.vercel.app
```

### Test Search Endpoint

```bash
curl -X POST https://buscador-coches.vercel.app/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "BMW",
    "minPrice": 20000,
    "maxPrice": 50000
  }'
```

### Test Cron Job

```bash
curl -X POST https://buscador-coches.vercel.app/api/cron/check-alerts \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

Check logs:
1. Go to Vercel dashboard
2. Project → Deployments → latest
3. Click "Cron" tab to see execution history

### Create Test Alert

```bash
curl -X POST https://buscador-coches.vercel.app/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "name": "Test Alert",
    "filters": {
      "brand": "BMW",
      "minPrice": 20000,
      "maxPrice": 50000
    }
  }'
```

### Check Cron Logs

```bash
# View cron execution logs in Vercel dashboard:
# Project → Monitor → Function Logs
# Filter by: /api/cron/check-alerts
```

## Step 10: Monitor Production

### Enable Vercel Analytics

1. Go to Project Settings → Analytics
2. Enable Web Analytics

### Monitor Cron Jobs

1. Go to Project → Monitor
2. Look for `/api/cron/check-alerts`
3. Check execution history and errors

### Monitor Email Delivery

1. Go to Resend dashboard
2. Check Email Log for sent/failed emails

### View Function Logs

```bash
# Via Vercel CLI
vercel logs --limit=50

# Filter by endpoint
vercel logs --follow /api/cron/check-alerts
```

## Troubleshooting

### Issue: Build fails on Vercel

Check:
1. Vercel dashboard → Deployments → latest → Logs
2. Usually missing environment variables
3. Add missing vars to Environment Variables

### Issue: Cron job not running

Check:
1. `vercel.json` has correct path: `/api/cron/check-alerts`
2. `CRON_SECRET` is set in environment variables
3. Function is being called (check logs)

### Issue: Email not sending

Check:
1. `RESEND_API_KEY` is correct in environment variables
2. Email format is valid
3. Domain verified in Resend (if using custom domain)
4. Check Resend dashboard Email Log

### Issue: Database connection error

Check:
1. `DATABASE_URL` is correct
2. Turso database exists
3. Auth token is valid
4. Network access allowed (Turso may need IP whitelist)

## Scaling & Optimization

### Performance Monitoring

1. Vercel Analytics shows performance metrics
2. Check function execution time in Logs
3. Optimize slow endpoints

### Cost Optimization

- **Vercel**: Free tier includes 100GB bandwidth, 1000 serverless function invocations
- **Turso**: Free tier includes 9GB space, unlimited reads, 50M writes/month
- **Resend**: Free tier includes 3,000 emails/day
- **BrowserBase**: ~$0.01-0.05 per request (or $10-50/month)

### Database Performance

1. Add indexes for frequently queried fields
2. Archive old `seenListing` entries periodically
3. Monitor database size in Turso dashboard

## Next Steps

1. ✅ Deploy to Vercel
2. Test all endpoints work in production
3. Create test alerts and verify email delivery
4. Monitor cron job execution (should run hourly)
5. Implement browser automation if needed

## Useful Links

- Vercel Dashboard: https://vercel.com/dashboard
- Turso Console: https://console.turso.io
- Resend Dashboard: https://resend.com/emails
- BrowserBase: https://www.browserbase.com
- Project URL: https://buscador-coches.vercel.app

## Support

If something breaks in production:

1. Check Vercel logs
2. Check Resend email logs
3. Check Turso database status
4. Use `vercel logs` CLI command
5. Contact support for respective services

---

**Deployment Date**: [Your Date]  
**Status**: ✅ Deployed  
**URL**: https://buscador-coches.vercel.app
