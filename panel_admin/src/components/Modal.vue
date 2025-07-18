<template>
  <div v-if="visible">
    <div class="modal fade show" tabindex="-1" :style="modalStyle">
      <div :class="['modal-dialog', sizeClass]">
        <div class="modal-content">
          <div class="modal-header">
            <slot name="header">
              <h5 class="modal-title">{{ title }}</h5>
              <button type="button" class="btn-close" @click="onClose"></button>
            </slot>
          </div>
          <div class="modal-body">
            <div class="modal-slot-wrapper">
              <slot />
            </div>
          </div>
          <div class="modal-footer">
            <slot name="footer">
              <button type="button" class="btn btn-secondary" @click="onClose">Cerrar</button>
            </slot>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" :style="backdropStyle"></div>
  </div>
</template>

<script setup>
import { computed, toRefs } from 'vue'
const props = defineProps({
  visible: Boolean,
  title: { type: String, default: '' },
  zIndex: { type: Number, default: 2000 },
  backdropZIndex: { type: Number, default: 1990 },
  size: { type: String, default: '' } // '', 'modal-lg', 'modal-sm', etc.
})
const emit = defineEmits(['close'])
const { visible, zIndex, backdropZIndex, size } = toRefs(props)
const modalStyle = computed(() => ({ display: 'block', zIndex: zIndex.value }))
const backdropStyle = computed(() => ({ zIndex: backdropZIndex.value }))
const sizeClass = computed(() => size.value)
function onClose() {
  emit('close')
}
</script>
<style scoped>
.modal-slot-wrapper {
  width: 100%;
  height: 100%;
}
</style> 