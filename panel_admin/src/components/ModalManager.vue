<template>
  <div>
    <slot />
    <Modal
      v-for="(modal, idx) in modals"
      :key="modal.id"
      :visible="modal.visible"
      :title="modal.title"
      :z-index="baseZIndex + idx * 10"
      :backdrop-z-index="baseZIndex + idx * 10 - 1"
      :size="modal.size"
      @close="closeModal(modal.id)"
    >
      <template #header v-if="modal.header">
        <component :is="modal.header" v-bind="modal.headerProps" />
      </template>
      <component :is="modal.body" v-bind="modal.bodyProps" />
      <template #footer v-if="modal.footer">
        <component :is="modal.footer" v-bind="modal.footerProps" />
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import Modal from './Modal.vue'

const baseZIndex = 2000
const modals = ref([])

function openModal({ title = '', body, bodyProps = {}, header = null, headerProps = {}, footer = null, footerProps = {}, size = '' }) {
  const id = Date.now() + Math.random()
  modals.value.push({
    id,
    visible: true,
    title,
    body,
    bodyProps,
    header,
    headerProps,
    footer,
    footerProps,
    size
  })
  return id
}

function closeModal(id) {
  const idx = modals.value.findIndex(m => m.id === id)
  if (idx !== -1) modals.value.splice(idx, 1)
}

provide('openModal', openModal)
provide('closeModal', closeModal)
</script> 