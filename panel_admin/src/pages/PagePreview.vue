<template>
  <div>
    <h4>{{ page?.title || 'Sin título' }}</h4>
    <div class="mb-2"><span class="badge bg-secondary">{{ page?.status || 'Sin estado' }}</span></div>
    <div class="border rounded p-3 bg-light">
      <div v-html="page?.content || '<em>Sin contenido</em>'"></div>
    </div>
  </div>
</template>
<script setup>
const props = defineProps({ page: { type: Object, default: null } })
</script> 