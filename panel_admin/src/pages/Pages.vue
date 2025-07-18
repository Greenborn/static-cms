<template>
  <div class="pages">
    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
      <h1 class="h2">Gestión de Páginas</h1>
      <div class="btn-toolbar mb-2 mb-md-0">
        <div class="btn-group me-2">
          <button type="button" class="btn btn-sm btn-primary" @click="openCreatePage">
            <i class="bi bi-plus-circle me-1"></i>
            Nueva Página
          </button>
        </div>
      </div>
    </div>

    <PageList @edit="openEditPage" @preview="openPreviewPage" />

    <!-- Modal para crear/editar página -->
    <Modal :visible="showFormModal" :title="formModalTitle" size="modal-lg" @close="closeFormModal">
      <PageForm :page="selectedPage" @saved="onPageSaved" @cancel="closeFormModal" />
    </Modal>

    <!-- Modal para vista previa de página -->
    <Modal :visible="showPreviewModal" title="Vista previa de página" size="modal-lg" @close="closePreviewModal">
      <PagePreview :page="selectedPage" />
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageList from './PageList.vue'
import PageForm from './PageForm.vue'
import PagePreview from './PagePreview.vue'
import Modal from '../components/Modal.vue'

const showFormModal = ref(false)
const showPreviewModal = ref(false)
const selectedPage = ref(null)
const formModalTitle = ref('Nueva Página')

function openCreatePage() {
  selectedPage.value = null
  formModalTitle.value = 'Nueva Página'
  showFormModal.value = true
}
function openEditPage(page) {
  selectedPage.value = page
  formModalTitle.value = 'Editar Página'
  showFormModal.value = true
}
function closeFormModal() {
  showFormModal.value = false
  selectedPage.value = null
}
function onPageSaved() {
  closeFormModal()
  // Aquí puedes recargar la lista si es necesario
}
function openPreviewPage(page) {
  selectedPage.value = page
  showPreviewModal.value = true
}
function closePreviewModal() {
  showPreviewModal.value = false
  selectedPage.value = null
}
</script> 