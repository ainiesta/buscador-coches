import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// PATCH /api/alerts/[id] — toggle active / update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const alert = await prisma.alert.update({
    where: { id },
    data: body,
  })

  return Response.json(alert)
}

// DELETE /api/alerts/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.alert.delete({ where: { id } })

  return Response.json({ ok: true })
}
