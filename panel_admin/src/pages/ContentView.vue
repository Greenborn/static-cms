<template>
  <div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-0">
          <i class="bi bi-eye me-2"></i>
          Ver Contenido
        </h1>
        <p class="text-muted mb-0">Detalles del contenido</p>
      </div>
      <div>
        <button class="btn btn-outline-secondary me-2" @click="goBack">
          <i class="bi bi-arrow-left me-1"></i>
          Volver
        </button>
        <button class="btn btn-primary" @click="editContent">
          <i class="bi bi-pencil me-1"></i>
          Editar
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-3">Cargando contenido...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="content" class="row">
      <!-- Información principal -->
      <div class="col-lg-8">
        <div class="card mb-4">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-file-text me-2"></i>
              Información del Contenido
            </h5>
          </div>
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-8">
                <h3>{{ content.title }}</h3>
                <p class="text-muted mb-0">
                  <strong>Slug:</strong> {{ content.slug }}
                </p>
              </div>
              <div class="col-md-4 text-end">
                <span :class="getStatusBadgeClass(content.status)" class="badge fs-6">
                  {{ getStatusText(content.status) }}
                </span>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <p><strong>Tipo de Contenido:</strong> {{ content.content_type_name }}</p>
                <p><strong>Creado:</strong> {{ formatDate(content.created_at) }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Actualizado:</strong> {{ formatDate(content.updated_at) }}</p>
                <p><strong>ID:</strong> {{ content.id }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Campos del contenido -->
        <div v-if="content.data && Object.keys(content.data).length > 0" class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="bi bi-list-check me-2"></i>
              Campos del Contenido
            </h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div v-for="(value, key) in content.data" :key="key" 
                   class="col-md-6 mb-3">
                <div class="content-field">
                  <label class="form-label fw-bold">{{ key }}</label>
                  <div class="field-value">
                    <!-- Valor booleano -->
                    <span v-if="typeof value === 'boolean'" 
                          :class="value ? 'text-success' : 'text-danger'">
                      <i :class="value ? 'bi bi-check-circle' : 'bi bi-x-circle'" class="me-1"></i>
                      {{ value ? 'Sí' : 'No' }}
                    </span>
                    
                    <!-- Valor de imagen -->
                    <div v-else-if="isImageField(key)" class="image-field">
                      <img :src="value" :alt="key" class="img-fluid rounded" style="max-width: 300px;">
                      <div class="mt-2">
                        <a :href="value" target="_blank" class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-box-arrow-up-right me-1"></i>
                          Ver imagen
                        </a>
                      </div>
                    </div>
                    
                    <!-- Valor de URL -->
                    <a v-else-if="isUrlField(key)" :href="value" target="_blank" 
                       class="text-primary text-decoration-none">
                      <i class="bi bi-box-arrow-up-right me-1"></i>
                      {{ value }}
                    </a>
                    
                    <!-- Valor de archivo -->
                    <div v-else-if="isFileField(key)" class="file-field">
                      <i class="bi bi-file-earmark me-2"></i>
                      <span>{{ getFileName(value) }}</span>
                      <div class="mt-2">
                        <a :href="value" target="_blank" class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-download me-1"></i>
                          Descargar
                        </a>
                      </div>
                    </div>
                    
                    <!-- Valor de texto largo -->
                    <div v-else-if="isLongText(value)" class="long-text">
                      <div class="text-preview">{{ value }}</div>
                      <button class="btn btn-sm btn-outline-secondary mt-2" 
                              @click="toggleFullText(key)">
                        {{ expandedText[key] ? 'Ver menos' : 'Ver más' }}
                      </button>
                    </div>
                    
                    <!-- Valor normal -->
                    <span v-else class="text-value">{{ value || 'No especificado' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sin campos -->
        <div v-else class="card">
          <div class="card-body text-center py-4">
            <i class="bi bi-inbox display-4 text-muted"></i>
            <h5 class="mt-3">Sin campos de contenido</h5>
            <p class="text-muted">Este contenido no tiene campos adicionales definidos</p>
          </div>
        </div>
      </div>

      <!-- Sidebar con acciones -->
      <div class="col-lg-4">
        <div class="card mb-4">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-gear me-2"></i>
              Acciones
            </h6>
          </div>
          <div class="card-body">
            <div class="d-grid gap-2">
              <button class="btn btn-primary" @click="editContent">
                <i class="bi bi-pencil me-1"></i>
                Editar Contenido
              </button>
              <button class="btn btn-outline-info" @click="duplicateContent">
                <i class="bi bi-files me-1"></i>
                Duplicar
              </button>
              <button class="btn btn-outline-warning" @click="changeStatus">
                <i class="bi bi-arrow-repeat me-1"></i>
                Cambiar Estado
              </button>
              <button class="btn btn-outline-danger" @click="deleteContent">
                <i class="bi bi-trash me-1"></i>
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-info-circle me-2"></i>
              Información Adicional
            </h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <small class="text-muted">Tipo de Contenido ID</small>
              <div class="fw-bold">{{ content.content_type_id }}</div>
            </div>
            <div class="mb-3">
              <small class="text-muted">Creado</small>
              <div class="fw-bold">{{ formatDate(content.created_at) }}</div>
            </div>
            <div class="mb-3">
              <small class="text-muted">Última actualización</small>
              <div class="fw-bold">{{ formatDate(content.updated_at) }}</div>
            </div>
            <div>
              <small class="text-muted">ID del contenido</small>
              <div class="fw-bold">{{ content.id }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="text-center py-5">
      <i class="bi bi-exclamation-triangle display-4 text-warning"></i>
      <h4 class="mt-3">Contenido no encontrado</h4>
      <p class="text-muted">El contenido que buscas no existe o ha sido eliminado</p>
      <button class="btn btn-primary" @click="goBack">
        <i class="bi bi-arrow-left me-1"></i>
        Volver a la lista
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import apiService from '../services/api.js'

export default {
  name: 'ContentView',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // Estado reactivo
    const loading = ref(true)
    const content = ref(null)
    const expandedText = ref({})

    // Métodos
    const loadContent = async () => {
      try {
        loading.value = true
        const contentId = route.params.id
        
        const response = await apiService.getContentById(contentId)
        content.value = response.content
      } catch (error) {
        console.error('Error cargando contenido:', error)
        content.value = null
      } finally {
        loading.value = false
      }
    }

    const getStatusBadgeClass = (status) => {
      switch (status) {
        case 'published': return 'badge bg-success'
        case 'draft': return 'badge bg-warning'
        case 'archived': return 'badge bg-secondary'
        default: return 'badge bg-secondary'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'published': return 'Publicado'
        case 'draft': return 'Borrador'
        case 'archived': return 'Archivado'
        default: return status
      }
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const isImageField = (fieldName) => {
      return fieldName.toLowerCase().includes('imagen') || 
             fieldName.toLowerCase().includes('image') ||
             fieldName.toLowerCase().includes('foto') ||
             fieldName.toLowerCase().includes('photo')
    }

    const isUrlField = (fieldName) => {
      return fieldName.toLowerCase().includes('url') || 
             fieldName.toLowerCase().includes('link') ||
             fieldName.toLowerCase().includes('enlace')
    }

    const isFileField = (fieldName) => {
      return fieldName.toLowerCase().includes('archivo') || 
             fieldName.toLowerCase().includes('file') ||
             fieldName.toLowerCase().includes('documento')
    }

    const isLongText = (value) => {
      return typeof value === 'string' && value.length > 100
    }

    const getFileName = (filePath) => {
      if (!filePath) return 'Sin archivo'
      return filePath.split('/').pop() || filePath
    }

    const toggleFullText = (fieldName) => {
      expandedText.value[fieldName] = !expandedText.value[fieldName]
    }

    const editContent = () => {
      router.push(`/content/edit/${content.value.id}`)
    }

    const duplicateContent = () => {
      // Implementar duplicación
      console.log('Duplicar contenido:', content.value.id)
    }

    const changeStatus = () => {
      // Implementar cambio de estado
      console.log('Cambiar estado:', content.value.id)
    }

    const deleteContent = async () => {
      if (!confirm(`¿Estás seguro de que quieres eliminar "${content.value.title}"?`)) {
        return
      }

      try {
        await apiService.deleteContent(content.value.id)
        router.push('/content')
      } catch (error) {
        console.error('Error eliminando contenido:', error)
      }
    }

    const goBack = () => {
      router.push('/content')
    }

    // Lifecycle
    onMounted(() => {
      loadContent()
    })

    return {
      loading,
      content,
      expandedText,
      getStatusBadgeClass,
      getStatusText,
      formatDate,
      isImageField,
      isUrlField,
      isFileField,
      isLongText,
      getFileName,
      toggleFullText,
      editContent,
      duplicateContent,
      changeStatus,
      deleteContent,
      goBack
    }
  }
}
</script>

<style scoped>
.content-field {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  background-color: #f8f9fa;
}

.field-value {
  margin-top: 0.5rem;
}

.text-value {
  word-break: break-word;
}

.long-text .text-preview {
  max-height: 100px;
  overflow: hidden;
  position: relative;
}

.long-text .text-preview.expanded {
  max-height: none;
}

.image-field img {
  border: 1px solid #dee2e6;
}

.file-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}
</style> 