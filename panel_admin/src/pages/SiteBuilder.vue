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

    <!-- Sección de Clonado de Sitio -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-download me-2"></i>
              Clonar Sitio Web
            </h5>
          </div>
          <div class="card-body">
            <!-- Formulario de clonado -->
            <div v-if="!cloneProcess" class="row">
              <div class="col-md-8">
                <div class="mb-3">
                  <label for="siteUrl" class="form-label">URL del sitio a clonar</label>
                  <div class="input-group">
                    <input 
                      type="url" 
                      class="form-control" 
                      id="siteUrl" 
                      v-model="siteUrl"
                      placeholder="https://ejemplo.com"
                      :disabled="isAnalyzing"
                    >
                    <button 
                      class="btn btn-primary" 
                      @click="startCloneAnalysis"
                      :disabled="!siteUrl || isAnalyzing"
                    >
                      <i class="bi bi-search me-1"></i>
                      {{ isAnalyzing ? 'Analizando...' : 'Analizar Sitio' }}
                    </button>
                  </div>
                  <div class="form-text">
                    Ingresa la URL completa del sitio web que deseas clonar
                  </div>
                </div>
              </div>
            </div>

            <!-- Proceso de clonado activo -->
            <div v-if="cloneProcess" class="clone-process">
              <!-- Información del proceso -->
              <div class="row mb-3">
                <div class="col-md-6">
                  <h6>Proceso de Clonado</h6>
                  <p class="text-muted mb-1">
                    <strong>URL:</strong> {{ cloneProcess.url }}
                  </p>
                  <p class="text-muted mb-1">
                    <strong>Estado:</strong> 
                    <span :class="getStatusClass(cloneProcess.status)">
                      {{ getStatusText(cloneProcess.status) }}
                    </span>
                  </p>
                  <p class="text-muted mb-0">
                    <strong>Recursos encontrados:</strong> {{ cloneProcess.totalResources || 0 }}
                  </p>
                </div>
                <div class="col-md-6">
                  <div class="progress mb-2">
                    <div 
                      class="progress-bar" 
                      :style="{ width: getProgressPercentage() + '%' }"
                      role="progressbar"
                    ></div>
                  </div>
                  <small class="text-muted">
                    {{ cloneProcess.processedResources || 0 }} de {{ cloneProcess.totalResources || 0 }} recursos procesados
                  </small>
                </div>
              </div>

                            <!-- Debug info -->
              <div class="alert alert-info">
                <strong>Debug:</strong> 
                cloneProcess: {{ cloneProcess ? 'Sí' : 'No' }}, 
                resources.length: {{ resources.length }}, 
                totalResources: {{ cloneProcess?.totalResources || 0 }}
                <button class="btn btn-sm btn-outline-info ms-2" @click="debugState">
                  Debug Estado
                </button>
              </div>
              
              <!-- Lista de recursos -->
              <div v-if="resources.length > 0" class="resources-list">
                <h6>Recursos Encontrados</h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Tipo</th>
                        <th>URL</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(resource, index) in resources" :key="index">
                        <td>{{ index + 1 }}</td>
                        <td>
                          <span class="badge" :class="getResourceTypeClass(resource.type)">
                            {{ resource.type }}
                          </span>
                        </td>
                        <td>
                          <small class="text-muted">{{ resource.url }}</small>
                        </td>
                        <td>
                          <span :class="getResourceStatusClass(resource.status)">
                            {{ getResourceStatusText(resource.status) }}
                          </span>
                        </td>
                        <td>
                          <button 
                            v-if="resource.status === 'pending'"
                            class="btn btn-sm btn-outline-primary"
                            @click="processResource(resource, index)"
                            :disabled="resource.processing"
                          >
                            <i class="bi bi-download me-1"></i>
                            {{ resource.processing ? 'Procesando...' : 'Procesar' }}
                          </button>
                          <span v-else-if="resource.status === 'success'" class="text-success">
                            <i class="bi bi-check-circle me-1"></i>
                            Completado
                          </span>
                          <span v-else-if="resource.status === 'error'" class="text-danger">
                            <i class="bi bi-x-circle me-1"></i>
                            Error
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Botones de acción masiva -->
                <div class="mt-3">
                  <button 
                    class="btn btn-success me-2"
                    @click="processAllResources"
                    :disabled="!hasPendingResources()"
                  >
                    <i class="bi bi-download me-1"></i>
                    Procesar Todos
                  </button>
                  <button 
                    class="btn btn-outline-secondary"
                    @click="resetCloneProcess"
                  >
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Nuevo Clonado
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección original del constructor -->
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
import { ref, reactive, nextTick, watch } from 'vue'
import ApiService from '../services/api.js'
const api = new ApiService()

