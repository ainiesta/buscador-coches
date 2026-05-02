'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import AlertsList from '@/components/AlertsList'

interface Alert {
  id: string
  name: string
  email: string
  filters: string
  isActive: boolean
  lastChecked: string | null
  createdAt: string
  _count: { seenIds: number }
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{ checked: number; results: any[] } | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts')
      const data = await res.json()
      setAlerts(data)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    })
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)))
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const handleCheck = async () => {
    setChecking(true)
    setCheckResult(null)
    try {
      const res = await fetch('/api/cron', { method: 'POST' })
      const data = await res.json()
      setCheckResult(data)
      await fetchAlerts()
    } catch {}
    setChecking(false)
  }

  const activeCount = alerts.filter((a) => a.isActive).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors">
            <span className="text-2xl">🚗</span>
            <span className="font-bold text-lg">BuscaCoches</span>
          </Link>
          <span className="text-sm text-gray-500">
            {activeCount} alerta{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis alertas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Comprobación automática cada hora para alertas activas
            </p>
          </div>
          <Link
            href="/"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Nueva búsqueda
          </Link>
        </div>

        {/* Resultado comprobación */}
        {checkResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm">
            <p className="font-medium text-blue-800">
              ✅ Comprobación completada — {checkResult.checked} alerta{checkResult.checked !== 1 ? 's' : ''} revisada{checkResult.checked !== 1 ? 's' : ''}
            </p>
            <div className="mt-2 space-y-1">
              {checkResult.results.map((r: any) => {
                const alert = alerts.find((a) => a.id === r.alertId)
                return (
                  <p key={r.alertId} className="text-blue-700">
                    {r.error ? (
                      <span>❌ {alert?.name ?? r.alertId}: {r.error}</span>
                    ) : (
                      <span>
                        {alert?.name ?? r.alertId}:{' '}
                        {r.newCount > 0
                          ? `🆕 ${r.newCount} anuncio${r.newCount > 1 ? 's' : ''} nuevo${r.newCount > 1 ? 's' : ''} — te hemos enviado un email`
                          : '✓ Sin novedades'}
                      </span>
                    )}
                  </p>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="animate-spin h-8 w-8 text-blue-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Cargando alertas...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <AlertsList
              alerts={alerts}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onCheck={handleCheck}
              checking={checking}
            />
          </div>
        )}

        {/* Info cron */}
        <div className="mt-4 bg-gray-100 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-medium text-gray-600 mb-1">⏱ Sistema de alertas automático</p>
          <p>
            En producción (Vercel), las alertas activas se comprueban automáticamente cada hora.
            Localmente, usa el botón &quot;Comprobar ahora&quot; para lanzar la comprobación manualmente.
          </p>
        </div>
      </main>
    </div>
  )
}
