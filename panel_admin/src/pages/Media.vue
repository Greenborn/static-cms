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

<script>
import api from '../services/api';

export default {
  name: 'Media',
  data() {
    return {
      categories: [],
      selectedCategory: null,
      files: [],
      loadingFiles: false,
      showNewCategory: false,
      newCategoryName: '',
    };
  },
  created() {
    this.loadCategories();
  },
  methods: {
    async loadCategories() {
      const res = await api.get('/media/categories');
      this.categories = res.categories;
      if (this.categories.length && !this.selectedCategory) {
        this.selectCategory(this.categories[0]);
      }
    },
    async selectCategory(cat) {
      this.selectedCategory = cat;
      this.loadFiles();
    },
    async loadFiles() {
      if (!this.selectedCategory) return;
      this.loadingFiles = true;
      const res = await api.get('/media/files?category_id=' + this.selectedCategory.id);
      this.files = res.files;
      this.loadingFiles = false;
    },
    async createCategory() {
      if (!this.newCategoryName.trim()) return;
      await api.post('/media/categories', { name: this.newCategoryName });
      this.showNewCategory = false;
      this.newCategoryName = '';
      await this.loadCategories();
    },
    async deleteCategory(id) {
      if (!confirm('¿Eliminar esta categoría?')) return;
      await api.delete('/media/categories/' + id);
      await this.loadCategories();
    },
    isImage(mime) {
      return mime && mime.startsWith('image/');
    },
    formatSize(size) {
      if (!size) return '';
      if (size < 1024) return size + ' B';
      if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
      return (size / (1024 * 1024)).toFixed(1) + ' MB';
    },
    async onFileChange(e) {
      const files = Array.from(e.target.files);
      if (!files.length || !this.selectedCategory) return;
      const formData = new FormData();
      formData.append('file', files[0]); // Por ahora solo uno, luego soportar múltiples
      formData.append('category_id', this.selectedCategory.id);
      await api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      this.loadFiles();
    },
  }
};
</script>

<style scoped>
/* Puedes personalizar más con Tailwind */
</style> 