export default {
  name: 'SiteBuilder',
  setup() {
    const isBuilding = ref(false)
    const isAnalyzing = ref(false)
    const siteUrl = ref('')
    const cloneProcess = ref(null)
    const resources = ref([])

    const startBuild = async () => {
      try {
        isBuilding.value = true
        await api.startBuild()
      } catch (error) {
        console.error('Error starting build:', error)
      } finally {
        isBuilding.value = false
      }
    }

    const startCloneAnalysis = async () => {
      if (!siteUrl.value) return
      
      try {
        isAnalyzing.value = true
        console.log('Iniciando análisis de sitio:', siteUrl.value)
        
        const response = await api.cloneSite(siteUrl.value)
        console.log('Respuesta del servidor:', response)
        console.log('response.success:', response.success)
        console.log('response.data:', response.data)
        
        if (response && response.success) {
          console.log('Análisis exitoso, configurando datos...')
          
          // Configurar datos directamente
          cloneProcess.value = {
            id: response.data.processId,
            url: siteUrl.value,
            status: 'ready',
            totalResources: response.data.totalResources,
            processedResources: 0
          }
          resources.value = response.data.resources
          
          console.log('Datos configurados:', {
            cloneProcess: cloneProcess.value,
            resourcesCount: resources.value.length
          })
          
          // Verificar que los watchers se ejecuten
          console.log('Verificando reactividad...')
          console.log('cloneProcess.value después de asignar:', cloneProcess.value)
          console.log('resources.value después de asignar:', resources.value.length)
        } else {
          console.error('Respuesta no exitosa:', response)
          console.error('Tipo de response:', typeof response)
          console.error('response.success:', response?.success)
          console.error('response.data:', response?.data)
        }
      } catch (error) {
        console.error('Error analizando sitio:', error)
        alert('Error al analizar el sitio: ' + error.message)
      } finally {
        isAnalyzing.value = false
      }
    }

    const processResource = async (resource, index) => {
      try {
        resource.processing = true
        resource.status = 'processing'
        
        const response = await api.processCloneResource({
          processId: cloneProcess.value.id,
          resourceIndex: index,
          resourceUrl: resource.url,
          resourceType: resource.type,
          originalPath: resource.original
        })
        
        if (response.success) {
          resource.status = 'success'
          resource.filename = response.data.filename
          resource.filePath = response.data.filePath
          cloneProcess.value.processedResources = (cloneProcess.value.processedResources || 0) + 1
        }
      } catch (error) {
        console.error('Error procesando recurso:', error)
        resource.status = 'error'
        resource.error = error.message
      } finally {
        resource.processing = false
      }
    }

    const processAllResources = async () => {
      const pendingResources = resources.value.filter(r => r.status === 'pending')
      
      for (let i = 0; i < pendingResources.length; i++) {
        const resource = pendingResources[i]
        const index = resources.value.indexOf(resource)
        await processResource(resource, index)
        
        // Pequeña pausa entre recursos para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const resetCloneProcess = () => {
      cloneProcess.value = null
      resources.value = []
      siteUrl.value = ''
    }

    const debugState = () => {
      console.log('=== DEBUG ESTADO ===')
      console.log('cloneProcess:', cloneProcess.value)
      console.log('resources:', resources.value)
      console.log('resources.length:', resources.value.length)
      console.log('siteUrl:', siteUrl.value)
      console.log('isAnalyzing:', isAnalyzing.value)
      console.log('==================')
    }

    const hasPendingResources = () => {
      return resources.value.some(r => r.status === 'pending')
    }

    // Watchers para debug
    watch(cloneProcess, (newVal) => {
      console.log('cloneProcess cambió:', newVal)
    }, { deep: true })

    watch(resources, (newVal) => {
      console.log('resources cambió:', newVal.length, 'elementos')
    }, { deep: true })

    const getProgressPercentage = () => {
      if (!cloneProcess.value || !cloneProcess.value.totalResources) return 0
      return Math.round((cloneProcess.value.processedResources || 0) / cloneProcess.value.totalResources * 100)
    }

    const getStatusClass = (status) => {
      switch (status) {
        case 'analyzing': return 'text-warning'
        case 'ready': return 'text-success'
        case 'error': return 'text-danger'
        default: return 'text-muted'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'analyzing': return 'Analizando'
        case 'ready': return 'Listo para procesar'
        case 'error': return 'Error'
        default: return 'Desconocido'
      }
    }

    const getResourceTypeClass = (type) => {
      switch (type) {
        case 'css': return 'bg-primary'
        case 'js': return 'bg-warning'
        case 'image': return 'bg-success'
        default: return 'bg-secondary'
      }
    }

    const getResourceStatusClass = (status) => {
      switch (status) {
        case 'pending': return 'text-muted'
        case 'processing': return 'text-warning'
        case 'success': return 'text-success'
        case 'error': return 'text-danger'
        default: return 'text-muted'
      }
    }

    const getResourceStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Pendiente'
        case 'processing': return 'Procesando'
        case 'success': return 'Completado'
        case 'error': return 'Error'
        default: return 'Desconocido'
      }
    }

    const buildPage = async () => {
      console.log('Build page')
    }

    const cleanBuild = async () => {
      try {
        await api.cleanBuild()
      } catch (error) {
        console.error('Error cleaning build:', error)
      }
    }

    const viewSite = () => {
      window.open('/public', '_blank')
    }

    return {
      isBuilding,
      isAnalyzing,
      siteUrl,
      cloneProcess,
      resources,
      startBuild,
              startCloneAnalysis,
        processResource,
        processAllResources,
        resetCloneProcess,
        debugState,
        hasPendingResources,
      getProgressPercentage,
      getStatusClass,
      getStatusText,
      getResourceTypeClass,
      getResourceStatusClass,
      getResourceStatusText,
      buildPage,
      cleanBuild,
      viewSite
    }
  }
}
</script>

<style scoped>
.clone-process {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.resources-list {
  margin-top: 1rem;
}

.progress {
  height: 0.5rem;
}

.table th {
  font-size: 0.875rem;
  font-weight: 600;
}

.table td {
  font-size: 0.875rem;
  vertical-align: middle;
}

.badge {
  font-size: 0.75rem;
}
</style> 