<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="card">
        <div class="card-body p-4">
          <div class="text-center mb-4">
            <h2 class="card-title">Static CMS</h2>
            <p class="text-muted">Panel de Administración</p>
          </div>

          <div v-if="step === 'telegram'" class="telegram-step">
            <h5 class="mb-3">Iniciar Sesión con Telegram</h5>
            <p class="text-muted mb-4">
              Ingresa tu ID de Telegram para recibir un código de verificación.
            </p>
            
            <form @submit.prevent="requestAccess">
              <div class="mb-3">
                <label for="telegramId" class="form-label">ID de Telegram</label>
                <input
                  type="text"
                  class="form-control"
                  id="telegramId"
                  v-model="telegramId"
                  placeholder="Ej: 123456789"
                  required
                  :disabled="isLoading"
                />
                <div class="form-text">
                  Puedes obtener tu ID de Telegram enviando /start al bot @userinfobot
                </div>
              </div>
              
              <button
                type="submit"
                class="btn btn-primary w-100"
                :disabled="isLoading || !telegramId"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isLoading ? 'Enviando...' : 'Solicitar Código' }}
              </button>
            </form>
          </div>

          <div v-else-if="step === 'code'" class="code-step">
            <h5 class="mb-3">Verificar Código</h5>
            <p class="text-muted mb-4">
              Revisa tu Telegram y ingresa el código que recibiste.
            </p>
            
            <form @submit.prevent="verifyCode">
              <div class="mb-3">
                <label for="code" class="form-label">Código de Verificación</label>
                <input
                  type="text"
                  class="form-control"
                  id="code"
                  v-model="code"
                  placeholder="Ej: 123456"
                  required
                  :disabled="isLoading"
                  maxlength="6"
                />
              </div>
              
              <button
                type="submit"
                class="btn btn-primary w-100"
                :disabled="isLoading || !code"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                {{ isLoading ? 'Verificando...' : 'Verificar Código' }}
              </button>
            </form>
            
            <div class="text-center mt-3">
              <button
                type="button"
                class="btn btn-link"
                @click="step = 'telegram'"
                :disabled="isLoading"
              >
                Cambiar ID de Telegram
              </button>
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-3" role="alert">
            {{ error }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()
    
    const step = ref('telegram')
    const telegramId = ref('')
    const code = ref('')
    const error = ref('')

    const isLoading = computed(() => authStore.isLoading.value)

    const requestAccess = async () => {
      try {
        error.value = ''
        await authStore.login(telegramId.value)
        step.value = 'code'
      } catch (err) {
        error.value = err.message || 'Error al solicitar acceso'
      }
    }

    const verifyCode = async () => {
      try {
        error.value = ''
        await authStore.verifyCode(code.value)
        // Redirigir al dashboard después del login exitoso usando el router (hash mode)
        router.push({ name: 'Dashboard' })
      } catch (err) {
        error.value = err.message || 'Error al verificar código'
      }
    }

    return {
      step,
      telegramId,
      code,
      error,
      isLoading,
      requestAccess,
      verifyCode
    }
  }
}
</script> 