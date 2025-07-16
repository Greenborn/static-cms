<template>
  <div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-0">
          <i class="bi bi-pencil-square me-2"></i>
          Editar Contenido
        </h1>
        <p class="text-muted mb-0">Modificar contenido existente</p>
      </div>
      <div>
        <button class="btn btn-outline-secondary me-2" @click="goBack">
          <i class="bi bi-arrow-left me-1"></i>
          Volver
        </button>
        <button class="btn btn-primary" @click="saveContent" :disabled="saving">
          <i class="bi bi-check-circle me-1"></i>
          {{ saving ? 'Guardando...' : 'Actualizar Contenido' }}
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

    <!-- Formulario -->
    <div v-else class="card">
      <div class="card-body">
        <form @submit.prevent="saveContent">
          <!-- Campos básicos -->
          <div class="row mb-4">
            <div class="col-md-8">
              <label class="form-label">Título *</label>
              <input 
                type="text" 
                class="form-control form-control-lg" 
                v-model="form.title"
                :class="{ 'is-invalid': errors.title }"
                required
                placeholder="Ingresa el título del contenido"
              >
              <div v-if="errors.title" class="invalid-feedback">{{ errors.title }}</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Estado</label>
              <select class="form-select form-select-lg" v-model="form.status">
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>

          <div class="mb-4">
            <label class="form-label">Slug</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="form.slug"
              :class="{ 'is-invalid': errors.slug }"
              placeholder="Se generará automáticamente si se deja vacío"
            >
            <div v-if="errors.slug" class="invalid-feedback">{{ errors.slug }}</div>
            <div class="form-text">URL amigable para el contenido (ej: mi-articulo-importante)</div>
          </div>

          <!-- Información del tipo de contenido -->
          <div class="mb-4">
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <strong>Tipo de Contenido:</strong> {{ selectedContentType?.name }}
            </div>
          </div>

          <!-- Campos dinámicos según el tipo de contenido -->
          <div v-if="selectedContentType && selectedContentType.fields" class="mb-4">
            <h5 class="mb-3">
              <i class="bi bi-list-check me-2"></i>
              Campos del Contenido
            </h5>
            
            <div class="row">
              <div v-for="field in selectedContentType.fields" :key="field.name" 
                   :class="getFieldColumnClass(field.type)" class="mb-3">
                <label class="form-label">
                  {{ field.name }}
                  <span v-if="field.required" class="text-danger">*</span>
                </label>
                
                <!-- Campo de texto -->
                <input 
                  v-if="field.type === 'text'" 
                  type="text" 
                  class="form-control"
                  :class="{ 'is-invalid': getFieldError(field.name) }"
                  v-model="form.data[field.name]"
                  :required="field.required"
                  :placeholder="`Ingresa ${field.name.toLowerCase()}`"
                >
                
                <!-- Campo de texto largo -->
                <textarea 
                  v-else-if="field.type === 'textarea'" 
                  class="form-control" 
                  rows="4"
                  :class="{ 'is-invalid': getFieldError(field.name) }"
                  v-model="form.data[field.name]"
                  :required="field.required"
                  :placeholder="`Ingresa ${field.name.toLowerCase()}`"
                ></textarea>
                
                <!-- Campo numérico -->
                <input 
                  v-else-if="field.type === 'number'" 
                  type="number" 
                  class="form-control"
                  :class="{ 'is-invalid': getFieldError(field.name) }"
                  v-model="form.data[field.name]"
                  :required="field.required"
                  :placeholder="`Ingresa ${field.name.toLowerCase()}`"
                >
                
                <!-- Campo de fecha -->
                <input 
                  v-else-if="field.type === 'date'" 
                  type="date" 
                  class="form-control"
                  :class="{ 'is-invalid': getFieldError(field.name) }"
                  v-model="form.data[field.name]"
                  :required="field.required"
                >
                
                <!-- Campo booleano -->
                <div v-else-if="field.type === 'boolean'" class="form-check form-switch">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    :id="'field-' + field.name"
                    :class="{ 'is-invalid': getFieldError(field.name) }"
                    v-model="form.data[field.name]"
                    :required="field.required"
                  >
                  <label class="form-check-label" :for="'field-' + field.name">
                    {{ field.name }}
                  </label>
                </div>
                
                <!-- Campo select -->
                <select 
                  v-else-if="field.type === 'select'" 
                  class="form-select"
                  :class="{ 'is-invalid': getFieldError(field.name) }"
                  v-model="form.data[field.name]"
                  :required="field.required"
                >
                  <option value="">Seleccionar {{ field.name.toLowerCase() }}...</option>
                  <option v-for="option in field.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
                
                <!-- Campo de archivo -->
                <div v-else-if="field.type === 'file'" class="file-upload">
                  <input 
                    type="file" 
                    class="form-control"
                    :class="{ 'is-invalid': getFieldError(field.name) }"
                    :required="field.required"
                    @change="handleFileUpload($event, field.name)"
                  >
                  <div class="form-text">Selecciona un archivo para subir</div>
                  <div v-if="form.data[field.name] && typeof form.data[field.name] === 'string'" class="mt-2">
                    <small class="text-muted">Archivo actual: {{ form.data[field.name] }}</small>
                  </div>
                </div>
                
                <!-- Campo de URL -->
                <input 
                  v-else-if="field.type === 'url'" 
                  type="url" 
                  class="form-control"
                  :class="{ 'is-invalid': getFieldError(field.name) }"
                  v-model="form.data[field.name]"
                  :required="field.required"
                  placeholder="https://ejemplo.com"
                >
                
                <!-- Campo de imagen -->
                <div v-else-if="field.type === 'imagen'" class="image-upload">
                  <input 
                    type="file" 
                    class="form-control"
                    :class="{ 'is-invalid': getFieldError(field.name) }"
                    accept="image/*"
                    :required="field.required"
                    @change="handleImageUpload($event, field.name)"
                  >
                  <div class="form-text">Formatos soportados: JPG, PNG, GIF, WebP</div>
                  <div v-if="imagePreview[field.name] || (form.data[field.name] && typeof form.data[field.name] === 'string')" class="mt-2">
                    <img :src="imagePreview[field.name] || form.data[field.name]" alt="Vista previa" class="img-thumbnail" style="max-width: 200px;">
                  </div>
                </div>
                
                <!-- Campo de relación -->
                <select 
                  v-else-if="field.type === 'relation'" 
                  class="form-select"
                  :class="{ 'is-invalid': getFieldError(field.name) }"
                  v-model="form.data[field.name]"
                  :required="field.required"
                >
                  <option value="">Seleccionar relación...</option>
                </select>
                
                <div v-if="getFieldError(field.name)" class="invalid-feedback d-block">
                  {{ getFieldError(field.name) }}
                </div>
                
                <div v-if="field.description" class="form-text">
                  {{ field.description }}
                </div>
              </div>
            </div>
          </div>

          <!-- Vista previa del contenido -->
          <div v-if="selectedContentType && form.title" class="mb-4">
            <h5 class="mb-3">
              <i class="bi bi-eye me-2"></i>
              Vista Previa
            </h5>
            <div class="card">
              <div class="card-body">
                <h4>{{ form.title }}</h4>
                <p class="text-muted">
                  <strong>Tipo:</strong> {{ selectedContentType.name }} |
                  <strong>Estado:</strong> {{ getStatusText(form.status) }} |
                  <strong>Slug:</strong> {{ form.slug || 'Se generará automáticamente' }}
                </p>
                <hr>
                <div v-if="Object.keys(form.data).length > 0" class="content-preview">
                  <div v-for="(value, key) in form.data" :key="key" class="mb-2">
                    <strong>{{ key }}:</strong>
                    <div class="mt-1">
                      <span v-if="typeof value === 'boolean'">{{ value ? 'Sí' : 'No' }}</span>
                      <span v-else-if="value">{{ value }}</span>
                      <span v-else class="text-muted">No especificado</span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-muted">
                  Completa los campos del contenido para ver la vista previa
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ApiService from '../services/api.js'
const api = new ApiService()

