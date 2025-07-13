<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore()

    onMounted(() => {
      // Inicializar autenticación al cargar la app
      authStore.initializeAuth()
    })
  }
}
</script>

<style>
#app {
  min-height: 100vh;
}
</style> 