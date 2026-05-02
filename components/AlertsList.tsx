'use client'

import { useState } from 'react'

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

interface Props {
  alerts: Alert[]
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
  onCheck: () => void
  checking: boolean
}

export default function AlertsList({ alerts, onToggle, onDelete, onCheck, checking }: Props) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-5xl mb-3">🔔</div>
        <p className="font-medium text-gray-500">No tienes alertas activas</p>
        <p className="text-sm mt-1">Busca coches y guarda una alerta para que te avisemos de novedades</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">{alerts.length} alerta{alerts.length > 1 ? 's' : ''}</p>
        <button
          onClick={onCheck}
          disabled={checking}
          className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
        >
          {checking ? 'Comprobando...' : '⚡ Comprobar ahora'}
        </button>
      </div>

      {alerts.map((alert) => {
        const filters = (() => {
          try { return JSON.parse(alert.filters) } catch { return {} }
        })()

        const filterTags: string[] = []
        if (filters.brand) filterTags.push(filters.brand)
        if (filters.model) filterTags.push(filters.model)
        if (filters.minPrice || filters.maxPrice) {
          filterTags.push(`${filters.minPrice ?? 0}€ – ${filters.maxPrice ? filters.maxPrice + '€' : '∞'}`)
        }
        if (filters.minYear || filters.maxYear) {
          filterTags.push(`${filters.minYear ?? ''} – ${filters.maxYear ?? ''}`)
        }
        if (filters.maxKm) filterTags.push(`≤ ${filters.maxKm.toLocaleString('es-ES')} km`)
        if (filters.fuel) filterTags.push(filters.fuel)

        return (
          <div
            key={alert.id}
            className={`rounded-xl border p-4 transition-all ${
              alert.isActive ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${alert.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <h3 className="font-semibold text-gray-900 truncate">{alert.name}</h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 ml-4">{alert.email}</p>

                {filterTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-4">
                    {filterTags.map((tag) => (
                      <span key={tag} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                        {tag}
                      </span>
                    ))}
                    {filters.sources && (
                      <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-indigo-600">
                        {(filters.sources as string[]).join(', ')}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-2 ml-4 text-xs text-gray-400">
                  <span>📧 {alert._count.seenIds} anuncios vistos</span>
                  {alert.lastChecked && (
                    <span>
                      🕐 Última comprobación:{' '}
                      {new Date(alert.lastChecked).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => onToggle(alert.id, !alert.isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    alert.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  title={alert.isActive ? 'Desactivar' : 'Activar'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      alert.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>

                {/* Delete */}
                {confirmDelete === alert.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { onDelete(alert.id); setConfirmDelete(null) }}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Borrar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(alert.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
                    title="Eliminar alerta"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
