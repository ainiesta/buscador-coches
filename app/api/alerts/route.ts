import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { AlertFilters } from '@/lib/types'

// GET all alerts
export async function GET() {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(alerts)
}

// POST create alert
export async function POST(req: NextRequest) {
  const { name, email, filters } = await req.json()

  const alert = await prisma.alert.create({
    data: {
      name,
      email,
      filters: JSON.stringify(filters),
      isActive: true,
    },
  })

  return NextResponse.json(alert, { status: 201 })
}

// PUT update alert
export async function PUT(req: NextRequest) {
  const { id, name, filters, isActive } = await req.json()

  const alert = await prisma.alert.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(filters && { filters: JSON.stringify(filters) }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return NextResponse.json(alert)
}

// DELETE alert
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.alert.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