export default {
  name: 'ContentEdit',
  setup() {
    const router = useRouter()
    const route = useRoute()
    
    // Estado reactivo
    const loading = ref(true)
    const saving = ref(false)
    const selectedContentType = ref(null)
    const errors = ref({})
    const fieldErrors = ref({})
    const imagePreview = ref({})

    // Formulario
    const form = reactive({
      id: null,
      title: '',
      slug: '',
      content_type_id: '',
      status: 'draft',
      data: {}
    })

    // Métodos
    const loadContent = async () => {
      try {
        loading.value = true
        const contentId = route.params.id
        
        const response = await api.getContentById(contentId)
        const contentData = response.content
        
        // Llenar formulario
        form.id = contentData.id
        form.title = contentData.title
        form.slug = contentData.slug
        form.content_type_id = contentData.content_type_id
        form.status = contentData.status
        form.data = { ...contentData.data }
        
        // Cargar campos del tipo de contenido
        await loadContentTypeFields()
      } catch (error) {
        console.error('Error cargando contenido:', error)
        // Redirigir a la lista si no se encuentra
        router.push('/content')
      } finally {
        loading.value = false
      }
    }

    const loadContentTypeFields = async () => {
      if (!form.content_type_id) {
        selectedContentType.value = null
        return
      }

      try {
        const response = await api.getContentTypeFields(form.content_type_id)
        selectedContentType.value = response.contentType
      } catch (error) {
        console.error('Error cargando campos del tipo de contenido:', error)
      }
    }

    const getFieldColumnClass = (fieldType) => {
      // Campos que ocupan toda la anchura
      if (['textarea', 'imagen', 'file'].includes(fieldType)) {
        return 'col-12'
      }
      // Campos que pueden ir en columnas
      return 'col-md-6'
    }

    const validateForm = () => {
      errors.value = {}
      fieldErrors.value = {}

      if (!form.title.trim()) {
        errors.value.title = 'El título es requerido'
      }

      // Validar campos requeridos del tipo de contenido
      if (selectedContentType.value && selectedContentType.value.fields) {
        selectedContentType.value.fields.forEach(field => {
          if (field.required && (!form.data[field.name] || form.data[field.name] === '')) {
            fieldErrors.value[field.name] = `El campo "${field.name}" es requerido`
          }
        })
      }

      return Object.keys(errors.value).length === 0 && Object.keys(fieldErrors.value).length === 0
    }

    const getFieldError = (fieldName) => {
      return fieldErrors.value[fieldName]
    }

    const handleFileUpload = (event, fieldName) => {
      const file = event.target.files[0]
      if (file) {
        form.data[fieldName] = file
      }
    }

    const handleImageUpload = (event, fieldName) => {
      const file = event.target.files[0]
      if (file) {
        form.data[fieldName] = file
        
        // Crear vista previa
        const reader = new FileReader()
        reader.onload = (e) => {
          imagePreview.value[fieldName] = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const saveContent = async () => {
      if (!validateForm()) return

      try {
        saving.value = true
        
        // Procesar archivos e imágenes antes de enviar
        const processedData = { ...form.data }
        
        // Procesar cada campo para detectar archivos
        for (const [fieldName, fieldValue] of Object.entries(processedData)) {
          if (fieldValue instanceof File) {
            try {
              console.log(`Subiendo archivo para campo: ${fieldName}`)
              const uploadResponse = await api.uploadMedia(fieldValue)
              processedData[fieldName] = uploadResponse.url
              console.log(`Archivo subido exitosamente: ${uploadResponse.url}`)
            } catch (uploadError) {
              console.error(`Error subiendo archivo para campo ${fieldName}:`, uploadError)
              throw new Error(`Error al subir el archivo del campo "${fieldName}": ${uploadError.message}`)
            }
          }
        }
        
        const contentData = {
          title: form.title.trim(),
          slug: form.slug.trim() || null,
          content_type_id: parseInt(form.content_type_id),
          data: JSON.stringify(processedData),
          status: form.status
        }

        await api.updateContent(form.id, contentData)
        
        // Redirigir a la lista de contenido
        router.push('/content')
      } catch (error) {
        console.error('Error guardando contenido:', error)
        // Aquí podrías mostrar un mensaje de error al usuario
      } finally {
        saving.value = false
      }
    }

    const goBack = () => {
      router.push('/content')
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'published': return 'Publicado'
        case 'draft': return 'Borrador'
        case 'archived': return 'Archivado'
        default: return status
      }
    }

    // Lifecycle
    onMounted(() => {
      loadContent()
    })

    return {
      loading,
      saving,
      selectedContentType,
      form,
      errors,
      imagePreview,
      loadContent,
      loadContentTypeFields,
      getFieldColumnClass,
      validateForm,
      getFieldError,
      handleFileUpload,
      handleImageUpload,
      saveContent,
      goBack,
      getStatusText
    }
  }
}
</script>

<style scoped>
.image-upload {
  position: relative;
}

.file-upload {
  position: relative;
}

.content-preview {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 0.375rem;
}

.form-select-lg {
  font-size: 1.125rem;
  padding: 0.75rem 1rem;
}

.form-control-lg {
  font-size: 1.125rem;
  padding: 0.75rem 1rem;
}
</style> 