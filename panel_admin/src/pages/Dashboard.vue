<template>
  <div class="dashboard">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
      <h1 class="h2">Dashboard</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group me-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="refreshStats">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Actualizar
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row mb-4" v-if="stats">
      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-primary shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                  Páginas Totales
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ stats.totalPages || 0 }}
                </div>
              </div>
              <div class="col-auto">
                <i class="bi bi-file-text fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-success shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                  Páginas Publicadas
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ stats.publishedPages || 0 }}
                </div>
              </div>
              <div class="col-auto">
                <i class="bi bi-check-circle fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-info shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                  Archivos Multimedia
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ stats.totalMedia || 0 }}
                </div>
              </div>
              <div class="col-auto">
                <i class="bi bi-images fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6 mb-4">
        <div class="card border-left-warning shadow h-100 py-2">
          <div class="card-body">
            <div class="row no-gutters align-items-center">
              <div class="col mr-2">
                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                  Última Construcción
                </div>
                <div class="h5 mb-0 font-weight-bold text-gray-800">
                  {{ formatDate(stats.lastBuild) }}
                </div>
              </div>
              <div class="col-auto">
                <i class="bi bi-gear fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Acciones Rápidas</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-3 mb-3">
                <router-link to="/pages" class="btn btn-primary w-100">
                  <i class="bi bi-plus-circle me-2"></i>
                  Nueva Página
                </router-link>
              </div>
              <div class="col-md-3 mb-3">
                <router-link to="/media" class="btn btn-success w-100">
                  <i class="bi bi-upload me-2"></i>
                  Subir Media
                </router-link>
              </div>
              <div class="col-md-3 mb-3">
                <button class="btn btn-info w-100" @click="startBuild" :disabled="isBuilding">
                  <i class="bi bi-gear me-2"></i>
                  {{ isBuilding ? 'Construyendo...' : 'Construir Sitio' }}
                </button>
              </div>
              <div class="col-md-3 mb-3">
                <router-link to="/settings" class="btn btn-secondary w-100">
                  <i class="bi bi-gear me-2"></i>
                  Configuración
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Actividad Reciente</h5>
          </div>
          <div class="card-body">
            <div v-if="recentActivity.length === 0" class="text-center text-muted py-4">
              <i class="bi bi-inbox fa-3x mb-3"></i>
              <p>No hay actividad reciente</p>
            </div>
            <div v-else class="list-group list-group-flush">
              <div v-for="activity in recentActivity" :key="activity.id" class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ activity.title }}</h6>
                  <small class="text-muted">{{ formatDate(activity.date) }}</small>
                </div>
                <p class="mb-1">{{ activity.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import apiService from '../services/api.js'

export default {
  name: 'Dashboard',
  setup() {
    const stats = ref(null)
    const recentActivity = ref([])
    const isBuilding = ref(false)

    const loadStats = async () => {
      try {
        const response = await apiService.getDashboardStats()
        if (response.success) {
          stats.value = response.data
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    const startBuild = async () => {
      try {
        isBuilding.value = true
        await apiService.startBuild()
        // Recargar stats después de la construcción
        await loadStats()
      } catch (error) {
        console.error('Error starting build:', error)
      } finally {
        isBuilding.value = false
      }
    }

    const refreshStats = () => {
      loadStats()
    }

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      return new Date(dateString).toLocaleDateString('es-ES')
    }

    onMounted(() => {
      loadStats()
    })

    return {
      stats,
      recentActivity,
      isBuilding,
      startBuild,
      refreshStats,
      formatDate
    }
  }
}
</script>

<style scoped>
.border-left-primary {
  border-left: 0.25rem solid #4e73df !important;
}

.border-left-success {
  border-left: 0.25rem solid #1cc88a !important;
}

.border-left-info {
  border-left: 0.25rem solid #36b9cc !important;
}

.border-left-warning {
  border-left: 0.25rem solid #f6c23e !important;
}

.text-gray-300 {
  color: #dddfeb !important;
}

.text-gray-800 {
  color: #5a5c69 !important;
}
</style> 