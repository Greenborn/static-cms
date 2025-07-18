<template>
  <div>
    <div class="card mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <input type="text" class="form-control w-auto" style="min-width:220px;" v-model="search" placeholder="Buscar páginas..." @input="onSearch" />
          <div>
            <select class="form-select d-inline-block w-auto me-2" v-model="status" @change="loadPages">
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
            <select class="form-select d-inline-block w-auto" v-model="limit" @change="loadPages">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
        <table class="table table-hover">
          <thead>
            <tr>
              <th @click="changeSort('title')" style="cursor:pointer">Título <span v-if="sortBy==='title'">{{ sortOrder==='ASC'?'▲':'▼' }}</span></th>
              <th @click="changeSort('slug')" style="cursor:pointer">Slug <span v-if="sortBy==='slug'">{{ sortOrder==='ASC'?'▲':'▼' }}</span></th>
              <th @click="changeSort('status')" style="cursor:pointer">Estado <span v-if="sortBy==='status'">{{ sortOrder==='ASC'?'▲':'▼' }}</span></th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="page in pages" :key="page.id">
              <td>{{ page.title }}</td>
              <td>{{ page.slug }}</td>
              <td><span :class="statusBadgeClass(page.status)">{{ statusText(page.status) }}</span></td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" @click="$emit('edit', page)">Editar</button>
                <button class="btn btn-sm btn-outline-secondary me-1" @click="$emit('preview', page)">Vista previa</button>
                <button class="btn btn-sm btn-outline-danger" @click="deletePage(page)">Eliminar</button>
              </td>
            </tr>
            <tr v-if="pages.length === 0">
              <td colspan="4" class="text-center text-muted">No hay páginas encontradas.</td>
            </tr>
          </tbody>
        </table>
        <nav v-if="pagination.pages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{disabled: pagination.page === 1}">
              <button class="page-link" @click="changePage(pagination.page-1)">&laquo;</button>
            </li>
            <li class="page-item" v-for="p in visiblePages" :key="p" :class="{active: p === pagination.page}">
              <button class="page-link" @click="changePage(p)">{{ p }}</button>
            </li>
            <li class="page-item" :class="{disabled: pagination.page === pagination.pages}">
              <button class="page-link" @click="changePage(pagination.page+1)">&raquo;</button>
            </li>
          </ul>
        </nav>
        <div v-if="msg" :class="['alert', msgType === 'success' ? 'alert-success' : 'alert-danger']">{{ msg }}</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import ApiService from '../services/api.js'
const api = new ApiService()

const pages = ref([])
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 1 })
const search = ref('')
const status = ref('')
const limit = ref(10)
const sortBy = ref('created_at')
sortBy.value = 'created_at'
const sortOrder = ref('DESC')
const msg = ref('')
const msgType = ref('success')

const loadPages = async () => {
  const res = await api.getPages(pagination.value.page, limit.value, search.value, status.value, sortBy.value, sortOrder.value)
  pages.value = res.pages
  pagination.value = res.pagination
}

const onSearch = () => {
  pagination.value.page = 1
  loadPages()
}

const changePage = (p) => {
  if (p >= 1 && p <= pagination.value.pages) {
    pagination.value.page = p
    loadPages()
  }
}

const changeSort = (field) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = field
    sortOrder.value = 'ASC'
  }
  loadPages()
}

const visiblePages = computed(() => {
  const pagesArr = []
  const start = Math.max(1, pagination.value.page - 2)
  const end = Math.min(pagination.value.pages, pagination.value.page + 2)
  for (let i = start; i <= end; i++) pagesArr.push(i)
  return pagesArr
})

const statusBadgeClass = (status) => {
  switch (status) {
    case 'published': return 'badge bg-success'
    case 'draft': return 'badge bg-warning'
    case 'archived': return 'badge bg-secondary'
    default: return 'badge bg-secondary'
  }
}
const statusText = (status) => {
  switch (status) {
    case 'published': return 'Publicado'
    case 'draft': return 'Borrador'
    case 'archived': return 'Archivado'
    default: return status
  }
}

const deletePage = async (page) => {
  if (!confirm(`¿Eliminar la página "${page.title}"?`)) return
  msg.value = ''
  try {
    await api.deletePage(page.id)
    msg.value = 'Página eliminada correctamente.'
    msgType.value = 'success'
    loadPages()
  } catch (e) {
    msg.value = e?.response?.data?.message || 'Error al eliminar la página.'
    msgType.value = 'danger'
  }
}

onMounted(loadPages)
</script> 