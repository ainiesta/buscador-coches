import type { CarListing } from '@/lib/types'
import Image from 'next/image'

export default function CarCard({ car }: { car: CarListing }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
      <div className="relative w-full h-48 bg-gray-200">
        {car.imageUrl ? (
          <Image
            src={car.imageUrl}
            alt={car.title}
            fill
            className="object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg flex-1 pr-2">{car.title}</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
            {car.source}
          </span>
        </div>

        <p className="text-2xl font-bold text-green-600 mb-3">
          €{car.price.toLocaleString('es-ES')}
        </p>

        <div className="text-sm text-gray-600 space-y-1 mb-4">
          {car.year && <p>📅 {car.year}</p>}
          {car.km && <p>🛣️ {car.km.toLocaleString('es-ES')} km</p>}
          {car.fuel && <p>⛽ {car.fuel}</p>}
          {car.location && <p>📍 {car.location}</p>}
        </div>

        <a
          href={car.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition"
        >
          Ver detalles
        </a>
      </div>
    </div>
  )
}
