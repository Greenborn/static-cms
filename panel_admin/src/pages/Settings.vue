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
            <form @submit.prevent="saveSettings">
              <div class="mb-3">
                <label for="siteTitle" class="form-label">Título del sitio</label>
                <input type="text" id="siteTitle" class="form-control" v-model="siteTitle" />
              </div>
              <div class="mb-3">
                <label for="siteLang" class="form-label">Idioma del sitio (código ISO, ej: es, en, fr)</label>
                <input type="text" id="siteLang" class="form-control" v-model="siteLang" maxlength="5" />
              </div>
              <button type="submit" class="btn btn-success btn-sm">
                <i class="bi bi-save me-1"></i> Guardar título
              </button>
              <span v-if="settingsMsg" :class="['ms-2', settingsMsgType === 'success' ? 'text-success' : 'text-danger']">{{ settingsMsg }}</span>
            </form>
          </div>
        </div>
        <!-- Formulario de breakpoints -->
        <div class="card mt-4">
          <div class="card-header">
            <h5 class="card-title mb-0">Breakpoints de Imágenes Responsivas</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="saveBreakpoints">
              <div v-if="breakpoints.length === 0" class="text-muted">Cargando breakpoints...</div>
              <div v-else>
                <div v-for="(bp, idx) in breakpoints" :key="bp.nombre" class="mb-3 row align-items-center">
                  <label :for="'bp-' + bp.nombre" class="col-4 col-form-label">{{ bp.nombre.toUpperCase() }}</label>
                  <div class="col-8">
                    <input type="number" min="0" class="form-control" :id="'bp-' + bp.nombre" v-model.number="bp.valor_px" />
                  </div>
                </div>
                <button type="submit" class="btn btn-success btn-sm mt-2">
                  <i class="bi bi-save me-1"></i> Guardar breakpoints
                </button>
                <span v-if="bpMsg" :class="['ms-2', bpMsgType === 'success' ? 'text-success' : 'text-danger']">{{ bpMsg }}</span>
              </div>
            </form>
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
import { ref, onMounted } from 'vue'
import ApiService from '../services/api'

export default {
  name: 'Settings',
  setup() {
    const nodeVersion = ref('N/A')
    const environment = ref('development')
    const breakpoints = ref([])
    const bpMsg = ref('')
    const bpMsgType = ref('success')
    const siteTitle = ref('')
    const siteLang = ref('')
    const settingsMsg = ref('')
    const settingsMsgType = ref('success')
    const api = new ApiService()

    // Cargar título y lenguaje del sitio
    const loadSettings = async () => {
      try {
        const res = await api.api.get('/settings')
        siteTitle.value = res.data.siteTitle || ''
        siteLang.value = res.data.lang || 'es'
      } catch (e) {
        settingsMsg.value = 'Error cargando configuración'
        settingsMsgType.value = 'danger'
      }
    }

    const saveSettings = async () => {
      settingsMsg.value = ''
      try {
        await api.api.put('/settings/site-title', { siteTitle: siteTitle.value })
        await api.api.put('/settings/lang', { lang: siteLang.value })
        settingsMsg.value = 'Configuración guardada correctamente'
        settingsMsgType.value = 'success'
      } catch (e) {
        settingsMsg.value = 'Error al guardar la configuración'
        settingsMsgType.value = 'danger'
      }
    }

    const loadBreakpoints = async () => {
      try {
        const res = await api.getBreakpoints()
        breakpoints.value = res.breakpoints
      } catch (e) {
        bpMsg.value = 'Error cargando breakpoints'
        bpMsgType.value = 'danger'
      }
    }

    const saveBreakpoints = async () => {
      bpMsg.value = ''
      let success = true
      for (const bp of breakpoints.value) {
        try {
          await api.updateBreakpoint(bp.nombre, bp.valor_px)
        } catch (e) {
          success = false
        }
      }
      if (success) {
        bpMsg.value = 'Breakpoints guardados correctamente'
        bpMsgType.value = 'success'
      } else {
        bpMsg.value = 'Error al guardar uno o más breakpoints'
        bpMsgType.value = 'danger'
      }
      loadBreakpoints()
    }

    onMounted(() => {
      loadSettings()
      loadBreakpoints()
    })

    return {
      nodeVersion,
      environment,
      breakpoints,
      bpMsg,
      bpMsgType,
      siteTitle,
      siteLang,
      settingsMsg,
      settingsMsgType,
      saveBreakpoints,
      saveSettings
    }
  }
}
</script> 