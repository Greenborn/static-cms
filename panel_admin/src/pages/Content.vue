<template>
  <div class="container-fluid">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-0">
          <i class="bi bi-file-text me-2"></i>
          Gestión de Contenido
        </h1>
        <p class="text-muted mb-0">Administra el contenido de tu sitio web</p>
      </div>
      <button class="btn btn-primary" @click="createContent">
        <i class="bi bi-plus-circle me-1"></i>
        Crear Contenido
      </button>
    </div>

    <!-- Filtros y búsqueda -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Buscar</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="searchTerm"
              @input="debouncedSearch"
              placeholder="Buscar por título o slug..."
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">Tipo de Contenido</label>
            <select class="form-select" v-model="selectedContentTypeFilter">
              <option value="">Todos los tipos</option>
              <option v-for="type in contentTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Estado</label>
            <select class="form-select" v-model="selectedStatus">
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-outline-secondary w-100" @click="loadContent">
              <i class="bi bi-search"></i>
              Buscar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de contenido -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando contenido...</p>
        </div>

        <div v-else-if="content.length === 0" class="text-center py-4">
          <i class="bi bi-file-text display-1 text-muted"></i>
          <h4 class="mt-3">No hay contenido</h4>
          <p class="text-muted">Crea tu primer contenido para comenzar</p>
          <button class="btn btn-primary" @click="createContent">
            <i class="bi bi-plus-circle me-1"></i>
            Crear Contenido
          </button>
        </div>

        <div v-else>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>
                    <a href="#" @click.prevent="changeSort('title')" class="text-decoration-none">
                      Título
                      <i v-if="sortBy === 'title'" :class="sortOrder === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                    </a>
                  </th>
                  <th>Tipo</th>
                  <th>Slug</th>
                  <th>
                    <a href="#" @click.prevent="changeSort('status')" class="text-decoration-none">
                      Estado
                      <i v-if="sortBy === 'status'" :class="sortOrder === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                    </a>
                  </th>
                  <th>
                    <a href="#" @click.prevent="changeSort('created_at')" class="text-decoration-none">
                      Fecha Creación
                      <i v-if="sortBy === 'created_at'" :class="sortOrder === 'ASC' ? 'bi bi-arrow-up' : 'bi bi-arrow-down'"></i>
                    </a>
                  </th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in content" :key="item.id">
                  <td>
                    <strong>{{ item.title }}</strong>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ item.content_type_name }}</span>
                  </td>
                  <td>
                    <code class="small">{{ item.slug }}</code>
                  </td>
                  <td>
                    <span :class="getStatusBadgeClass(item.status)">
                      {{ getStatusText(item.status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(item.created_at) }}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary" @click="viewContent(item)" title="Ver">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-outline-secondary" @click="editContent(item)" title="Editar">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger" @click="deleteContent(item)" title="Eliminar">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <nav v-if="pagination.pages > 1" aria-label="Navegación de páginas">
            <ul class="pagination justify-content-center">
              <li class="page-item" :class="{ disabled: pagination.page === 1 }">
                <a class="page-link" href="#" @click.prevent="changePage(pagination.page - 1)">
                  <i class="bi bi-chevron-left"></i>
                </a>
              </li>
              
              <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === pagination.page }">
                <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
              </li>
              
              <li class="page-item" :class="{ disabled: pagination.page === pagination.pages }">
                <a class="page-link" href="#" @click.prevent="changePage(pagination.page + 1)">
                  <i class="bi bi-chevron-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ApiService from '../services/api.js'
const api = new ApiService()

export default {
  name: 'Content',
  setup() {
    const router = useRouter()
    
    // Estado reactivo
    const loading = ref(false)
    const content = ref([])
    const contentTypes = ref([])
    const searchTerm = ref('')
    const selectedContentTypeFilter = ref('')
    const selectedStatus = ref('')
    const sortBy = ref('created_at')
    const sortOrder = ref('DESC')

    // Paginación
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
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
    const loadContent = async () => {
      try {
        loading.value = true
        const response = await api.getContent(
          pagination.page, 
          pagination.limit, 
          searchTerm.value,
          selectedContentTypeFilter.value,
          selectedStatus.value,
          sortBy.value,
          sortOrder.value
        )
        
        content.value = response.content
        Object.assign(pagination, response.pagination)
      } catch (error) {
        console.error('Error cargando contenido:', error)
      } finally {
        loading.value = false
      }
    }

    const loadContentTypes = async () => {
      try {
        const response = await api.getContentTypes(1, 100)
        contentTypes.value = response.contentTypes
      } catch (error) {
        console.error('Error cargando tipos de contenido:', error)
      }
    }

    const createContent = () => {
      router.push('/content/create')
    }

    const editContent = (contentItem) => {
      router.push(`/content/edit/${contentItem.id}`)
    }

    const viewContent = (contentItem) => {
      router.push(`/content/view/${contentItem.id}`)
    }

    const deleteContent = async (contentItem) => {
      if (!confirm(`¿Estás seguro de que quieres eliminar "${contentItem.title}"?`)) {
        return
      }

      try {
        await api.deleteContent(contentItem.id)
        loadContent()
      } catch (error) {
        console.error('Error eliminando contenido:', error)
      }
    }

    const changeSort = (field) => {
      if (sortBy.value === field) {
        sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
      } else {
        sortBy.value = field
        sortOrder.value = 'ASC'
      }
      loadContent()
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.pages) {
        pagination.page = page
        loadContent()
      }
    }

    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        pagination.page = 1
        loadContent()
      }, 300)
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
      loadContent()
      loadContentTypes()
    })

    return {
      loading,
      content,
      contentTypes,
      searchTerm,
      selectedContentTypeFilter,
      selectedStatus,
      sortBy,
      sortOrder,
      pagination,
      visiblePages,
      loadContent,
      loadContentTypes,
      createContent,
      editContent,
      viewContent,
      deleteContent,
      changeSort,
      changePage,
      debouncedSearch,
      getStatusBadgeClass,
      getStatusText,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Estilos específicos para la vista de contenido */
</style> 