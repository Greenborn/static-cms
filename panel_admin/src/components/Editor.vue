<template>
  <div class="editor-component">
    <ul class="nav nav-tabs mb-2">
      <li class="nav-item">
        <button class="nav-link" :class="{active: tab==='wysiwyg'}" @click.stop="tab='wysiwyg'">WYSIWYG</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{active: tab==='html'}" @click.stop="tab='html'">Código HTML</button>
      </li>
    </ul>
    <div v-show="tab==='wysiwyg'">
      <div class="toolbar mb-2">
        <button type="button" class="btn btn-sm btn-light" @click="exec('bold')"><b>B</b></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('italic')"><i>I</i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('underline')"><u>U</u></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('insertUnorderedList')"><i class="bi bi-list-ul"></i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('insertOrderedList')"><i class="bi bi-list-ol"></i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('formatBlock','<h2>')">H2</button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('formatBlock','<h3>')">H3</button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('createLink', prompt('URL:'))"><i class="bi bi-link-45deg"></i></button>
        <button type="button" class="btn btn-sm btn-light" @click="openImageGallery"><i class="bi bi-image"></i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('removeFormat')"><i class="bi bi-eraser"></i></button>
      </div>
      <div
        ref="wysiwygRef"
        class="editor-wysiwyg border rounded bg-white p-2"
        contenteditable="true"
        :style="{minHeight: '250px', outline: 'none'}"
        @input="onWysiwygInput"
      ></div>
    </div>
    <div v-show="tab==='html'">
      <textarea class="form-control" rows="12" v-model="html" @input="onHtmlInput"></textarea>
    </div>

    <!-- Modal de selección de imágenes -->
    <Modal :visible="showImageModal" title="Seleccionar imagen" size="modal-lg" @close="closeImageModal">
      <div class="image-gallery">
        <!-- Selector de categoría -->
        <div class="mb-3">
          <label class="form-label">Categoría:</label>
          <select class="form-select" v-model="selectedCategory" @change="onCategoryChange">
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        
        <div class="row g-3">
          <div v-for="image in images" :key="image.id" class="col-6 col-sm-4 col-md-3">
            <div class="image-item card h-100" @click="selectImage(image)">
              <img :src="getImageUrl(image)" class="card-img-top" :alt="image.original_name" />
              <div class="card-body p-2">
                <small class="text-muted">{{ image.original_name }}</small>
              </div>
            </div>
          </div>
        </div>
        <div v-if="loadingImages" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
        <div v-if="!loadingImages && images.length === 0" class="text-center py-4">
          <p class="text-muted">No hay imágenes disponibles en esta categoría</p>
        </div>
      </div>
    </Modal>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import Modal from './Modal.vue'
import ApiService from '../services/api.js'

const api = new ApiService()
const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
const tab = ref('wysiwyg')
const html = ref(props.modelValue)
const wysiwygRef = ref(null)

// Estado para la galería de imágenes
const showImageModal = ref(false)
const images = ref([])
const categories = ref([])
const selectedCategory = ref(null)
const loadingImages = ref(false)
const imageUrls = ref({})

watch(() => props.modelValue, (val) => {
  if (val !== html.value) {
    html.value = val
    // Solo actualizar el contenido del editor si no está enfocado
    if (tab.value === 'wysiwyg' && wysiwygRef.value && document.activeElement !== wysiwygRef.value) {
      wysiwygRef.value.innerHTML = val
    }
  }
})
watch(html, (val) => {
  emit('update:modelValue', val)
})

const exec = (cmd, arg) => {
  document.execCommand(cmd, false, arg)
  onWysiwygInput()
}
const onWysiwygInput = () => {
  html.value = wysiwygRef.value.innerHTML
}
const onHtmlInput = () => {
  // Solo actualizar el editor WYSIWYG si no está enfocado
  if (tab.value === 'wysiwyg' && wysiwygRef.value && document.activeElement !== wysiwygRef.value) {
    nextTick(() => { wysiwygRef.value.innerHTML = html.value })
  }
}

// Funciones para la galería de imágenes
const openImageGallery = async () => {
  showImageModal.value = true
  await loadImages()
}

const closeImageModal = () => {
  showImageModal.value = false
  images.value = []
  categories.value = []
  selectedCategory.value = null
  imageUrls.value = {}
}

const loadImages = async () => {
  loadingImages.value = true
  try {
    // Cargar todas las categorías primero
    const categoriesRes = await api.getMediaCategories()
    categories.value = categoriesRes.categories || []
    
    if (categories.value.length > 0) {
      // Seleccionar la primera categoría por defecto
      selectedCategory.value = categories.value[0].id
      await loadImagesFromCategory(selectedCategory.value)
    }
  } catch (error) {
    console.error('Error cargando categorías:', error)
  } finally {
    loadingImages.value = false
  }
}

const loadImagesFromCategory = async (categoryId) => {
  loadingImages.value = true
  try {
    const filesRes = await api.getMediaFiles(categoryId)
    images.value = filesRes.files || []
    
    // Limpiar URLs anteriores
    Object.values(imageUrls.value).forEach(url => URL.revokeObjectURL(url))
    imageUrls.value = {}
    
    // Cargar URLs de las imágenes
    for (const image of images.value) {
      if (isImage(image.mimetype)) {
        try {
          const blob = await api.getMediaPreviewBlob(image.id)
          imageUrls.value[image.id] = URL.createObjectURL(blob)
        } catch (error) {
          console.error('Error cargando imagen:', error)
        }
      }
    }
  } catch (error) {
    console.error('Error cargando imágenes de categoría:', error)
  } finally {
    loadingImages.value = false
  }
}

const onCategoryChange = async () => {
  if (selectedCategory.value) {
    await loadImagesFromCategory(selectedCategory.value)
  }
}

const isImage = (mimetype) => {
  return mimetype && mimetype.startsWith('image/')
}

const getImageUrl = (image) => {
  return imageUrls.value[image.id] || ''
}

const selectImage = (image) => {
  const imageUrl = getImageUrl(image)
  if (imageUrl) {
    // Insertar imagen en el editor
    const imgTag = `<img src="${imageUrl}" alt="${image.original_name}" style="max-width: 100%; height: auto;" />`
    
    if (tab.value === 'wysiwyg' && wysiwygRef.value) {
      // Insertar en el cursor actual
      document.execCommand('insertHTML', false, imgTag)
      onWysiwygInput()
    } else {
      // Insertar en el HTML
      const textarea = document.querySelector('.editor-component textarea')
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = html.value
        html.value = text.substring(0, start) + imgTag + text.substring(end)
        // Restaurar cursor
        nextTick(() => {
          textarea.setSelectionRange(start + imgTag.length, start + imgTag.length)
          textarea.focus()
        })
      }
    }
    
    closeImageModal()
  }
}

onMounted(() => {
  if (wysiwygRef.value) wysiwygRef.value.innerHTML = html.value
})
</script>
<style scoped>
.editor-wysiwyg {
  min-height: 250px;
  max-height: 60vh;
  overflow-y: auto;
}
.toolbar button {
  margin-right: 0.25rem;
}

.image-gallery {
  max-height: 60vh;
  overflow-y: auto;
}

.image-item {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.image-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.image-item img {
  height: 120px;
  object-fit: cover;
  width: 100%;
}

.image-item .card-body {
  padding: 0.5rem;
}

.image-item small {
  font-size: 0.75rem;
  line-height: 1.2;
}
</style> 