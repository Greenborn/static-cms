<template>
  <div class="clone-site">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
      <h1 class="h2">Clonar Sitio</h1>
    </div>
    <div class="card">
      <div class="card-body">
        <form @submit.prevent="handleClone">
          <div class="mb-3">
            <label for="siteUrl" class="form-label">URL del sitio a clonar</label>
            <input
              type="url"
              class="form-control"
              id="siteUrl"
              v-model="siteUrl"
              placeholder="https://ejemplo.com"
              required
              :disabled="isLoading"
            />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="isLoading || !siteUrl">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
            {{ isLoading ? 'Clonando...' : 'Clonar' }}
          </button>
        </form>
        <div v-if="successMessage" class="alert alert-success mt-3">{{ successMessage }}</div>
        <div v-if="errorMessage" class="alert alert-danger mt-3">{{ errorMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import apiService from '../services/api.js'

export default {
  name: 'CloneSite',
  setup() {
    const siteUrl = ref('')
    const isLoading = ref(false)
    const successMessage = ref('')
    const errorMessage = ref('')

    const handleClone = async () => {
      successMessage.value = ''
      errorMessage.value = ''
      isLoading.value = true
      try {
        // Llamada dummy al backend (puedes cambiar la URL y lógica luego)
        await apiService.cloneSite(siteUrl.value)
        successMessage.value = 'Sitio clonado exitosamente.'
        siteUrl.value = ''
      } catch (error) {
        errorMessage.value = error.message || 'Error al clonar el sitio.'
      } finally {
        isLoading.value = false
      }
    }

    return {
      siteUrl,
      isLoading,
      successMessage,
      errorMessage,
      handleClone
    }
  }
}
</script> 