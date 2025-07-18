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
            <div class="card h-100 shadow-sm" @click="openImageModal(file)">
              <div class="card-body d-flex flex-column align-items-center p-2">
                <img v-if="isImage(file.mimetype)" :src="getPreviewUrl(file)" class="img-fluid rounded mb-2" style="max-height:90px;object-fit:cover;" />
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

    <!-- Modal de detalles de imagen -->
    <div class="modal fade show" tabindex="-1" style="display: block; z-index: 2000;" v-if="showImageModal" @click.self="closeImageModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalles de la imagen</h5>
            <button type="button" class="btn-close" @click="closeImageModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedImage">
              <div class="text-center mb-3">
                <img :src="getPreviewUrl(selectedImage, false)" class="img-fluid rounded" style="max-height:320px;object-fit:contain;" />
              </div>
              <div class="mb-2"><strong>Nombre original:</strong> {{ selectedImage.original_name }}</div>
              <div class="mb-2"><strong>Tamaño:</strong> {{ formatSize(selectedImage.size) }}</div>
              <div class="mb-2"><strong>MIME:</strong> {{ selectedImage.mimetype }}</div>
              <div class="mb-2"><strong>Fecha de subida:</strong> {{ selectedImage.created_at || '-' }}</div>
              <div class="mb-3"><strong>Categoría:</strong> {{ selectedImage.category_id || '-' }}</div>
              <div>
                <strong>Miniaturas generadas:</strong>
                <ul v-if="thumbnails.length">
                  <li v-for="thumb in thumbnails" :key="thumb.nombre">
                    <span class="badge bg-secondary me-2">{{ thumb.nombre }}</span>
                    <span>{{ thumb.width }}px</span>
                    <img :src="thumb.url" class="ms-2 rounded border" style="max-height:48px;max-width:80px;object-fit:contain;vertical-align:middle;" />
                  </li>
                </ul>
                <div v-else class="text-muted">No hay miniaturas generadas.
                  <button class="btn btn-sm btn-primary ms-2" @click="generateThumbnails" :disabled="generatingThumbs">
                    <span v-if="generatingThumbs"><span class="spinner-border spinner-border-sm"></span> Generando...</span>
                    <span v-else>Generar miniaturas</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeImageModal">Cerrar</button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" style="z-index: 1990;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ApiService from '../services/api.js'
const api = new ApiService()

const categories = ref([])
const selectedCategory = ref(null)
const files = ref([])
const loadingFiles = ref(false)
const showNewCategory = ref(false)
const newCategoryName = ref('')

// URLs temporales para blobs
const previewUrls = ref({})
const breakpoints = ref([])

const loadBreakpoints = async () => {
  // Obtener breakpoints ordenados (de menor a mayor)
  const res = await api.getBreakpoints()
  breakpoints.value = res.breakpoints || []
}

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
  // Limpiar URLs previas
  Object.values(previewUrls.value).forEach(url => URL.revokeObjectURL(url))
  previewUrls.value = {}
  // Obtener blobs autenticados para miniaturas (o imagen original)
  for (const file of files.value) {
    if (isImage(file.mimetype)) {
      let blob = null
      let url = ''
      // Buscar el breakpoint más pequeño
      let thumbSize = breakpoints.value.length ? breakpoints.value[0].nombre : null
      if (thumbSize) {
        try {
          blob = await api.getMediaPreviewBlob(file.id, thumbSize)
        } catch (e) {
          // Si falla, intentar original
          try {
            blob = await api.getMediaPreviewBlob(file.id)
          } catch (e2) {
            blob = null
          }
        }
      } else {
        try {
          blob = await api.getMediaPreviewBlob(file.id)
        } catch (e) {
          blob = null
        }
      }
      if (blob) {
        url = URL.createObjectURL(blob)
      }
      previewUrls.value[file.id] = url
    }
  }
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

const showImageModal = ref(false)
const selectedImage = ref(null)
const thumbnails = ref([])
const generatingThumbs = ref(false)

const openImageModal = async (file) => {
  showNewCategory.value = false // Cerrar modal de categoría si está abierto
  selectedImage.value = file
  showImageModal.value = true
  await loadThumbnails(file)
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImage.value = null
  thumbnails.value = []
}

const loadThumbnails = async (file) => {
  thumbnails.value = []
  if (!isImage(file.mimetype)) return
  // Buscar miniaturas para todos los breakpoints
  for (const bp of breakpoints.value) {
    try {
      const blob = await api.getMediaPreviewBlob(file.id, bp.nombre)
      const url = URL.createObjectURL(blob)
      thumbnails.value.push({ nombre: bp.nombre, width: bp.valor_px, url })
    } catch (e) {
      // No existe la miniatura para este breakpoint
    }
  }
}

const generateThumbnails = async () => {
  if (!selectedImage.value) return
  generatingThumbs.value = true
  try {
    // Llamar a la API de subida con el mismo archivo para forzar generación de thumbs
    await api.regenerateThumbnails(selectedImage.value.id)
    await loadThumbnails(selectedImage.value)
  } finally {
    generatingThumbs.value = false
  }
}

// Modificar getPreviewUrl para aceptar un segundo parámetro (usar original o miniatura)
const getPreviewUrl = (file, useThumb = true) => {
  if (!file) return ''
  if (!useThumb) return previewUrls.value[file.id] || ''
  return previewUrls.value[file.id] || ''
}

onMounted(() => {
  loadBreakpoints()
  loadCategories()
})

onBeforeUnmount(() => {
  Object.values(previewUrls.value).forEach(url => URL.revokeObjectURL(url))
})
</script>

<style scoped>
/**** El layout ahora depende de Bootstrap, puedes agregar ajustes aquí si es necesario ****/
</style> 