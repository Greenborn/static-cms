<template>
  <div class="content-types">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
      <h1 class="h2">Tipos de Contenido</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group me-2">
          <button type="button" class="btn btn-sm btn-primary" @click="showCreateForm">
            <i class="bi bi-plus-circle me-1"></i>
            Nuevo Tipo
          </button>
        </div>
      </div>
    </div>

    <!-- Lista de tipos de contenido -->
    <div v-if="!showForm" class="content-types-list">
      <!-- Filtros y búsqueda -->
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Buscar tipos de contenido..."
              v-model="searchTerm"
              @input="debouncedSearch"
            >
            <button class="btn btn-outline-secondary" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="col-md-6 text-end">
          <select class="form-select d-inline-block w-auto" v-model="sortBy">
            <option value="name">Ordenar por nombre</option>
            <option value="created_at">Ordenar por fecha de creación</option>
            <option value="updated_at">Ordenar por fecha de actualización</option>
          </select>
        </div>
      </div>

      <!-- Tabla de tipos de contenido -->
      <div class="card">
        <div class="card-body">
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>

          <div v-else-if="contentTypes.length === 0" class="text-center py-4">
            <i class="bi bi-collection text-muted" style="font-size: 3rem;"></i>
            <p class="text-muted mt-2">No hay tipos de contenido</p>
            <button class="btn btn-primary" @click="showCreateForm">
              <i class="bi bi-plus-circle me-1"></i>
              Crear primer tipo
            </button>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Campos</th>
                  <th>Contenido</th>
                  <th>Última actualización</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contentType in contentTypes" :key="contentType.id">
                  <td>
                    <strong>{{ contentType.name }}</strong>
                  </td>
                  <td>
                    <span class="text-muted">{{ contentType.description || 'Sin descripción' }}</span>
                  </td>
                  <td>
                    <span class="badge bg-info">{{ contentType.fields.length }} campos</span>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ contentType.contentCount || 0 }} elementos</span>
                  </td>
                  <td>
                    <small class="text-muted">
                      {{ formatDate(contentType.updated_at) }}
                    </small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="editContentType(contentType)">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-info" @click="viewContentType(contentType)">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="deleteContentType(contentType)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div v-if="pagination.pages > 1" class="d-flex justify-content-center mt-3">
            <nav>
              <ul class="pagination">
                <li class="page-item" :class="{ disabled: pagination.page === 1 }">
                  <button class="page-link" @click="changePage(pagination.page - 1)">Anterior</button>
                </li>
                <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
                  <button class="page-link" @click="changePage(page)">{{ page }}</button>
                </li>
                <li class="page-item" :class="{ disabled: pagination.page === pagination.pages }">
                  <button class="page-link" @click="changePage(pagination.page + 1)">Siguiente</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Formulario de creación/edición -->
    <div v-if="showForm" class="content-type-form">
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">
            <i class="bi bi-collection me-2"></i>
            {{ isEditing ? 'Editar' : 'Crear' }} Tipo de Contenido
          </h5>
        </div>
        <div class="card-body">
          <form @submit.prevent="saveContentType">
            <!-- Información básica -->
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="name" class="form-label">Nombre *</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="name" 
                  v-model="form.name"
                  :class="{ 'is-invalid': errors.name }"
                  required
                >
                <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
              </div>
              <div class="col-md-6">
                <label for="description" class="form-label">Descripción</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="description" 
                  v-model="form.description"
                  placeholder="Descripción opcional"
                >
              </div>
            </div>

            <!-- Campos -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label">Campos *</label>
                <button type="button" class="btn btn-sm btn-outline-primary" @click="addField">
                  <i class="bi bi-plus-circle me-1"></i>
                  Agregar Campo
                </button>
              </div>

              <div v-if="form.fields.length === 0" class="text-center py-4 border rounded">
                <i class="bi bi-list-ul text-muted" style="font-size: 2rem;"></i>
                <p class="text-muted mt-2">No hay campos definidos</p>
                <button type="button" class="btn btn-primary" @click="addField">
                  <i class="bi bi-plus-circle me-1"></i>
                  Agregar primer campo
                </button>
              </div>

              <div v-else class="fields-list">
                <div v-for="(field, index) in form.fields" :key="index" class="field-item border rounded p-3 mb-3">
                  <div class="row">
                    <div class="col-md-4">
                      <label class="form-label">Nombre del campo *</label>
                      <input 
                        type="text" 
                        class="form-control" 
                        v-model="field.name"
                        :class="{ 'is-invalid': getFieldError(index, 'name') }"
                        placeholder="ej: título, descripción"
                        required
                      >
                      <div v-if="getFieldError(index, 'name')" class="invalid-feedback">{{ getFieldError(index, 'name') }}</div>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Tipo de dato *</label>
                      <select 
                        class="form-select" 
                        v-model="field.tipo_dato"
                        :class="{ 'is-invalid': getFieldError(index, 'tipo_dato') }"
                        required
                      >
                        <option value="">Seleccionar tipo</option>
                        <option value="text">Texto corto</option>
                        <option value="textarea">Texto largo</option>
                        <option value="number">Número</option>
                        <option value="date">Fecha</option>
                        <option value="boolean">Booleano</option>
                        <option value="select">Selector</option>
                        <option value="file">Archivo</option>
                        <option value="relation">Relación</option>
                        <option value="url">URL</option>
                        <option value="imagen">Imagen</option>
                      </select>
                      <div v-if="getFieldError(index, 'tipo_dato')" class="invalid-feedback">{{ getFieldError(index, 'tipo_dato') }}</div>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label">Requerido</label>
                      <div class="form-check mt-2">
                        <input 
                          class="form-check-input" 
                          type="checkbox" 
                          v-model="field.required"
                          id="required-{{ index }}"
                        >
                        <label class="form-check-label" :for="'required-' + index">
                          Campo obligatorio
                        </label>
                      </div>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label">&nbsp;</label>
                      <div>
                        <button type="button" class="btn btn-sm btn-outline-danger" @click="removeField(index)">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Configuración adicional para campos select -->
                  <div v-if="field.tipo_dato === 'select'" class="row mt-2">
                    <div class="col-md-6">
                      <label class="form-label">Opciones (una por línea)</label>
                      <textarea 
                        class="form-control" 
                        v-model="field.optionsText"
                        rows="3"
                        placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                        @input="updateSelectOptions(index)"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="d-flex justify-content-between">
              <button type="button" class="btn btn-secondary" @click="cancelForm">
                <i class="bi bi-x-circle me-1"></i>
                Cancelar
              </button>
              <div>
                <button type="button" class="btn btn-outline-primary me-2" @click="previewContentType">
                  <i class="bi bi-eye me-1"></i>
                  Vista previa
                </button>
                <button type="submit" class="btn btn-primary" :disabled="saving">
                  <i class="bi bi-check-circle me-1"></i>
                  {{ saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal de vista previa -->
    <Modal
      :visible="showPreviewModal"
      :title="'Vista previa: ' + form.name"
      :z-index="2000"
      :backdrop-z-index="1990"
      size="modal-lg"
      @close="showPreviewModal = false"
    >
      <template #default>
        <div class="preview-form">
          <div v-for="field in form.fields" :key="field.name" class="mb-3">
            <label class="form-label">
              {{ field.name }}
              <span v-if="field.required" class="text-danger">*</span>
            </label>
            <input v-if="field.tipo_dato === 'text'" type="text" class="form-control" :placeholder="field.name">
            <textarea v-else-if="field.tipo_dato === 'textarea'" class="form-control" rows="3" :placeholder="field.name"></textarea>
            <input v-else-if="field.tipo_dato === 'number'" type="number" class="form-control" :placeholder="field.name">
            <input v-else-if="field.tipo_dato === 'date'" type="date" class="form-control">
            <div v-else-if="field.tipo_dato === 'boolean'" class="form-check">
              <input class="form-check-input" type="checkbox" :id="'preview-' + field.name">
              <label class="form-check-label" :for="'preview-' + field.name">{{ field.name }}</label>
            </div>
            <select v-else-if="field.tipo_dato === 'select'" class="form-select">
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>
      </template>
      <template #footer>
        <button type="button" class="btn btn-secondary" @click="showPreviewModal = false">Cerrar</button>
      </template>
    </Modal>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import ApiService from '../services/api.js'
const api = new ApiService()
import Modal from '../components/Modal.vue'

export default {
  name: 'ContentTypes',
  setup() {
    // Estado reactivo
    const loading = ref(false)
    const saving = ref(false)
    const showForm = ref(false)
    const isEditing = ref(false)
    const contentTypes = ref([])
    const searchTerm = ref('')
    const sortBy = ref('name')
    const errors = ref({})
    const fieldErrors = ref({})
    const showPreviewModal = ref(false)

    // Paginación
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    })

    // Formulario
    const form = reactive({
      id: null,
      name: '',
      description: '',
      fields: []
    })

    // Computed
    const visiblePages = computed(() => {
      const pages = []
      const start = Math.max(1, pagination.page - 2)
      const end = Math.min(pagination.pages, pagination.page + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    })

    // Métodos
    const loadContentTypes = async () => {
      try {
        loading.value = true
        const response = await api.getContentTypes(
          pagination.page, 
          pagination.limit, 
          searchTerm.value,
          sortBy.value
        )
        
        contentTypes.value = response.contentTypes
        Object.assign(pagination, response.pagination)
      } catch (error) {
        console.error('Error cargando tipos de contenido:', error)
        // Aquí podrías mostrar un toast de error
      } finally {
        loading.value = false
      }
    }

    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        pagination.page = 1
        loadContentTypes()
      }, 300)
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.pages) {
        pagination.page = page
        loadContentTypes()
      }
    }

    const showCreateForm = () => {
      resetForm()
      isEditing.value = false
      showForm.value = true
    }

    const editContentType = (contentType) => {
      resetForm()
      isEditing.value = true
      form.id = contentType.id
      form.name = contentType.name
      form.description = contentType.description || ''
      
      // Transformar campos del backend al formato del frontend
      form.fields = contentType.fields.map(field => ({
        name: field.name,
        tipo_dato: field.type,
        required: field.required || false,
        options: field.options || [],
        optionsText: field.options ? field.options.join('\n') : ''
      }))
      
      showForm.value = true
    }

    const resetForm = () => {
      form.id = null
      form.name = ''
      form.description = ''
      form.fields = []
      errors.value = {}
      fieldErrors.value = {}
    }

    const addField = () => {
      form.fields.push({
        name: '',
        tipo_dato: '',
        required: false,
        options: [],
        optionsText: ''
      })
    }

    const removeField = (index) => {
      form.fields.splice(index, 1)
    }

    const updateSelectOptions = (index) => {
      const field = form.fields[index]
      field.options = field.optionsText.split('\n').filter(option => option.trim())
    }

    const validateForm = () => {
      errors.value = {}
      fieldErrors.value = {}

      // Validar nombre
      if (!form.name.trim()) {
        errors.value.name = 'El nombre es requerido'
      } else if (form.name.length > 100) {
        errors.value.name = 'El nombre no puede tener más de 100 caracteres'
      }

      // Validar campos
      if (form.fields.length === 0) {
        errors.value.fields = 'Debe tener al menos un campo'
      }

      form.fields.forEach((field, index) => {
        if (!field.name.trim()) {
          fieldErrors.value[index] = { ...fieldErrors.value[index], name: 'El nombre del campo es requerido' }
        }
        if (!field.tipo_dato) {
          fieldErrors.value[index] = { ...fieldErrors.value[index], tipo_dato: 'El tipo de dato es requerido' }
        }
        if (field.tipo_dato === 'select' && field.options.length === 0) {
          fieldErrors.value[index] = { ...fieldErrors.value[index], options: 'Debe especificar al menos una opción' }
        }
      })

      return Object.keys(errors.value).length === 0 && Object.keys(fieldErrors.value).length === 0
    }

    const getFieldError = (index, field) => {
      return fieldErrors.value[index]?.[field]
    }

    const saveContentType = async () => {
      if (!validateForm()) return

      try {
        saving.value = true
        
        // Transformar campos para que coincidan con la estructura del backend
        const transformedFields = form.fields.map(field => ({
          name: field.name,
          type: field.tipo_dato,
          required: field.required || false,
          options: field.tipo_dato === 'select' ? field.options : []
        }))
        
        const contentTypeData = {
          name: form.name.trim(),
          description: form.description.trim() || null,
          fields: JSON.stringify(transformedFields)
        }

        if (isEditing.value) {
          await api.updateContentType(form.id, contentTypeData)
        } else {
          await api.createContentType(contentTypeData)
        }

        showForm.value = false
        loadContentTypes()
        // Aquí podrías mostrar un toast de éxito
      } catch (error) {
        console.error('Error guardando tipo de contenido:', error)
        // Aquí podrías mostrar un toast de error
      } finally {
        saving.value = false
      }
    }

    const deleteContentType = async (contentType) => {
      if (!confirm(`¿Estás seguro de que quieres eliminar "${contentType.name}"?`)) {
        return
      }

      try {
        await api.deleteContentType(contentType.id)
        loadContentTypes()
        // Aquí podrías mostrar un toast de éxito
      } catch (error) {
        console.error('Error eliminando tipo de contenido:', error)
        // Aquí podrías mostrar un toast de error
      }
    }

    const cancelForm = () => {
      showForm.value = false
      resetForm()
    }

    const previewContentType = () => {
      showPreviewModal.value = true
    }

    const viewContentType = (contentType) => {
      // Implementar vista detallada
      console.log('Ver tipo de contenido:', contentType)
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Variables para debounce
    let searchTimeout

    // Lifecycle
    onMounted(() => {
      loadContentTypes()
    })

    return {
      loading,
      saving,
      showForm,
      isEditing,
      contentTypes,
      searchTerm,
      sortBy,
      pagination,
      form,
      errors,
      visiblePages,
      loadContentTypes,
      debouncedSearch,
      changePage,
      showCreateForm,
      editContentType,
      resetForm,
      addField,
      removeField,
      updateSelectOptions,
      validateForm,
      getFieldError,
      saveContentType,
      deleteContentType,
      cancelForm,
      previewContentType,
      viewContentType,
      formatDate,
      showPreviewModal
    }
  }
}
</script>

<style scoped>
.fields-list {
  max-height: 400px;
  overflow-y: auto;
}

.field-item {
  background-color: #f8f9fa;
  border-color: #dee2e6 !important;
}

.field-item:hover {
  background-color: #e9ecef;
}

.preview-form {
  max-height: 400px;
  overflow-y: auto;
}
</style> 