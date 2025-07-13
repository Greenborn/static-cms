import { useQuery } from 'react-query'
import { 
  FileText, 
  Database, 
  Eye, 
  Image, 
  Code, 
  Clock, 
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import apiService from '../services/api'
import { DashboardStats } from '../types'

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>(
    'dashboard-stats',
    () => apiService.getDashboardStats().then(res => res.data!),
    {
      refetchInterval: 30000, // Refrescar cada 30 segundos
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error al cargar estadísticas
            </h3>
            <div className="mt-2 text-sm text-red-700">
              No se pudieron cargar las estadísticas del dashboard.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Páginas Totales',
      value: stats?.total_pages || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      name: 'Páginas Publicadas',
      value: stats?.published_pages || 0,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      name: 'Borradores',
      value: stats?.draft_pages || 0,
      icon: FileText,
      color: 'bg-yellow-500',
    },
    {
      name: 'Tipos de Contenido',
      value: stats?.total_content_types || 0,
      icon: Database,
      color: 'bg-purple-500',
    },
    {
      name: 'Vistas',
      value: stats?.total_views || 0,
      icon: Eye,
      color: 'bg-indigo-500',
    },
    {
      name: 'Archivos Multimedia',
      value: stats?.total_media_files || 0,
      icon: Image,
      color: 'bg-pink-500',
    },
    {
      name: 'Formateadores',
      value: stats?.total_formatters || 0,
      icon: Code,
      color: 'bg-gray-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general del sistema Static CMS
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center justify-center h-8 w-8 rounded-md ${stat.color} text-white`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Información del último build */}
      {stats?.last_build && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Última Generación del Sitio
            </h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha</p>
                  <p className="text-sm text-gray-900">
                    {new Date(stats.last_build).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
              {stats.build_duration && (
                <div className="flex items-center">
                  <TrendingUp className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Duración</p>
                    <p className="text-sm text-gray-900">
                      {Math.round(stats.build_duration / 1000)} segundos
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Acciones Rápidas
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                  <FileText className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Crear Nueva Página
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Crear una nueva página para el sitio web
                </p>
              </div>
            </button>

            <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                  <TrendingUp className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Generar Sitio
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Generar el sitio estático completo
                </p>
              </div>
            </button>

            <button className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-700 ring-4 ring-white">
                  <Database className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Gestionar Contenido
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Administrar tipos de contenido y vistas
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 