'use client'

import { useState } from 'react'
import type { SearchFilters } from '@/lib/types'

const FUEL_OPTIONS = ['gasolina', 'diesel', 'electrico', 'hibrido']
const PROVINCES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza',
  'Málaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante'
]

export default function SearchForm({
  onSearch,
  loading,
  showSaveAlert,
  onSaveAlert,
}: {
  onSearch: (filters: SearchFilters) => void
  loading?: boolean
  showSaveAlert?: boolean
  onSaveAlert?: (filters: SearchFilters, name: string, email: string) => void
}) {
  const [filters, setFilters] = useState<SearchFilters>({
    sources: ['wallapop', 'cochesnet'],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">🚗 Buscar Coches</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Marca (ej: BMW)"
          value={filters.brand || ''}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          className="border rounded px-3 py-2"
        />

        <input
          type="text"
          placeholder="Modelo (ej: X3)"
          value={filters.model || ''}
          onChange={(e) => setFilters({ ...filters, model: e.target.value })}
          className="border rounded px-3 py-2"
        />

        <input
          type="number"
          placeholder="Precio mínimo"
          value={filters.minPrice || ''}
          onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseInt(e.target.value) : undefined })}
          className="border rounded px-3 py-2"
        />

        <input
          type="number"
          placeholder="Precio máximo"
          value={filters.maxPrice || ''}
          onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseInt(e.target.value) : undefined })}
          className="border rounded px-3 py-2"
        />

        <input
          type="number"
          placeholder="Año mínimo"
          value={filters.minYear || ''}
          onChange={(e) => setFilters({ ...filters, minYear: e.target.value ? parseInt(e.target.value) : undefined })}
          className="border rounded px-3 py-2"
        />

        <input
          type="number"
          placeholder="Km máximo"
          value={filters.maxKm || ''}
          onChange={(e) => setFilters({ ...filters, maxKm: e.target.value ? parseInt(e.target.value) : undefined })}
          className="border rounded px-3 py-2"
        />

        <select
          value={filters.fuel || ''}
          onChange={(e) => setFilters({ ...filters, fuel: e.target.value || undefined })}
          className="border rounded px-3 py-2"
        >
          <option value="">Combustible</option>
          {FUEL_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filters.province || ''}
          onChange={(e) => setFilters({ ...filters, province: e.target.value || undefined })}
          className="border rounded px-3 py-2"
        >
          <option value="">Provincia</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.sources?.includes('wallapop') ?? false}
            onChange={(e) => {
              const sources = filters.sources || []
              setFilters({
                ...filters,
                sources: e.target.checked
                  ? [...sources, 'wallapop']
                  : sources.filter((s) => s !== 'wallapop'),
              })
            }}
          />
          Wallapop
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.sources?.includes('cochesnet') ?? false}
            onChange={(e) => {
              const sources = filters.sources || []
              setFilters({
                ...filters,
                sources: e.target.checked
                  ? [...sources, 'cochesnet']
                  : sources.filter((s) => s !== 'cochesnet'),
              })
            }}
          />
          Coches.net
        </label>
      </div>

      {showSaveAlert && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Guardar como alerta
          </label>
          <input
            type="text"
            placeholder="Nombre de la alerta (ej: BMW X3 barato)"
            id="alert-name"
            className="w-full border rounded px-3 py-2 text-sm mb-2"
          />
          <input
            type="email"
            placeholder="Tu email para recibir notificaciones"
            id="alert-email"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
        {showSaveAlert && onSaveAlert && (
          <button
            type="button"
            onClick={() => {
              const name = (document.getElementById('alert-name') as HTMLInputElement)?.value
              const email = (document.getElementById('alert-email') as HTMLInputElement)?.value
              if (name && email) {
                onSaveAlert(filters, name, email)
              }
            }}
            className="flex-1 bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700 transition"
          >
            Guardar Alerta
          </button>
        )}
      </div>
    </form>
  )
}
