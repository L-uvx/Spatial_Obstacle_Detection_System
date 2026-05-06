<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps<{
  options: string[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const isOpen = ref(false)
const highlightIndex = ref(-1)

const dropdownStyle = computed(() => {
  if (!triggerRef.value) return {}
  const rect = triggerRef.value.getBoundingClientRect()
  return {
    position: 'fixed' as const,
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 9999,
  }
})

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    const idx = props.options.indexOf(props.modelValue)
    highlightIndex.value = idx >= 0 ? idx : 0
  }
}

function select(option: string) {
  emit('update:modelValue', option)
  isOpen.value = false
  highlightIndex.value = -1
  triggerRef.value?.focus()
}

function close() {
  isOpen.value = false
  highlightIndex.value = -1
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!isOpen.value) {
      toggle()
    }
    if (e.key === 'ArrowDown') {
      highlightIndex.value = Math.min(highlightIndex.value + 1, props.options.length - 1)
    } else {
      highlightIndex.value = Math.max(highlightIndex.value - 1, 0)
    }
    nextTick(() => scrollHighlightedIntoView())
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggle()
    return
  }
}

function onDropdownKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = Math.min(highlightIndex.value + 1, props.options.length - 1)
    nextTick(() => scrollHighlightedIntoView())
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(highlightIndex.value - 1, 0)
    nextTick(() => scrollHighlightedIntoView())
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightIndex.value >= 0 && highlightIndex.value < props.options.length) {
      select(props.options[highlightIndex.value])
    }
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    triggerRef.value?.focus()
    return
  }
  if (e.key === 'Tab') {
    close()
    return
  }
}

function scrollHighlightedIntoView() {
  if (!dropdownRef.value) return
  const highlighted = dropdownRef.value.querySelector('.obstacle-type-select__option.is-highlighted') as HTMLElement | null
  try { highlighted?.scrollIntoView({ block: 'nearest' }) } catch { /* jsdom may not implement scrollIntoView */ }
}

function onClickOutside(e: MouseEvent) {
  if (!isOpen.value) return
  const target = e.target as HTMLElement
  if (rootRef.value?.contains(target)) return
  if (dropdownRef.value?.contains(target)) return
  close()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside, true)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside, true)
})

watch(isOpen, (val) => {
  if (!val) return
  const idx = props.options.indexOf(props.modelValue)
  highlightIndex.value = idx >= 0 ? idx : 0
  nextTick(() => {
    scrollHighlightedIntoView()
    dropdownRef.value?.focus()
  })
})
</script>

<template>
  <div ref="rootRef" class="obstacle-type-select">
    <button
      ref="triggerRef"
      type="button"
      class="obstacle-type-select__trigger"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-controls="isOpen ? 'obstacle-type-listbox' : undefined"
      @click.stop="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="obstacle-type-select__value">{{ modelValue }}</span>
      <svg
        class="obstacle-type-select__chevron"
        :class="{ 'is-open': isOpen }"
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="8"
        viewBox="0 0 12 8"
      >
        <path
          d="M1 1.5l5 5 5-5"
          stroke="#94a3b8"
          stroke-width="1.8"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <Teleport to="body">
      <div
        v-if="isOpen"
        id="obstacle-type-listbox"
        ref="dropdownRef"
        role="listbox"
        class="obstacle-type-select__dropdown shell-scrollbar"
        tabindex="-1"
        :style="dropdownStyle"
        @keydown="onDropdownKeydown"
      >
        <div
          v-for="(option, index) in options"
          :key="option"
          :id="`obstacle-type-option-${index}`"
          class="obstacle-type-select__option"
          :class="{ 'is-highlighted': index === highlightIndex }"
          role="option"
          :aria-selected="index === highlightIndex"
          @click="select(option)"
          @mouseenter="highlightIndex = index"
        >
          {{ option }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.obstacle-type-select {
  position: relative;
  width: 100%;
}

.obstacle-type-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 42px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 12px 14px;
  padding-right: 36px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.72);
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  transition: border-color 0.2s;
  position: relative;
}

.obstacle-type-select__trigger:hover {
  border-color: rgba(148, 163, 184, 0.5);
}

.obstacle-type-select__trigger:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.obstacle-type-select__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obstacle-type-select__chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  transition: transform 0.2s;
  pointer-events: none;
}

.obstacle-type-select__chevron.is-open {
  transform: translateY(-50%) rotate(180deg);
}

.obstacle-type-select__dropdown {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  background: #0f172a;
  outline: none;
}

.obstacle-type-select__option {
  padding: 10px 14px;
  color: #e2e8f0;
  cursor: pointer;
  transition: background 0.15s;
}

.obstacle-type-select__option:hover,
.obstacle-type-select__option.is-highlighted {
  background: rgba(59, 130, 246, 0.18);
}
</style>
