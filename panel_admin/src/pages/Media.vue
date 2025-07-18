<template>
  <div class="container-fluid h-100">
    <div class="row h-100">
      <!-- Sidebar de categorías -->
      <aside class="col-md-3 col-lg-2 d-md-block bg-light border-end h-100 p-0">
        <div class="p-3">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold text-secondary">Categorías</span>
            <button @click="showNewCategory = true" class="btn btn-sm btn-primary" title="Nueva categoría">
              <i class="bi bi-plus"></i>
            </button>
          </div>
          <ul class="list-group">
            <li v-for="cat in categories" :key="cat.id"
                :class="['list-group-item', cat.id === selectedCategory?.id ? 'active' : '']"
                style="cursor:pointer"
                @click="selectCategory(cat)">
              <div class="d-flex justify-content-between align-items-center">
                <span>{{ cat.name }}</span>
                <button v-if="cat.id === selectedCategory?.id" @click.stop="deleteCategory(cat.id)" class="btn btn-sm btn-link text-danger p-0 ms-2" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main: grid de archivos -->
      <main class="col-md-9 col-lg-10 p-4 overflow-auto">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="h4 fw-bold mb-0">Galería multimedia</h2>
          <label class="btn btn-primary mb-0">
            <i class="bi bi-upload me-1"></i> Subir archivo
            <input type="file" class="d-none" multiple @change="onFileChange" />
          </label>
        </div>
        <div v-if="loadingFiles" class="text-center py-5 text-secondary">
          <div class="spinner-border" role="status"><span class="visually-hidden">Cargando...</span></div>
          <div>Cargando archivos...</div>
        </div>
        <div v-else-if="files.length === 0" class="text-center py-5 text-muted">
          <i class="bi bi-inbox display-4 mb-3"></i>
          <div>No hay archivos en esta categoría.</div>
        </div>
        <div v-else class="row g-3">
          <div v-for="file in files" :key="file.id" class="col-6 col-sm-4 col-md-3 col-lg-2">
            <div class="card h-100 shadow-sm">
              <div class="card-body d-flex flex-column align-items-center p-2">
                <img v-if="isImage(file.mimetype)" :src="file.url" class="img-fluid rounded mb-2" style="max-height:90px;object-fit:cover;" />
                <div v-else class="d-flex align-items-center justify-content-center bg-light rounded mb-2" style="height:90px;width:100%">
                  <i class="bi bi-file-earmark-text display-6 text-secondary"></i>
                </div>
                <div class="text-truncate w-100 small text-center">{{ file.original_name }}</div>
                <div class="text-muted small">{{ formatSize(file.size) }}</div>
              </div>
              <div class="card-footer bg-white border-0 d-flex justify-content-center gap-2 p-2">
                <button class="btn btn-sm btn-outline-danger" title="Eliminar"><i class="bi bi-trash"></i></button>
                <button class="btn btn-sm btn-outline-secondary" title="Mover"><i class="bi bi-arrows-move"></i></button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal nueva categoría -->
    <div
      class="modal fade show"
      tabindex="-1"
      style="display: block; z-index: 1055;"
      v-if="showNewCategory"
      @click.self="showNewCategory = false"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nueva categoría</h5>
            <button type="button" class="btn-close" @click="showNewCategory = false"></button>
          </div>
          <div class="modal-body">
            <input v-model="newCategoryName" class="form-control" placeholder="Nombre de la categoría" />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showNewCategory = false">Cancelar</button>
            <button type="button" class="btn btn-primary" @click="createCategory">Crear</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Backdrop -->
    <div
      class="modal-backdrop fade show"
      v-if="showNewCategory"
      style="z-index: 1050;"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ApiService from '../services/api.js'
const api = new ApiService()

const categories = ref([])
const selectedCategory = ref(null)
const files = ref([])
const loadingFiles = ref(false)
const showNewCategory = ref(false)
const newCategoryName = ref('')

const loadCategories = async () => {
  const res = await api.getMediaCategories()
  categories.value = res.categories
  if (categories.value.length && !selectedCategory.value) {
    selectCategory(categories.value[0])
  }
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
  loadFiles()
}

const loadFiles = async () => {
  if (!selectedCategory.value) return
  loadingFiles.value = true
  const res = await api.getMediaFiles(selectedCategory.value.id)
  files.value = res.files
  loadingFiles.value = false
}

const createCategory = async () => {
  if (!newCategoryName.value.trim()) return
  await api.createMediaCategory(newCategoryName.value)
  showNewCategory.value = false
  newCategoryName.value = ''
  await loadCategories()
}

const deleteCategory = async (id) => {
  if (!confirm('¿Eliminar esta categoría?')) return
  await api.deleteMediaCategory(id)
  await loadCategories()
}

const isImage = (mime) => {
  return mime && mime.startsWith('image/')
}

const formatSize = (size) => {
  if (!size) return ''
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const onFileChange = async (e) => {
  const filesArr = Array.from(e.target.files)
  if (!filesArr.length || !selectedCategory.value) return
  await api.uploadMediaFile(filesArr[0], selectedCategory.value.id)
  loadFiles()
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
/**** El layout ahora depende de Bootstrap, puedes agregar ajustes aquí si es necesario ****/
</style> 