<template>
  <div class="settings">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
      <h1 class="h2">Configuración</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group me-2">
          <button type="button" class="btn btn-sm btn-primary" @click="saveSettings">
            <i class="bi bi-check-circle me-1"></i>
            Guardar
          </button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Configuración General</h5>
          </div>
          <div class="card-body">
            <p class="text-muted">Funcionalidad de configuración en desarrollo...</p>
            <p>Aquí se implementará:</p>
            <ul>
              <li>Configuración del sitio</li>
              <li>Configuración de Telegram Bot</li>
              <li>Configuración de base de datos</li>
              <li>Configuración de build</li>
              <li>Configuración de seguridad</li>
              <li>Backup y restauración</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Información del Sistema</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-6">
                <strong>Versión:</strong>
                <p class="text-muted">1.0.0</p>
              </div>
              <div class="col-6">
                <strong>Node.js:</strong>
                <p class="text-muted">{{ nodeVersion }}</p>
              </div>
              <div class="col-6">
                <strong>Base de Datos:</strong>
                <p class="text-muted">SQLite</p>
              </div>
              <div class="col-6">
                <strong>Entorno:</strong>
                <p class="text-muted">{{ environment }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Settings',
  setup() {
    const nodeVersion = ref('N/A')
    const environment = ref('development')

    const saveSettings = () => {
      // Implementar guardado de configuración
      console.log('Save settings')
    }

    return {
      nodeVersion,
      environment,
      saveSettings
    }
  }
}
</script> 