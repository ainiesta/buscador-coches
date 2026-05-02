'use client'

import { useState } from 'react'
import Link from 'next/link'
import SearchForm from '@/components/SearchForm'
import CarCard from '@/components/CarCard'
import type { CarListing, SearchFilters, SearchResult } from '@/lib/types'

const SOURCE_LABELS: Record<string, string> = {
  wallapop: 'Wallapop',
  cochesnet: 'Coches.net',
  autoscout24: 'AutoScout24',
  milanuncios: 'Milanuncios',
}

export default function HomePage() {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [alertSaved, setAlertSaved] = useState(false)
  const [sortBy, setSortBy] = useState<'price' | 'year' | 'km'>('price')
  const [filterSource, setFilterSource] = useState<string>('all')

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true)
    setResult(null)
    setAlertSaved(false)

    try {
      const qs = new URLSearchParams()
      if (filters.brand) qs.set('brand', filters.brand)
      if (filters.model) qs.set('model', filters.model)
      if (filters.minPrice) qs.set('minPrice', String(filters.minPrice))
      if (filters.maxPrice) qs.set('maxPrice', String(filters.maxPrice))
      if (filters.minYear) qs.set('minYear', String(filters.minYear))
      if (filters.maxYear) qs.set('maxYear', String(filters.maxYear))
      if (filters.maxKm) qs.set('maxKm', String(filters.maxKm))
      if (filters.fuel) qs.set('fuel', filters.fuel)
      if (filters.province) qs.set('province', filters.province)
      if (filters.sources?.length) qs.set('sources', filters.sources.join(','))

      const res = await fetch(`/api/search?${qs.toString()}`)
      const data: SearchResult = await res.json()
      setResult(data)
    } catch {
      setResult({ listings: [], errors: [{ source: 'general', message: 'Error de conexión' }] })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAlert = async (filters: SearchFilters, name: string, email: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, filters }),
      })
      setAlertSaved(true)
      setTimeout(() => setAlertSaved(false), 4000)
    } catch {}
  }

  const listings = result?.listings ?? []

  const filteredListings = listings
    .filter((c) => filterSource === 'all' || c.source === filterSource)
    .sort((a, b) => {
      if (sortBy === 'price') return (a.price || Infinity) - (b.price || Infinity)
      if (sortBy === 'year') return (b.year ?? 0) - (a.year ?? 0)
      if (sortBy === 'km') return (a.km ?? Infinity) - (b.km ?? Infinity)
      return 0
    })

  const sources = [...new Set(listings.map((c) => c.source))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="font-bold text-gray-900 text-lg">BuscaCoches</span>
          </div>
          <Link
            href="/alertas"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            🔔 Mis alertas
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Sidebar filtros */}
          <div className="lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-900 mb-4">Filtros de búsqueda</h2>
              <SearchForm
                onSearch={handleSearch}
                loading={loading}
                showSaveAlert
                onSaveAlert={handleSaveAlert}
              />
            </div>

            {alertSaved && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium flex items-center gap-2">
                ✅ Alerta guardada — te avisaremos cuando haya coches nuevos
              </div>
            )}
          </div>

          {/* Resultados */}
          <div>
            {!result && !loading && (
              <div className="text-center py-20 text-gray-400">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-500">Busca tu próximo coche</h3>
                <p className="mt-2 text-sm max-w-md mx-auto">
                  Filtra por marca, modelo, precio y más. Buscamos en Wallapop, Coches.net, AutoScout24 y Milanuncios a la vez.
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-20">
                <div className="inline-flex items-center gap-3 text-gray-500">
                  <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  <span className="font-medium">Buscando en todas las webs...</span>
                </div>
              </div>
            )}

            {result && !loading && (
              <>
                {result.errors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
                    ⚠️ No se pudo obtener resultados de:{' '}
                    {result.errors.map((e) => SOURCE_LABELS[e.source] ?? e.source).join(', ')}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900">
                      {filteredListings.length} coches
                    </h3>

                    <div className="flex gap-1">
                      <button
                        onClick={() => setFilterSource('all')}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${filterSource === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                      >
                        Todas
                      </button>
                      {sources.map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterSource(s)}
                          className={`text-xs px-2 py-1 rounded-full border transition-colors ${filterSource === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                          {SOURCE_LABELS[s] ?? s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'price' | 'year' | 'km')}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="price">Precio: menor a mayor</option>
                    <option value="year">Más nuevos primero</option>
                    <option value="km">Menos km primero</option>
                  </select>
                </div>

                {filteredListings.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <div className="text-5xl mb-3">🚫</div>
                    <p className="font-medium text-gray-500">Sin resultados con estos filtros</p>
                    <p className="text-sm mt-1">Prueba a ampliar el rango de precio o km</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredListings.map((car) => (
                      <CarCard key={`${car.source}-${car.id}`} car={car} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
