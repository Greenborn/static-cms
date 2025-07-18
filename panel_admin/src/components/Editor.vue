<template>
  <div class="editor-component">
    <ul class="nav nav-tabs mb-2">
      <li class="nav-item">
        <button class="nav-link" :class="{active: tab==='wysiwyg'}" @click.stop="tab='wysiwyg'">WYSIWYG</button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{active: tab==='html'}" @click.stop="tab='html'">Código HTML</button>
      </li>
    </ul>
    <div v-show="tab==='wysiwyg'">
      <div class="toolbar mb-2">
        <button type="button" class="btn btn-sm btn-light" @click="exec('bold')"><b>B</b></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('italic')"><i>I</i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('underline')"><u>U</u></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('insertUnorderedList')"><i class="bi bi-list-ul"></i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('insertOrderedList')"><i class="bi bi-list-ol"></i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('formatBlock','<h2>')">H2</button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('formatBlock','<h3>')">H3</button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('createLink', prompt('URL:'))"><i class="bi bi-link-45deg"></i></button>
        <button type="button" class="btn btn-sm btn-light" @click="exec('removeFormat')"><i class="bi bi-eraser"></i></button>
      </div>
      <div
        ref="wysiwygRef"
        class="editor-wysiwyg border rounded bg-white p-2"
        contenteditable="true"
        :style="{minHeight: '250px', outline: 'none'}"
        @input="onWysiwygInput"
        v-html="html"
      ></div>
    </div>
    <div v-show="tab==='html'">
      <textarea class="form-control" rows="12" v-model="html" @input="onHtmlInput"></textarea>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
const props = defineProps({
  modelValue: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
const tab = ref('wysiwyg')
const html = ref(props.modelValue)
const wysiwygRef = ref(null)

watch(() => props.modelValue, (val) => {
  if (val !== html.value) html.value = val
})
watch(html, (val) => {
  emit('update:modelValue', val)
  if (tab.value === 'wysiwyg' && wysiwygRef.value && wysiwygRef.value.innerHTML !== val) {
    wysiwygRef.value.innerHTML = val
  }
})

const exec = (cmd, arg) => {
  document.execCommand(cmd, false, arg)
  onWysiwygInput()
}
const onWysiwygInput = () => {
  html.value = wysiwygRef.value.innerHTML
}
const onHtmlInput = () => {
  if (tab.value === 'wysiwyg' && wysiwygRef.value) {
    nextTick(() => { wysiwygRef.value.innerHTML = html.value })
  }
}
onMounted(() => {
  if (wysiwygRef.value) wysiwygRef.value.innerHTML = html.value
})
</script>
<style scoped>
.editor-wysiwyg {
  min-height: 250px;
  max-height: 60vh;
  overflow-y: auto;
}
.toolbar button {
  margin-right: 0.25rem;
}
</style> 