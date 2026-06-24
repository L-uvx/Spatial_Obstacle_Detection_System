<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { RenderedAirport } from '../../types/tool'

const props = defineProps<{
  airports: RenderedAirport[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const searchText = ref('')
const highlightIndex = ref(-1)

const filteredAirports = computed(() => {
  if (!searchText.value) return props.airports
  const keyword = searchText.value.toLowerCase()
  return props.airports.filter((a) => a.name.toLowerCase().includes(keyword))
})

function selectAirport(airport: RenderedAirport) {
  emit('update:modelValue', airport.id)
  searchText.value = ''
  highlightIndex.value = -1
}

function scrollHighlightedIntoView() {
  if (!dropdownRef.value) return
  const highlighted = dropdownRef.value.querySelector('.airport-search-select__option.is-highlighted') as HTMLElement | null
  try { highlighted?.scrollIntoView({ block: 'nearest' }) } catch { /* jsdom may not implement scrollIntoView */ }
}

function onFocus() {
  highlightIndex.value = filteredAirports.value.length > 0 ? 0 : -1
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlightIndex.value = Math.min(highlightIndex.value + 1, filteredAirports.value.length - 1)
    nextTick(() => scrollHighlightedIntoView())
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlightIndex.value = Math.max(Math.min(highlightIndex.value - 1, filteredAirports.value.length - 1), -1)
    nextTick(() => scrollHighlightedIntoView())
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (highlightIndex.value >= 0 && highlightIndex.value < filteredAirports.value.length) {
      selectAirport(filteredAirports.value[highlightIndex.value])
    }
    return
  }
  if (e.key === 'Escape') {
    e.preventDefault()
    searchText.value = ''
    highlightIndex.value = -1
    return
  }
}

watch(() => props.modelValue, () => {
  searchText.value = ''
  highlightIndex.value = -1
})

watch(searchText, () => {
  highlightIndex.value = filteredAirports.value.length > 0 ? 0 : -1
})

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<template>
  <div class="airport-search-select">
    <div class="airport-search-select__input-wrap">
      <svg
        class="airport-search-select__search-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#64748b"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref="inputRef"
        v-model="searchText"
        class="airport-search-select__input"
        placeholder="搜索机场名称..."
        @keydown="onKeydown"
        @focus="onFocus"
      />
    </div>
    <div ref="dropdownRef" class="airport-search-select__list shell-scrollbar" role="listbox">
      <div
        v-for="(airport, index) in filteredAirports"
        :key="airport.id"
        class="airport-search-select__option"
        :class="{
          'is-highlighted': index === highlightIndex,
          'is-selected': airport.id === modelValue,
        }"
        role="option"
        :aria-selected="index === highlightIndex"
        @click="selectAirport(airport)"
        @mouseenter="highlightIndex = index"
      >
        <span class="airport-search-select__option-name">{{ airport.name }}</span>
        <svg
          v-if="airport.id === modelValue"
          class="airport-search-select__check"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div v-if="filteredAirports.length === 0 && searchText" class="airport-search-select__empty">
        无匹配机场
      </div>
    </div>
  </div>
</template>

<style scoped>
.airport-search-select {
  position: relative;
  width: 100%;
}

.airport-search-select__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.airport-search-select__search-icon {
  position: absolute;
  left: 12px;
  pointer-events: none;
  z-index: 1;
}

.airport-search-select__input {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 10px 14px 10px 38px;
  color: #e2e8f0;
  background: rgba(15, 23, 42, 0.72);
  font-family: inherit;
  font-size: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.airport-search-select__input::placeholder {
  color: #64748b;
}

.airport-search-select__input:focus {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.airport-search-select__list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.95);
  margin-top: 6px;
  padding: 0;
}

.airport-search-select__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  color: #e2e8f0;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.airport-search-select__option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.airport-search-select__option:hover {
  background: rgba(59, 130, 246, 0.12);
  border-left-color: rgba(59, 130, 246, 0.4);
}

.airport-search-select__option.is-highlighted {
  background: rgba(59, 130, 246, 0.18);
  border-left-color: rgba(59, 130, 246, 0.7);
  color: #f1f5f9;
}

.airport-search-select__option.is-selected {
  color: #93c5fd;
}

.airport-search-select__check {
  flex-shrink: 0;
  margin-left: 8px;
}

.airport-search-select__empty {
  color: #64748b;
  text-align: center;
  padding: 24px 14px;
  font-size: 0.9em;
}
</style>
