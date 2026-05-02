import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scrapeWallapop } from '@/lib/scrapers/wallapop'
import { scrapeCochesNet } from '@/lib/scrapers/cochesnet'
import { sendAlertEmail } from '@/lib/email'
import type { SearchFilters } from '@/lib/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alerts = await prisma.alert.findMany({
    where: { isActive: true },
    include: { seenIds: true },
  })

  let checked = 0
  let errors: any[] = []

  for (const alert of alerts) {
    try {
      const filters: SearchFilters = JSON.parse(alert.filters)
      const sources = filters.sources || ['wallapop', 'cochesnet']

      let allListings: any[] = []

      if (sources.includes('wallapop')) {
        const wlisting = await scrapeWallapop(filters).catch((e) => {
          console.error('Wallapop scrape error:', e)
          return []
        })
        allListings = allListings.concat(wlisting)
      }

      if (sources.includes('cochesnet')) {
        const clisting = await scrapeCochesNet(filters).catch((e) => {
          console.error('Coches.net scrape error:', e)
          return []
        })
        allListings = allListings.concat(clisting)
      }

      const seenIds = new Set(alert.seenIds.map((s) => s.id))
      const newListings = allListings.filter((l) => !seenIds.has(l.id))

      if (newListings.length > 0) {
        // Create seen listings, handling any duplicates gracefully
        try {
          await prisma.seenListing.createMany({
            data: newListings.map((l) => ({
              id: l.id,
              alertId: alert.id,
              title: l.title,
              price: l.price,
              url: l.url,
              source: l.source,
            })),
          })
        } catch (e) {
          // If duplicate constraints are hit, silently continue
          // (listings already marked as seen)
          console.log('Some listings were duplicates, continuing...')
        }

        await sendAlertEmail(alert.email, alert.name, newListings)
      }

      await prisma.alert.update({
        where: { id: alert.id },
        data: { lastChecked: new Date() },
      })

      checked++
    } catch (e) {
      errors.push({ alertId: alert.id, error: String(e) })
    }
  }

  return NextResponse.json({
    checked,
    total: alerts.length,
    errors,
    timestamp: new Date().toISOString(),
  })
}
