<template>
  <div class="d-flex">
    <!-- Sidebar -->
    <nav class="sidebar col-md-3 col-lg-2 d-md-block">
      <div class="position-sticky pt-3">
        <div class="px-3 mb-4">
          <h5 class="text-white">Static CMS</h5>
          <small class="text-muted">Panel Admin</small>
        </div>
        
        <ul class="nav flex-column">
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link" active-class="active">
              <i class="bi bi-speedometer2 me-2"></i>
              Dashboard
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/pages" class="nav-link" active-class="active">
              <i class="bi bi-file-text me-2"></i>
              Páginas
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/content-types" class="nav-link" active-class="active">
              <i class="bi bi-collection me-2"></i>
              Tipos de Contenido
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/views" class="nav-link" active-class="active">
              <i class="bi bi-eye me-2"></i>
              Vistas
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/media" class="nav-link" active-class="active">
              <i class="bi bi-images me-2"></i>
              Multimedia
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/formatters" class="nav-link" active-class="active">
              <i class="bi bi-code-slash me-2"></i>
              Formateadores
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/site-builder" class="nav-link" active-class="active">
              <i class="bi bi-gear me-2"></i>
              Constructor de Sitio
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/settings" class="nav-link" active-class="active">
              <i class="bi bi-gear me-2"></i>
              Configuración
            </router-link>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Main content -->
    <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 main-content">
      <!-- Top navbar -->
      <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom mb-4">
        <div class="container-fluid">
          <button class="navbar-toggler d-md-none" type="button" @click="toggleSidebar">
            <span class="navbar-toggler-icon"></span>
          </button>
          
          <div class="navbar-nav ms-auto">
            <div class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i class="bi bi-person-circle me-1"></i>
                {{ user?.name || 'Usuario' }}
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" @click="logout">Cerrar Sesión</a></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <!-- Page content -->
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

export default {
  name: 'Layout',
  setup() {
    const authStore = useAuthStore()
    
    const user = computed(() => authStore.user.value)

    const logout = async () => {
      await authStore.logout()
      window.location.href = '/login'
    }

    const toggleSidebar = () => {
      // Implementar toggle para móviles si es necesario
      console.log('Toggle sidebar')
    }

    return {
      user,
      logout,
      toggleSidebar
    }
  }
}
</script> 