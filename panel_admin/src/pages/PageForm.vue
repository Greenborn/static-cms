<template>
  <form @submit.prevent="onSubmit">
    <div class="mb-3">
      <label class="form-label">Título</label>
      <input type="text" class="form-control" v-model="form.title" required />
    </div>
    <div class="mb-3">
      <label class="form-label">Slug</label>
      <input type="text" class="form-control" v-model="form.slug" required />
    </div>
    <div class="mb-3">
      <label class="form-label">Estado</label>
      <select class="form-select" v-model="form.status">
        <option value="draft">Borrador</option>
        <option value="published">Publicado</option>
        <option value="archived">Archivado</option>
      </select>
    </div>
    <div class="mb-3">
      <label class="form-label">Contenido (plantilla HTML mustacheable)</label>
      <Editor v-model="form.content" :preview-data="previewData" />
    </div>
    <div v-if="msg" :class="['alert', msgType === 'success' ? 'alert-success' : 'alert-danger']">{{ msg }}</div>
    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancelar</button>
      <button type="submit" class="btn btn-primary" :disabled="loading">{{ loading ? 'Guardando...' : 'Guardar' }}</button>
    </div>
  </form>
</template>
<script setup>
import { reactive, watch, toRefs, ref } from 'vue'
import ApiService from '../services/api.js'
import Editor from '../components/Editor.vue'
const api = new ApiService()
const props = defineProps({ page: { type: Object, default: null } })
const emit = defineEmits(['saved', 'cancel'])
const form = reactive({
  title: '',
  slug: '',
  status: 'draft',
  content: ''
})
const loading = ref(false)
const msg = ref('')
const msgType = ref('success')
const previewData = ref({ title: 'Ejemplo', user: { name: 'Admin' } })
watch(() => props.page, (val) => {
  if (val) {
    form.title = val.title || ''
    form.slug = val.slug || ''
    form.status = val.status || 'draft'
    form.content = val.content || ''
  } else {
    form.title = ''
    form.slug = ''
    form.status = 'draft'
    form.content = ''
  }
}, { immediate: true })

const onSubmit = async () => {
  msg.value = ''
  loading.value = true
  try {
    if (props.page && props.page.id) {
      await api.updatePage(props.page.id, { ...form })
      msg.value = 'Página actualizada correctamente.'
    } else {
      await api.createPage({ ...form })
      msg.value = 'Página creada correctamente.'
    }
    msgType.value = 'success'
    setTimeout(() => emit('saved'), 600)
  } catch (e) {
    msg.value = e?.response?.data?.message || 'Error al guardar la página.'
    msgType.value = 'danger'
  } finally {
    loading.value = false
  }
}
</script> 