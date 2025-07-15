<template>
  <div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-0">
          <i class="bi bi-plus-circle me-2"></i>
          Crear Contenido
        </h1>
        <p class="text-muted mb-0">Agregar nuevo contenido al sitio web</p>
      </div>
      <div>
        <button class="btn btn-outline-secondary me-2" @click="goBack">
          <i class="bi bi-arrow-left me-1"></i>
          Volver
        </button>
        <button class="btn btn-primary" @click="saveContent" :disabled="saving">
          <i class="bi bi-check-circle me-1"></i>
          {{ saving ? 'Guardando...' : 'Crear Contenido' }}
        </button>
      </div>
    </div>

    <!-- Formulario -->
    <div class="card">
      <div class="card-body">
        <form @submit.prevent="saveContent">
          <!-- Selección de tipo de contenido -->
          <div class="mb-4">
            <label class="form-label">Tipo de Contenido *</label>
            <select 
              class="form-select form-select-lg" 
              v-model="form.content_type_id"
              :class="{ 'is-invalid': errors.content_type_id }"
              required
              @change="loadContentTypeFields"
            >
              <option value="">Seleccionar tipo de contenido</option>
              <option v-for="type in contentTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
            <div v-if="errors.content_type_id" class="invalid-feedback">{{ errors.content_type_id }}</div>
            <div class="form-text">Selecciona el tipo de contenido que mejor describa tu contenido</div>
          </div>

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
                  <div v-if="imagePreview[field.name]" class="mt-2">
                    <img :src="imagePreview[field.name]" alt="Vista previa" class="img-thumbnail" style="max-width: 200px;">
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
import { useRouter } from 'vue-router'
import apiService from '../services/api.js'

export default {
  name: 'ContentCreate',
  setup() {
    const router = useRouter()
    
    // Estado reactivo
    const saving = ref(false)
    const contentTypes = ref([])
    const selectedContentType = ref(null)
    const errors = ref({})
    const fieldErrors = ref({})
    const imagePreview = ref({})

    // Formulario
    const form = reactive({
      title: '',
      slug: '',
      content_type_id: '',
      status: 'draft',
      data: {}
    })

    // Métodos
    const loadContentTypes = async () => {
      try {
        const response = await apiService.getContentTypes(1, 100)
        contentTypes.value = response.contentTypes
      } catch (error) {
        console.error('Error cargando tipos de contenido:', error)
      }
    }

    const loadContentTypeFields = async () => {
      if (!form.content_type_id) {
        selectedContentType.value = null
        return
      }

      try {
        const response = await apiService.getContentTypeFields(form.content_type_id)
        selectedContentType.value = response.contentType
        resetFormData()
      } catch (error) {
        console.error('Error cargando campos del tipo de contenido:', error)
      }
    }

    const resetFormData = () => {
      form.data = {}
      imagePreview.value = {}
      if (selectedContentType.value && selectedContentType.value.fields) {
        selectedContentType.value.fields.forEach(field => {
          form.data[field.name] = field.type === 'boolean' ? false : ''
        })
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

      if (!form.content_type_id) {
        errors.value.content_type_id = 'El tipo de contenido es requerido'
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
        
        const contentData = {
          title: form.title.trim(),
          slug: form.slug.trim() || null,
          content_type_id: parseInt(form.content_type_id),
          data: JSON.stringify(form.data),
          status: form.status
        }

        await apiService.createContent(contentData)
        
        // Redirigir a la lista de contenido
        router.push('/content')
      } catch (error) {
        console.error('Error guardando contenido:', error)
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
      loadContentTypes()
    })

    return {
      saving,
      contentTypes,
      selectedContentType,
      form,
      errors,
      imagePreview,
      loadContentTypes,
      loadContentTypeFields,
      resetFormData,
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