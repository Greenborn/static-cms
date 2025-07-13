<template>
  <div class="site-builder">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
      <h1 class="h2">Constructor de Sitio</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group me-2">
          <button type="button" class="btn btn-sm btn-success" @click="startBuild" :disabled="isBuilding">
            <i class="bi bi-gear me-1"></i>
            {{ isBuilding ? 'Construyendo...' : 'Construir Sitio' }}
          </button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Estado de Construcción</h5>
          </div>
          <div class="card-body">
            <p class="text-muted">Funcionalidad del constructor de sitio en desarrollo...</p>
            <p>Aquí se implementará:</p>
            <ul>
              <li>Estado actual de construcción</li>
              <li>Progreso en tiempo real</li>
              <li>Logs de construcción</li>
              <li>Errores y advertencias</li>
              <li>Configuración de build</li>
              <li>Optimizaciones automáticas</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Acciones</h5>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="btn btn-primary" @click="buildPage">
                <i class="bi bi-file-text me-1"></i>
                Construir Página
              </button>
              <button class="btn btn-warning" @click="cleanBuild">
                <i class="bi bi-trash me-1"></i>
                Limpiar Build
              </button>
              <button class="btn btn-info" @click="viewSite">
                <i class="bi bi-eye me-1"></i>
                Ver Sitio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import apiService from '../services/api.js'

export default {
  name: 'SiteBuilder',
  setup() {
    const isBuilding = ref(false)

    const startBuild = async () => {
      try {
        isBuilding.value = true
        await apiService.startBuild()
      } catch (error) {
        console.error('Error starting build:', error)
      } finally {
        isBuilding.value = false
      }
    }

    const buildPage = async () => {
      // Implementar construcción de página específica
      console.log('Build page')
    }

    const cleanBuild = async () => {
      try {
        await apiService.cleanBuild()
      } catch (error) {
        console.error('Error cleaning build:', error)
      }
    }

    const viewSite = () => {
      window.open('/public', '_blank')
    }

    return {
      isBuilding,
      startBuild,
      buildPage,
      cleanBuild,
      viewSite
    }
  }
}
</script> 