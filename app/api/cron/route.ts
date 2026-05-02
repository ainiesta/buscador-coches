import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { scrapeAll } from '@/lib/scrapers'
import { sendAlertEmail } from '@/lib/email'
import type { SearchFilters } from '@/lib/types'

// Called by Vercel Cron every hour, or manually via POST
export async function GET(request: NextRequest) {
  // Protect cron endpoint in production
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return runAlertChecks()
}

export async function POST(request: NextRequest) {
  // Manual trigger (from UI "comprobar ahora")
  return runAlertChecks()
}

async function runAlertChecks() {
  const alerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: { seenIds: { select: { id: true } } },
  })

  const results: { alertId: string; newCount: number; error?: string }[] = []

  for (const alert of alerts) {
    try {
      const filters: SearchFilters = JSON.parse(alert.filters)
      const { listings } = await scrapeAll(filters)

      const alreadySeenIds = new Set(alert.seenIds.map((s) => s.id))
      const newListings = listings.filter((l) => !alreadySeenIds.has(l.id))

      if (newListings.length > 0) {
        // Persist new listings as seen
        await prisma.seenListing.createMany({
          data: newListings.map((l) => ({
            id: l.id,
            alertId: alert.id,
            title: l.title,
            price: l.price,
            url: l.url,
            source: l.source,
          })),
          skipDuplicates: true as never,
        })

        // Send email notification
        await sendAlertEmail(alert.email, alert.name, newListings)
      }

      // Update lastChecked
      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastChecked: new Date() },
      })

      results.push({ alertId: alert.id, newCount: newListings.length })
    } catch (err: any) {
      results.push({ alertId: alert.id, newCount: 0, error: err.message })
    }
  }

  return Response.json({ checked: alerts.length, results })
}
