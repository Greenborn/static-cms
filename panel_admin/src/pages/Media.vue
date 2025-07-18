<template>
  <div class="flex h-full">
    <!-- Sidebar de categorías -->
    <aside class="w-56 bg-gray-50 border-r p-4 flex flex-col">
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-gray-700">Categorías</span>
        <button @click="showNewCategory = true" class="text-blue-600 text-xl">+</button>
      </div>
      <ul class="flex-1 overflow-y-auto">
        <li v-for="cat in categories" :key="cat.id" :class="[cat.id === selectedCategory?.id ? 'bg-blue-100 font-semibold' : ''] + ' cursor-pointer rounded px-2 py-1 mb-1 hover:bg-blue-50'" @click="selectCategory(cat)">
          {{ cat.name }}
          <button v-if="cat.id === selectedCategory?.id" @click.stop="deleteCategory(cat.id)" class="ml-2 text-red-500 text-xs">🗑</button>
        </li>
      </ul>
      <!-- Modal nueva categoría -->
      <div v-if="showNewCategory" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div class="bg-white p-4 rounded shadow w-80">
          <h3 class="font-bold mb-2">Nueva categoría</h3>
          <input v-model="newCategoryName" class="border p-2 w-full mb-2" placeholder="Nombre de la categoría" />
          <div class="flex justify-end gap-2">
            <button @click="showNewCategory = false" class="px-3 py-1">Cancelar</button>
            <button @click="createCategory" class="bg-blue-600 text-white px-3 py-1 rounded">Crear</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main: grid de archivos -->
    <main class="flex-1 p-6 overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">Galería multimedia</h2>
        <label class="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
          Subir archivo
          <input type="file" class="hidden" multiple @change="onFileChange" />
        </label>
      </div>
      <div v-if="loadingFiles" class="text-center py-8 text-gray-500">Cargando archivos...</div>
      <div v-else-if="files.length === 0" class="text-center py-8 text-gray-400">No hay archivos en esta categoría.</div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div v-for="file in files" :key="file.id" class="bg-white rounded shadow p-2 flex flex-col items-center">
          <img v-if="isImage(file.mimetype)" :src="file.url" class="w-24 h-24 object-cover rounded mb-2" />
          <div v-else class="w-24 h-24 flex items-center justify-center bg-gray-100 rounded mb-2 text-3xl">📄</div>
          <div class="text-xs truncate w-full text-center">{{ file.original_name }}</div>
          <div class="text-xs text-gray-400">{{ formatSize(file.size) }}</div>
          <div class="flex gap-2 mt-2">
            <button class="text-red-500 text-lg" title="Eliminar">🗑</button>
            <button class="text-gray-500 text-lg" title="Mover">⇄</button>
          </div>
        </div>
      </div>
    </main>
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
/* Puedes personalizar más con Tailwind */
</style> 